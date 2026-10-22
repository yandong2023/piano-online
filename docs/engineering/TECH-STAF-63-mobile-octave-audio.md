# STAF-63 技术方案 v2

对应 PRD：STAF-63 issue 初版（2026-10-22），AC1 首音预热、AC2 移动双八度及教学跟随。

## 方案

采用共享 Piano 参数化渲染 + StudioPiano 适配：移动端默认 C3–C5，按八度移动至 C1–C3 / C5–C7；桌面恢复 C3–C6。15 个白键各至少 40px 需要 600px，故移动端在琴键内部横向滚动，教学先调整音域再立即滚动目标键入视口。另一方案是保留 37 键只滚动：不能满足移动端 25 键及真实八度切换要求，否决。两份硬编码数组会产生映射与教学漂移，否决。

AudioContext 与 19 个 C3–G5 自然音样本在 idle 创建/预取；无 requestIdleCallback 时延迟 1200ms。保留 loadingBuffers 去重、force-cache、AbortController 与 nearest-sample/振荡器即时回退。初始化不等待网络；提前操作时同步创建 context 后 resume。另一方案 link preload/等待全部解码会抢首屏带宽并延迟发声，否决。

## 影响面

- 接口：Piano 增加音域、确保音符可见方法；PracticeMode 高亮调用它。StudioPiano 使用动态白键计数定位黑键。
- 数据/迁移/权限/多租户：无服务端或存储结构变更；AudioContext 仍依赖用户手势恢复。
- 异步/缓存：idle 回调可取消；样本 fetch 沿用 force-cache、超时、退避、dispose 中止。
- 第三方：不增加依赖，不改 Vercel、SEO；MIDI、延音、录音接口保持。

## 变更清单

- js/piano-audio.js：调度、取消 idle 预热，19 样本，首次起音日志。
- js/keyboard-range.mjs、js/piano.js：参数化渲染、移动音域、边界、切换/resize、输入释放。
- js/studio.js、js/main.js：移除首屏 init，接入音域控件、状态更新。
- js/practice-mode.js：高亮前确保音符可见。
- css/studio.css、css/piano.css：40px 白键、44px 控件、隐藏移动字母提示。
- tests：音频生命周期、音域边界、移动/桌面浏览器回归；本文件记录证据索引。

## 测试点

AC1：无缓存独立浏览器 context；用户交互前确认 ≥10 个样本完成；pointerdown 到 source.start <100ms；state running；模拟未下载/失败/并发/取消。

AC2：390×844 DOM 尺寸、25 键/15 白键/10 黑键；控件范围/边界；完整跟弹《致爱丽丝》《卡农》，逐音断言高亮存在且位于视口内；切换与 resize；1280px 37 键、A/S/D、空格/开关延音、MIDI note on/off/CC64；录音相关接口检查及浏览器采集（若旧录音实现不可用，明确记录）。

## 上线与回滚

仅提交功能分支、推送并开 base main 的 PR，本任务不部署。上线由另一次决策授权。回滚：合并后 git revert 本 PR 的提交，按原发布流程重新发布；无数据迁移，完全可逆。

## 风险与未知

移动 viewport 同时容纳不下 600px 键盘，自动跟随只保证当前教学单音可见。产品现有 guided/practice 为串行单音；跨越两八度的同时和弦不在本轮范围。重渲染前释放输入，避免删除捕获节点后卡音。C1/C2/C7 使用就近采样或合成回退，不新增音源资源。真实手机音频硬件输出延迟及 Safari 设备验证不确定；日志测量的是 source.start 调度时间。

## 自测与证据

逐条 AC、命令输出、回归清单及未测项目见 `SELFTEST-STAF-63-mobile-octave-audio.md`；截图和浏览器结构化结果见 `evidence/STAF-63/`。最终冷首音 51ms、19 样本先于交互完成、移动白键 40px、两首歌共 143 音符不丢高亮；Node 全套 87 项通过。自动教学换音域保留 pending first attack；曲目末尾空音符已有保护。

## v2：仅修 P2-1 / P2-2 / P3（2026-10-22 用户选择 B）

- P2-1：scrollLeft 赋值受 CSS smooth 影响，动画在同步断言之后覆盖教学定位。setRange 归零改为显式 `scrollTo({left:0,behavior:'instant'})`，与目标定位一致；相较临时改 CSS 再恢复，无需引入样式状态或异步恢复流程。测试跨两帧且等待 300ms 后测量。
- P2-2：删除覆盖原 ≥1100px 规则的 ≥641px 隐藏规则；非移动端按钮保持可用并调用原先的 scrollBy。只改 CSS 会留下 disabled 和无效的 setRange，因此同时恢复事件分支。移动端仍是双八度切换；641–1099px 保持 37 键横向滚动；1280px 无溢出、隐藏按钮。
- P3：恢复键数、动态音域、移动端两侧箭头提示，支持简体/繁体/英文。
- 用户已接受手机一屏约 7 个白键、宽跨度和弦需滑动；本轮不改键宽/音域，不部署。
- 无音频、数据结构、权限、缓存或发布配置变更。复核只需 P2 两处、AC2-3 时序和提示；前后证据见自测记录的 v2 部分。
