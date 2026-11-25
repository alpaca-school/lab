import { test, expect } from '@playwright/test';
const url='http://127.0.0.1:8765/kina-bansho-v2/';
async function audit(page, info, name, selectors){
 const problems=await page.evaluate(selectors=>{
  const vv=visualViewport,b={x:vv.offsetLeft,y:vv.offsetTop,w:vv.width,h:vv.height};
  const nodes=selectors.map(s=>document.querySelector(s));
  const issues=[],rects=[];
  nodes.forEach((e,i)=>{
   if(!e||!e.getClientRects().length){issues.push('missing/hidden: '+selectors[i]);return}
   const r=e.getBoundingClientRect();rects.push({r,i});
   if(r.width<44||r.height<44)issues.push('size: '+selectors[i]+' '+r.width+'x'+r.height);
   if(r.left<b.x||r.top<b.y||r.right>b.x+b.w+1||r.bottom>b.y+b.h+1)issues.push('viewport: '+selectors[i]);
   const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   if(!e.contains(hit))issues.push('hit: '+selectors[i]);
  });
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(Math.min(a.r.right,b.r.right)>Math.max(a.r.left,b.r.left)&&Math.min(a.r.bottom,b.r.bottom)>Math.max(a.r.top,b.r.top))issues.push('overlap: '+selectors[a.i]+' '+selectors[b.i])}
  return issues
 },selectors);
 await page.screenshot({path:info.outputPath(name+'.png')});
 expect(problems).toEqual([]);
}
for(const [width,height] of [[390,560],[390,650],[390,760],[1280,800]]){
 test('fallback and layout '+width+'x'+height,async({page},info)=>{
  await page.setViewportSize({width,height});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto(url);await expect(page.locator('#start')).toBeVisible();
  await audit(page,info,'title',['#start','#mode','#story','#labLink','#explain','#sound']);
  await page.locator('#story').click();await expect(page.locator('#readingDialog')).toBeVisible();await audit(page,info,'story',['#closeReading']);await page.locator('#closeReading').click();
  await page.locator('#mode').selectOption('relax');await page.locator('#start').click();
  await expect(page.locator('.fallback')).toBeVisible();await expect(page.locator('#inn')).toBeEnabled();
  await audit(page,info,'play',['#home','#explain','#sound','#inn','[data-job="admin"]','[data-job="guide"]','[data-job="exchange"]','#tea','#help','#resetView']);
  await page.locator('#inn').click();await expect(page.locator('#score')).toHaveText('130');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('kina_bansho_v2_qa_best_relax'))).toBe('130');
  await page.locator('#explain').click();await expect(page.locator('#readingDialog')).toBeVisible();await audit(page,info,'help',['#closeReading']);await page.locator('#closeReading').click();
  await page.locator('#home').click();await expect(page.locator('#intro')).toBeVisible();
  await page.locator('#mode').selectOption('challenge');await page.locator('#start').click();await expect(page.locator('#best')).toHaveText('0');
  expect(errors).toEqual([]);
 });
}
test('audit negative control rejects missing target',async({page},info)=>{await page.goto(url);await expect(audit(page,info,'negative',['#does-not-exist'])).rejects.toThrow()});
