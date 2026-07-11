import { getScoreBySongId } from '../data/song-scores.mjs';

const DURATION_UNITS = {
  '8': 1,
  q: 2,
  h: 4,
  w: 8
};

const LETTER_TO_STEP = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6
};

const REFERENCE_STEP = diatonicStep('E4');
const SVG_NS = 'http://www.w3.org/2000/svg';

function diatonicStep(pitch) {
  const match = String(pitch).match(/^([A-G])([#b]?)(\d)$/);
  if (!match) return REFERENCE_STEP;
  const [, letter, , octaveValue] = match;
  const octave = Number(octaveValue);
  return octave * 7 + LETTER_TO_STEP[letter];
}

function accidentalOf(pitch) {
  const match = String(pitch).match(/^([A-G])([#b]?)(\d)$/);
  return match?.[2] || '';
}

function unitsForDuration(duration) {
  return DURATION_UNITS[duration] || DURATION_UNITS.q;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, String(value));
    }
  });
  return element;
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

class ScoreViewer {
  constructor(root, songId, locale = 'zh') {
    this.root = root;
    this.songId = songId;
    this.locale = locale;
    this.score = getScoreBySongId(songId);
    this.canvas = root.querySelector('[data-score-canvas]');
    this.caption = root.querySelector('[data-score-caption]');
    this.modeButtons = Array.from(root.querySelectorAll('[data-score-mode]'));
    this.followToggle = root.querySelector('[data-score-follow]');
    this.labelsToggle = document.getElementById('labels-toggle');
    this.noteGroups = [];
    this.activeMode = 'dual';
    this.isFollowing = this.followToggle?.checked ?? true;

    this.bindControls();
    this.render();
  }

  bindControls() {
    this.modeButtons.forEach((button) => {
      button.addEventListener('click', () => this.setMode(button.dataset.scoreMode || 'dual'));
    });

    this.followToggle?.addEventListener('change', () => {
      this.isFollowing = this.followToggle.checked;
    });
  }

  setMode(mode) {
    this.activeMode = mode;
    this.root.dataset.scoreMode = mode;
    this.modeButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.scoreMode === mode);
      button.setAttribute('aria-pressed', button.dataset.scoreMode === mode ? 'true' : 'false');
    });

    if (this.labelsToggle) {
      const shouldShowLabels = mode !== 'score';
      if (this.labelsToggle.checked !== shouldShowLabels) {
        this.labelsToggle.checked = shouldShowLabels;
        this.labelsToggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    if (this.caption) {
      const captions = {
        zh: {
          guided: '当前音符会与键盘提示同步高亮，适合刚开始练习时边看谱边上手。',
          dual: '双视图会同时保留乐谱与键位提示，适合从提示练习过渡到看谱弹奏。',
          score: '纯乐谱模式会隐藏键位字母，更接近真实练琴的阅读体验。'
        },
        en: {
          guided: 'The current note stays synced with keyboard prompts, perfect for first-time practice.',
          dual: 'Dual view keeps sheet music and key prompts together so you can transition into reading notation.',
          score: 'Score mode hides key letters for a more focused sheet-reading experience.'
        }
      };

      this.caption.textContent = captions[this.locale]?.[mode] || captions.en[mode];
    }
  }

  render() {
    if (!this.canvas) return;
    clearElement(this.canvas);

    if (!this.score) {
      this.root.classList.add('is-unavailable');
      this.modeButtons.forEach((button) => {
        button.disabled = true;
      });
      this.canvas.innerHTML = `
        <div class="score-viewer-empty">
          <strong>${this.locale === 'zh' ? '这首曲子的乐谱即将上线。' : 'Sheet music for this song is coming soon.'}</strong>
          <p>${this.locale === 'zh'
            ? '我们会优先为热门入门歌曲补充五线谱。现在你仍然可以使用下方的提示练习开始弹奏。'
            : 'We are adding sheet music to more beginner favorites. For now, you can still start with guided practice below.'}</p>
        </div>
      `;
      return;
    }

    this.root.classList.remove('is-unavailable');
    this.setMode('dual');

    const svg = this.buildSvg();
    this.canvas.appendChild(svg);
  }

  buildSvg() {
    const staffTop = 84;
    const staffSpacing = 14;
    const bottomLineY = staffTop + staffSpacing * 4;
    const measureSpacing = 20;
    const noteUnitWidth = 24;
    const firstMeasureOffset = 96;
    const measureDescriptors = this.score.measures.map((measure, index) => {
      const units = Math.max(4, measure.reduce((sum, event) => sum + unitsForDuration(event.duration), 0));
      const width = Math.max(index === 0 ? 220 : 180, units * noteUnitWidth + 72);
      return { measure, units, width };
    });

    const width = measureDescriptors.reduce((total, descriptor) => total + descriptor.width, firstMeasureOffset + measureSpacing);
    const height = 222;
    const svg = createSvgElement('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'score-svg',
      role: 'img',
      'aria-label': this.locale === 'zh' ? '互动钢琴乐谱' : 'Interactive piano sheet music'
    });

    svg.appendChild(createSvgElement('rect', {
      x: 0,
      y: 0,
      width,
      height,
      rx: 24,
      class: 'score-paper'
    }));

    const metaGroup = createSvgElement('g', { class: 'score-meta' });
    const timeSignature = `${this.score.timeSignature.beats}/${this.score.timeSignature.beatType}`;
    metaGroup.appendChild(createSvgElement('text', {
      x: 46,
      y: 52,
      class: 'score-meta-key'
    }));
    metaGroup.lastChild.textContent = this.score.keySignature || '';
    metaGroup.appendChild(createSvgElement('text', {
      x: 46,
      y: 105,
      class: 'score-clef'
    }));
    metaGroup.lastChild.textContent = '𝄞';
    metaGroup.appendChild(createSvgElement('text', {
      x: 84,
      y: 103,
      class: 'score-time-signature'
    }));
    metaGroup.lastChild.textContent = timeSignature;
    svg.appendChild(metaGroup);

    const measureLayer = createSvgElement('g', { class: 'score-measures' });
    let noteIndex = 0;
    let x = firstMeasureOffset;

    measureDescriptors.forEach((descriptor, measureIndex) => {
      for (let line = 0; line < 5; line += 1) {
        const y = staffTop + line * staffSpacing;
        measureLayer.appendChild(createSvgElement('line', {
          x1: x,
          y1: y,
          x2: x + descriptor.width,
          y2: y,
          class: 'score-staff-line'
        }));
      }

      measureLayer.appendChild(createSvgElement('line', {
        x1: x,
        y1: staffTop,
        x2: x,
        y2: bottomLineY,
        class: 'score-bar-line'
      }));

      measureLayer.appendChild(createSvgElement('text', {
        x: x + 6,
        y: staffTop - 20,
        class: 'score-measure-number'
      }));
      measureLayer.lastChild.textContent = `${measureIndex + 1}`;

      let noteX = x + 34;
      descriptor.measure.forEach((event) => {
        const units = unitsForDuration(event.duration);
        const group = this.buildNoteGroup({
          event,
          noteIndex,
          x: noteX,
          bottomLineY,
          staffSpacing
        });
        this.noteGroups.push(group);
        measureLayer.appendChild(group);
        noteX += Math.max(32, units * noteUnitWidth);
        noteIndex += 1;
      });

      x += descriptor.width;
      measureLayer.appendChild(createSvgElement('line', {
        x1: x,
        y1: staffTop,
        x2: x,
        y2: bottomLineY,
        class: 'score-bar-line'
      }));
      x += measureSpacing;
    });

    svg.appendChild(measureLayer);
    return svg;
  }

  buildNoteGroup({ event, noteIndex, x, bottomLineY, staffSpacing }) {
    const group = createSvgElement('g', {
      class: 'score-note',
      'data-note-index': noteIndex
    });

    const notePosition = diatonicStep(event.pitch) - REFERENCE_STEP;
    const y = bottomLineY - notePosition * (staffSpacing / 2);
    const isOpenHead = event.duration === 'h' || event.duration === 'w';
    const noteHead = createSvgElement('ellipse', {
      cx: x,
      cy: y,
      rx: 10,
      ry: 7,
      class: `score-note-head${isOpenHead ? ' is-open' : ''}`
    });
    group.appendChild(noteHead);

    const accidental = accidentalOf(event.pitch);
    if (accidental) {
      const text = createSvgElement('text', {
        x: x - 18,
        y: y + 4,
        class: 'score-accidental'
      });
      text.textContent = accidental;
      group.appendChild(text);
    }

    if (event.duration !== 'w') {
      const stemUp = notePosition < 6;
      group.appendChild(createSvgElement('line', {
        x1: stemUp ? x + 8 : x - 8,
        y1: y,
        x2: stemUp ? x + 8 : x - 8,
        y2: stemUp ? y - 34 : y + 34,
        class: 'score-stem'
      }));
    }

    const ledgerOffsets = [];
    if (notePosition < 0) {
      for (let position = notePosition; position <= 0; position += 2) {
        if (position % 2 === 0) ledgerOffsets.push(position);
      }
    } else if (notePosition > 8) {
      for (let position = 10; position <= notePosition; position += 2) {
        ledgerOffsets.push(position);
      }
    }

    ledgerOffsets.forEach((position) => {
      const ledgerY = bottomLineY - position * (staffSpacing / 2);
      group.appendChild(createSvgElement('line', {
        x1: x - 14,
        y1: ledgerY,
        x2: x + 14,
        y2: ledgerY,
        class: 'score-ledger-line'
      }));
    });

    const label = createSvgElement('text', {
      x,
      y: 188,
      class: 'score-note-label'
    });
    label.textContent = event.pitch;
    group.appendChild(label);

    return group;
  }

  setProgress(noteIndex, { completed = false } = {}) {
    if (!this.noteGroups.length) return;

    this.noteGroups.forEach((group, index) => {
      group.classList.toggle('is-complete', completed || index < noteIndex);
      group.classList.toggle('is-current', !completed && index === noteIndex);
    });

    if (this.isFollowing && !completed) {
      const current = this.noteGroups[noteIndex];
      current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  clearProgress() {
    this.noteGroups.forEach((group) => {
      group.classList.remove('is-complete', 'is-current');
    });
  }
}

export function initializeScoreViewer(songId, options = {}) {
  const root = document.querySelector('[data-score-viewer]');
  if (!root || !songId) return null;

  const viewer = new ScoreViewer(root, songId, options.locale || root.dataset.locale || 'zh');

  const bindEvent = (eventName, handler) => {
    document.addEventListener(eventName, (event) => {
      if (event.detail?.songId && event.detail.songId !== songId) return;
      handler(event.detail || {});
    });
  };

  bindEvent('piano:practice-songchange', () => viewer.clearProgress());
  bindEvent('piano:practice-start', (detail) => viewer.setProgress(detail.noteIndex || 0));
  bindEvent('piano:practice-progress', (detail) => viewer.setProgress(detail.noteIndex || 0));
  bindEvent('piano:practice-stop', (detail) => {
    if (detail.completed) {
      viewer.setProgress(viewer.noteGroups.length, { completed: true });
    } else {
      viewer.clearProgress();
    }
  });

  return viewer;
}
