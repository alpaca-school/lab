import {test,expect} from '@playwright/test';
import {baseLabel} from './base-label.mjs';
import {auditLayout} from './audit-layout.mjs';

test('actual DOM: both ruby formats and original unchanged',async({page})=>{
 await page.setContent('<div id="label"><span class="furigana"><span class="furigana-rt">まんざもう</span><span class="furigana-base">万座毛</span></span><ruby>沖縄<rp>(</rp><rt>おきなわ</rt><rp>)</rp></ruby></div>');
 expect(await page.locator('#label').evaluate(baseLabel)).toBe('万座毛沖縄');
 await expect(page.locator('rt')).toHaveText('おきなわ');
 await expect(page.locator('.furigana-rt')).toHaveText('まんざもう');
});
test('layout audit positive fixture',async({page},info)=>{
 await page.setViewportSize({width:390,height:560});
 await page.setContent('<button style="width:48px;height:48px">A</button><button style="width:48px;height:48px">B</button>');
 await auditLayout(page,info,'positive',['button']);
});
test('layout audit rejects absent, undersized and obscured targets',async({page},info)=>{
 await page.setViewportSize({width:390,height:560});
 // Failures are tested through the pure inspection result rather than suppressing assertions.
 const {inspectLayout}=await import('./audit-layout.mjs');
 await page.setContent('<button id="tiny" style="width:30px;height:30px">A</button><button id="blocked" style="position:absolute;top:80px;left:10px;width:48px;height:48px">B</button><div style="position:absolute;top:80px;left:10px;width:48px;height:48px;background:red"></div>');
 const result=await inspectLayout(page,['#tiny','#blocked','#missing']);
 expect(result).toEqual(expect.arrayContaining([expect.stringContaining('missing'),expect.stringContaining('touch target <44px'),expect.stringContaining('center blocked')]));
});
for(const viewport of [{width:390,height:560},{width:390,height:650},{width:390,height:760},{width:1280,height:800}]){
 test.describe('template '+viewport.width+'x'+viewport.height,()=>{
  test.use({viewport});
  test('title to result and return',async({page},info)=>{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://unpkg.com/**',r=>r.abort());
   await page.goto('http://127.0.0.1:8765/starter-kit/');
   await expect(page.locator('#start-btn')).toBeVisible();
   await auditLayout(page,info,'title',['#start-btn']);
   await page.locator('#start-btn').click();
   await expect(page.locator('#complete-btn')).toBeDisabled();
   await auditLayout(page,info,'play',['#sound-btn','#action-btn']);
   await page.locator('#action-btn').click();
   await expect(page.locator('#complete-btn')).toBeEnabled();
   await auditLayout(page,info,'play-done',['#sound-btn','#action-btn','#complete-btn']);
   await page.locator('#complete-btn').click();
   await expect(page.locator('#story-text ruby').first()).toBeVisible();
   await auditLayout(page,info,'story',['.nav-sticky button']);
   await page.locator('[data-go="screen-final"]').click();
   await expect(page.locator('#screen-final.active')).toBeVisible();
   await page.locator('.nav-final').scrollIntoViewIfNeeded();
   await auditLayout(page,info,'final',['.nav-final button','.nav-final a']);
   await page.locator('.nav-final [data-go="screen-title"]').click();
   await expect(page.locator('#start-btn')).toBeVisible();
   expect(errors).toEqual([]);
  });
 });
}
