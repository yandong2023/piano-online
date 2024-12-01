const https = require('https');
const fs = require('fs');
const path = require('path');

// 创建项目结构
const dirs = ['samples'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(`Created directory: ${dir}`);
    }
});

// 定义要下载的音符
const notes = [
    'A0', 'C1', 'D#1', 'F#1', 'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3',
    'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6', 'D#6', 'F#6', 'A6'
];

// 下载进度追踪
let downloadedCount = 0;
const totalFiles = notes.length;

// 下载单个文件的函数
function downloadFile(note) {
    const url = `https://tonejs.github.io/audio/salamander/${note}.mp3`;
    const filePath = path.join('samples', `piano-${note}.mp3`);
    
    https.get(url, (response) => {
        if (response.statusCode === 200) {
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                downloadedCount++;
                const progress = Math.round((downloadedCount / totalFiles) * 100);
                console.log(`Downloaded: piano-${note}.mp3 (${progress}% complete)`);
                
                if (downloadedCount === totalFiles) {
                    console.log('\nAll piano samples downloaded successfully!');
                    console.log('Setup complete! You can now run the piano application.');
                }
            });
        } else {
            console.error(`Failed to download ${note}: HTTP ${response.statusCode}`);
        }
    }).on('error', (err) => {
        console.error(`Error downloading ${note}:`, err);
    });
}

console.log('Starting piano samples download...');
notes.forEach(note => downloadFile(note)); 