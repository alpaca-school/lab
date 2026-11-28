import { test, expect } from '@playwright/test';
import { auditLayout } from '../../starter-kit/qa/audit-layout.mjs';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
let server, url;
test.beforeAll(async () => {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url));
  server = createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  url='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{if(server) await new Promise(r=>server.close(r))});
for(const [width,height] of [[390,560],[390,650],[390,760],[375,667],[390,844],[430,932],[1280,800]]) {
 test('title and disabled graphics '+width+'x'+height, async ({browser},info)=>{
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){if(/^webgl/i.test(type)||type==='experimental-webgl')return null;return get.call(this,type,...args)};
  });
  expect((await page.goto(url)).status()).toBe(200);
  await expect(page.locator('h1')).toContainText('ガンジュー');
  await expect(page.locator('.card')).toBeVisible();
  await expect(page.locator('.chip')).toHaveCount(8);
  await expect(page.locator('canvas')).toHaveCount(0);
  await auditLayout(page,info,'title',['.card','.chip','.hud a','.hud button']);
  await page.locator('.card').click();
  await expect(page.getByRole('alert')).toContainText('WebGL');
  const back=page.getByRole('alert').locator('a');
  await expect(back).toHaveAttribute('href','https://lab.alpaca-school.okinawa/');
  await auditLayout(page,info,'fallback',['[role=alert] a','.hud a','.hud button']);
  expect(errors).toEqual([]);
  await page.close();
 });
}
test('WebGL enabled: stage 1 rain changes observable gauges',async({browser},info)=>{
  test.setTimeout(90000);
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  expect((await page.goto(url)).status()).toBe(200);
  await expect(page.locator('.card')).toBeVisible();
  await page.locator('.card').click();
  await expect(page.locator('.stagename')).toContainText('しみこみくらべ');
  await expect(page.locator('.stagebox canvas')).toBeVisible();
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'つぎへ ▶',exact:true}).click();
  await page.getByRole('button',{name:'はじめる!',exact:true}).click();
  const rain=page.locator('.rainb');
  await expect(rain).toBeVisible();
  await expect(page.locator('.gauge')).toHaveCount(3);
  await auditLayout(page,info,'rain-before',['.rainb','.slab input','.hud a','.hud button']);
  const before=await page.locator('.gauge .gs').allTextContents();
  await rain.click();
  await expect(rain).toContainText('とめる');
  await expect.poll(async()=>JSON.stringify(await page.locator('.gauge .gs').allTextContents()),{timeout:20000}).not.toBe(JSON.stringify(before));
  await expect.poll(async()=>page.locator('.gbar i').evaluateAll(els=>els.some(el=>parseFloat(el.style.width)>0)),{timeout:20000}).toBe(true);
  await page.screenshot({path:info.outputPath('rain-after.png')});
  await rain.click();
  await expect(rain).toContainText('あめ');
  expect(await page.evaluate(()=>typeof window.__gj)).toBe('undefined');
  expect(errors).toEqual([]);
  await page.getByRole('button',{name:'タイトルがめんに もどる'}).click();
  await expect(page.locator('.card')).toBeVisible();
  await page.close();
});
