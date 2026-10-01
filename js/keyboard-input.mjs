// Respect literal mapped keys first (including non-QWERTY layouts), then fall
// back to physical keys for Shift, full-width punctuation, dead keys and IMEs.
export function keyboardCharacter(event) {
  return String(event.key || '').normalize('NFKC').toLowerCase();
}
export function keyboardNote(event, keyMap) {
  const key = keyboardCharacter(event);
  if (Object.hasOwn(keyMap, key)) return keyMap[key];
  const code = String(event.code || '');
  const character = /^Key[A-Z]$/.test(code) ? code.slice(3).toLowerCase()
    : /^(Digit|Numpad)[0-9]$/.test(code) ? code.slice(-1)
    : ({ Semicolon: ';', Comma: ',' })[code];
  return Object.hasOwn(keyMap, character || '') ? keyMap[character] : undefined;
}
export function keyboardIdentity(event) {
  return event.code || keyboardCharacter(event);
}
