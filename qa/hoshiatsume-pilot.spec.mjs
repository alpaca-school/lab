import { test, expect } from '@playwright/test';
test.use({ screenshot: 'only-on-failure' });


async function auditLayout(page, testInfo, name, selectors) {
  const problems=await page.evaluate(async selectors=>{
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const vv=window.visualViewport;
    const bounds={left:vv?.offsetLeft||0,top:vv?.offsetTop||0,width:vv?.width||innerWidth,height:vv?.height||innerHeight};
    const targets=[...new Set(selectors.flatMap(s=>Array.from(document.querySelectorAll(s))))].filter(el=>{
      const r=el.getBoundingClientRect(), st=getComputedStyle(el);
      return r.width>0&&r.height>0&&st.visibility!=='hidden'&&st.display!=='none'&&!el.closest('[inert]')&&!el.disabled;
    });
    const label=el=>el.getAttribute('aria-label')||el.textContent.trim().slice(0,70)||el.className;
    const issues=[];
    const entries=targets.map(el=>({el,r:el.getBoundingClientRect()}));
    for(const {el,r} of entries){
      const tag=label(el);
      if(r.left<bounds.left-1||r.top<bounds.top-1||r.right>bounds.left+bounds.width+1||r.bottom>bounds.top+bounds.height+1)issues.push('viewport: '+tag);
      if(r.width<44||r.height<44)issues.push('touch target <44px: '+tag+' '+Math.round(r.width)+'x'+Math.round(r.height));
      const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      if(!hit||!el.contains(hit))issues.push('center blocked: '+tag+' by '+(hit?label(hit):'outside viewport'));
    }
    for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
      const a=entries[i],b=entries[j];
      if(a.el.contains(b.el)||b.el.contains(a.el))continue;
      if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>1&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>1)issues.push('overlap: '+label(a.el)+' / '+label(b.el));
    }
    return issues;
  },selectors);
  await page.screenshot({path:testInfo.outputPath(name+'.png'),animations:'disabled'});
  expect.soft(problems,name).toEqual([]);
}
const mapControls=['.journeyexit','.hudbtns button','.bottombar button'];
const quizControls=['.journeyexit','.hudbtns button','.sheet.quiz button'];

const progressKey = 'hoshizora-shisa-refactor-20261124';
const photoKey = 'okinawa-hoshiatsume-photos-refactor-20261124';
const url = 'http://127.0.0.1:8765/okinawa-hoshiatsume/?dbg=1';
const screen = async (page, name) => expect.poll(() => page.evaluate(() => window.__dbg?.screen), {timeout: 30000}).toBe(name);
async function menu(page) {
  await page.goto(url);
  await screen(page, 'title');
  await page.getByRole('button', {name:'はじめる', exact:true}).click();
  await page.locator('.storyskip').click();
  await expect(page.locator('.activitymenu')).toBeVisible();
}
async function mode(page, name) {
  await page.locator('.activitymenu').getByRole('button', {name}).click();
  await screen(page, 'map');
  await page.locator('.bottombar button').click();
}
async function answer(page, name) {
  const button=page.locator('.opts button').filter({hasText:name});
  await expect(button).toHaveCount(1);
  await button.click();
}
async function quiz(page) {
  await screen(page,'quiz');
  await page.locator('.opts button').filter({hasNotText:'万座毛'}).first().click();
  await expect(page.locator('.ngmsg')).toBeVisible();
  await answer(page,'万座毛');
  await expect(page.locator('.qtext')).toContainText('市町村');
  await answer(page,'恩納村');
}
async function stars(page) {
  await screen(page,'sky');
  // Debug hook tests state transition, not physical 3D hit targets.
  await page.evaluate(()=>window.__dbg.onStar(1));
  await expect.poll(()=>page.evaluate(()=>window.__dbg.lit.length)).toBe(0);
  for(let i=0;i<6;i++){
    await page.evaluate(n=>window.__dbg.onStar(n),i);
    await expect.poll(()=>page.evaluate(()=>window.__dbg.lit.length)).toBe(i+1);
  }
}
async function saved(page) {
 return page.evaluate(([p,a])=>({done:JSON.parse(localStorage.getItem(p)||'{"done":[]}').done,photos:JSON.parse(localStorage.getItem(a)||'[]')}),[progressKey,photoKey]);
}
for(const viewport of [{width:390,height:560},{width:390,height:650},{width:390,height:760},{width:1280,height:800}]){
 test.describe(viewport.width+'x'+viewport.height,()=>{
  test.use({viewport});
  test('story, quiz, trace, adventure, save',async({page},testInfo)=>{
   test.setTimeout(150000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await menu(page);
   await auditLayout(page,testInfo,'menu',['.activitymenu button']);
   await page.locator('.activitymenu').getByRole('button',{name:/地名クイズ/}).click();
   await screen(page,'map');
   await auditLayout(page,testInfo,'map',mapControls);
   await page.locator('.bottombar button').click();
   await screen(page,'quiz');
   await auditLayout(page,testInfo,'quiz',quizControls);
   await quiz(page);await screen(page,'map');
   expect(await saved(page)).toEqual({done:[],photos:[]});
   await page.locator('.journeyexit').click();await screen(page,'title');
   await page.getByRole('button',{name:'はじめる',exact:true}).click();
   await mode(page,/星座つなぎ/);
   await stars(page);await screen(page,'map');
   expect(await saved(page)).toEqual({done:[],photos:[]});
   await page.locator('.journeyexit').click();await screen(page,'title');
   await page.getByRole('button',{name:'はじめる',exact:true}).click();
   await mode(page,/ぼうけんする/);
   await screen(page,'card');
   await auditLayout(page,testInfo,'place-card',['.journeyexit','.hudbtns button','.sheet.card button']);
   await page.locator('.sheet.card .big').click();
   await quiz(page);await stars(page);await screen(page,'reward');
   await expect(page.locator('.photo3-stage')).toBeVisible();
   await auditLayout(page,testInfo,'photo',['.photo3-save','.photo3-skip']);
   expect((await saved(page)).photos).toHaveLength(0);
   await page.locator('.photo3-save').click();
   expect((await saved(page)).photos).toHaveLength(1);
   expect((await saved(page)).done).toEqual([1]);
   await page.locator('.sheet.reward .big').click();await screen(page,'map');
   await page.locator('.rbtn.book').click();
   await expect(page.locator('.photo3-mini')).toHaveCount(1);
   await auditLayout(page,testInfo,'album',['.photo3-album-head button']);
   await page.locator('.photo3-album-head button').click();
   await page.reload();await screen(page,'title');
   expect((await saved(page)).photos).toHaveLength(1);
   expect(errors).toEqual([]);
  });
  test('cancel completed trace before delayed transition',async({page})=>{
   await menu(page);await mode(page,/星座つなぎ/);await stars(page);
   await page.locator('.skyhead .back').click();await screen(page,'map');
   await page.waitForTimeout(3500);await screen(page,'map');
   expect(await saved(page)).toEqual({done:[],photos:[]});
  });
 });
}


// Independent expected catalog: do not derive expectations from the implementation.
const catalog=[
 ['残波岬','読谷村','おひつじ座','aries',4,3],
 ['万座毛','恩納村','おうし座','taurus',6,4],
 ['海中道路','うるま市','ふたご座','gemini',8,7],
 ['古宇利島','今帰仁村','かに座','cancer',5,4],
 ['辺戸岬','国頭村','しし座','leo',9,9],
 ['沖縄こどもの国','沖縄市','おとめ座','virgo',7,6],
 ['知念岬','南城市','てんびん座','libra',5,5],
 ['喜屋武岬','糸満市','さそり座','scorpius',10,9],
 ['座間味島','座間味村','いて座','sagittarius',8,10],
 ['東平安名崎','宮古島市','やぎ座','capricornus',9,9],
 ['石垣島天文台','石垣市','みずがめ座','aquarius',7,6],
 ['波照間島','竹富町','うお座','pisces',9,9]
];
async function pick(page,id){
 await screen(page,'map');
 await page.evaluate(id=>window.__dbg.pickPlace(id),id);
 await expect.poll(()=>page.evaluate(()=>window.__dbg.cur)).toBe(id);
}
async function correct(page,expected){
 const buttons=page.locator('.opts button');
 // ruby readings are excluded when matching base Japanese labels.
 const labels=await buttons.evaluateAll(els=>els.map(el=>{
   const clone=el.cloneNode(true);clone.querySelectorAll('rt,rp').forEach(x=>x.remove());return clone.textContent.replace(/\s/g,'');
 }));
 expect(labels.filter(x=>x===expected)).toHaveLength(1);
 await buttons.nth(labels.indexOf(expected)).click();
}
async function completeStars(page,count){
 await screen(page,'sky');
 await page.evaluate(()=>window.__dbg.onStar(1));
 await expect.poll(()=>page.evaluate(()=>window.__dbg.lit.length)).toBe(0);
 for(let i=0;i<count;i++){
   await page.evaluate(i=>window.__dbg.onStar(i),i);
   await expect.poll(()=>page.evaluate(()=>window.__dbg.lit.length)).toBe(i+1);
 }
}
async function assertBaseLabel(locator,expected){
 await expect.poll(()=>locator.evaluate(el=>{const clone=el.cloneNode(true);clone.querySelectorAll('rt,rp').forEach(x=>x.remove());return clone.textContent.replace(/\s/g,'')})).toContain(expected);
}
for(const viewport of [{width:390,height:560},{width:390,height:650},{width:390,height:760},{width:1280,height:800}]){
 test.describe('all stages '+viewport.width+'x'+viewport.height,()=>{
  test.use({viewport});
  test('twelve places, rewards, album, unlock and persistence',async({page},testInfo)=>{
   test.setTimeout(480000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await menu(page);
   await page.locator('.activitymenu').getByRole('button',{name:/ぼうけんする/}).click();
   await screen(page,'map');
   await page.evaluate(()=>window.__dbg.pickPlace(12));
   await expect.poll(()=>page.evaluate(()=>window.__dbg.screen)).toBe('map');
   expect(await saved(page)).toEqual({done:[],photos:[]});
   const order=[1,0,2,3,4,5,6,7,8,9,10,11];
   for(const [index,id] of order.entries()){
    const [place,muni,zodiac,code,count,edgeCount]=catalog[id];
    await test.step(place+' / '+zodiac,async()=>{
     await expect(page.locator('.bottombar .next')).toBeVisible();
     await expect.poll(()=>page.evaluate(()=>window.__dbg.nextId)).toBe(id);
     await auditLayout(page,testInfo,'map-'+id,mapControls);
     await page.locator('.bottombar .next').click();
     await screen(page,'card');
     await expect.poll(()=>page.evaluate(()=>window.__dbg.cur)).toBe(id);
     await assertBaseLabel(page.locator('.pname'),place);
     await assertBaseLabel(page.locator('.pmuni'),muni);
     await auditLayout(page,testInfo,'card-'+id,['.journeyexit','.hudbtns button','.sheet.card button']);
     await page.locator('.sheet.card .big').click();
     await screen(page,'quiz');
     await auditLayout(page,testInfo,'quiz-place-'+id,quizControls);
     await correct(page,place);
     await expect(page.locator('.qtext')).toContainText('市町村');
     await auditLayout(page,testInfo,'quiz-muni-'+id,quizControls);
     await correct(page,muni);
     await completeStars(page,count);
     await screen(page,'reward');
     await expect(page.locator('.photo3-stage')).toBeVisible();
     await expect(page.locator('.photo3-caption b')).toHaveText(place);
     await expect(page.locator('.photo3-caption span')).toHaveText(zodiac);
     await expect(page.locator('.photo3-stars circle')).toHaveCount(count);
     await expect(page.locator('.photo3-stars line')).toHaveCount(edgeCount);
     await auditLayout(page,testInfo,'photo-'+id,['.photo3-save','.photo3-skip']);
     expect((await saved(page)).photos).toHaveLength(index);
     await page.locator('.photo3-save').click();
     const record=await saved(page);
     expect(record.done).toEqual(order.slice(0,index+1));
     expect(record.photos).toHaveLength(index+1);
     expect(record.photos.at(-1)).toMatchObject({spot_id:id,place_name:place,municipality:muni,constellation_id:code,constellation_name:zodiac,kind:'game-illustration'});
     await auditLayout(page,testInfo,'reward-'+id,['.journeyexit','.hudbtns button','.sheet.reward button']);
     await page.locator('.sheet.reward .big').click();
     await screen(page,'map');
    });
   }
   await page.locator('.rbtn.book').click();
   await expect(page.locator('.photo3-mini')).toHaveCount(12);
   await expect(page.locator('.photo3-empty')).toHaveCount(0);
   for(const [id,[place,,zodiac]] of catalog.entries())await expect(page.locator('.photo3-mini[data-spot="'+id+'"] b')).toHaveText(place+' × '+zodiac);
   await auditLayout(page,testInfo,'album-full',['.photo3-album-head button']);
   await page.locator('.photo3-album-head button').click();
   // Replay a previously earned location: saving the same card is idempotent.
   await pick(page,1);await screen(page,'card');
   await page.locator('.sheet.card .big').click();await screen(page,'quiz');
   await correct(page,'万座毛');await expect(page.locator('.qtext')).toContainText('市町村');await correct(page,'恩納村');
   await completeStars(page,6);await screen(page,'reward');await page.locator('.photo3-save').click();
   expect((await saved(page)).photos).toHaveLength(12);
   await page.locator('.sheet.reward .big').click();await screen(page,'map');
   await expect.poll(()=>page.evaluate(()=>window.__dbg.nextId)).toBe(12);
   await page.locator('.bottombar .next').click();await screen(page,'card');
   await page.locator('.sheet.card .big').click();await screen(page,'quiz');
   await correct(page,'波照間島');await completeStars(page,5);await screen(page,'reward');
   await expect(page.locator('.photo3-stage')).toHaveCount(0);
   await page.locator('.sheet.reward .big').click();await screen(page,'ending');
   const record=await saved(page);
   expect(record.done).toEqual([...order,12]);
   expect(record.photos).toHaveLength(12);
   await page.reload();await screen(page,'title');
   expect(await saved(page)).toEqual(record);
   expect(errors).toEqual([]);
  });
 });
}

test('non-pilot practice and skipped photo do not pollute records',async({page})=>{
 test.setTimeout(120000);
 await menu(page);
 await page.locator('.activitymenu').getByRole('button',{name:/地名クイズ/}).click();
 await pick(page,9);await screen(page,'quiz');
 await correct(page,'東平安名崎');await expect(page.locator('.qtext')).toContainText('市町村');await correct(page,'宮古島市');await screen(page,'map');
 expect(await saved(page)).toEqual({done:[],photos:[]});
 await page.locator('.journeyexit').click();await screen(page,'title');
 await page.getByRole('button',{name:'はじめる',exact:true}).click();
 await page.locator('.activitymenu').getByRole('button',{name:/星座つなぎ/}).click();
 await pick(page,7);await completeStars(page,10);await screen(page,'map');
 expect(await saved(page)).toEqual({done:[],photos:[]});
 await page.locator('.journeyexit').click();await screen(page,'title');
 await page.getByRole('button',{name:'はじめる',exact:true}).click();
 await page.locator('.activitymenu').getByRole('button',{name:/ぼうけんする/}).click();
 await pick(page,3);await screen(page,'card');await page.locator('.sheet.card .big').click();await screen(page,'quiz');
 await correct(page,'古宇利島');await expect(page.locator('.qtext')).toContainText('市町村');await correct(page,'今帰仁村');
 await completeStars(page,5);await screen(page,'reward');await page.locator('.photo3-skip').click();
 expect(await saved(page)).toEqual({done:[3],photos:[]});
});
