# STAF-63 自测记录（2026-10-22）

基于 `origin/main` 的 `b77e9d4`，功能分支 `feat/mobile-octave-audio-preload`。仅本地验证，不代表线上已发布。

## AC1：首音预热

- 冷 context + CDP `Network.setCacheDisabled(true)`：首次输入前，19 个 C3–G5 自然音样本全部下载并解码；最晚完成于 navigation 后 664.5ms，当时 context 为 suspended。
- 原生触屏 pointerdown 到实际 `AudioBufferSourceNode.start()`：**51.0ms**。应用控制台同为：

```text
[piano:first-attack] {note: C4, inputToStartMs: 51, audioStartTime: 0.005333333333333333, state: running, loadedSamples: 19}
```

- 计时起点为 pointerdown 监听器进入时的 `performance.now()`，终点为 source.start 调度；不测扬声器、蓝牙或 OS 输出延迟。应用日志与独立浏览器埋点分别记录，非从样本下载完成时间推算。
- 请求沿用 `force-cache`；idle 回调和输入并发无重复 fetch；提前输入、请求失败仍发声；dispose 取消 idle 并中止 19 个请求；无 requestIdleCallback 时 1200ms 才预热。这些均有 Node 行为测试。
- `network-before-input.png` 是真实 Resource Timing 数据生成的截图，不是 DevTools 面板截图；原始 Network 记录见交接附件 `cold-network.har`。

## AC2：双八度、切换与跟随

| 项目 | 命令/操作与结果 |
|---|---|
| 390×844 初始键盘 | `getBoundingClientRect().width`：15 个白键全部 **40px**；25 键 = 15 白 + 10 黑；C3–C5 |
| 控件 | `getBoundingClientRect()`：左右按钮均 **50×44px**；切换 C1–C3 → … → C5–C7；端点禁用；文案同步 |
| 字母提示 | 移动端所有 `.key-label` display:none；未来音符显示实际音名；可选外接键盘映射随八度平移，桌面恢复原映射 |
| 《致爱丽丝》 | 全曲 **63/63** 音，含 33 个 octave≥5 音符；逐音断言 current 的音名及左右边界均位于 viewport 内；错误数 0 |
| 《D大调卡农》 | 全曲 **80/80** 音，含 21 个 octave≥5 音符；同上；错误数 0 |
| 共享 PracticeMode | 直接调用 highlightKey 验证 C1/C#1/G5/C7/C3，均渲染并可见，不依赖 Studio progress 监听器补救 |
| 切换/并发 | 双指 C3/E3 同时发声、松开归零；按住时换音域不留 held note；首次 resume 中教学 C5→D5 不取消首音 |
| 页面入口 | `/en/`、`/zh-hant/`、`/songs/fur-elise/` 均 25 键并能高亮 G5；旧版 Base Piano fixture 重渲染后指针仍能发声 |
| 曲目结束 | 最后一次 progress 在 noteIndex=notes.length 时不再把 undefined 当音符；浏览器 page_errors=[] |

桌面 1280px 回归清单：

- [x] 37 键、C3–C6，resize 从移动端恢复正确。
- [x] 原生按键 A/S/D 分别触发 C3/D3/E3，松开释放；标点、Shift/IME 映射由现有 Node 测试覆盖。
- [x] 空格延音、松开释音、延音开关均正常。
- [x] MIDI note-on/off、CC64 延音消息通过。使用合成 MIDI 消息，未接物理 MIDI 设备。
- [x] 原钢琴 gainNode 输出连接 MediaRecorder，得到 **2228 bytes** 的 `audio/webm;codecs=opus`，确认音频输出仍可录制。
- [ ] 旧 `PianoRecorder` 按钮/下载完整 UI 未验证：当前 Studio 页面本来就没有录音 UI；不把输出采集等同于旧 UI 验收，不在本轮新增或修复它。

## 命令与关键输出

```text
npm test
test:audio     24 pass / 0 fail
test:home      17 pass / 0 fail
test:secondary  9 pass / 0 fail
test:songs     23 pass / 0 fail
test:tutorials 10 pass / 0 fail
test:score      4 pass / 0 fail
合计           87 pass / 0 fail

npm run build
Built static site in dist with 100 public songs, 10 new tutorials and 357 sitemap URLs.

python /path/to/webapp-testing/scripts/with_server.py \
  --server 'python3 -m http.server 8763 --bind 127.0.0.1 --directory dist' --port 8763 \
  -- python tests/mobile-piano-browser.py
exit 0; AC1_under_100ms=true; page_errors=[]

git diff --check
exit 0
```

浏览器依赖：Python Playwright 及 Chromium；可设 `PIANO_CHROMIUM` 指定已有浏览器，`PIANO_EVIDENCE` 指定证据目录。本次使用本机 Chromium headless shell 1234，原生 Web Audio，无样本响应 mock。脚本用真实键盘/触屏测首音、和弦与桌面输入；整曲逐音通过实际 pressKey→PracticeMode 链路驱动，不宣称为人手完整录屏。

实现位置：`js/piano-audio.js:34` 调度、`:144` 起音日志；`js/piano.js:249` 控件、`:289` 重渲染、`:306` 跟随；`js/practice-mode.js:217` 高亮入口；测试 `tests/audio-playback.test.mjs`、`tests/keyboard-input.test.mjs`、`tests/mobile-piano-browser.py`。

## 风险与复测建议

真实 iPhone/Safari、扬声器实际输出和物理 MIDI 未测，不确定。另一次人为 suspend 后的宿主音频恢复曾约 202ms，说明设备/浏览器的 resume 开销可能超过目标；本次最终冷启动 51ms 达标，不承诺任意设备都 <100ms。质检请优先在真实移动设备重复 AC1，再核对旧录音 UI 是否仍需单独验收。

移动端 600px 键盘内部滚动，保证当前单音高亮可见。教学中手动切到不包含当前目标的音域会自动回到目标音域；不支持把跨度超过两八度的和弦全部同时放在手机可视区。

原工作目录保持 200 项用户改动；测试生成的站点文件未纳入本 PR。无部署、无 main 推送、无 Vercel/SEO 配置修改。回滚按 TECH 文档 revert 本 PR 提交，无数据迁移。
