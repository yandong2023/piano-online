# STAF-69 自测记录

版本 v2，2026-10-26；候选分支 `feat/staf-69-audio-keyboard-analytics`，基线 `9bcdcab`；对应产品 PRD v2（e54da93）。v1 记录保存在原提交和原任务附件，本次不覆盖其历史失败结论。

## 命令与结果

```text
npm test
  101 tests / 101 pass / 0 fail（既有95项 + 新增事件文件6项）
  输出含 tests/studio-events.test.mjs、live Studio modules send every event...
  尾部为 very long or future input timestamps... / tests 6 / pass 6 / fail 0
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

本次由 webapp-testing 的 with_server.py 管理两台服务，前台收集后自动停止，无持久后台服务。实际命令在工作目录下用 `--server 'python3 -m http.server 8763 --bind 127.0.0.1 --directory piano-analytics/dist' --port 8763` 和 baseline/dist:8764 运行，子命令为 `env PIANO_EVIDENCE=./evidence-v2 python tests/mobile-piano-browser.py --analytics`。证据结果 AC1_to_AC6=PASS / AC7_v2=false，退出码1。文件保存全部比较后才断言失败，未把失败吞成退出码0。

本轮最初执行在 AC-1 首次短触未出声处终止，未进入 AC-7，未产出比较JSON。为排查输入/恢复时序，测试增加了前台页面激活、playNote 返回值/耗时记录和首触立即断言；未修改生产音频逻辑。随后这次有效比较的 AC-7 失败结果完整保留，没有为凑同桶再次采样。

## AC 证据

| AC | 结果 | 关键输出 |
|---|---|---|
| 1 | 通过 | mobile: audio_first_attack=1, free_play_entry=1, note_play=3, octave_shift=1；desktop: 1/1/1/0 |
| 2 | 通过 | 再按10键首音仍1条；C4 / 159.8ms / 100-200 / sample / cold_start=yes / free；独立 start hook=159.9ms |
| 3 | 通过 | touch,keyboard,touch,touch 共4条；range=C3–C5, octaves=2；附加 MIDI/program 分类正确 |
| 4 | 通过 | 仅 C3–C5→C4–C6、C4–C6→C5–C7 两条；disabled/clamp/resize/自动 teaching 零新增；按 PRD v2 允许的 HTMLElement.click 验证桌面 scrollBy 分支 |
| 5 | 通过 | 空闲2秒=0；free首键=1；切模式再按仍1；歌曲 guided=0；guided→free首键=1；mobile labels 设置不可见，显式设置 checked=false 后验证 keys_visible=false |
| 6 | 通过 | event_version(number)=1，asset_version=20261001.1；移除 query→unknown；改 v→changed；无缓存 |
| 7 | v2 未通过 | 行为字段（1px）、pageerror=0、应用错误=0 全部通过；missing 组不同桶，见下方原始数据 |
| 8 | 通过 | npm test 真实执行新文件6项，原有95项均保留；覆盖静态契约、版本、去重、取消、并发、失败及时延边界 |
| 9 | 通过 | 101项测试通过；package.json 仅 scripts.test 末尾追加调用，完整diff随附件；HTML/广告/配置未改；GA loader仍1，console首音仍保留 |
| 10/11 | 未执行 | 需部署授权、线上窗口和 GA4 admin 维度注册，不是开发门槛 |

AC-7 的原始比较（完整数据在任务附件 analytics-browser.json）：

| gtag 情况 | baseline 首音/桶 | candidate 首音/桶 | 绝对差 | 行为字段 | pageerror | 应用 error | 同桶 |
|---|---|---|---:|---|---|---|---|
| undefined | 90.7ms / 50-100 | 20.6ms / <50 | 70.1ms | 相同，音源实际启动 | 0 / 0 | 0 / 0 | 否 |
| throws boom | 94.1ms / 50-100 | 51.0ms / 50-100 | 43.1ms | 相同，音源实际启动 | 0 / 0 | 0 / 0 | 是 |

`before`/`after` 包含 range、键数、白键宽度（1px）、按钮宽高（1px）、标签、buffers、state；另记录按住/释放两阶段 notes、active、state。两组均全部匹配，释放后空 notes 且 active=false。候选首音更快，但仍按 v2 同桶原文判 missing 组失败，不擅自改成“更快也通过”。

允许排除的资源错误：四个页面各2条，共8条。每条均有 console location.url、requestfailed（failure=net::ERR_FAILED）和测试 abort URL 匹配，完整逐条数据见 analytics-browser.json 的 excluded_console_errors / request_failed / aborted_urls。具体URL如下，每个页面都出现一次：

```text
https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y
https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4423187689700927
```

排除规则要求 URL 属于 PRD 的 GA/广告域（含其子域）、该 URL 实际由本测试 abort 且有匹配的 requestfailed；只出现 net::ERR_FAILED 文本不足以排除，任何 localhost/站内错误均留下使断言失败。

## 上下游回归与边界

- pointerdown / drag / keyboard / MIDI → Studio → audio：来源正确，每次真正 start 才回调；pressedNotes 和高亮生命周期保持。
- rhythm → audio 直接播放：默认 program，上下文模式从 rhythm.isPlaying 获取；不误计 free 首次进入。
- practice → ensureNoteVisible → automatic setRange：不产生 octave_shift；原先教学回调未重排。
- pending resume / stopAll / invalid note / failed resume：Node 测试确认零成功事件，原异常仍按原路径处理。
- gtag missing / throws、DOM 读取失败、缺失/空/动态版本、20000ms/未来时间戳：静默隔离或按字典取值；无权限/登录场景不适用。
- 未跑物理 MIDI 硬件、Safari/真机、线上 GA4；不声称这些通过。

## 交接与回滚

功能代码、PRD v2、TECH v2、自测 v2、完整 package.json diff、npm完整输出及浏览器JSON随附件交质检。AC-8 已补齐，AC-7 一组跨桶仍未通过，请质检重点复核该测量与原始数据；不声称全部 AC 通过，不申请上线。PR保持draft。PRD关于授权来源的原说明仍保留，未由开发改写。回滚由授权发布人 `git revert <merge-sha>` 走 PR；无需数据迁移，已上报 GA 事件不可撤回。
