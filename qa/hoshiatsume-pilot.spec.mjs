import { test, expect } from '@playwright/test';

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
   test.setTimeout(120000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await menu(page);
   await mode(page,/地名クイズ/);
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
   await page.locator('.sheet.card .big').click();
   await quiz(page);await stars(page);await screen(page,'reward');
   await expect(page.locator('.photo3-stage')).toBeVisible();
   expect((await saved(page)).photos).toHaveLength(0);
   await page.locator('.photo3-save').click();
   expect((await saved(page)).photos).toHaveLength(1);
   expect((await saved(page)).done).toEqual([1]);
   await page.locator('.sheet.reward .big').click();await screen(page,'map');
   await page.locator('.rbtn.book').click();
   await expect(page.locator('.photo3-mini')).toHaveCount(1);
   await page.screenshot({path:testInfo.outputPath('album.png')});
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
