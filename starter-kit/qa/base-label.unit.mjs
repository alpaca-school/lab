import test from 'node:test';
import assert from 'node:assert/strict';
import { baseLabel } from './base-label.mjs';

function fixture(parts) {
  return {
    parts,
    cloneNode(deep) {
      assert.equal(deep,true);
      const cloned = parts.map(x=>({...x}));
      return {
        querySelectorAll(selectors) {
          const selected = selectors.split(',');
          return cloned.filter(x=>selected.includes(x.tag)).map(x=>({remove(){x.removed=true}}));
        },
        get textContent(){return cloned.filter(x=>!x.removed).map(x=>x.text).join('')}
      };
    }
  };
}
test('standard ruby and custom furigana: retain base, not reading',()=>{
  const element=fixture([{tag:'.furigana-rt',text:'まんざもう'},{tag:'.furigana-base',text:'万座毛'},{tag:'rp',text:'('},{tag:'rt',text:'おきなわ'},{tag:'rp',text:')'},{tag:'text',text:' 沖縄'}]);
  assert.equal(baseLabel(element),'万座毛沖縄');
  assert.equal(element.parts.length,6);
  assert.equal(element.parts.some(x=>x.removed),false);
});
test('plain text, spaces and empty labels',()=>{
  assert.equal(baseLabel(fixture([{tag:'text',text:' 宮古島 市\n'}])),'宮古島市');
  assert.equal(baseLabel(fixture([])),'');
});
test('invalid input cannot silently pass',()=>assert.throws(()=>baseLabel(null),TypeError));
