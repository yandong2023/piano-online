// 导出的歌曲数据
const songs = {
    'happy-birthday': {
        name: '生日快乐',
        difficulty: 1,
        notes: [
            // 第一段
            'G4', 'G4', 'A4', 'G4', 'C5', 'B4',
            // 祝你生日快乐
            'G4', 'G4', 'A4', 'G4', 'D5', 'C5',
            // 祝你生日快乐
            'G4', 'G4', 'G5', 'E5', 'C5', 'B4', 'A4',
            // 祝你生日快乐
            'F5', 'F5', 'E5', 'C5', 'D5', 'C5'
        ],
        tempo: 120,
        maxScore: 100
    },
    'twinkle': {
        name: '小星星',
        difficulty: 1,
        notes: [
            // 第一段
            'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',
            'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4',
            // 中间段
            'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
            // 重复第一段
            'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
            'C4', 'G4', 'C5'
        ],
        tempo: 100,
        maxScore: 100
    },
    'two-tigers': {
        name: '两只老虎',
        difficulty: 1,
        notes: [
            // 第一只老虎
            'C4', 'D4', 'E4', 'C4',
            'C4', 'D4', 'E4', 'C4',
            'E4', 'F4', 'G4',
            'E4', 'F4', 'G4',
            // 跑得快
            'G4', 'A4', 'G4', 'F4', 'E4', 'C4',
            'G4', 'A4', 'G4', 'F4', 'E4', 'C4',
            // 一只没有眼睛
            'C4', 'G3', 'C4',
            'C4', 'G3', 'C4'
        ],
        tempo: 120,
        maxScore: 100
    },
    'ode-to-joy': {
        name: '欢乐颂',
        difficulty: 2,
        notes: [
            'E4', 'E4', 'F4', 'G4',
            'G4', 'F4', 'E4', 'D4',
            'C4', 'C4', 'D4', 'E4',
            'E4', 'D4', 'D4',
            
            'E4', 'E4', 'F4', 'G4',
            'G4', 'F4', 'E4', 'D4',
            'C4', 'C4', 'D4', 'E4',
            'D4', 'C4', 'C4'
        ],
        tempo: 120,
        maxScore: 100
    },
    'mary-lamb': {
        name: '玛丽有只小羊羔',
        difficulty: 1,
        notes: [
            'E4', 'D4', 'C4', 'D4',
            'E4', 'E4', 'E4',
            'D4', 'D4', 'D4',
            'E4', 'G4', 'G4',
            
            'E4', 'D4', 'C4', 'D4',
            'E4', 'E4', 'E4',
            'D4', 'D4', 'E4', 'D4',
            'C4'
        ],
        tempo: 120,
        maxScore: 100
    },
    'jingle-bells': {
        name: '铃儿响叮当',
        difficulty: 2,
        notes: [
            'E4', 'E4', 'E4',
            'E4', 'E4', 'E4',
            'E4', 'G4', 'C4', 'D4',
            'E4',
            
            'F4', 'F4', 'F4', 'F4',
            'F4', 'E4', 'E4', 'E4', 'E4',
            'E4', 'D4', 'D4', 'E4',
            'D4', 'G4'
        ],
        tempo: 120,
        maxScore: 100
    },
    'jasmine': {
        name: '茉莉花',
        difficulty: 3,
        notes: [
            'E4', 'G4', 'A4', 'C5',
            'B4', 'A4', 'G4', 'E4',
            'G4', 'A4', 'G4', 'E4',
            'D4', 'E4',
            
            'E4', 'G4', 'A4', 'C5',
            'B4', 'A4', 'G4', 'E4',
            'G4', 'E4', 'D4', 'C4',
            'C4', 'E4'
        ],
        tempo: 90,
        maxScore: 100
    },
    'butterfly-lovers': {
        name: '梁祝',
        difficulty: 4,
        notes: [
            'E4', 'G4', 'A4', 'B4',
            'C5', 'B4', 'A4', 'G4',
            'E4', 'G4', 'A4', 'B4',
            'C5', 'E5',
            
            'D5', 'C5', 'B4', 'A4',
            'G4', 'E4', 'D4', 'E4',
            'G4', 'A4', 'G4', 'E4',
            'D4', 'E4'
        ],
        tempo: 80,
        maxScore: 100
    },
    'fur-elise': {
        name: '致爱丽丝',
        difficulty: 3,
        notes: [
            // 主题旋律
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
            'C4', 'E4', 'A4', 'B4',
            'E4', 'G#4', 'B4', 'C5',
            // 第二段
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
            'C4', 'E4', 'A4', 'B4',
            'E4', 'C5', 'B4', 'A4',
            // 中间段
            'B4', 'C5', 'D5', 'E5',
            'G4', 'F5', 'E5', 'D5',
            'F4', 'E5', 'D5', 'C5',
            // 重复主题
            'E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4',
            'C4', 'E4', 'A4', 'B4',
            'E4', 'G#4', 'B4', 'C5'
        ],
        tempo: 130,
        maxScore: 100
    },
    'canon': {
        name: '卡农',
        nameEn: 'Canon in D',
        difficulty: 4,
        notes: [
            // 主题旋律
            'D4', 'A4', 'B4', 'F#4', 'G4', 'D4', 'G4', 'A4',
            'D4', 'A4', 'B4', 'F#4', 'G4', 'D4', 'G4', 'A4',
            // 变奏1
            'F#4', 'D4', 'F#4', 'G4', 'A4', 'F#4', 'A4', 'B4',
            'G4', 'B4', 'A4', 'G4', 'F#4', 'D4', 'E4', 'F#4',
            // 变奏2
            'G4', 'E4', 'G4', 'A4', 'B4', 'G4', 'B4', 'C5',
            'A4', 'C5', 'B4', 'A4', 'G4', 'E4', 'F#4', 'G4',
            // 高潮部分
            'A4', 'D5', 'C#5', 'D5', 'B4', 'G4', 'A4', 'B4',
            'C5', 'A4', 'B4', 'C5', 'D5', 'B4', 'C5', 'D5',
            // 结束段
            'E5', 'C5', 'D5', 'E5', 'F#5', 'D5', 'E5', 'F#5',
            'G5', 'D5', 'G4', 'A4', 'B4', 'G4', 'B4', 'D5'
        ],
        tempo: 140,
        maxScore: 100
    },
    'london-bridge': {
        name: '伦敦大桥',
        nameEn: 'London Bridge',
        difficulty: 1,
        notes: [
            'G4', 'A4', 'G4', 'F4', 'E4', 'F4', 'G4',
            'D4', 'E4', 'F4', 'E4', 'F4', 'G4',
            'G4', 'A4', 'G4', 'F4', 'E4', 'F4', 'G4',
            'D4', 'G4', 'E4', 'C4'
        ],
        tempo: 120,
        maxScore: 100
    },
    'row-boat': {
        name: '划船歌',
        nameEn: 'Row Row Row Your Boat',
        difficulty: 1,
        notes: [
            'C4', 'C4', 'C4', 'D4', 'E4',
            'E4', 'D4', 'E4', 'F4', 'G4',
            'C5', 'C5', 'C5', 'G4', 'G4', 'G4',
            'E4', 'E4', 'E4', 'C4', 'C4', 'C4',
            'G4', 'F4', 'E4', 'D4', 'C4'
        ],
        tempo: 100,
        maxScore: 100
    },
    'amazing-grace': {
        name: '奇异恩典',
        nameEn: 'Amazing Grace',
        difficulty: 2,
        notes: [
            'G3', 'C4', 'E4', 'C4', 'E4', 'D4', 'C4', 'A3',
            'G3', 'G3', 'C4', 'E4', 'C4', 'E4', 'D4', 'G4',
            'E4', 'G4', 'E4', 'C4', 'E4', 'D4', 'C4', 'A3',
            'G3', 'C4', 'E4', 'C4', 'E4', 'D4', 'C4'
        ],
        tempo: 80,
        maxScore: 100
    },
    'silent-night': {
        name: '平安夜',
        nameEn: 'Silent Night',
        difficulty: 2,
        notes: [
            'G4', 'A4', 'G4', 'E4',
            'G4', 'A4', 'G4', 'E4',
            'D5', 'D5', 'B4',
            'C5', 'C5', 'G4',
            'A4', 'A4', 'C5', 'B4', 'A4',
            'G4', 'A4', 'G4', 'E4',
            'A4', 'A4', 'C5', 'B4', 'A4',
            'G4', 'A4', 'G4', 'E4',
            'D5', 'D5', 'F5', 'D5', 'B4',
            'C5', 'E5', 'C5', 'G4', 'E4', 'G4', 'F4', 'D4', 'C4'
        ],
        tempo: 70,
        maxScore: 100
    },
    'auld-lang-syne': {
        name: '友谊地久天长',
        nameEn: 'Auld Lang Syne',
        difficulty: 2,
        notes: [
            'G4', 'C5', 'C5', 'C5', 'E5', 'D5', 'C5', 'D5',
            'E5', 'C5', 'C5', 'E5', 'G5', 'A5',
            'G5', 'E5', 'E5', 'C5', 'D5', 'C5', 'D5',
            'E5', 'D5', 'C5', 'A4', 'A4', 'G4', 'C5'
        ],
        tempo: 90,
        maxScore: 100
    },
    'moonlight': {
        name: '月光奏鸣曲',
        nameEn: 'Moonlight Sonata',
        difficulty: 3,
        notes: [
            // 简化版主题
            'G#3', 'C#4', 'E4', 'G#3', 'C#4', 'E4', 'G#3', 'C#4', 'E4',
            'G#3', 'C#4', 'E4', 'G#3', 'C#4', 'E4', 'G#3', 'C#4', 'E4',
            'A3', 'C#4', 'E4', 'A3', 'C#4', 'E4', 'A3', 'D4', 'F#4',
            'G#3', 'B3', 'E4', 'G#3', 'B3', 'E4', 'G#3', 'C#4', 'E4'
        ],
        tempo: 60,
        maxScore: 100
    },
    'river-flows': {
        name: '你的心河',
        nameEn: 'River Flows in You',
        difficulty: 4,
        notes: [
            // 简化版主旋律
            'A4', 'B4', 'C5', 'B4', 'A4', 'E4', 'E4',
            'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'E4',
            'F4', 'E4', 'D4', 'E4', 'F4', 'G4', 'A4',
            'G4', 'F4', 'E4', 'D4', 'C4', 'D4', 'E4',
            'A4', 'B4', 'C5', 'D5', 'E5', 'D5', 'C5', 'B4',
            'A4', 'G4', 'F4', 'E4', 'D4', 'E4', 'A4'
        ],
        tempo: 75,
        maxScore: 100
    }
};

// 计算分数的函数
function calculateScore(correctNotes, wrongNotes) {
    if (correctNotes === 0 && wrongNotes === 0) return 0;
    
    const totalNotes = correctNotes + wrongNotes;
    const accuracy = correctNotes / totalNotes;
    
    // 基础分数是准确率 * 100
    let score = Math.round(accuracy * 100);
    
    // 如果错误次数过多，额外扣分
    if (wrongNotes > totalNotes * 0.5) {
        score -= 20;
    }
    
    // 确保分数在0-100之间
    return Math.max(0, Math.min(100, score));
}

// 导出
export { songs, calculateScore };

console.log('practice-songs.js loaded, available songs:', Object.keys(songs));
console.log('Songs object:', songs);
console.log('Number of songs:', Object.keys(songs).length);
console.log('Song names:', Object.values(songs).map(song => song.name));
