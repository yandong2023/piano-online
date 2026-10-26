# TECH-STAF-69 · 音频与键盘埋点

版本 v2，2026-10-26。对应 PRD-STAF-69 v2（e54da93），交付 AC-1～AC-9；AC-10/11 属上线后观测。v2 仅补测试接线、按产品新 AC-7 重测并更新文档，生产 JS 保持 24b94dd 的实现。

## 方案

| 选项 | 做法 | 结论 |
|---|---|---|
| A | 在 pointerdown / keydown 直接发事件 | 否决：resume 失败、24ms 去重和取消的按键会误报，rhythm 直接调用 audio 的路径会漏报 |
| B | 音频成功启动后发事件，Studio 提供触发时上下文 | 采用：复用现有 firstAttackLogged 与 true/false 播放结果，同步上下文快照覆盖等待 resume 时的模式/音区变化 |

统一通道 `js/analytics.js` 每次读取 studio script 的版本，独立 try/catch 保护版本解析与 gtag。首音从已有日志同一数值产生，成功播放回调给 Studio 发送 note_play / free_play_entry。物理输入传 source；未注明来源的直接 audio 调用为 program。play_mode 由 rhythm.isPlaying 和壳内 mode 决定。只在移动端非 force / 非 automatic 的实际音区变化后发 octave_shift。

## 影响面

- 接口：playNote 新增可选第四参数，pressKey 新增可选 source；旧调用兼容。新增 getPlaybackContext / onNoteStarted 可选回调，异常隔离。MIDI 沿用原解析，仅传来源。
- 数据：四个事件遵循 PRD §4.1，无 count / device / PII。无迁移、身份、权限、多租户或持久任务变更。
- 异步：上下文在 resume 前保存；重复、stale、stopAll 取消及播放失败不触发成功回调。
- 缓存：不改 HTML query 版本；asset_version 真实反映现有脚本 v 值，不代表 commit。
- 第三方：仍为现有 gtag，无 SDK / 广告 / GA4 配置变更。

## 变更清单

| 文件 | 内容 |
|---|---|
| js/analytics.js | 公共 track、版本参数和异常隔离 |
| js/piano-audio.js | 首音、冷启动上下文、成功出声回调 |
| js/studio.js | 输入来源、模式/音区快照、note_play 与 free_play_entry |
| js/piano.js | MIDI 来源、真实手动换区事件 |
| tests/studio-events.test.mjs | 静态契约及动态失败/去重/取消验证 |
| tests/mobile-piano-browser.py | --analytics 浏览器验收分支 |
| package.json | 仅 scripts.test 末尾追加 node --test tests/studio-events.test.mjs |
| docs/product/PRD-STAF-69-audio-keyboard-analytics.md | 产品原始定稿，随功能 PR 交付 |

AC-8 接线与 AC-9 白名单冲突已由 PRD v2 修正。package.json 仅追加新测试调用，保留全部原脚本和依赖；完整 diff 随自测附件交付。

## 测试点与证据

| AC | 方法 |
|---|---|
| 1 | dist 390px 触屏/键盘/换区及 1280px，导出完整 dataLayer |
| 2 | 首音参数、重复 10 键仍一次、时延与独立 start hook 对比 |
| 3 | 原生 touch 拖键、键盘、MIDI、program，按事件序列和 aria-label 比较 |
| 4 | 上下边界、disabled、clamp、自动 teaching、resize、桌面箭头零误报 |
| 5 | 加载/切模式零事件，首次 free 键一次，歌曲页 guided 零事件，guided→free 可恢复 |
| 6 | 每次公共参数，动态删除/改写 query 与缺失 script 返回 unknown |
| 7 | 同浏览器会话基线对照：行为字段（1px）、pageerror、应用 console.error、时延同桶；排除错误必须逐条关联测试 abort 的白名单 URL 和 requestfailed |
| 8 | 静态事件/必填参数/唯一通道，Node 动态验证版本及异常；npm test 末尾直接执行新增文件 |
| 9 | npm test / build、白名单和 GA 单例、保留首音日志 |

执行结果见 `docs/engineering/SELFTEST-STAF-69-audio-keyboard-analytics.md` 和随任务附上的 `analytics-browser.json`。无权限场景不适用；无参数/空版本、超长时延、并发 resume、异常中断由 Node 测试覆盖。上报时延限制到 0～9999.99ms，同时满足字典范围和 AC-2 的严格小于 10000；原 console 数值保留。

自测结果：`npm test` 101/101（含新事件文件6项）；build 100 songs / 10 tutorials / 357 URLs。浏览器 v2 的完整分桶、原始时延与 URL 逐条排除证据见 SELFTEST 与 analytics-browser.json；v1 历史失败留在原提交及原任务附件，不覆盖历史结论。

## 上线与回滚

1. 本阶段只推独立功能分支、创建 PR，交质检，不合并或部署。
2. Morgan/用户确认部署窗口（包括 STAF-66 的 11-06 限制）后，才按既有发布链路合并。
3. 若需回滚，合并提交由发布人执行 `git revert <merge-sha>`，走 PR 发布；不 force push。无数据库与客户端存储变更，代码可逆，已进入 GA 的事件不可撤回。
4. D-1 后台维度/指标注册由 GA4 admin 决策，本单不执行。上线 48h / ≥7 天分别交产品与运营观测 AC-10/11，n<20 仅报绝对数。

## 风险与未知

- 独立运行的真实首音依赖宿主调度；按 PRD v2 比较同桶并保留原始读数与差值，不重复采样凑通过。
- PRD v2 文首保留产品对 AC-7 授权来源的说明（无 issue 内用户文字答复，产品按改派路径落地选项 A），质检须连同说明审阅；开发未自行修改 PRD 门槛。
- gtag 缺失或抛错时事件静默丢弃；首音与首次进入都不重试，避免后续行为冒充首次。
- free_play_entry 事件字典：v1 为 2026-07-25～2026-10-01 的旧 CTA；v2 从本单实际上线日开始，为 free 模式首次成功物理按键。event_version 仍为公共协议版本 1；旧新口径不可比较，中间断点无数据。
- guided_song_entry / guided_fullscreen_result 标注 deprecated (2026-10-01)，本单不恢复也不删除旧代码。
- 不确定：实际 GA4 后台注册状态、最终上线日期、真实线上分布；本地结果不替代线上验收。
