import assert from 'node:assert/strict';
import test from 'node:test';
import { keyboardNote, keyboardIdentity } from '../js/keyboard-input.mjs';
import { keyboardNotes, mobileRangeForNote, keyboardMapForRange } from '../js/keyboard-range.mjs';
const map={a:'C3','1':'C#3',';':'E4',',':'C6',q:'F4'};
test('literal letters and full-width punctuation map to visible labels',()=>{
 for(const [key,note] of [['A','C3'],['；','E4'],['，','C6']])assert.equal(keyboardNote({key},map),note);
});
test('Shift and IME use physical keys when the character has no mapping',()=>{
 for(const [key,code,note] of [[':','Semicolon','E4'],['<','Comma','C6'],['!','Digit1','C#3'],['Process','KeyA','C3'],['Dead','KeyQ','F4']]) assert.equal(keyboardNote({key,code},map),note);
});
test('literal mapped keys take precedence over physical positions on alternate layouts',()=>{
 assert.equal(keyboardNote({key:'a',code:'KeyQ'},map),'C3');
 assert.equal(keyboardNote({key:'Escape',code:'Escape'},map),undefined);
});
test('physical key identity survives Shift state changes on keyup',()=>{
 assert.equal(keyboardIdentity({key:':',code:'Semicolon'}),keyboardIdentity({key:';',code:'Semicolon'}));
 assert.equal(keyboardIdentity({key:'A',code:''}),'a');
});
test('parameterized keyboard preserves desktop and mobile endpoints/counts',()=>{
 const desktop=keyboardNotes(),mobile=keyboardNotes(3,2);
 assert.equal(desktop.length,37);assert.equal(desktop[0].note,'C3');assert.equal(desktop.at(-1).note,'C6');
 assert.equal(mobile.length,25);assert.equal(mobile.filter(k=>k.type==='white').length,15);
 assert.equal(mobile.filter(k=>k.type==='black').length,10);assert.equal(mobile.at(-1).note,'C5');
});
test('teaching ranges contain every supported natural/sharp note and clamp at C1/C7',()=>{
 for(const {note} of keyboardNotes(1,6)){
  const octave=mobileRangeForNote(note,3);
  assert.ok(octave>=1&&octave<=5,note);
  assert.ok(keyboardNotes(octave,2).some(key=>key.note===note),note);
 }
 assert.equal(mobileRangeForNote('C5',3),3);
 assert.equal(mobileRangeForNote('C#5',3),4);
 assert.equal(mobileRangeForNote('C1',3),1);assert.equal(mobileRangeForNote('C7',3),5);
});
test('optional mobile physical keys transpose with the visible range; desktop stays fixed',()=>{
 const base={a:'C3',s:'D3',d:'E3',t:'C5',y:'D5',',':'C6'};
 assert.deepEqual(keyboardMapForRange(base,4,true),{a:'C4',s:'D4',d:'E4',t:'C6'});
 assert.deepEqual(keyboardMapForRange(base,1,true),{a:'C1',s:'D1',d:'E1',t:'C3'});
 assert.deepEqual(keyboardMapForRange(base,5,false),base);
});
