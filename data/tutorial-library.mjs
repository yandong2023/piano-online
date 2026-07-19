export const tutorialArticles = [
  {
    slug: 'computer-keyboard-piano',
    category: 'start',
    difficulty: 1,
    minutes: 8,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: {
      zh: '电脑键盘怎么弹钢琴：零基础在线弹琴完整指南',
      en: 'How to Play Piano with a Computer Keyboard: Complete Beginner Guide'
    },
    description: {
      zh: '不用下载软件，也不用先会五线谱。了解电脑按键与钢琴音符的对应关系，并用提示练习弹完第一首歌。',
      en: 'Learn how computer keys map to piano notes, how to position your hands, and how to finish a first guided song without installing software.'
    },
    intro: {
      zh: '在线钢琴最容易被误解成“点几下会响的网页”。真正有价值的用法，是把电脑键盘当成一组固定琴键，再通过逐键提示练习完整旋律。下面从设备、按键、手位到第一首歌一步步完成。',
      en: 'An online piano is more than a page that makes sound. Treat your computer keyboard as a fixed set of piano keys, then use one-key prompts to complete a whole melody. This guide covers setup, hand position, key mapping and your first song.'
    },
    outcomes: {
      zh: ['知道 A、S、D 等键对应哪些音', '正确放置左手和右手', '完成一首逐键提示歌曲', '知道何时使用自由弹奏和全屏模式'],
      en: ['Understand what A, S and D play', 'Place both hands comfortably', 'Complete a guided song', 'Know when to use free play and full screen']
    },
    sections: [
      {
        heading: { zh: '开始前只需要三样东西', en: 'You only need three things' },
        paragraphs: {
          zh: ['准备一台带实体键盘的电脑、一个现代浏览器和可以正常出声的耳机或音箱。第一次练习建议关闭输入法候选框和容易抢占快捷键的软件。', '笔记本键盘已经足够入门。外接机械键盘并不会让音色更好，但较大的键距可能更容易定位。'],
          en: ['Use a computer with a physical keyboard, a modern browser, and working speakers or headphones. Close apps that capture keyboard shortcuts before your first practice.', 'A laptop keyboard is enough. An external keyboard does not improve sound, although wider spacing may make key locations easier to feel.']
        },
        bullets: {
          zh: ['打开页面后先点击一次，允许浏览器启用声音', '坐到键盘正中间，不要让手腕悬得太高', '第一次从《生日快乐》或《小星星》开始'],
          en: ['Click the page once so the browser can enable audio', 'Sit centered and keep wrists neutral', 'Start with Happy Birthday or Twinkle Twinkle Little Star']
        }
      },
      {
        heading: { zh: '电脑按键与钢琴音符怎么对应', en: 'How computer keys map to piano notes' },
        paragraphs: {
          zh: ['本站把字母键分成连续的音区。A、S、D、F、G、H、J 对应一组连续白键，K、L、分号以及上排字母继续向右延伸。数字键主要负责黑键。', '不要一次背完整张映射表。先记住 A、S、D、F、G 这五个键，能够完成第一段旋律后再扩大范围。'],
          en: ['Letter keys form continuous note ranges. A, S, D, F, G, H and J play a row of white notes, while K, L, semicolon and upper-row letters continue upward. Number keys mainly play black notes.', 'Do not memorize the whole map at once. Learn A through G first, finish a short phrase, and expand only when a song requires more notes.']
        },
        example: {
          label: { zh: '第一组白键', en: 'First white-key group' },
          keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J'],
          notes: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3']
        }
      },
      {
        heading: { zh: '用提示模式完成第一首歌', en: 'Finish your first song with guided prompts' },
        paragraphs: {
          zh: ['选择歌曲后点击“开始跟弹”。页面会进入专注全屏，把下一个电脑按键、当前进度和钢琴键盘放在同一屏幕。', '按对后提示自动前进；按错不会重新开始。初学者应把目标设为“弹完整首”，而不是第一次就追求零错误。'],
          en: ['Choose a song and start guided practice. Focused full screen keeps the next computer key, progress and piano keyboard visible together.', 'A correct key advances automatically. A wrong key does not restart the lesson. Your first goal is to finish, not to achieve perfect accuracy.']
        },
        steps: {
          zh: ['选择《生日快乐》', '点击“开始跟弹”并进入全屏', '看大号字母提示，不要先看音名', '完成后再练一次，减少错误数'],
          en: ['Choose Happy Birthday', 'Start guided practice and enter full screen', 'Watch the large keyboard letter before the note name', 'Repeat once and reduce errors']
        },
        tip: {
          zh: '第一次只要能连续按对 5 个音，就已经理解了这个工具的核心用法。',
          en: 'Once you play five correct notes in sequence, you understand the core workflow.'
        }
      },
      {
        heading: { zh: '自由弹奏适合什么时候', en: 'When free play becomes useful' },
        paragraphs: {
          zh: ['提示模式负责建立方向，自由弹奏负责探索。完成两三首入门曲后，可以关闭歌曲提示，尝试用相同按键复现熟悉旋律。', '自由弹奏时仍建议保留琴键字母标签。等到手指能自然找到位置，再关闭标签测试记忆。'],
          en: ['Guided practice gives direction; free play encourages exploration. After two or three beginner songs, turn off the sequence and try recreating familiar phrases.', 'Keep key labels visible at first. Hide them only after your fingers can find positions without searching.']
        }
      }
    ],
    relatedSongs: ['happy-birthday', 'twinkle', 'ode-to-joy'],
    relatedTutorials: ['piano-keyboard-letters', 'learn-piano-without-sheet-music', 'beginner-30-day-plan'],
    faq: [
      { q: { zh: '手机可以用电脑键盘模式吗？', en: 'Can I use computer-keyboard mode on a phone?' }, a: { zh: '手机可以点击屏幕琴键，但实体电脑键盘更适合逐键练习。', en: 'Phones can use touch keys, but a physical computer keyboard is better for guided letter practice.' } },
      { q: { zh: '为什么第一次没有声音？', en: 'Why is there no sound at first?' }, a: { zh: '浏览器通常要求用户先点击页面才能启用音频。检查系统音量，并再次点击任意琴键。', en: 'Browsers often require a user click before audio starts. Check system volume and click a piano key again.' } }
    ]
  },
  {
    slug: 'piano-keyboard-letters',
    category: 'start',
    difficulty: 1,
    minutes: 9,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '钢琴键盘字母怎么看：C D E F G A B 与电脑按键对照', en: 'Piano Keyboard Letters Explained: C D E F G A B and Computer Keys' },
    description: { zh: '通过黑键分组认识 C D E F G A B，并理解本站电脑键盘字母与钢琴音符的对应方式。', en: 'Use black-key groups to identify C D E F G A B and understand the computer-key mapping used by Piano Online.' },
    intro: { zh: '钢琴白键只重复七个字母：C、D、E、F、G、A、B。难点不是字母本身，而是在几十个相似琴键中快速定位。黑键的“两颗一组、三颗一组”就是最可靠的路标。', en: 'White piano keys repeat only seven letters: C, D, E, F, G, A and B. The challenge is locating them across a long keyboard. Groups of two and three black keys are the most reliable landmarks.' },
    outcomes: { zh: ['通过黑键快速找到 C 和 F', '理解八度为什么会重复', '看懂电脑按键提示', '避免把电脑字母和钢琴音名混为一谈'], en: ['Find C and F from black-key groups', 'Understand octave repetition', 'Read computer-key prompts', 'Separate keyboard letters from note names'] },
    sections: [
      {
        heading: { zh: '先找到所有 C', en: 'Find every C first' },
        paragraphs: { zh: ['观察任意两个黑键组成的小组。紧挨这两个黑键左侧的白键就是 C。向右依次是 D、E，然后遇到三个黑键组前的 F。', '从一个 C 到下一个 C 是一个八度。虽然位置更高或更低，字母顺序完全相同。'], en: ['Look for any pair of black keys. The white key immediately to the left is C. Moving right gives D and E, followed by F before the group of three black keys.', 'From one C to the next C is an octave. The pitch is higher or lower, but the letter sequence repeats exactly.'] },
        example: { label: { zh: '一个八度的白键顺序', en: 'White keys in one octave' }, keys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], notes: ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'] }
      },
      {
        heading: { zh: '为什么电脑提示是 A、S、D，而不是 C、D、E', en: 'Why prompts show A, S and D instead of C, D and E' },
        paragraphs: { zh: ['钢琴音名描述“要发出的音”，电脑字母描述“手要按的位置”。例如页面提示 A，表示按电脑上的 A 键；这个按键会发出 C3。', '练习时优先看电脑字母，理解旋律时再看钢琴音名。两个信息同时存在，但承担不同任务。'], en: ['A piano note name describes the sound; a computer letter describes the physical key to press. For example, pressing computer key A produces C3.', 'During guided practice, follow the computer letter first. Use note names later to understand the melody. They serve different purposes.'] },
        example: { label: { zh: '电脑键与音名', en: 'Computer key to note' }, keys: ['A', 'S', 'D', 'F', 'G'], notes: ['C3', 'D3', 'E3', 'F3', 'G3'] }
      },
      {
        heading: { zh: '每天三分钟定位练习', en: 'A three-minute daily landmark drill' },
        steps: { zh: ['找出屏幕上所有 C 键', '找出所有 F 键', '随机说一个字母并点击对应白键', '关闭字母标签，再重复一次'], en: ['Find every C on screen', 'Find every F', 'Say a random letter and click its white key', 'Hide labels and repeat'] },
        paragraphs: { zh: ['定位练习不需要弹曲子。每天三分钟，比一次背完整张键盘图更有效。'], en: ['This drill does not require a song. Three minutes daily is more effective than memorizing a full keyboard diagram once.'] }
      },
      {
        heading: { zh: '黑键名称怎么理解', en: 'How black-key names work' },
        paragraphs: { zh: ['黑键通常有两个等音名称。例如 C 右侧的黑键可以叫 C♯，也可以叫 D♭。在本站按键映射中主要使用升号写法。', '初学阶段只需要知道黑键位于两个白键之间，不必一次掌握所有调号。'], en: ['A black key often has two enharmonic names. The black key right of C may be called C-sharp or D-flat. This site mainly uses sharp names in mappings.', 'At the beginning, simply understand that a black key sits between two white notes. You do not need every key signature at once.'] }
      }
    ],
    relatedSongs: ['twinkle', 'happy-birthday', 'hot-cross-buns'],
    relatedTutorials: ['computer-keyboard-piano', 'reading-notes', 'basic-piano-chords'],
    faq: [
      { q: { zh: '中央 C 一定在钢琴正中间吗？', en: 'Is middle C exactly at the physical center?' }, a: { zh: '它接近键盘中央，但不同键数的乐器视觉位置会略有差异。应通过黑键分组确认。', en: 'It is near the center, but the visual position varies with keyboard size. Use black-key groups to confirm it.' } }
    ]
  },
  {
    slug: 'learn-piano-without-sheet-music',
    category: 'start',
    difficulty: 1,
    minutes: 10,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '不会五线谱可以学钢琴吗？先弹会再读谱的入门路线', en: 'Can You Learn Piano Without Reading Sheet Music? A Practical Beginner Path' },
    description: { zh: '不会五线谱也能开始学钢琴。先用按键提示建立节奏和键位，再逐步过渡到音名与简化乐谱。', en: 'You can start piano before reading notation. Build keyboard confidence and rhythm with prompts, then transition gradually to note names and simplified scores.' },
    intro: { zh: '不会读谱不是开始弹琴的障碍，但长期完全回避读谱会限制曲目范围。更实际的路线是：先通过提示模式获得“我能弹完一首歌”的经验，再把已经会弹的旋律对应到音名和乐谱。', en: 'Not reading music should not prevent you from starting, although avoiding notation forever limits progress. A practical path is to finish a familiar song with prompts first, then connect the melody you already know to note names and a score.' },
    outcomes: { zh: ['知道不识谱阶段该练什么', '避免只背按键序列', '从字母提示过渡到音名', '建立第一周学习安排'], en: ['Know what to practise before notation', 'Avoid memorizing keys blindly', 'Move from letter prompts to note names', 'Build a first-week plan'] },
    sections: [
      {
        heading: { zh: '第一阶段：先建立动作与节奏', en: 'Stage one: movement and rhythm first' },
        paragraphs: { zh: ['选择非常熟悉的旋律，因为耳朵能够立即发现错误。提示模式只显示下一个按键，让注意力集中在动作和节奏上。', '第一阶段不要求解释每个音符，只要求保持放松、连续完成，并知道旋律何时上行或下行。'], en: ['Choose a melody you know well so your ear notices mistakes immediately. One-key prompts keep attention on movement and pulse.', 'At this stage, you do not need to explain every note. Stay relaxed, finish the sequence, and notice when the melody rises or falls.'] },
        steps: { zh: ['完成《生日快乐》', '完成《小星星》', '尝试不看提示弹出开头四到八个音', '比较两首歌的重复音和跳进'], en: ['Complete Happy Birthday', 'Complete Twinkle Twinkle Little Star', 'Play the first four to eight notes without prompts', 'Compare repeated notes and melodic jumps'] }
      },
      {
        heading: { zh: '第二阶段：把按键字母换成音名', en: 'Stage two: translate keys into note names' },
        paragraphs: { zh: ['当一段旋律已经熟悉，把 A、S、D 这样的电脑按键对应到 C3、D3、E3。不要同时处理整首歌，每次只转换一个短句。', '说出音名再按键，能避免把动作记忆误当成真正理解。'], en: ['Once a phrase feels familiar, translate computer keys such as A, S and D into C3, D3 and E3. Convert one short phrase at a time.', 'Say the note name before pressing the key. This separates musical understanding from pure motor memory.'] }
      },
      {
        heading: { zh: '第三阶段：再看简化乐谱', en: 'Stage three: add a simplified score' },
        paragraphs: { zh: ['先看节奏清楚、音域不大的入门曲。将谱面分成两到四小节，每次只确认起始音、方向和节奏型。', '读谱不是让眼睛逐个翻译字母，而是逐渐识别形状：重复、级进、跳进和相同节奏。'], en: ['Begin with a narrow-range piece and clear rhythm. Divide the score into two- or four-measure chunks and identify the starting note, direction and rhythm pattern.', 'Reading music is not endless letter translation. Learn to recognize shapes: repeats, steps, leaps and recurring rhythms.'] }
      },
      {
        heading: { zh: '一周过渡计划', en: 'A one-week transition plan' },
        bullets: { zh: ['第 1—2 天：只跟提示完成歌曲', '第 3 天：记住开头八个按键', '第 4 天：把八个按键说成音名', '第 5 天：查看对应简化乐谱', '第 6 天：慢速边看谱边弹', '第 7 天：完整复习并录下结果'], en: ['Days 1–2: finish with prompts', 'Day 3: memorize the first eight keys', 'Day 4: name those notes', 'Day 5: view the simplified score', 'Day 6: play slowly while reading', 'Day 7: review and record a complete attempt'] },
        tip: { zh: '提示模式是入口，不是终点。每学会一首歌，都向音名和乐谱多走一步。', en: 'Prompts are an entry point, not the destination. With every song, move one step closer to note names and notation.' }
      }
    ],
    relatedSongs: ['happy-birthday', 'twinkle', 'ode-to-joy'],
    relatedTutorials: ['computer-keyboard-piano', 'piano-keyboard-letters', 'sight-reading'],
    faq: [
      { q: { zh: '只看字母谱会有问题吗？', en: 'Is letter notation enough?' }, a: { zh: '短期可以帮助开始，但长期会限制节奏、双手和复杂作品的学习，应逐步加入标准乐谱。', en: 'It helps you begin, but eventually limits rhythm, two-hand music and complex pieces. Add standard notation gradually.' } }
    ]
  },
  {
    slug: 'beginner-30-day-plan',
    category: 'practice',
    difficulty: 1,
    minutes: 12,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '钢琴初学者 30 天练习计划：每天 20 分钟怎么安排', en: '30-Day Piano Practice Plan for Beginners: 20 Minutes a Day' },
    description: { zh: '一份可以执行的 30 天钢琴入门计划，覆盖键位、节奏、单手、和弦、读谱与完整歌曲。', en: 'A practical 30-day beginner plan covering keyboard landmarks, rhythm, single-hand work, chords, reading and complete songs.' },
    intro: { zh: '初学者最常见的问题不是缺少教程，而是不知道今天该练什么。这个计划把每天 20 分钟拆成固定结构，并用四周分别解决键位、节奏、和弦和完整曲目。', en: 'Beginners rarely lack information; they lack a clear task for today. This plan gives every 20-minute session the same structure and assigns keyboard, rhythm, chord and song goals across four weeks.' },
    outcomes: { zh: ['建立每天固定练习结构', '四周完成至少三首歌曲', '掌握基础和弦与节拍器', '形成可以继续复用的练习日志'], en: ['Build a repeatable daily routine', 'Finish at least three songs', 'Use basic chords and a metronome', 'Keep a reusable practice log'] },
    sections: [
      {
        heading: { zh: '每天 20 分钟的固定结构', en: 'The same 20-minute structure every day' },
        bullets: { zh: ['3 分钟：键位和手指热身', '5 分钟：当天技术任务', '8 分钟：歌曲分段练习', '3 分钟：从头到尾演奏', '1 分钟：记录错误与明日目标'], en: ['3 minutes: landmarks and warm-up', '5 minutes: daily technique', '8 minutes: song chunks', '3 minutes: complete run-through', '1 minute: record errors and tomorrow’s goal'] },
        paragraphs: { zh: ['固定结构可以减少选择成本。当天状态不好时，缩短每一部分，但不要只反复从头弹歌曲。'], en: ['A fixed structure removes decision fatigue. On a difficult day, shorten each part rather than repeating only the beginning of a song.'] }
      },
      {
        heading: { zh: '第 1 周：键位和第一首歌', en: 'Week 1: keyboard landmarks and a first song' },
        steps: { zh: ['第 1 天：找到 C 和 F，体验自由弹奏', '第 2 天：记住 A—G 电脑按键', '第 3 天：跟弹《生日快乐》前半段', '第 4 天：完成整首《生日快乐》', '第 5 天：减少错误并保持稳定速度', '第 6 天：尝试开头不看提示', '第 7 天：录制一次完整结果'], en: ['Day 1: find C and F and try free play', 'Day 2: learn computer keys A through G', 'Day 3: practise the first half of Happy Birthday', 'Day 4: finish the whole song', 'Day 5: reduce errors at a steady pulse', 'Day 6: play the opening without prompts', 'Day 7: record one complete result'] }
      },
      {
        heading: { zh: '第 2 周：节奏与第二首歌', en: 'Week 2: rhythm and a second song' },
        paragraphs: { zh: ['选择《小星星》或《欢乐颂》。从 60 BPM 开始使用节拍器，每拍只按一个音。先保持稳定，再恢复歌曲原有长短。'], en: ['Choose Twinkle Twinkle Little Star or Ode to Joy. Start at 60 BPM with one note per click. Establish steadiness before restoring the real rhythm.'] },
        bullets: { zh: ['每天拍手 1 分钟', '困难片段循环 3—5 次', '只有连续两次正确才提高速度', '提高速度每次不超过 5 BPM'], en: ['Clap for one minute daily', 'Loop difficult fragments three to five times', 'Increase tempo only after two correct repetitions', 'Raise tempo by no more than 5 BPM'] }
      },
      {
        heading: { zh: '第 3 周：和弦与左手', en: 'Week 3: chords and left hand' },
        paragraphs: { zh: ['学习 C、F、G 三个基础和弦。左手先只在每小节第一拍按一个根音，稳定后再尝试完整和弦。', '双手合练时，把右手旋律拆成两到四个音的小组。不要一开始就从头到尾双手演奏。'], en: ['Learn C, F and G chords. Begin with one left-hand root note on the first beat of each measure, then add full chords.', 'When combining hands, divide the right-hand melody into groups of two to four notes. Do not attempt the entire piece with both hands immediately.'] }
      },
      {
        heading: { zh: '第 4 周：读谱、复习与展示', en: 'Week 4: reading, review and performance' },
        bullets: { zh: ['为已会弹的歌曲查看简化乐谱', '标出重复小节与相同节奏', '选择一首新经典曲作为下月目标', '第 30 天录制三首曲目的连续演奏'], en: ['View simplified notation for a song you already play', 'Mark repeated measures and rhythms', 'Choose a new classic for next month', 'On Day 30, record three songs in one session'] },
        tip: { zh: '30 天的结果不是“学会钢琴”，而是建立能够继续进步的练习系统。', en: 'The result of 30 days is not mastering piano; it is building a system that can keep improving.' }
      }
    ],
    relatedSongs: ['happy-birthday', 'twinkle', 'ode-to-joy', 'hot-cross-buns'],
    relatedTutorials: ['practice-methods', 'metronome-for-beginners', 'left-hand-piano-basics'],
    faq: [
      { q: { zh: '每天只有 10 分钟怎么办？', en: 'What if I only have 10 minutes?' }, a: { zh: '保留 2 分钟热身、3 分钟技术和 5 分钟歌曲分段，取消完整演奏也不要取消记录。', en: 'Keep two minutes of warm-up, three minutes of technique and five minutes of song chunks. Skip the full run, not the log.' } }
    ]
  },
  {
    slug: 'metronome-for-beginners',
    category: 'practice',
    difficulty: 1,
    minutes: 9,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '钢琴节拍器怎么用：BPM、拍号与提速方法', en: 'How to Use a Metronome for Piano: BPM, Time Signatures and Tempo Practice' },
    description: { zh: '理解 BPM 和拍号，从 60 BPM 开始练习，并用正确方法逐步提速而不牺牲准确率。', en: 'Understand BPM and time signatures, start at 60 BPM, and increase speed without sacrificing accuracy.' },
    intro: { zh: '节拍器不是用来催你弹快，而是帮助你发现忽快忽慢。正确使用时，它像一把时间尺；错误使用时，它会让初学者只顾追赶点击声。', en: 'A metronome is not there to force speed. It exposes uneven timing. Used correctly, it is a ruler for time; used poorly, it turns practice into chasing clicks.' },
    outcomes: { zh: ['理解 BPM 数字', '会选择起始速度', '知道何时提高速度', '能用节拍器练困难片段'], en: ['Understand BPM', 'Choose a starting tempo', 'Know when to increase speed', 'Use clicks for difficult fragments'] },
    sections: [
      {
        heading: { zh: 'BPM 到底表示什么', en: 'What BPM actually means' },
        paragraphs: { zh: ['BPM 是每分钟拍数。60 BPM 表示每秒一次点击，120 BPM 表示每秒两次。速度数字不等于难度，但速度越快，留给动作修正的时间越短。', '初学者第一次练新片段，通常从 50—70 BPM 开始更合适。'], en: ['BPM means beats per minute. At 60 BPM you hear one click per second; at 120 BPM, two clicks per second. Tempo is not the same as difficulty, but faster tempos leave less time to correct movement.', 'For a new fragment, 50–70 BPM is often a useful starting range.'] }
      },
      {
        heading: { zh: '先拍手，再弹琴', en: 'Clap before you play' },
        steps: { zh: ['设置 60 BPM', '不弹琴，只跟着拍手八拍', '说出 1、2、3、4', '保持拍手，再念出歌曲节奏', '最后才加入琴键'], en: ['Set 60 BPM', 'Clap eight beats without playing', 'Count 1, 2, 3, 4', 'Keep clapping while speaking the rhythm', 'Add piano notes last'] },
        paragraphs: { zh: ['如果拍手都无法稳定，加入音高只会增加负担。'], en: ['If clapping is unstable, adding pitches only increases the load.'] }
      },
      {
        heading: { zh: '如何决定是否提速', en: 'When to raise the tempo' },
        bullets: { zh: ['连续两次完整正确', '肩膀和手腕没有明显紧张', '错误不会集中在同一个位置', '提高 3—5 BPM，而不是一次加 20'], en: ['Two complete correct repetitions', 'No obvious shoulder or wrist tension', 'No recurring error at the same place', 'Increase by 3–5 BPM, not 20'] },
        tip: { zh: '提速失败时退回上一个成功速度，不要把错误动作练得更熟。', en: 'When a tempo increase fails, return to the last successful speed instead of rehearsing mistakes faster.' }
      },
      {
        heading: { zh: '歌曲练习中的三种用法', en: 'Three ways to use clicks in songs' },
        bullets: { zh: ['一拍一音：适合先确认均匀动作', '一拍两音：适合八分音符和连续音型', '只在每小节第一拍点击：检查是否能独立保持节奏'], en: ['One note per click for even motion', 'Two notes per click for eighth-note patterns', 'One click per measure to test internal pulse'] }
      }
    ],
    relatedSongs: ['ode-to-joy', 'minuet-in-g', 'jingle-bells'],
    relatedTutorials: ['rhythm-basics', 'beginner-30-day-plan', 'practice-methods'],
    faq: [
      { q: { zh: '节拍器声音让我更紧张怎么办？', en: 'What if the click makes me tense?' }, a: { zh: '降低音量，先拍手或只练两小节。也可以每两拍点击一次，减少追赶感。', en: 'Lower the volume, clap first, or practise only two measures. You can also use one click every two beats.' } }
    ]
  },
  {
    slug: 'left-hand-piano-basics',
    category: 'practice',
    difficulty: 2,
    minutes: 11,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '钢琴左手怎么练：根音、五度与基础伴奏入门', en: 'Piano Left-Hand Basics: Root Notes, Fifths and Simple Accompaniment' },
    description: { zh: '从单个根音开始练左手，逐步加入五度与三和弦，并学习如何与右手旋律配合。', en: 'Start left-hand practice with single roots, add fifths and triads, and learn how to combine accompaniment with a right-hand melody.' },
    intro: { zh: '很多初学者右手能弹旋律，一加左手就停下来。原因通常不是左手太笨，而是同时处理的任务太多。正确顺序是先减少左手信息，再逐步合手。', en: 'Many beginners can play a melody until the left hand joins. The problem is usually too many simultaneous tasks, not a weak left hand. Reduce left-hand information first, then combine gradually.' },
    outcomes: { zh: ['找到 C、F、G 根音', '弹根音与五度', '掌握最简单的分解和弦', '用短小单元合手'], en: ['Find C, F and G roots', 'Play roots and fifths', 'Use a simple broken chord', 'Combine hands in small units'] },
    sections: [
      {
        heading: { zh: '第一步只弹根音', en: 'Step one: roots only' },
        paragraphs: { zh: ['选择使用 C、F、G 和弦的简单旋律。左手暂时不弹完整和弦，只在和声变化时按一个低音。', '根音持续的时间可以很长，右手继续弹多个旋律音。这样先建立双手不同任务的感觉。'], en: ['Choose a simple melody using C, F and G harmony. Do not play full chords yet; press one bass note only when the harmony changes.', 'Hold the root while the right hand plays several melody notes. This develops independence with minimal left-hand information.'] },
        example: { label: { zh: '三个常用根音', en: 'Three common roots' }, keys: ['C', 'F', 'G'], notes: ['C3', 'F3', 'G3'] }
      },
      {
        heading: { zh: '第二步加入五度', en: 'Step two: add fifths' },
        paragraphs: { zh: ['C 的五度是 G，F 的五度是 C，G 的五度是 D。根音与五度不包含三音，因此听起来稳定，也较少出现大小调判断错误。', '可以同时按下两个音，也可以先根音后五度，形成“低—高”的伴奏型。'], en: ['The fifth of C is G, of F is C, and of G is D. Root-and-fifth shapes omit the third, so they sound stable and avoid major/minor confusion.', 'Play both notes together or alternate low root then high fifth.'] }
      },
      {
        heading: { zh: '第三步学习 1—5—3—5', en: 'Step three: use a 1–5–3–5 pattern' },
        paragraphs: { zh: ['在 C 和弦中，1—5—3—5 是 C—G—E—G。保持固定手型并慢速循环，直到不需要逐个寻找。', '先单独练左手八次，再与右手两到四个音的短句合并。'], en: ['In C major, 1–5–3–5 is C–G–E–G. Keep a stable shape and loop slowly until you no longer search for every note.', 'Practise the left hand alone eight times, then combine it with a right-hand phrase of two to four notes.'] },
        example: { label: { zh: 'C 和弦分解型', en: 'C-major broken pattern' }, keys: ['1', '5', '3', '5'], notes: ['C3', 'G3', 'E3', 'G3'] }
      },
      {
        heading: { zh: '合手时不要从头开始', en: 'Do not combine from the beginning' },
        steps: { zh: ['右手先弹两个音', '左手只按一个根音', '确认两手同时开始的位置', '循环同一个两秒片段', '成功三次后再增加下一组'], en: ['Play two right-hand notes', 'Add one left-hand root', 'Confirm where both hands start together', 'Loop the same two-second fragment', 'Add the next group after three successes'] },
        tip: { zh: '合手练习的最小单位可以只有一个同时按下的瞬间。', en: 'The smallest two-hand practice unit may be a single coordinated moment.' }
      }
    ],
    relatedSongs: ['canon', 'ode-to-joy', 'brahms-lullaby'],
    relatedTutorials: ['basic-piano-chords', 'hand-coordination', 'beginner-30-day-plan'],
    faq: [
      { q: { zh: '左手需要一直看吗？', en: 'Should I keep looking at the left hand?' }, a: { zh: '开始可以看，但应利用黑键分组和固定手型减少视线来回移动。', en: 'At first yes, but use black-key landmarks and stable shapes to reduce visual switching.' } }
    ]
  },
  {
    slug: 'basic-piano-chords',
    category: 'theory',
    difficulty: 2,
    minutes: 12,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '钢琴和弦入门：C、F、G 三和弦与常用进行', en: 'Beginner Piano Chords: C, F and G Triads and Common Progressions' },
    description: { zh: '理解三和弦由什么组成，学会 C、F、G 大三和弦，并用 I–V–vi–IV 等常见进行开始伴奏。', en: 'Understand triad construction, learn C, F and G major chords, and begin accompanying songs with common progressions.' },
    intro: { zh: '和弦不是必须一次按很多键的复杂知识。最基础的三和弦只包含根音、三音和五音。先掌握 C、F、G 三个形状，就能理解大量入门歌曲的和声方向。', en: 'Chords do not need to feel complicated. A basic triad contains a root, third and fifth. Learning C, F and G shapes reveals the harmony behind many beginner songs.' },
    outcomes: { zh: ['理解根音、三音、五音', '弹出 C、F、G 大三和弦', '看懂罗马数字和弦级数', '用和弦为简单旋律伴奏'], en: ['Understand root, third and fifth', 'Play C, F and G major triads', 'Read Roman-numeral chord degrees', 'Accompany a simple melody'] },
    sections: [
      {
        heading: { zh: '大三和弦的结构', en: 'The structure of a major triad' },
        paragraphs: { zh: ['从根音开始，向上取第三个和第五个音级。C 大三和弦是 C—E—G；F 大三和弦是 F—A—C；G 大三和弦是 G—B—D。', '初学者先用根音位置，不必急着学习所有转位。'], en: ['Starting from the root, take the third and fifth scale degrees. C major is C–E–G, F major is F–A–C, and G major is G–B–D.', 'Begin in root position. Inversions can wait until these shapes feel secure.'] },
        example: { label: { zh: '三个基础大三和弦', en: 'Three basic major triads' }, keys: ['C', 'F', 'G'], notes: ['C-E-G', 'F-A-C', 'G-B-D'] }
      },
      {
        heading: { zh: '为什么 C、F、G 最值得先学', en: 'Why C, F and G come first' },
        paragraphs: { zh: ['在 C 大调中，它们分别是 I、IV、V 级，是最稳定、最常见的功能组合。很多童谣和传统旋律只需要这三个和弦。', '先听它们的方向：C 像“回家”，F 像“离开”，G 像“等待解决”。'], en: ['In C major they are I, IV and V, the most common functional combination. Many children’s and traditional melodies use only these chords.', 'Listen to their direction: C feels like home, F moves away, and G creates a need to resolve.'] }
      },
      {
        heading: { zh: '每天五分钟的换和弦练习', en: 'A five-minute chord-change drill' },
        steps: { zh: ['C 和弦保持四拍', '换到 F 保持四拍', '回到 C', '换到 G', '最后回到 C', '全程保持手腕放松'], en: ['Hold C for four beats', 'Move to F for four beats', 'Return to C', 'Move to G', 'Resolve to C', 'Keep the wrist relaxed throughout'] },
        tip: { zh: '换和弦前先想共同音。例如 C 和 F 都包含 C，可以尽量减少手的移动。', en: 'Notice common tones before moving. C and F both contain C, so the hand can move less.' }
      },
      {
        heading: { zh: '从整和弦到伴奏型', en: 'From block chords to accompaniment' },
        bullets: { zh: ['整和弦：三个音同时按下', '低音 + 和弦：先根音，再按完整和弦', '分解和弦：按 1—5—3—5 顺序', '八度低音：根音在两个八度同时出现'], en: ['Block chord: all three notes together', 'Bass plus chord: root first, then full chord', 'Broken chord: play 1–5–3–5', 'Octave bass: root in two octaves'] }
      }
    ],
    relatedSongs: ['happy-birthday', 'jingle-bells', 'canon'],
    relatedTutorials: ['left-hand-piano-basics', 'music-theory', 'advanced-music-theory'],
    faq: [
      { q: { zh: '手太小按不到三个音怎么办？', en: 'What if my hand cannot reach the chord?' }, a: { zh: '把和弦拆开弹，或者使用根音与五度。不要为了同时按下而扭曲手腕。', en: 'Break the chord into separate notes or use root and fifth. Do not twist the wrist just to hold all notes.' } }
    ]
  },
  {
    slug: 'happy-birthday-piano-guide',
    category: 'songs',
    difficulty: 1,
    minutes: 8,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '《生日快乐》钢琴教程：电脑按键、节奏与分句练习', en: 'Happy Birthday Piano Tutorial: Keyboard Letters, Rhythm and Practice Phrases' },
    description: { zh: '把《生日快乐》拆成四个短句，使用在线按键提示练习重复音、跳进和结尾，并完成整首旋律。', en: 'Break Happy Birthday into four short phrases and practise repeated notes, melodic jumps and the ending with guided keyboard prompts.' },
    intro: { zh: '《生日快乐》旋律熟悉、篇幅短，而且包含重复音、级进与较大跳进，非常适合作为第一首完整歌曲。不要一口气背所有按键，按四个乐句分别练习。', en: 'Happy Birthday is familiar, short, and includes repeats, steps and larger leaps. It is an excellent first complete song. Learn it in four phrases instead of memorizing every key at once.' },
    outcomes: { zh: ['认识四个乐句', '处理开头重复音', '练习第三句的大跳', '在提示模式中完成全曲'], en: ['Recognize four phrases', 'Control the repeated opening', 'Practise the larger third-phrase leap', 'Complete the song in guided mode'] },
    sections: [
      {
        heading: { zh: '先听清楚四个乐句', en: 'Hear the four phrases first' },
        paragraphs: { zh: ['前两句结构几乎相同，只在目标音上不同。第三句音域最高，第四句回到结束音。先哼唱并在每句结尾停一下。'], en: ['The first two phrases share almost the same shape with different target notes. The third reaches highest; the fourth returns to the ending note. Sing each phrase and pause at its end.'] }
      },
      {
        heading: { zh: '开头两个相同音不要抢', en: 'Do not rush the repeated opening notes' },
        paragraphs: { zh: ['开头两个音相同，但第二个音要自然连接到后面的上行。初学者常把两个音按得过快，导致整句提前。', '可以先说“生—日—快—乐”的节奏，再按琴键。'], en: ['The first two notes repeat, but the second must lead naturally into the rising phrase. Beginners often play both too quickly and rush the line.', 'Speak the rhythm before touching the keys.'] }
      },
      {
        heading: { zh: '第三句单独循环', en: 'Loop the third phrase separately' },
        paragraphs: { zh: ['第三句包含全曲最大的音高跳进。只练跳进前后的三个音，确认手指能直接到目标位置。', '不要靠滑动寻找目标键。先停住、看清，再一次到位。'], en: ['The third phrase contains the largest leap. Practise only the three notes around the leap until the target feels direct.', 'Do not slide across keys searching. Pause, locate, and move once.'] },
        steps: { zh: ['在提示模式练完整首一次', '只重复第三句五次', '从第二句结尾接入第三句', '最后连续弹四句'], en: ['Play the complete guided song once', 'Repeat phrase three five times', 'Connect phrase two into phrase three', 'Play all four phrases continuously'] }
      },
      {
        heading: { zh: '完成后怎么继续提高', en: 'What to improve after finishing' },
        bullets: { zh: ['减少错误次数', '尝试保持固定拍速', '关闭提示弹第一句', '加入左手 C、F、G 根音', '查看简化乐谱并对应音名'], en: ['Reduce errors', 'Keep a steady pulse', 'Play phrase one without prompts', 'Add C, F and G left-hand roots', 'Connect the melody to simplified notation'] }
      }
    ],
    relatedSongs: ['happy-birthday', 'twinkle', 'hot-cross-buns'],
    relatedTutorials: ['computer-keyboard-piano', 'metronome-for-beginners', 'left-hand-piano-basics'],
    faq: [
      { q: { zh: '为什么本站的按键与其他字母谱不同？', en: 'Why do the letters differ from other tutorials?' }, a: { zh: '有些教程用字母表示音名，本站用字母表示电脑实体键。练习时以页面实时提示为准。', en: 'Some tutorials use letters as note names; this site uses letters as physical computer keys. Follow the live prompt.' } }
    ]
  },
  {
    slug: 'fur-elise-piano-guide',
    category: 'songs',
    difficulty: 3,
    minutes: 11,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '《致爱丽丝》钢琴入门教程：主题旋律怎么分段练', en: 'Für Elise Beginner Piano Guide: How to Practise the Main Theme' },
    description: { zh: '学习《致爱丽丝》著名主题的半音往返、分段方法、慢速练习和常见错误，适合已经完成几首入门曲的人。', en: 'Learn the famous Für Elise theme through chromatic alternation, slow practice, phrase chunks and common-error fixes.' },
    intro: { zh: '《致爱丽丝》的开头听起来熟悉，但对初学者并不算真正的第一首歌。它包含相邻半音快速往返、跨越和左手分解和弦。建议先完成《生日快乐》《小星星》和《欢乐颂》，再挑战主题片段。', en: 'The opening of Für Elise is familiar but not an ideal first song. It includes quick chromatic alternation, leaps and broken left-hand harmony. Complete several easier melodies before attempting the theme.' },
    outcomes: { zh: ['正确练习 E 与 D♯ 往返', '把主题拆成小单元', '避免手腕紧张', '知道什么时候加入左手'], en: ['Practise E and D-sharp alternation', 'Chunk the theme into small units', 'Avoid wrist tension', 'Know when to add the left hand'] },
    sections: [
      {
        heading: { zh: '最难的不是速度，而是放松', en: 'Relaxation is harder than speed' },
        paragraphs: { zh: ['开头 E5 与 D♯5 反复交替。初学者容易用整只手上下抖动。更好的动作是手腕稳定、手指贴近琴键，并用很小的动作交替。', '先以每个音都清楚为标准，不要模仿录音的速度。'], en: ['The opening alternates E5 and D-sharp5. Beginners often shake the entire hand. Keep the wrist stable, fingers near the keys, and use minimal alternating motion.', 'Judge success by clarity, not by matching recording speed.'] },
        example: { label: { zh: '开头核心音型', en: 'Opening core pattern' }, keys: ['E5', 'D♯5', 'E5', 'D♯5', 'E5'], notes: ['慢', '均匀', '放松', '贴键', '清楚'] }
      },
      {
        heading: { zh: '使用 3—5 个音的小单元', en: 'Use units of three to five notes' },
        steps: { zh: ['只练 E—D♯—E', '增加 D♯—E—B', '加入后续 D—C—A', '每组连续正确三次', '最后连接两组'], en: ['Practise E–D-sharp–E', 'Add D-sharp–E–B', 'Add the following D–C–A', 'Repeat each group correctly three times', 'Connect two groups'] },
        paragraphs: { zh: ['片段越短，越容易发现哪个转移造成停顿。'], en: ['Short chunks reveal exactly which movement causes a pause.'] }
      },
      {
        heading: { zh: '左手什么时候加入', en: 'When to add the left hand' },
        paragraphs: { zh: ['右手主题能够慢速连续两次后，再练左手。左手先单独记住低音与分解和弦，不要边看右手边猜左手。', '合手时只连接一个右手落点与一个左手低音。'], en: ['Add the left hand only after two continuous slow right-hand repetitions. Learn bass and broken chords separately instead of guessing while watching the right hand.', 'Combine one right-hand landing with one left-hand bass at a time.'] }
      },
      {
        heading: { zh: '常见错误检查', en: 'Common error checklist' },
        bullets: { zh: ['半音交替越来越快', '拇指抬得太高', '跳到低音前没有提前看位置', '只练开头，从不连接后半句', '为了速度牺牲音的清楚'], en: ['Chromatic alternation accelerates', 'Thumb lifts too high', 'Bass target is not prepared visually', 'Only the opening is practised', 'Clarity is sacrificed for speed'] },
        tip: { zh: '把速度降低到“几乎不会错”的程度，才真正有机会改动作。', en: 'Slow down until errors are rare enough that movement can actually change.' }
      }
    ],
    relatedSongs: ['fur-elise', 'moonlight', 'minuet-in-g'],
    relatedTutorials: ['metronome-for-beginners', 'practice-methods', 'hand-coordination'],
    faq: [
      { q: { zh: '零基础第一天适合弹《致爱丽丝》吗？', en: 'Is Für Elise suitable on day one?' }, a: { zh: '可以体验开头几个音，但不建议把它作为第一首完整曲目。先建立键位与节奏更有效。', en: 'You may try a few opening notes, but it is not an ideal first complete piece. Build landmarks and rhythm first.' } }
    ]
  },
  {
    slug: 'classic-piano-pieces-for-beginners',
    category: 'songs',
    difficulty: 2,
    minutes: 13,
    publishedAt: '2026-07-18',
    updatedAt: '2026-07-18',
    title: { zh: '适合初学者的经典钢琴曲：从简单旋律到古典名曲的顺序', en: 'Classic Piano Pieces for Beginners: A Practical Learning Order' },
    description: { zh: '按音域、节奏、跳进和双手难度整理经典钢琴曲学习顺序，并推荐每个阶段适合练习的作品。', en: 'A practical order of classic pieces based on range, rhythm, leaps and two-hand difficulty, with recommendations for each stage.' },
    intro: { zh: '“经典”不等于“适合零基础”。作品的知名度和演奏难度没有直接关系。更合理的选曲顺序是先看旋律范围、节奏复杂度、重复程度和双手任务，再考虑自己最喜欢哪首。', en: 'Famous does not mean beginner-friendly. Choose pieces by range, rhythm, repetition and hand coordination before choosing only by popularity.' },
    outcomes: { zh: ['判断一首曲子是否适合当前阶段', '获得四级选曲顺序', '知道简化版本与原版的区别', '为下一阶段选择目标曲'], en: ['Judge whether a piece fits your level', 'Follow a four-stage repertoire path', 'Understand simplified versus original versions', 'Choose a next-piece goal'] },
    sections: [
      {
        heading: { zh: '第一级：熟悉旋律与窄音域', en: 'Level 1: familiar melodies and narrow range' },
        paragraphs: { zh: ['从《生日快乐》《小星星》《热十字面包》《欢乐颂》开始。这些旋律重复多、音域相对集中，适合建立键位和节奏。'], en: ['Begin with Happy Birthday, Twinkle Twinkle Little Star, Hot Cross Buns and Ode to Joy. They repeat often and stay within a manageable range.'] },
        bullets: { zh: ['目标：完整弹完，不因错误停止', '先使用提示模式', '完成后记住开头八个音'], en: ['Goal: finish without stopping after errors', 'Use guided prompts first', 'Then memorize the first eight notes'] }
      },
      {
        heading: { zh: '第二级：简单古典主题', en: 'Level 2: approachable classical themes' },
        paragraphs: { zh: ['可以进入《G 大调小步舞曲》《勃拉姆斯摇篮曲》《蓝色多瑙河》简化主题。这一阶段会出现更长乐句、附点节奏和较多跳进。'], en: ['Move to simplified themes from Minuet in G, Brahms’ Lullaby and The Blue Danube. Expect longer phrases, dotted rhythms and more leaps.'] },
        bullets: { zh: ['目标：分句练习并使用节拍器', '每次只提高 3—5 BPM', '开始查看简化乐谱'], en: ['Goal: phrase practice with a metronome', 'Increase tempo by 3–5 BPM', 'Begin reading simplified notation'] }
      },
      {
        heading: { zh: '第三级：著名主题与手指控制', en: 'Level 3: famous themes and finger control' },
        paragraphs: { zh: ['《致爱丽丝》《土耳其进行曲》《维瓦尔第〈春〉》的简化主题适合已经有基础的人。它们要求半音控制、快速重复和更准确的跳进。'], en: ['Simplified themes from Für Elise, Turkish March and Vivaldi’s Spring suit players with basic control. They require chromatic motion, repeated notes and accurate leaps.'] }
      },
      {
        heading: { zh: '第四级：双手、和声与完整作品', en: 'Level 4: two hands, harmony and longer works' },
        paragraphs: { zh: ['《卡农》《月光奏鸣曲》《肖邦前奏曲》等作品的原版需要更成熟的双手与音乐控制。本站提供的简化旋律适合认识主题，但不能替代完整原谱。'], en: ['Original versions of Canon in D, Moonlight Sonata and Chopin preludes require stronger two-hand and musical control. Simplified melodies introduce themes but do not replace complete scores.'] },
        tip: { zh: '页面标注“简化主题”时，目标是练旋律与键位，不要把它当作原作完整版本。', en: 'When a page says “simplified theme,” use it for melody and keyboard practice rather than treating it as the complete original work.' }
      },
      {
        heading: { zh: '选下一首曲子的四个问题', en: 'Four questions before choosing the next piece' },
        steps: { zh: ['我能否听出弹错？', '右手能否慢速连续完成？', '音域是否超出熟悉区域？', '这首曲子是在训练一个新难点，还是同时出现五个难点？'], en: ['Can I hear my own mistakes?', 'Can the right hand finish slowly?', 'Does the range exceed familiar territory?', 'Does the piece add one new challenge or five at once?'] }
      }
    ],
    relatedSongs: ['ode-to-joy', 'minuet-in-g', 'fur-elise', 'canon', 'moonlight'],
    relatedTutorials: ['beginner-30-day-plan', 'fur-elise-piano-guide', 'sight-reading'],
    faq: [
      { q: { zh: '简化版会不会影响以后学原版？', en: 'Will a simplified version hurt later study?' }, a: { zh: '只要明确它是主题练习，并在后续重新按原谱学习节奏、指法和声部，就不会成为问题。', en: 'Not if it is clearly treated as theme practice and you later relearn rhythm, fingering and voices from the full score.' } }
    ]
  }
];

export const tutorialCategories = [
  { id: 'start', label: { zh: '零基础开始', en: 'Start from zero' }, description: { zh: '设备、键位、提示模式与学习路线。', en: 'Setup, keyboard landmarks, prompts and learning paths.' } },
  { id: 'practice', label: { zh: '练习方法', en: 'Practice methods' }, description: { zh: '计划、节拍器、左手与双手协调。', en: 'Plans, metronome work, left hand and coordination.' } },
  { id: 'theory', label: { zh: '乐理与和弦', en: 'Theory and chords' }, description: { zh: '用可以立即弹奏的例子理解音乐结构。', en: 'Understand musical structure through playable examples.' } },
  { id: 'songs', label: { zh: '经典曲目教程', en: 'Classic song guides' }, description: { zh: '把熟悉作品拆成可完成的练习步骤。', en: 'Break familiar works into achievable practice steps.' } }
];

export function getTutorialBySlug(slug) {
  return tutorialArticles.find((article) => article.slug === slug) || null;
}

export function getTutorialTitle(article, locale = 'zh') {
  return article?.title?.[locale] || article?.title?.zh || '';
}
