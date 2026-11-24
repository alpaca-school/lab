import { expect } from '@playwright/test';

// Reusable copy of the audit passed by Hoshiatsume pilot QA #7.
// Run against explicit selectors for the current active screen.
export async function inspectLayout(page, selectors) {
  if (!Array.isArray(selectors) || !selectors.length) throw new Error('Explicit required selectors needed');
  return page.evaluate(async selectors=>{
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const vv=window.visualViewport;
    const bounds={left:vv?.offsetLeft||0,top:vv?.offsetTop||0,width:vv?.width||innerWidth,height:vv?.height||innerHeight};
    const targets=[...new Set(selectors.flatMap(s=>Array.from(document.querySelectorAll(s))))].filter(el=>{
      const r=el.getBoundingClientRect(), st=getComputedStyle(el);
      return r.width>0&&r.height>0&&st.visibility!=='hidden'&&st.display!=='none'&&!el.closest('[inert]')&&!el.disabled;
    });
    const label=el=>el.getAttribute('aria-label')||el.textContent.trim().slice(0,70)||el.className;
    const issues=selectors.filter(s=>!targets.some(el=>el.matches(s))).map(s=>'missing visible enabled target: '+s);
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
}
export async function auditLayout(page, testInfo, name, selectors) {
  const problems=await inspectLayout(page,selectors);
  await page.screenshot({path:testInfo.outputPath(name+'.png'),animations:'disabled'});
  expect.soft(problems,name).toEqual([]);
}
