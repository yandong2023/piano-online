import { songs as baseSongs, calculateScore } from './song-catalog.mjs';

const overrides = {
  "two-tigers": { "seoEnabled": true, "featured": true, "composer": "Traditional French" },
  "mary-lamb": { "seoEnabled": true, "featured": true, "composer": "Traditional American" },
  "jasmine": { "seoEnabled": true, "featured": true, "difficulty": 2, "composer": "Traditional Chinese" },
  "canon": { "seoEnabled": true, "featured": true, "composer": "Johann Pachelbel", "title": { "zh": "D大调卡农", "en": "Canon in D" } },
  "london-bridge": { "seoEnabled": true, "composer": "Traditional English" },
  "row-boat": { "seoEnabled": true, "composer": "Traditional" },
  "amazing-grace": { "seoEnabled": true, "composer": "Traditional" },
  "silent-night": { "seoEnabled": true, "featured": true, "composer": "Franz Xaver Gruber" },
  "auld-lang-syne": { "seoEnabled": true, "composer": "Traditional Scottish" },
  "moonlight": { "seoEnabled": true, "composer": "Ludwig van Beethoven" }
};

const additions = {
  "hot-cross-buns": {
    "slug": "hot-cross-buns", "title": { "zh": "热十字面包", "en": "Hot Cross Buns" }, "difficulty": 1, "tempo": 96, "keySignature": "C Major", "estimatedMinutes": 2, "category": "kids", "featured": true, "seoEnabled": true, "composer": "Traditional",
    "description": { "zh": "在线学习《热十字面包》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Hot Cross Buns with interactive keyboard prompts." },
    "notes": ["E4","D4","C4","E4","D4","C4","C4","C4","C4","C4","D4","D4","D4","D4","E4","D4","C4"]
  },
  "old-macdonald": {
    "slug": "old-macdonald-had-a-farm", "title": { "zh": "老麦克唐纳有个农场", "en": "Old MacDonald Had a Farm" }, "difficulty": 1, "tempo": 108, "keySignature": "C Major", "estimatedMinutes": 3, "category": "kids", "featured": false, "seoEnabled": true, "composer": "Traditional",
    "description": { "zh": "在线学习《老麦克唐纳有个农场》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Old MacDonald Had a Farm with interactive keyboard prompts." },
    "notes": ["C4","C4","C4","G3","A3","A3","G3","E4","E4","D4","D4","C4","G3","C4","C4","C4","G3","A3","A3","G3","E4","E4","D4","D4","C4"]
  },
  "yankee-doodle": {
    "slug": "yankee-doodle", "title": { "zh": "扬基歌", "en": "Yankee Doodle" }, "difficulty": 2, "tempo": 116, "keySignature": "G Major", "estimatedMinutes": 4, "category": "traditional", "featured": false, "seoEnabled": true, "composer": "Traditional American",
    "description": { "zh": "在线学习《扬基歌》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Yankee Doodle with interactive keyboard prompts." },
    "notes": ["G4","G4","A4","B4","G4","B4","A4","D5","G4","G4","A4","B4","G4","F#4","E4","D4","E4","F#4","G4","A4","G4","E4","D4","G4"]
  },
  "this-old-man": {
    "slug": "this-old-man", "title": { "zh": "这个老人", "en": "This Old Man" }, "difficulty": 1, "tempo": 108, "keySignature": "C Major", "estimatedMinutes": 3, "category": "kids", "featured": false, "seoEnabled": true, "composer": "Traditional",
    "description": { "zh": "在线学习《这个老人》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of This Old Man with interactive keyboard prompts." },
    "notes": ["G4","E4","G4","G4","E4","G4","A4","G4","F4","E4","D4","E4","F4","E4","F4","G4","C4","C4","C4","C4","C4","D4","E4","F4","G4"]
  },
  "when-the-saints": {
    "slug": "when-the-saints-go-marching-in", "title": { "zh": "圣者进行曲", "en": "When the Saints Go Marching In" }, "difficulty": 2, "tempo": 112, "keySignature": "C Major", "estimatedMinutes": 4, "category": "traditional", "featured": false, "seoEnabled": true, "composer": "Traditional",
    "description": { "zh": "在线学习《圣者进行曲》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of When the Saints Go Marching In with interactive keyboard prompts." },
    "notes": ["C4","E4","F4","G4","C4","E4","F4","G4","C4","E4","F4","G4","E4","C4","E4","D4","E4","E4","D4","C4","C4","E4","G4","G4","F4"]
  },
  "greensleeves": {
    "slug": "greensleeves", "title": { "zh": "绿袖子", "en": "Greensleeves" }, "difficulty": 3, "tempo": 82, "keySignature": "A Minor", "estimatedMinutes": 5, "category": "traditional", "featured": false, "seoEnabled": true, "composer": "Traditional English",
    "description": { "zh": "在线学习《绿袖子》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Greensleeves with interactive keyboard prompts." },
    "notes": ["A4","C5","D5","E5","F5","E5","D5","B4","G4","A4","B4","C5","A4","A4","G#4","A4","C5","D5","E5","C5","B4","A4","G#4","E4","A4"]
  },
  "brahms-lullaby": {
    "slug": "brahms-lullaby", "title": { "zh": "勃拉姆斯摇篮曲", "en": "Brahms’ Lullaby" }, "difficulty": 2, "tempo": 72, "keySignature": "C Major", "estimatedMinutes": 4, "category": "classical", "featured": true, "seoEnabled": true, "composer": "Johannes Brahms",
    "description": { "zh": "在线学习《勃拉姆斯摇篮曲》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Brahms’ Lullaby with interactive keyboard prompts." },
    "notes": ["G4","G4","B4","G4","G4","B4","G4","B4","E5","D5","C5","C5","B4","F4","G4","A4","F4","F4","G4","A4","G4","C5","B4","C5","D5","C5","G4"]
  },
  "we-wish-you": {
    "slug": "we-wish-you-a-merry-christmas", "title": { "zh": "祝你圣诞快乐", "en": "We Wish You a Merry Christmas" }, "difficulty": 2, "tempo": 112, "keySignature": "C Major", "estimatedMinutes": 4, "category": "holiday", "featured": false, "seoEnabled": true, "composer": "Traditional English",
    "description": { "zh": "在线学习《祝你圣诞快乐》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of We Wish You a Merry Christmas with interactive keyboard prompts." },
    "notes": ["G4","C5","C5","D5","C5","B4","A4","A4","D5","D5","E5","D5","C5","B4","G4","E5","E5","F5","E5","D5","C5","A4","G4","A4","D5","B4","C5"]
  },
  "deck-the-halls": {
    "slug": "deck-the-halls", "title": { "zh": "装饰大厅", "en": "Deck the Halls" }, "difficulty": 2, "tempo": 116, "keySignature": "C Major", "estimatedMinutes": 4, "category": "holiday", "featured": false, "seoEnabled": true, "composer": "Traditional Welsh",
    "description": { "zh": "在线学习《装饰大厅》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Deck the Halls with interactive keyboard prompts." },
    "notes": ["G4","F4","E4","D4","C4","D4","E4","C4","D4","E4","F4","D4","E4","D4","C4","B3","C4","D4","E4","C4","D4","E4","F4","G4"]
  },
  "joy-to-world": {
    "slug": "joy-to-the-world", "title": { "zh": "普世欢腾", "en": "Joy to the World" }, "difficulty": 2, "tempo": 104, "keySignature": "C Major", "estimatedMinutes": 4, "category": "holiday", "featured": false, "seoEnabled": true, "composer": "George Frideric Handel / Lowell Mason",
    "description": { "zh": "在线学习《普世欢腾》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Joy to the World with interactive keyboard prompts." },
    "notes": ["C5","B4","A4","G4","F4","E4","D4","C4","G4","A4","A4","B4","B4","C5","C5","C5","B4","A4","G4","G4","F4","E4","C5"]
  },
  "minuet-in-g": {
    "slug": "minuet-in-g", "title": { "zh": "G大调小步舞曲", "en": "Minuet in G" }, "difficulty": 2, "tempo": 108, "keySignature": "G Major", "estimatedMinutes": 5, "category": "classical", "featured": true, "seoEnabled": true, "composer": "Christian Petzold",
    "description": { "zh": "在线学习《G大调小步舞曲》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Minuet in G with interactive keyboard prompts." },
    "notes": ["D5","G4","A4","B4","C5","D5","G4","G4","E5","C5","D5","E5","F#5","G5","G4","G4","C5","D5","C5","B4","A4","B4","C5","B4","A4","G4"]
  },
  "symphony-five": {
    "slug": "beethoven-symphony-no-5", "title": { "zh": "命运交响曲主题", "en": "Beethoven Symphony No. 5 Theme" }, "difficulty": 2, "tempo": 108, "keySignature": "C Minor", "estimatedMinutes": 4, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Ludwig van Beethoven",
    "description": { "zh": "在线学习《命运交响曲主题》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Beethoven Symphony No. 5 Theme with interactive keyboard prompts." },
    "notes": ["G4","G4","G4","D#4","F4","F4","F4","D4","G4","G4","G4","D#4","G#4","G#4","G#4","G4","D#5","D#5","D5","C5","A#4","A#4","G#4","G4"]
  },
  "eine-kleine": {
    "slug": "eine-kleine-nachtmusik", "title": { "zh": "小夜曲", "en": "Eine kleine Nachtmusik" }, "difficulty": 3, "tempo": 126, "keySignature": "G Major", "estimatedMinutes": 5, "category": "classical", "featured": true, "seoEnabled": true, "composer": "Wolfgang Amadeus Mozart",
    "description": { "zh": "在线学习《小夜曲》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Eine kleine Nachtmusik with interactive keyboard prompts." },
    "notes": ["G4","D5","G4","D5","G4","D5","G4","B4","D5","C5","B4","A4","G4","G4","F#4","F#4","E4","D4","D4","C4","B3","A3","G3"]
  },
  "turkish-march": {
    "slug": "turkish-march", "title": { "zh": "土耳其进行曲", "en": "Turkish March" }, "difficulty": 3, "tempo": 132, "keySignature": "A Minor", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Wolfgang Amadeus Mozart",
    "description": { "zh": "在线学习《土耳其进行曲》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Turkish March with interactive keyboard prompts." },
    "notes": ["B4","A4","G#4","A4","C5","B4","A4","B4","E5","D5","C5","B4","C5","E5","A4","B4","C5","D5","E5","D5","C5","B4","A4"]
  },
  "vivaldi-spring": {
    "slug": "vivaldi-spring", "title": { "zh": "维瓦尔第《春》", "en": "Vivaldi Spring" }, "difficulty": 3, "tempo": 128, "keySignature": "E Major", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Antonio Vivaldi",
    "description": { "zh": "在线学习维瓦尔第《春》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Vivaldi Spring with interactive keyboard prompts." },
    "notes": ["E5","E5","E5","F#5","G#5","G#5","F#5","E5","B4","B4","C#5","D#5","E5","D#5","C#5","B4","E5","F#5","G#5","F#5","E5"]
  },
  "swan-lake": {
    "slug": "swan-lake", "title": { "zh": "天鹅湖主题", "en": "Swan Lake Theme" }, "difficulty": 3, "tempo": 86, "keySignature": "A Minor", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Pyotr Ilyich Tchaikovsky",
    "description": { "zh": "在线学习《天鹅湖主题》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Swan Lake Theme with interactive keyboard prompts." },
    "notes": ["A4","D5","E5","F5","G5","F5","E5","D5","C#5","D5","E5","F5","E5","D5","C#5","B4","A4","E5","D5","C#5","B4","A4"]
  },
  "blue-danube": {
    "slug": "blue-danube", "title": { "zh": "蓝色多瑙河", "en": "The Blue Danube" }, "difficulty": 3, "tempo": 96, "keySignature": "C Major", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Johann Strauss II",
    "description": { "zh": "在线学习《蓝色多瑙河》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of The Blue Danube with interactive keyboard prompts." },
    "notes": ["G4","C5","E5","E5","E5","G5","G5","G5","E5","E5","E5","C5","C5","C5","E5","E5","E5","G5","G5","G5","F5","F5","F5","D5"]
  },
  "wedding-march": {
    "slug": "wedding-march", "title": { "zh": "婚礼进行曲", "en": "Wedding March" }, "difficulty": 3, "tempo": 112, "keySignature": "C Major", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Felix Mendelssohn",
    "description": { "zh": "在线学习《婚礼进行曲》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Wedding March with interactive keyboard prompts." },
    "notes": ["C5","C5","C5","C5","G4","B4","C5","D5","E5","E5","E5","D5","C5","B4","A4","G4","C5","E5","G5","F5","E5","D5","C5"]
  },
  "the-entertainer": {
    "slug": "the-entertainer", "title": { "zh": "演艺人", "en": "The Entertainer" }, "difficulty": 3, "tempo": 118, "keySignature": "C Major", "estimatedMinutes": 5, "category": "ragtime", "featured": true, "seoEnabled": true, "composer": "Scott Joplin",
    "description": { "zh": "在线学习《演艺人》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of The Entertainer with interactive keyboard prompts." },
    "notes": ["D5","D#5","E5","C5","E5","C5","E5","C5","C5","D5","D#5","E5","C5","D5","E5","B4","D5","C5","A4","B4","G4","A4","E4"]
  },
  "gymnopedie-one": {
    "slug": "gymnopedie-no-1", "title": { "zh": "第一号裸体歌舞", "en": "Gymnopédie No. 1" }, "difficulty": 3, "tempo": 72, "keySignature": "D Major", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Erik Satie",
    "description": { "zh": "在线学习《第一号裸体歌舞》的简化钢琴旋律，支持电脑按键提示和分段练习。", "en": "Learn a simplified piano melody of Gymnopédie No. 1 with interactive keyboard prompts." },
    "notes": ["D5","F#5","E5","D5","C#5","B4","A4","B4","C#5","D5","A4","B4","C#5","D5","E5","F#5","E5","D5","C#5","B4"]
  },
  "bach-prelude-c-major": {
    "slug": "bach-prelude-in-c-major", "title": { "zh": "巴赫C大调前奏曲", "en": "Bach Prelude in C Major" }, "difficulty": 3, "tempo": 76, "keySignature": "C Major", "estimatedMinutes": 6, "category": "classical", "featured": true, "seoEnabled": true, "composer": "Johann Sebastian Bach",
    "description": { "zh": "在线练习巴赫《C大调前奏曲》的简化分解和弦主题，适合学习均匀触键与和声进行。", "en": "Practice a simplified arpeggiated theme from Bach's Prelude in C Major for even touch and harmonic movement." },
    "notes": ["C4","E4","G4","C5","E5","G4","C5","E5","C4","E4","G4","C5","E5","G4","C5","E5","D4","F4","A4","D5","F5","A4","D5","F5","B3","D4","G4","D5","F5","G4","D5","F5"]
  },
  "chopin-prelude-e-minor": {
    "slug": "chopin-prelude-e-minor", "title": { "zh": "肖邦E小调前奏曲", "en": "Chopin Prelude in E Minor" }, "difficulty": 3, "tempo": 64, "keySignature": "E Minor", "estimatedMinutes": 6, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Frédéric Chopin",
    "description": { "zh": "在线练习肖邦《E小调前奏曲》简化旋律，重点体会下行线条、呼吸与慢速控制。", "en": "Practice a simplified melodic line from Chopin's Prelude in E Minor, focusing on descent, breathing and slow control." },
    "notes": ["B4","C5","B4","A4","G4","F#4","E4","D#4","E4","G4","F#4","E4","D4","C4","B3","E4","F#4","G4","A4","G4","F#4","E4","D#4","E4"]
  },
  "mozart-k545": {
    "slug": "mozart-sonata-k545", "title": { "zh": "莫扎特C大调奏鸣曲K.545", "en": "Mozart Sonata K.545" }, "difficulty": 3, "tempo": 112, "keySignature": "C Major", "estimatedMinutes": 6, "category": "classical", "featured": true, "seoEnabled": true, "composer": "Wolfgang Amadeus Mozart",
    "description": { "zh": "在线学习莫扎特C大调奏鸣曲K.545第一乐章的简化主题，练习清晰分句与均匀音阶。", "en": "Learn a simplified theme from the first movement of Mozart's Sonata K.545 and practise clear phrasing and even scales." },
    "notes": ["C5","E5","G5","B4","C5","D5","C5","B4","A4","G4","F4","E4","D4","C4","E4","G4","C5","E5","D5","C5","B4","A4","G4","F4","E4"]
  },
  "william-tell-overture": {
    "slug": "william-tell-overture", "title": { "zh": "威廉·退尔序曲", "en": "William Tell Overture" }, "difficulty": 3, "tempo": 132, "keySignature": "E Major", "estimatedMinutes": 5, "category": "classical", "featured": true, "seoEnabled": true, "composer": "Gioachino Rossini",
    "description": { "zh": "在线练习《威廉·退尔序曲》终曲的简化主题，适合训练重复音、跳进与稳定速度。", "en": "Practice a simplified finale theme from the William Tell Overture for repeated notes, leaps and steady tempo." },
    "notes": ["E4","E4","E4","G#4","B4","E5","B4","G#4","E4","F#4","G#4","A4","B4","B4","A4","G#4","F#4","E4","B4","B4","B4","C#5","D#5","E5","D#5","C#5","B4"]
  },
  "offenbach-can-can": {
    "slug": "offenbach-can-can", "title": { "zh": "奥芬巴赫康康舞曲", "en": "Offenbach Can-Can" }, "difficulty": 2, "tempo": 124, "keySignature": "C Major", "estimatedMinutes": 5, "category": "classical", "featured": true, "seoEnabled": true, "composer": "Jacques Offenbach",
    "description": { "zh": "在线练习奥芬巴赫《康康舞曲》的简化主题，学习快速级进、重复节奏与轻快触键。", "en": "Practice a simplified Can-Can theme by Offenbach with quick steps, repeated rhythm and light articulation." },
    "notes": ["A4","A4","B4","C5","D5","C5","B4","A4","G4","G4","A4","B4","C5","B4","A4","G4","F4","F4","G4","A4","B4","A4","G4","F4","E4","G4","C5"]
  },
  "bizet-habanera": {
    "slug": "bizet-habanera", "title": { "zh": "比才《哈巴涅拉》", "en": "Bizet Habanera" }, "difficulty": 3, "tempo": 88, "keySignature": "D Minor", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Georges Bizet",
    "description": { "zh": "在线练习歌剧《卡门》中《哈巴涅拉》的简化旋律，感受半音下行与稳定舞曲节奏。", "en": "Practice a simplified Habanera melody from Carmen and explore chromatic descent with a steady dance pulse." },
    "notes": ["D4","D4","D4","C#4","D4","E4","F4","E4","D4","C#4","B3","C#4","D4","D4","F4","A4","G4","F4","E4","D4","C#4","D4"]
  },
  "sugar-plum-fairy": {
    "slug": "dance-of-the-sugar-plum-fairy", "title": { "zh": "糖梅仙子之舞", "en": "Dance of the Sugar Plum Fairy" }, "difficulty": 3, "tempo": 96, "keySignature": "E Minor", "estimatedMinutes": 5, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Pyotr Ilyich Tchaikovsky",
    "description": { "zh": "在线练习柴可夫斯基《糖梅仙子之舞》的简化主题，训练轻巧触键、半音与神秘音色。", "en": "Practice a simplified Dance of the Sugar Plum Fairy theme with light touch, chromatic motion and a mysterious character." },
    "notes": ["E5","D#5","E5","B4","C5","A4","B4","G4","A4","F#4","G4","E4","F#4","D#4","E4","B3","E4","G4","F#4","E4","D#4","E4"]
  },
  "schubert-serenade": {
    "slug": "schubert-serenade", "title": { "zh": "舒伯特小夜曲", "en": "Schubert Serenade" }, "difficulty": 3, "tempo": 76, "keySignature": "D Minor", "estimatedMinutes": 6, "category": "classical", "featured": false, "seoEnabled": true, "composer": "Franz Schubert",
    "description": { "zh": "在线练习舒伯特《小夜曲》的简化旋律，学习歌唱性连奏、乐句呼吸与慢速控制。", "en": "Practice a simplified Schubert Serenade melody and develop singing legato, phrase breathing and slow control." },
    "notes": ["D4","E4","D4","B3","D4","E4","D4","B3","F#4","E4","D4","C#4","D4","A4","G4","F#4","E4","D4","C#4","B3","A3","D4"]
  }
};

export const songs = Object.fromEntries(
  Object.entries({ ...baseSongs, ...additions }).map(([id, song]) => [id, { ...song, ...(overrides[id] || {}) }])
);

export const songList = Object.entries(songs).map(([id, song]) => ({ id, ...song }));
export const publicSongs = songList.filter((song) => song.seoEnabled && !song.copyrightRestricted);
export const featuredSongs = publicSongs.filter((song) => song.featured);
export function getSongById(id) { return songs[id] || null; }
export function getSongBySlug(slug) { return songList.find((song) => song.slug === slug) || null; }
export function getSongTitle(song, locale = 'zh') { return song?.title?.[locale] || song?.title?.zh || ''; }
export { calculateScore };
