import assert from 'node:assert/strict';
import test from 'node:test';
import { keyboardNote, keyboardIdentity } from '../js/keyboard-input.mjs';
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
