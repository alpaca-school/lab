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

const serviceIcons=['🛏️','📜','🪧','🤝'];
const serviceKeys=['inn','admin','guide','exchange'];
async function boot(page,mode='relax',fallback=true){
 if(fallback)await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.locator('#mode').selectOption(mode);await page.locator('#start').click();await expect(page.locator('#inn')).toBeEnabled();
}
test('progression, five-hit rush, all unlocks and clear',async({page},info)=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:650});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Math.random=()=>.999});
 await page.clock.install();await boot(page);
 await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())));
 let lastScore=0,seen=new Set();
 for(let i=0;i<100;i++){
   if(await page.locator('#result').isVisible())break;
   if(!await page.locator('#queue .guestCard').count())await page.clock.runFor(1600);
   const label=await page.locator('#queue .guestCard').first().textContent();
   const job=serviceIcons.findIndex(icon=>label.includes(icon));expect(job).toBeGreaterThanOrEqual(0);
   seen.add(job);
   await page.locator('[data-job="'+serviceKeys[job]+'"]').click();
   const s=Number(await page.locator('#score').textContent());expect(s).toBeGreaterThan(lastScore);lastScore=s;
   if(i===4){expect(s).toBeGreaterThanOrEqual(1265);expect(await page.locator('#tea').textContent()).toMatch(/3/)}
   await page.clock.runFor(100);
 }
 expect([...seen].sort()).toEqual([0,1,2,3]);
 expect(lastScore).toBeGreaterThanOrEqual(7000);
 await expect(page.locator('#resultText')).toContainText('大成功');
 await audit(page,info,'clear',['#again','#continue','#resultHome','#result a']);
 await page.locator('#continue').click();await expect(page.locator('#play')).toBeVisible();
 expect(errors).toEqual([]);
});
test('tea, helper, timeout and restart',async({page})=>{
 await page.clock.install();await boot(page,'challenge');
 await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())));
 await page.clock.runFor(2400);
 const before=await page.locator('#queue progress').first().evaluate(e=>e.value);
 await page.locator('#tea').click();expect(await page.locator('#queue progress').first().evaluate(e=>e.value)).toBeGreaterThan(before);
 await expect(page.locator('#tea')).toHaveText('🍵 お茶 1');
 await page.locator('#help').click();await expect(page.locator('#help')).toHaveText('👴 おじぃ 0');expect(Number(await page.locator('#score').textContent())).toBeGreaterThan(0);
 await page.clock.runFor(22000);await expect(page.locator('#resultText')).toContainText('おしごと終了');
 await page.locator('#again').click();await expect(page.locator('#score')).toHaveText('0');await expect(page.locator('#tea')).toHaveText('🍵 お茶 2');
});
test('storage denied: game continues',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('storage denied')};Storage.prototype.setItem=function(){throw Error('storage denied')}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);await page.locator('#inn').click();await expect(page.locator('#score')).toHaveText('130');expect(errors).toEqual([]);
});
test('real WebGL startup and render',async({page},info)=>{
 test.setTimeout(60000);await page.setViewportSize({width:390,height:650});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await boot(page,'relax',false);
 await expect(page.locator('#world canvas')).toBeVisible();await expect(page.locator('.fallback')).toHaveCount(0);
 await page.locator('#resetView').click();
 await page.locator('#inn').click();await expect(page.locator('#score')).toHaveText('130');
 await page.screenshot({path:info.outputPath('webgl.png')});expect(errors).toEqual([]);
});
