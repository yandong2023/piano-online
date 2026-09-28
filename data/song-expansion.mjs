function makeSong({ slug, zh, en, composer, category = 'traditional', difficulty = 2, tempo = 100, keySignature = 'C Major', estimatedMinutes = 4, featured = false, notes }) {
  return {
    slug,
    title: { zh, en },
    difficulty,
    tempo,
    keySignature,
    estimatedMinutes,
    category,
    featured,
    seoEnabled: true,
    composer,
    description: {
      zh: '在线练习《' + zh + '》的简化钢琴主题，支持电脑按键提示和分段练习。',
      en: 'Practice a simplified piano theme from ' + en + ' with interactive keyboard prompts.'
    },
    notes: notes.trim().split(/\s+/)
  };
}

const EXPANSION_ROWS = [
  ["oh-susanna", "oh-susanna", "哦，苏珊娜", "Oh! Susanna", "Stephen Foster", "traditional", 2, 112, "C Major", 4, "C4 D4 E4 G4 G4 A4 G4 E4 C4 D4 E4 E4 D4 C4 D4 E4 G4 A4 G4 E4 D4 C4"],
  ["camptown-races", "camptown-races", "坎普敦赛马", "Camptown Races", "Stephen Foster", "traditional", 2, 116, "C Major", 4, "G4 G4 E4 G4 A4 G4 E4 C4 E4 D4 C4 D4 E4 G4 E4 D4 C4 C4"],
  ["home-sweet-home", "home-sweet-home", "甜蜜的家", "Home! Sweet Home!", "Henry Bishop", "traditional", 2, 84, "C Major", 5, "E4 G4 C5 B4 A4 G4 E4 D4 C4 E4 G4 C5 B4 A4 G4 F4 E4 D4 C4"],
  ["my-bonnie", "my-bonnie-lies-over-the-ocean", "我的邦妮", "My Bonnie Lies over the Ocean", "Traditional Scottish", "traditional", 2, 96, "C Major", 4, "G4 E4 F4 G4 E4 G4 C5 B4 A4 A4 G4 F4 E4 D4 C4 G4 E4 F4 G4"],
  ["coming-round-mountain", "shell-be-coming-round-the-mountain", "她将绕山而来", "She'll Be Coming 'Round the Mountain", "Traditional American", "traditional", 2, 116, "C Major", 4, "G4 G4 C5 C5 E5 E5 C5 G4 G4 A4 G4 E4 C4 G4 G4 C5 C5 E5"],
  ["skip-to-my-lou", "skip-to-my-lou", "跳到我的露", "Skip to My Lou", "Traditional American", "traditional", 1, 120, "C Major", 3, "G4 E4 G4 E4 G4 A4 G4 E4 D4 C4 D4 E4 G4 G4 E4 E4 D4 C4"],
  ["turkey-in-straw", "turkey-in-the-straw", "稻草里的火鸡", "Turkey in the Straw", "Traditional American", "traditional", 3, 126, "C Major", 5, "E4 F4 G4 A4 G4 E4 C4 D4 E4 G4 A4 C5 B4 A4 G4 E4 D4 C4 E4 G4"],
  ["clementine", "oh-my-darling-clementine", "噢，我的宝贝克莱门汀", "Oh My Darling, Clementine", "Percy Montrose", "traditional", 2, 92, "C Major", 4, "G3 G3 C4 E4 E4 E4 D4 C4 E4 D4 C4 G3 G3 C4 E4 G4 G4 F4 E4 D4"],
  ["aura-lee", "aura-lee", "奥拉·李", "Aura Lee", "George R. Poulton", "traditional", 2, 86, "C Major", 4, "G4 C5 B4 A4 G4 E4 D4 E4 F4 G4 A4 G4 E4 G4 C5 B4 A4 G4"],
  ["scarborough-fair", "scarborough-fair", "斯卡伯勒集市", "Scarborough Fair", "Traditional English", "traditional", 3, 76, "A Minor", 5, "A4 E5 E5 B4 C5 B4 A4 E4 A4 C5 D5 C5 B4 A4 G4 A4"],
  ["londonderry-air", "londonderry-air", "伦敦德里小调", "Londonderry Air (Danny Boy)", "Traditional Irish", "traditional", 3, 72, "C Major", 5, "G4 C5 E5 D5 C5 E5 G5 A5 G5 E5 D5 C5 A4 G4 C5 E5 D5 C5"],
  ["red-river-valley", "red-river-valley", "红河谷", "Red River Valley", "Traditional North American", "traditional", 2, 88, "C Major", 4, "G4 C5 C5 C5 B4 A4 G4 A4 G4 E4 G4 C5 C5 D5 E5 D5 C5"],
  ["swing-low", "swing-low-sweet-chariot", "摇啊，甜蜜马车", "Swing Low, Sweet Chariot", "Traditional Spiritual", "traditional", 2, 78, "C Major", 4, "E4 G4 C5 E5 D5 C5 G4 E4 G4 C5 E5 D5 C5 A4 G4 E4"],
  ["down-by-riverside", "down-by-the-riverside", "河边", "Down by the Riverside", "Traditional Spiritual", "traditional", 2, 104, "C Major", 4, "C4 E4 G4 G4 A4 G4 E4 C4 E4 G4 A4 C5 A4 G4 E4 D4 C4"],
  ["johnny-marching-home", "when-johnny-comes-marching-home", "当约翰尼凯旋归来", "When Johnny Comes Marching Home", "Patrick Gilmore", "traditional", 3, 116, "A Minor", 5, "A4 A4 C5 D5 E5 E5 D5 C5 B4 A4 A4 C5 D5 E5 D5 C5 B4 A4"],
  ["o-christmas-tree", "o-christmas-tree", "圣诞树", "O Christmas Tree", "Traditional German", "holiday", 2, 92, "C Major", 4, "G4 C5 C5 C5 D5 E5 E5 E5 E5 D5 E5 F5 B4 D5 C5"],
  ["away-in-manger", "away-in-a-manger", "马槽歌", "Away in a Manger", "Traditional", "holiday", 2, 82, "C Major", 4, "G4 C5 C5 B4 A4 A4 G4 F4 E4 D4 C4 G4 C5 C5 B4 A4"],
  ["first-noel", "the-first-noel", "第一首圣诞颂歌", "The First Noel", "Traditional English", "holiday", 2, 84, "C Major", 5, "E4 D4 C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 A4 B4 C5 G4"],
  ["god-rest-merry", "god-rest-ye-merry-gentlemen", "愿上帝赐你喜乐", "God Rest Ye Merry, Gentlemen", "Traditional English", "holiday", 3, 96, "A Minor", 5, "E4 E4 B4 B4 A4 G4 F#4 E4 D4 E4 F#4 G4 A4 B4 A4 G4"],
  ["hark-herald", "hark-the-herald-angels-sing", "听啊，天使高声唱", "Hark! The Herald Angels Sing", "Felix Mendelssohn", "holiday", 2, 104, "C Major", 4, "G4 C5 C5 B4 C5 E5 E5 D5 G4 A4 B4 C5 C5 B4 A4 G4"],
  ["o-come-faithful", "o-come-all-ye-faithful", "齐来崇拜", "O Come, All Ye Faithful", "Traditional", "holiday", 2, 96, "C Major", 5, "G4 C5 G4 A4 G4 E4 D4 E4 F4 E4 D4 C4 G4 A4 B4 C5"],
  ["angels-heard-high", "angels-we-have-heard-on-high", "天使歌唱在高天", "Angels We Have Heard on High", "Traditional French", "holiday", 3, 112, "C Major", 5, "G4 C5 C5 D5 E5 D5 C5 B4 A4 G4 A4 B4 C5 D5 E5 F5 E5 D5"],
  ["up-on-housetop", "up-on-the-housetop", "屋顶上", "Up on the Housetop", "Benjamin Hanby", "holiday", 2, 112, "C Major", 4, "G4 E4 F4 G4 C5 B4 A4 G4 E4 F4 G4 A4 G4 E4 D4 C4"],
  ["we-three-kings", "we-three-kings", "东方三博士", "We Three Kings", "John Henry Hopkins Jr.", "holiday", 3, 88, "E Minor", 5, "E4 G4 A4 B4 B4 A4 G4 F#4 E4 G4 A4 B4 D5 C5 B4 A4"],
  ["o-holy-night", "o-holy-night", "圣善夜", "O Holy Night", "Adolphe Adam", "holiday", 3, 76, "C Major", 6, "G4 C5 C5 E5 D5 C5 F5 E5 D5 C5 B4 A4 G4 C5 E5 G5"],
  ["bach-air-g", "bach-air-on-the-g-string", "巴赫G弦上的咏叹调", "Bach Air on the G String", "Johann Sebastian Bach", "classical", 3, 72, "D Major", 6, "D4 F#4 A4 D5 C#5 B4 A4 G4 F#4 E4 D4 A4 B4 C#5 D5 A4"],
  ["bach-jesu-joy", "bach-jesu-joy-of-mans-desiring", "巴赫《耶稣，世人仰望的喜悦》", "Jesu, Joy of Man's Desiring", "Johann Sebastian Bach", "classical", 3, 84, "G Major", 6, "G4 A4 B4 D5 C5 B4 A4 G4 A4 B4 C5 E5 D5 C5 B4 A4"],
  ["bach-toccata", "bach-toccata-and-fugue-d-minor", "巴赫D小调托卡塔与赋格", "Toccata and Fugue in D Minor", "Johann Sebastian Bach", "classical", 4, 96, "D Minor", 6, "D5 C#5 D5 E5 F5 G5 A5 G5 F5 E5 D5 A4 D5 C#5 D5 A4"],
  ["mozart-symphony-40", "mozart-symphony-no-40", "莫扎特第四十交响曲", "Mozart Symphony No. 40", "Wolfgang Amadeus Mozart", "classical", 3, 116, "G Minor", 5, "G4 G4 A4 G4 G4 A4 G4 G4 A4 A#4 C5 A#4 A4 G4 F#4 G4"],
  ["mozart-lacrimosa", "mozart-lacrimosa", "莫扎特《落泪之日》", "Mozart Lacrimosa", "Wolfgang Amadeus Mozart", "classical", 3, 72, "D Minor", 6, "D4 A4 A4 G4 F4 E4 D4 C#4 D4 F4 A4 C5 A#4 A4 G4 F4"],
  ["haydn-surprise", "haydn-surprise-symphony", "海顿《惊愕交响曲》", "Haydn Surprise Symphony", "Joseph Haydn", "classical", 2, 104, "C Major", 5, "C4 C4 E4 E4 G4 G4 E4 F4 F4 D4 D4 B3 B3 C4 G4"],
  ["handel-hallelujah", "handel-hallelujah-chorus", "亨德尔《哈利路亚》", "Hallelujah Chorus", "George Frideric Handel", "classical", 3, 108, "D Major", 5, "D4 F#4 A4 D5 C#5 B4 A4 G4 F#4 E4 D4 F#4 A4 B4 A4 G4"],
  ["handel-water-music", "handel-water-music", "亨德尔《水上音乐》", "Handel Water Music", "George Frideric Handel", "classical", 3, 112, "D Major", 5, "D4 F#4 A4 D5 A4 F#4 E4 D4 A4 B4 C#5 D5 C#5 B4 A4"],
  ["vivaldi-summer", "vivaldi-summer", "维瓦尔第《夏》", "Vivaldi Summer", "Antonio Vivaldi", "classical", 4, 132, "G Minor", 6, "G4 A4 A#4 C5 D5 C5 A#4 A4 G4 D5 D#5 D5 C5 A#4 A4 G4"],
  ["vivaldi-autumn", "vivaldi-autumn", "维瓦尔第《秋》", "Vivaldi Autumn", "Antonio Vivaldi", "classical", 3, 124, "F Major", 5, "F4 A4 C5 C5 A#4 A4 G4 F4 C5 D5 C5 A#4 A4 G4 F4"],
  ["vivaldi-winter", "vivaldi-winter", "维瓦尔第《冬》", "Vivaldi Winter", "Antonio Vivaldi", "classical", 4, 128, "F Minor", 6, "F4 F4 G4 G#4 G4 F4 E4 F4 C5 C5 C#5 C5 A#4 G#4 G4 F4"],
  ["schubert-ave-maria", "schubert-ave-maria", "舒伯特《圣母颂》", "Schubert Ave Maria", "Franz Schubert", "classical", 3, 72, "C Major", 6, "G4 C5 E5 G5 F5 E5 D5 C5 E5 G5 A5 G5 F5 E5 D5 C5"],
  ["schubert-trout", "schubert-the-trout", "舒伯特《鳟鱼》", "Schubert The Trout", "Franz Schubert", "classical", 3, 104, "D Major", 5, "D4 F#4 A4 A4 B4 A4 F#4 D4 E4 F#4 G4 A4 G4 F#4 E4 D4"],
  ["chopin-nocturne", "chopin-nocturne-op-9-no-2", "肖邦夜曲Op.9 No.2", "Chopin Nocturne Op. 9 No. 2", "Frédéric Chopin", "classical", 3, 66, "Eb Major", 6, "A#4 G4 G4 A#4 A4 G4 F4 D#4 F4 G4 A#4 C5 A#4 G4 F4"],
  ["chopin-funeral", "chopin-funeral-march", "肖邦葬礼进行曲", "Chopin Funeral March", "Frédéric Chopin", "classical", 3, 68, "Bb Minor", 6, "A#3 A#3 A#3 C#4 C4 A#3 A3 A#3 F4 F4 F4 F#4 F4 D#4 C#4 C4"],
  ["chopin-waltz-am", "chopin-waltz-in-a-minor", "肖邦A小调圆舞曲", "Chopin Waltz in A Minor", "Frédéric Chopin", "classical", 3, 88, "A Minor", 6, "E4 A4 B4 C5 B4 A4 G#4 A4 E5 D5 C5 B4 A4 G#4 A4 E4"],
  ["mendelssohn-spring", "mendelssohn-spring-song", "门德尔松《春之歌》", "Mendelssohn Spring Song", "Felix Mendelssohn", "classical", 3, 92, "A Major", 5, "E4 A4 C#5 E5 D5 C#5 B4 A4 B4 C#5 E5 F#5 E5 C#5 B4 A4"],
  ["nutcracker-march", "tchaikovsky-nutcracker-march", "柴可夫斯基《胡桃夹子进行曲》", "Nutcracker March", "Pyotr Ilyich Tchaikovsky", "classical", 3, 116, "G Major", 5, "G4 B4 D5 G5 F#5 E5 D5 C5 B4 A4 G4 D5 B4 G4"],
  ["waltz-flowers", "tchaikovsky-waltz-of-the-flowers", "柴可夫斯基《花之圆舞曲》", "Waltz of the Flowers", "Pyotr Ilyich Tchaikovsky", "classical", 3, 92, "D Major", 6, "A4 D5 F#5 A5 G5 F#5 E5 D5 F#5 A5 B5 A5 G5 F#5 E5 D5"],
  ["grieg-morning", "grieg-morning-mood", "格里格《晨曲》", "Grieg Morning Mood", "Edvard Grieg", "classical", 2, 76, "E Major", 5, "E4 F#4 G#4 B4 G#4 F#4 E4 F#4 G#4 B4 C#5 B4 G#4 F#4 E4"],
  ["grieg-mountain", "in-the-hall-of-the-mountain-king", "格里格《山魔王的宫殿》", "In the Hall of the Mountain King", "Edvard Grieg", "classical", 3, 120, "B Minor", 5, "B3 C#4 D4 E4 D4 C#4 B3 D4 E4 F#4 G4 F#4 E4 D4 C#4 B3"],
  ["dvorak-new-world", "dvorak-new-world-symphony", "德沃夏克《自新大陆》", "Dvořák New World Symphony", "Antonín Dvořák", "classical", 3, 84, "E Minor", 6, "E4 G4 B4 B4 A4 G4 E4 D4 E4 G4 B4 D5 C5 B4 A4 G4"],
  ["dvorak-humoresque", "dvorak-humoresque", "德沃夏克《幽默曲》", "Dvořák Humoresque", "Antonín Dvořák", "classical", 3, 96, "Gb Major", 5, "F#4 G#4 A#4 C#5 B4 A#4 G#4 F#4 G#4 A#4 B4 D#5 C#5 B4 A#4 G#4"],
  ["saint-saens-swan", "saint-saens-the-swan", "圣-桑《天鹅》", "Saint-Saëns The Swan", "Camille Saint-Saëns", "classical", 3, 72, "G Major", 6, "D4 G4 B4 D5 C5 B4 A4 G4 B4 D5 E5 D5 C5 B4 A4 G4"],
  ["bizet-toreador", "bizet-toreador-song", "比才《斗牛士之歌》", "Bizet Toreador Song", "Georges Bizet", "classical", 3, 112, "A Major", 5, "E4 E4 E4 F#4 G#4 A4 B4 A4 G#4 F#4 E4 B4 A4 G#4 F#4 E4"],
  ["offenbach-barcarolle", "offenbach-barcarolle", "奥芬巴赫《船歌》", "Offenbach Barcarolle", "Jacques Offenbach", "classical", 3, 78, "D Major", 6, "A4 D5 F#5 E5 D5 C#5 B4 A4 B4 C#5 D5 F#5 E5 D5 C#5 B4"],
  ["verdi-la-donna", "verdi-la-donna-e-mobile", "威尔第《善变的女人》", "Verdi La donna è mobile", "Giuseppe Verdi", "classical", 3, 116, "B Major", 5, "F#4 F#4 F#4 G#4 A#4 B4 C#5 B4 A#4 G#4 F#4 D#5 C#5 B4 A#4 G#4"],
  ["brahms-hungarian-5", "brahms-hungarian-dance-no-5", "勃拉姆斯《匈牙利舞曲第五号》", "Brahms Hungarian Dance No. 5", "Johannes Brahms", "classical", 4, 132, "F# Minor", 6, "F#4 G#4 A4 B4 C#5 B4 A4 G#4 F#4 C#5 B4 A4 G#4 F#4 E4 F#4"],
  ["debussy-clair", "debussy-clair-de-lune", "德彪西《月光》", "Debussy Clair de Lune", "Claude Debussy", "classical", 3, 66, "Db Major", 6, "C#4 G#4 C#5 F5 D#5 C#5 C5 A#4 G#4 C#5 F5 G#5 G5 F5 D#5 C#5"],
  ["satie-gnossienne", "satie-gnossienne-no-1", "萨蒂《第一号玄秘曲》", "Satie Gnossienne No. 1", "Erik Satie", "classical", 3, 68, "F Minor", 6, "F4 G#4 C5 D#5 C5 G#4 F4 G4 A#4 C#5 C5 A#4 G#4 G4 F4"],
  ["maple-leaf-rag", "maple-leaf-rag", "枫叶拉格泰姆", "Maple Leaf Rag", "Scott Joplin", "ragtime", 4, 124, "Ab Major", 6, "G#4 C5 D#5 F5 D#5 C5 G#4 A#4 C5 C#5 D#5 C5 A#4 G#4 G4 G#4"],
  ["easy-winners", "the-easy-winners", "轻松赢家", "The Easy Winners", "Scott Joplin", "ragtime", 4, 120, "Ab Major", 6, "G#4 A#4 C5 D#5 C5 A#4 G#4 F4 G#4 C5 C#5 C5 A#4 G#4 G4 F4"]
];

export const seoExpansionSongs = Object.fromEntries(
  EXPANSION_ROWS.map(([id, slug, zh, en, composer, category, difficulty, tempo, keySignature, estimatedMinutes, notes]) => [
    id,
    makeSong({ slug, zh, en, composer, category, difficulty, tempo, keySignature, estimatedMinutes, notes })
  ])
);
