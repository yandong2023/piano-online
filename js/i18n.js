import { NEW_PIANO_LOCALES, translatePiano } from '../data/piano-locales.mjs';

const dictionaries = {
    zh: {
        practice: {
            correct: '正确',
            wrong: '错误',
            progress: '进度',
            completedTitle: '完成这首歌！',
            stoppedTitle: '练习已结束',
            score: '得分',
            accuracy: '准确率',
            duration: '用时',
            bestScore: '最佳成绩',
            newBest: '刷新最佳成绩',
            practiceAgain: '再练一次',
            nextSong: '下一首',
            close: '关闭',
            noSong: '请先选择一首歌曲',
            start: '跟着提示弹',
            stop: '停止练习'
        }
    },
    en: {
        practice: {
            correct: 'Correct',
            wrong: 'Wrong',
            progress: 'Progress',
            completedTitle: 'Song completed!',
            stoppedTitle: 'Practice ended',
            score: 'Score',
            accuracy: 'Accuracy',
            duration: 'Time',
            bestScore: 'Best score',
            newBest: 'New personal best',
            practiceAgain: 'Practice again',
            nextSong: 'Next song',
            close: 'Close',
            noSong: 'Choose a song first',
            start: 'Guided Practice',
            stop: 'Stop Practice'
        }
    }
};

for (const locale of NEW_PIANO_LOCALES) {
    dictionaries[locale] = { practice: Object.fromEntries(Object.entries(dictionaries.en.practice)
        .map(([key, en]) => [key, translatePiano(locale, dictionaries.zh.practice[key], en)])) };
}

export function getLocale() {
    const lang = document.documentElement.lang?.toLowerCase() || 'zh';
    if (lang === 'zh-hant') return lang;
    const base = lang.split('-')[0];
    return dictionaries[base] ? base : 'zh';
}

export function pianoText(zh, en) {
    return translatePiano(getLocale(), zh, en);
}

export function t(key, params = {}) {
    const locale = getLocale();
    const value = key.split('.').reduce((current, part) => current?.[part], dictionaries[locale]);
    const fallback = key.split('.').reduce((current, part) => current?.[part], dictionaries.zh);
    const template = value ?? fallback ?? key;

    return Object.entries(params).reduce(
        (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
        String(template)
    );
}
