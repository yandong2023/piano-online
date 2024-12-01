const fs = require('fs');
const path = require('path');

// 需要验证的音符列表
const notes = [
    'A0', 'C1', 'D#1', 'F#1', 'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3',
    'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6', 'D#6', 'F#6', 'A6'
];

// 验证文件
console.log('Verifying downloaded files...');
const missingFiles = [];
const invalidFiles = [];

notes.forEach(note => {
    const filePath = path.join('samples', `piano-${note}.mp3`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        missingFiles.push(note);
        return;
    }
    
    // 检查文件大小
    const stats = fs.statSync(filePath);
    if (stats.size < 1000) { // 文件太小可能是损坏的
        invalidFiles.push(note);
    }
});

if (missingFiles.length > 0) {
    console.error('\nMissing files:');
    missingFiles.forEach(note => console.error(`- piano-${note}.mp3`));
}

if (invalidFiles.length > 0) {
    console.error('\nPotentially corrupted files:');
    invalidFiles.forEach(note => console.error(`- piano-${note}.mp3`));
}

if (missingFiles.length === 0 && invalidFiles.length === 0) {
    console.log('\nAll files verified successfully!');
    console.log(`Total files: ${notes.length}`);
    console.log('Piano samples are ready to use.');
} else {
    console.error('\nSome files need to be redownloaded.');
    console.log('Please run setup.js again for the missing or corrupted files.');
} 