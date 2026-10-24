const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNumberToNote(midi) {
  const number = Number(midi);
  if (!Number.isInteger(number) || number < 0 || number > 127) throw new TypeError('Bad MIDI note');
  return `${NOTE_NAMES[number % 12]}${Math.floor(number / 12) - 1}`;
}

function text(bytes, offset, length) {
  let value = '';
  for (let index = 0; index < length; index += 1) value += String.fromCharCode(bytes[offset + index]);
  return value;
}

function readVLQ(bytes, offset) {
  let value = 0;
  let byte = 0;
  do {
    if (offset >= bytes.length) throw new Error('This MIDI file ended early.');
    byte = bytes[offset];
    offset += 1;
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);
  return { value, offset };
}

export function parseMidi(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length < 14 || text(bytes, 0, 4) !== 'MThd') throw new Error('That file is not a MIDI file. Choose a .mid file.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(4);
  const format = view.getUint16(8);
  const trackCount = view.getUint16(10);
  const division = view.getUint16(12);
  if (division & 0x8000) throw new Error('This MIDI time format is not supported. Export a standard .mid file.');
  if (!division) throw new Error('This MIDI file has no timing information.');
  let offset = 8 + headerLength;
  const events = [];
  for (let track = 0; track < trackCount; track += 1) {
    if (text(bytes, offset, 4) !== 'MTrk') throw new Error('That file is not a MIDI file. Choose a .mid file.');
    const length = view.getUint32(offset + 4);
    const end = offset + 8 + length;
    offset += 8;
    let tick = 0;
    let status = 0;
    while (offset < end) {
      const delta = readVLQ(bytes, offset);
      offset = delta.offset;
      tick += delta.value;
      if (offset >= bytes.length) break;
      let byte = bytes[offset];
      if (byte < 0x80) {
        if (!status) throw new Error('This MIDI file could not be read.');
        byte = status;
      } else {
        status = byte;
        offset += 1;
      }
      const kind = byte & 0xf0;
      if (kind === 0x80 || kind === 0x90 || kind === 0xa0 || kind === 0xb0 || kind === 0xe0) {
        const data1 = bytes[offset];
        const data2 = bytes[offset + 1];
        offset += 2;
        if (kind === 0x80 || (kind === 0x90 && data2 === 0)) events.push({ tick, type: 'off', note: data1 });
        else if (kind === 0x90) events.push({ tick, type: 'on', note: data1, velocity: data2 });
      } else if (kind === 0xc0 || kind === 0xd0) {
        offset += 1;
      } else if (byte === 0xff) {
        const meta = bytes[offset];
        offset += 1;
        const len = readVLQ(bytes, offset);
        offset = len.offset;
        if (meta === 0x51 && len.value === 3) {
          const tempo = (bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2];
          events.push({ tick, type: 'tempo', tempo });
        }
        offset += len.value;
        status = 0;
      } else if (byte === 0xf0 || byte === 0xf7) {
        const len = readVLQ(bytes, offset);
        offset = len.offset + len.value;
        status = 0;
      } else {
        throw new Error('This MIDI file could not be read.');
      }
    }
    offset = end;
  }
  events.sort((a, b) => a.tick - b.tick || (a.type === 'tempo' ? -1 : 1));
  return { format, division, events };
}

export function timelineMs(events, division) {
  let tempo = 500000;
  let lastTick = 0;
  let ms = 0;
  const timed = [];
  for (const event of events) {
    ms += ((event.tick - lastTick) * tempo) / division / 1000;
    lastTick = event.tick;
    if (event.type === 'tempo' && event.tempo > 0) tempo = event.tempo;
    else if (event.type === 'on' || event.type === 'off') timed.push({ ...event, ms });
  }
  return timed;
}
