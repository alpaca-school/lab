"use strict";
/*
  しょうかの たび：段階的3Dレイヤー v3
  第2段階：食べものが器官の中を移動・分解・吸収される様子を可視化。
  外部ライブラリなし。教材本体はこのレイヤーに依存しない。
*/
let current=null,observer=null;

function dispose(){
  if(!current)return;
  cancelAnimationFrame(current.raf||0);
  current.ro?.disconnect();
  current=null;
}

function stageIndex(host){
  const n=Number(host?.dataset?.stage);
  if(Number.isFinite(n))return Math.max(0,Math.min(6,n));
  const chips=[...document.querySelectorAll(".chip")];
  const i=chips.findIndex(c=>c.classList.contains("on"));
  return i<0?0:Math.min(i,6);
}
function actionCount(host){const n=Number(host?.dataset?.count);return Number.isFinite(n)?n:0}
function foodKind(host){
  const s=host?.dataset?.food||"";
  if(s.includes("りんご"))return "apple";
  if(s.includes("にんじん"))return "carrot";
  return "rice";
}
function foodColor(kind){return kind==="apple"?0xe94f62:kind==="carrot"?0xf28a2e:0xf2d283}
function foodAccent(kind){return kind==="apple"?0x8bc34a:kind==="carrot"?0xffb15d:0xfff0bd}

function rotY(p,a){const c=Math.cos(a),s=Math.sin(a);return{x:p.x*c-p.z*s,y:p.y,z:p.x*s+p.z*c}}
function rotX(p,a){const c=Math.cos(a),s=Math.sin(a);return{x:p.x,y:p.y*c-p.z*s,z:p.y*s+p.z*c}}
function project(p,w,h){
  const d=5.2,f=Math.min(w,h)*1.15,z=Math.max(.35,d-p.z);
  return{x:w/2+p.x*f/z,y:h/2-p.y*f/z,z:p.z,scale:f/z};
}
function rgb(hex,k=1){
  const r=(hex>>16)&255,g=(hex>>8)&255,b=hex&255;
  return"rgb("+Math.round(Math.min(255,r*k))+","+Math.round(Math.min(255,g*k))+","+Math.round(Math.min(255,b*k))+")";
}
function sphere(ctx,x,y,r,color,shine=true,alpha=1){
  ctx.save();ctx.globalAlpha=alpha;
  const g=ctx.createRadialGradient(x-r*.35,y-r*.42,Math.max(1,r*.08),x,y,Math.max(1,r));
  g.addColorStop(0,shine?"rgba(255,255,255,.72)":"rgba(255,255,255,.18)");
  g.addColorStop(.18,rgb(color,1.28));g.addColorStop(.72,rgb(color,.95));g.addColorStop(1,rgb(color,.55));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();
}
function lineGlow(ctx,a,b,color,width,alpha=.7){
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";
  ctx.shadowColor=color;ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}

function tubePoints(stage,t){
  const pts=[],n=stage===3?150:stage===4?125:90;
  for(let i=0;i<n;i++){
    const u=i/(n-1),a=u*Math.PI*2;let x=0,y=0,z=0,r=.15;
    if(stage===0){x=Math.cos(a)*1.05;y=Math.sin(a)*.5;z=Math.sin(a*2)*.16;r=.22}
    else if(stage===1){y=1.45-u*2.9;x=.12*Math.sin(u*5*Math.PI);z=.18*Math.cos(u*4*Math.PI);r=.20}
    else if(stage===2){const aa=u*Math.PI*1.7-.3;x=.55*Math.cos(aa)+.12;y=.8*Math.sin(aa)-.1;z=.25*Math.sin(aa*1.5);r=.34}
    else if(stage===3){const aa=u*Math.PI*10;x=.78*Math.sin(aa)*(.75+.2*Math.cos(u*Math.PI*2));y=1.25-2.5*u;z=.5*Math.cos(aa);r=.13}
    else if(stage===4){
      const side=Math.min(3,Math.floor(u*4)),v=(u*4)%1;
      if(side===0){x=-1;y=-.9+1.9*v}
      if(side===1){x=-1+2*v;y=1}
      if(side===2){x=1;y=1-1.9*v}
      if(side===3){x=1-.9*v;y=-.9}
      z=.12*Math.sin(u*12*Math.PI);r=.19
    }else if(stage===5){y=1.15-u*2.3;x=.18*Math.sin(u*Math.PI*1.2);z=.1*Math.cos(u*Math.PI);r=.27}
    else{const aa=u*Math.PI*2;x=Math.cos(aa)*.95;y=Math.sin(aa)*.78;z=.35*Math.sin(aa*3);r=.12}
    pts.push({x,y,z,r,u});
  }
  return pts;
}
function transformedPoints(stage,time,w,h){
  const a=time*.00028;
  return tubePoints(stage,time).map(p=>{
    let q=rotY(p,a);q=rotX(q,.12*Math.sin(time*.0004));
    const pr=project(q,w,h);return{...pr,r:p.r*pr.scale,u:p.u};
  });
}
function samplePath(pts,u){
  const idx=Math.max(0,Math.min(pts.length-1,Math.floor(u*(pts.length-1))));
  return pts[idx];
}
function drawOrgan(ctx,w,h,stage,time,boost){
  const colors=[0xe85c7a,0xe88960,0xe96984,0xf0a154,0xdf8d72,0xb85f78,0xd99347];
  const pts=transformedPoints(stage,time,w,h).sort((A,B)=>A.z-B.z);
  ctx.save();ctx.shadowColor="rgba(96,34,57,.23)";ctx.shadowBlur=14;
  for(const p of pts)sphere(ctx,p.x,p.y,Math.max(3,p.r*(1+boost*.12)),colors[stage],true,.96);
  ctx.restore();
  return transformedPoints(stage,time,w,h);
}
function drawFoodBase(ctx,x,y,size,kind,stage,progress=0,alpha=1){
  const c=foodColor(kind),a=foodAccent(kind);
  if(kind==="rice"&&stage===0&&progress<.34){
    sphere(ctx,x,y,size,c,true,alpha);
    sphere(ctx,x-size*.32,y-size*.10,size*.42,a,true,alpha*.95);
    sphere(ctx,x+size*.28,y+size*.08,size*.36,a,true,alpha*.95);
  }else if(kind==="apple"&&stage===0&&progress<.34){
    sphere(ctx,x,y,size,c,true,alpha);
    lineGlow(ctx,{x,y:y-size*.78},{x:x+2,y:y-size*1.18},"#6f4a28",Math.max(2,size*.12),alpha);
    sphere(ctx,x+size*.36,y-size*.95,size*.22,a,true,alpha);
  }else if(kind==="carrot"&&stage===0&&progress<.34){
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=rgb(c,1.02);
    ctx.beginPath();ctx.moveTo(x-size*.8,y-size*.55);ctx.lineTo(x+size*.85,y);ctx.lineTo(x-size*.75,y+size*.55);ctx.closePath();ctx.fill();ctx.restore();
    for(let i=-1;i<=1;i++)lineGlow(ctx,{x:x-size*.72+i*3,y:y-size*.45},{x:x-size*.92+i*7,y:y-size*.9},rgb(a,1),Math.max(2,size*.12),alpha);
  }else sphere(ctx,x,y,size,c,true,alpha);
}
function drawFoodJourney(ctx,w,h,stage,time,host,boost){
  const kind=foodKind(host),count=actionCount(host),anim=current?.actionAnim;
  const now=performance.now();
  let phase=anim?Math.min(1,(now-anim.start)/Math.max(300,anim.duration)):1;
  phase=ease(Math.max(0,phase));
  const actionActive=!!anim&&phase<1;
  const countForLook=actionActive?anim.fromCount:count;

  if(stage===0){
    const pieces=Math.min(1+countForLook*2+(actionActive?Math.floor(phase*2):0),7);
    const radius=Math.max(7,25-countForLook*4-phase*3);
    for(let i=0;i<pieces;i++){
      const a=i/Math.max(1,pieces)*Math.PI*2+time*.0007;
      const spread=(pieces===1?0:16+countForLook*8+phase*7);
      drawFoodBase(ctx,w*.5+Math.cos(a)*spread,h*.53+Math.sin(a)*spread*.45,radius,kind,stage,countForLook/3,1);
    }
  }else if(stage===1){
    const path=transformedPoints(stage,time,w,h);
    const travel=actionActive?phase:((time*.00012)%1);
    const p=samplePath(path,travel);
    drawFoodBase(ctx,p.x,p.y,14+boost*3,kind,stage,1,1);
    ctx.save();ctx.globalAlpha=.28;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.x,p.y,22,0,Math.PI*2);ctx.fill();ctx.restore();
  }else if(stage===2){
    const n=7+countForLook*3;
    for(let i=0;i<n;i++){
      const a=time*.0012+i*(Math.PI*2/n)+phase*.9,rr=(30+i%3*7)*(1-.08*countForLook);
      drawFoodBase(ctx,w*.5+Math.cos(a)*rr,h*.53+Math.sin(a*1.18)*rr*.72,Math.max(4,9-countForLook*1.2),kind,stage,1,.9);
    }
    if(actionActive){ctx.save();ctx.globalAlpha=.16+.18*(1-phase);ctx.fillStyle="#ffb4b4";ctx.beginPath();ctx.arc(w*.5,h*.53,75+phase*18,0,Math.PI*2);ctx.fill();ctx.restore()}
  }else if(stage===3){
    const path=transformedPoints(stage,time,w,h),n=12;
    for(let i=0;i<n;i++){const u=(i/n+time*.00007)%1,p=samplePath(path,u);drawFoodBase(ctx,p.x,p.y,4+(i%3),kind,stage,1,.78)}
    const released=Math.min(18,countForLook*6+(actionActive?Math.floor(phase*6):0));
    for(let i=0;i<released;i++){
      const a=i/Math.max(1,released)*Math.PI*2+time*.0007,dist=42+(i%4)*16+(actionActive?phase*18:0);
      sphere(ctx,w*.5+Math.cos(a)*dist,h*.5+Math.sin(a)*dist*.78,4,[0xffd45a,0x69c8ff,0x73d67f][i%3],true,.9);
    }
    if(actionActive)for(let i=0;i<4;i++){
      const a=(i/4)*Math.PI*2;
      lineGlow(ctx,{x:w*.5+Math.cos(a)*35,y:h*.5+Math.sin(a)*28},{x:w*.5+Math.cos(a)*(70+phase*30),y:h*.5+Math.sin(a)*(55+phase*25)},"rgba(255,214,75,.8)",3,.8*(1-phase));
    }
  }else if(stage===4){
    const path=transformedPoints(stage,time,w,h),residueSize=Math.max(7,14-countForLook*2-(actionActive?phase*2:0));
    for(let i=0;i<8;i++){const u=(i/8+time*.000045)%1,p=samplePath(path,u);sphere(ctx,p.x,p.y,residueSize*.55,0x9b6a46,true,.78)}
    const droplets=Math.max(0,10-countForLook*3);
    for(let i=0;i<droplets;i++){
      const a=i/Math.max(1,droplets)*Math.PI*2-time*.0007,dist=38+(i%3)*15+(actionActive?phase*22:0);
      sphere(ctx,w*.5+Math.cos(a)*dist,h*.5+Math.sin(a)*dist*.72,4,0x59c8ff,true,.82);
    }
  }else if(stage===5){
    const path=transformedPoints(stage,time,w,h),u=actionActive ? (0.28+phase*0.58) : 0.7,p=samplePath(path,u);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;sphere(ctx,p.x+Math.cos(a)*9,p.y+Math.sin(a)*6,7,0x8c5a3c,true,.95)}
  }else if(stage===6){
    const burst=actionActive?phase:((Math.sin(time*.001)+1)/2);
    for(let i=0;i<14;i++){
      const a=i/14*Math.PI*2+time*.0004,dist=20+burst*(25+(i%4)*9);
      sphere(ctx,w*.5+Math.cos(a)*dist,h*.5+Math.sin(a)*dist*.78,4,[0xffd966,0xff7899,0x59c8ff][i%3],true,.88);
    }
  }
  if(current&&current.actionAnim&&phase>=1)current.actionAnim=null;
}
function drawLabel(ctx,w,h,stage){
  const labels=[
    ["かむほど、小さな粒に","食べものを細かくする"],
    ["食道を下へ移動","筋肉の動きで送られる"],
    ["胃の中で混ざる","細かく、どろどろに"],
    ["栄養が外へ","小腸から体へ吸収"],
    ["水分が外へ","残りが少しずつ固まる"],
    ["出口へ運ぶ","便として外へ出す準備"],
    ["旅の終わり","必要なものは体へ"]
  ];
  const [a,b]=labels[stage]||["しょうかの旅",""];
  ctx.save();ctx.textAlign="left";ctx.fillStyle="rgba(76,36,50,.88)";
  ctx.font="900 14px system-ui,sans-serif";ctx.fillText(a,12,22);
  ctx.font="700 11px system-ui,sans-serif";ctx.fillStyle="rgba(76,36,50,.62)";ctx.fillText(b,12,39);
  ctx.textAlign="right";ctx.font="800 11px system-ui,sans-serif";ctx.fillText("立体アニメーション 2/3",w-10,h-10);ctx.restore();
}
function drawFrame(ctx,w,h,stage,time,host,boost){
  ctx.clearRect(0,0,w,h);
  const bg=ctx.createRadialGradient(w*.5,h*.38,10,w*.5,h*.5,Math.max(w,h)*.7);
  bg.addColorStop(0,"rgba(255,239,243,.98)");bg.addColorStop(1,"rgba(235,206,219,.96)");
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  drawOrgan(ctx,w,h,stage,time,boost);drawFoodJourney(ctx,w,h,stage,time,host,boost);drawLabel(ctx,w,h,stage);
}
function mount(host){
  dispose();
  const organ=host.closest(".organ"),canvas=document.createElement("canvas");canvas.setAttribute("aria-hidden","true");host.replaceChildren(canvas);
  organ.classList.add("three-active");
  const badge=document.createElement("div");badge.className="three-badge";badge.textContent="3D 食べもの移動 ✓";organ.appendChild(badge);
  const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)throw new Error("Canvas unavailable");
  let boost=0,raf=0;
  const resize=()=>{
    const r=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.7);
    canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));
    canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const stage=stageIndex(host),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  current={host,canvas,ctx,organ,ro,raf,stage,actionAnim:null,setBoost:v=>boost=v};
  const loop=t=>{
    if(!current||current.host!==host)return;
    const r=host.getBoundingClientRect();drawFrame(ctx,r.width,r.height,stage,reduce?0:t,host,boost);boost*=.9;
    if(!reduce){raf=requestAnimationFrame(loop);current.raf=raf}
  };
  loop(0);
}
function tryMount(){
  const host=document.getElementById("threeHost");
  if(!host){dispose();return}
  if(current?.host===host)return;
  try{mount(host)}catch(err){
    console.warn("3D layer failed; keeping lightweight view.",err);
    host.closest(".organ")?.classList.remove("three-active");dispose();
  }
}
window.addEventListener("digestion-action",e=>{
  if(!current)return;
  const d=e.detail||{};if(Number(d.stage)!==current.stage)return;
  current.actionAnim={start:performance.now(),duration:current.stage===1?700:current.stage===3?650:520,fromCount:Number(d.count)||0,toCount:Number(d.nextCount)||1};
  current.setBoost(1);
});
document.addEventListener("click",e=>{if(e.target?.id==="act"&&current)current.setBoost(1)});
observer=new MutationObserver(tryMount);
observer.observe(document.getElementById("app"),{childList:true,subtree:true});
tryMount();
