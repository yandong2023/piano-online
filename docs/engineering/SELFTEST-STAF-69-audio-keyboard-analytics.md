# STAF-69 自测记录

2026-10-23；候选分支 `feat/staf-69-audio-keyboard-analytics`，基线 `9bcdcab`；PRD v1。

## 命令与结果

```text
npm test
  95 tests / 95 pass / 0 fail（既有脚本；不包含新增文件）
node --test tests/studio-events.test.mjs
  6 tests / 6 pass / 0 fail
npm run build
  Built static site in dist with 100 public songs, 10 new tutorials and 357 sitemap URLs.
node --check js/analytics.js
python3 -m py_compile tests/mobile-piano-browser.py
git diff --check
  无语法/空白错误
```

浏览器环境：Python Playwright，Chromium headless，390×844 / 1280×800，真实 AudioContext，CDP 禁用缓存，只允许对应 localhost origin，其他请求全部 abort。无新增依赖或 GA4 网络写入。

可重跑（需本机 Python Playwright；先将 `git archive 9bcdcab` 解到独立 baseline 并执行其 npm run build）：

```bash
python3 -m http.server 8763 --bind 127.0.0.1 --directory dist
# 第二终端服务 baseline/dist，端口 8764
# 第三终端执行（本机需已安装 Python Playwright）
PIANO_EVIDENCE=./evidence python3 tests/mobile-piano-browser.py --analytics
```

本次由 webapp-testing 的 with_server.py 管理两台服务，前台收集后自动停止，无持久后台服务。证据采集结果为 AC1_to_AC6=PASS / AC7_functional=PASS / AC7_strict=false。最终脚本在保存证据后对 AC-7 严格失败返回非零，避免 CI 将失败误视为全通过。

## AC 证据

| AC | 结果 | 关键输出 |
|---|---|---|
| 1 | 通过 | mobile: audio_first_attack=1, free_play_entry=1, note_play=3, octave_shift=1；desktop: 1/1/1/0 |
| 2 | 通过 | 再按10键首音仍1条；C4 / 31.7ms / <50 / sample / cold_start=yes / free；独立 start hook=31.8ms |
| 3 | 通过 | touch,keyboard,touch,touch 共4条；range=C3–C5, octaves=2；附加 MIDI/program 分类正确 |
| 4 | 行为通过；操作差异注明 | 仅 C3–C5→C4–C6、C4–C6→C5–C7 两条；disabled/clamp/resize/自动 teaching 零新增；桌面原 CSS 隐藏箭头，使用 HTMLElement.click 验证 scrollBy 分支 |
| 5 | 通过 | 空闲2秒=0；free首键=1；切模式再按仍1；歌曲 guided=0；guided→free首键=1；mobile labels 设置不可见，显式设置 checked=false 后验证 keys_visible=false |
| 6 | 通过 | event_version(number)=1，asset_version=20261001.1；移除 query→unknown；改 v→changed；无缓存 |
| 7 | 严格验收未通过 | 见下方，未放宽1ms/console门槛 |
| 8 | 部分通过，接线阻塞 | 事件名/必填字段/共享通道/异常防护静态断言；版本、去重、取消、并发、失败、时延边界动态测试6/6；未进入 npm test |
| 9 | 通过 | 95项既有测试通过；只动4个允许的JS、2个允许测试及docs；HTML/广告/配置未改；GA loader仍1，console首音仍保留 |
| 10/11 | 未执行 | 需部署授权、线上窗口和 GA4 admin 维度注册，不是开发门槛 |

AC-7 的原始比较（完整数据在任务附件 analytics-browser.json）：

| gtag 情况 | baseline 首音 | candidate 首音 | 绝对差 | 几何/按键/高亮/释放/换区 | pageerror | 原始 console error |
|---|---:|---:|---:|---|---:|---|
| undefined | 35.8ms | 24.2ms | 11.6ms | 相同，声音实际启动 | 0 / 0 | 两侧各2条 net::ERR_FAILED |
| throws boom | 37.0ms | 38.6ms | 1.6ms | 相同，声音实际启动 | 0 / 0 | 两侧各2条 net::ERR_FAILED |

两侧资源错误都由测试要求的外网 abort 产生，应用 console error 为0，但按 PRD 原文 console error=0 的严格条件仍未通过。首音波动方向不同，不足以归因于代码回归，也不足以声称 ≤1ms 通过；不为凑通过反复采样。

## 上下游回归与边界

- pointerdown / drag / keyboard / MIDI → Studio → audio：来源正确，每次真正 start 才回调；pressedNotes 和高亮生命周期保持。
- rhythm → audio 直接播放：默认 program，上下文模式从 rhythm.isPlaying 获取；不误计 free 首次进入。
- practice → ensureNoteVisible → automatic setRange：不产生 octave_shift；原先教学回调未重排。
- pending resume / stopAll / invalid note / failed resume：Node 测试确认零成功事件，原异常仍按原路径处理。
- gtag missing / throws、DOM 读取失败、缺失/空/动态版本、20000ms/未来时间戳：静默隔离或按字典取值；无权限/登录场景不适用。
- 未跑物理 MIDI 硬件、Safari/真机、线上 GA4；不声称这些通过。

## 交接与回滚

功能代码、PRD、TECH、自测及补丁均随任务附件交付。仅 draft PR；AC-7 门槛与 AC-8 白名单冲突交 Morgan/用户决策，未请求合并。回滚由授权发布人 `git revert <merge-sha>` 走 PR；无需数据迁移，已上报 GA 事件不可撤回。
