"use strict";
/*
  しょうかの たび：段階的3Dレイヤー v2
  外部ライブラリなし。教材本体が壊れないようCanvas描画を独立させる。
*/
let current=null,observer=null;

function dispose(){
  if(!current)return;
  cancelAnimationFrame(current.raf||0);
  current.ro?.disconnect();
  current=null;
}

function stageIndex(){
  const chips=[...document.querySelectorAll(".chip")];
  const i=chips.findIndex(c=>c.classList.contains("on"));
  return i<0?0:Math.min(i,6);
}

function rotY(p,a){
  const c=Math.cos(a),s=Math.sin(a);
  return {x:p.x*c-p.z*s,y:p.y,z:p.x*s+p.z*c};
}
function rotX(p,a){
  const c=Math.cos(a),s=Math.sin(a);
  return {x:p.x,y:p.y*c-p.z*s,z:p.y*s+p.z*c};
}
function project(p,w,h){
  const d=5.2, f=Math.min(w,h)*1.15;
  const z=d-p.z;
  return {x:w/2+p.x*f/z,y:h/2-p.y*f/z,z:p.z,scale:f/z};
}
function mix(a,b,t){return a+(b-a)*t}
function rgb(hex,k=1){
  const r=(hex>>16)&255,g=(hex>>8)&255,b=hex&255;
  return "rgb("+Math.round(Math.min(255,r*k))+","+Math.round(Math.min(255,g*k))+","+Math.round(Math.min(255,b*k))+")";
}
function sphere(ctx,x,y,r,color,shine=true){
  const g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r);
  g.addColorStop(0,shine?"#fff7":"#fff2");
  g.addColorStop(.18,rgb(color,1.28));
  g.addColorStop(.72,rgb(color,.95));
  g.addColorStop(1,rgb(color,.55));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function tubePoints(stage,t){
  const pts=[];
  const n=stage===3?150:stage===4?125:90;
  for(let i=0;i<n;i++){
    const u=i/(n-1), a=u*Math.PI*2;
    let x=0,y=0,z=0,r=.15;
    if(stage===0){
      x=Math.cos(a)*1.05;y=Math.sin(a)*.5;z=Math.sin(a*2)*.16;r=.22;
    }else if(stage===1){
      y=1.45-u*2.9;x=.12*Math.sin(u*5*Math.PI);z=.18*Math.cos(u*4*Math.PI);r=.20;
    }else if(stage===2){
      const aa=u*Math.PI*1.7-.3;x=.55*Math.cos(aa)+.12;y=.8*Math.sin(aa)-.1;z=.25*Math.sin(aa*1.5);r=.34;
    }else if(stage===3){
      const aa=u*Math.PI*10;x=.78*Math.sin(aa)*(.75+.2*Math.cos(u*Math.PI*2));y=1.25-2.5*u;z=.5*Math.cos(aa);r=.13;
    }else if(stage===4){
      const side=Math.floor(u*4);
      const v=(u*4)%1;
      if(side===0){x=-1;y=-.9+1.9*v}
      if(side===1){x=-1+2*v;y=1}
      if(side===2){x=1;y=1-1.9*v}
      if(side===3){x=1-.9*v;y=-.9}
      z=.12*Math.sin(u*12*Math.PI);r=.19;
    }else if(stage===5){
      y=1.15-u*2.3;x=.18*Math.sin(u*Math.PI*1.2);z=.1*Math.cos(u*Math.PI);r=.27;
    }else{
      const aa=u*Math.PI*2;x=Math.cos(aa)*.95;y=Math.sin(aa)*.78;z=.35*Math.sin(aa*3);r=.12;
    }
    pts.push({x,y,z,r,u});
  }
  return pts;
}
function drawModel(ctx,w,h,stage,time,boost){
  ctx.clearRect(0,0,w,h);
  const bg=ctx.createRadialGradient(w*.5,h*.38,10,w*.5,h*.5,Math.max(w,h)*.7);
  bg.addColorStop(0,"rgba(255,234,240,.96)");bg.addColorStop(1,"rgba(238,210,222,.92)");
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);

  const colors=[0xe85c7a,0xe88960,0xe96984,0xf0a154,0xdf8d72,0xb85f78,0xd99347];
  const a=time*.00028;
  const pts=tubePoints(stage,time).map(p=>{
    let q=rotY(p,a);q=rotX(q,.12*Math.sin(time*.0004));
    const pr=project(q,w,h);
    return {...pr,r:p.r*pr.scale,u:p.u};
  }).sort((A,B)=>A.z-B.z);

  ctx.save();
  ctx.shadowColor="rgba(96,34,57,.23)";ctx.shadowBlur=14;
  for(const p of pts){
    const light=.82+(p.z+1.5)/6;
    sphere(ctx,p.x,p.y,Math.max(3,p.r*(1+boost*.18)),colors[stage],true);
  }
  ctx.restore();

  // 食べもの・吸収・水分など、段階ごとの動く目印
  if(stage===1){
    const u=(time*.00035)%1;
    const y=h*(.25+.5*u),x=w*.5+Math.sin(u*Math.PI*5)*8;
    sphere(ctx,x,y,10+boost*3,0xffc45f);
  }
  if(stage===2){
    for(let i=0;i<7;i++){
      const aa=time*.001+i*.9;
      sphere(ctx,w*.5+Math.cos(aa)*w*.13,h*.5+Math.sin(aa*1.2)*h*.12,5,0xffd569);
    }
  }
  if(stage===3){
    for(let i=0;i<8;i++){
      const aa=i/8*Math.PI*2+time*.0008;
      sphere(ctx,w*.5+Math.cos(aa)*w*.35,h*.5+Math.sin(aa)*h*.3,4+(i%3),[0xffcc4d,0x59c8ff,0x73d67f][i%3]);
    }
  }
  if(stage===4){
    for(let i=0;i<5;i++){
      const aa=i/5*Math.PI*2-time*.0007;
      sphere(ctx,w*.5+Math.cos(aa)*w*.25,h*.5+Math.sin(aa)*h*.2,5,0x59c8ff);
    }
  }
  if(stage===6){
    for(let i=0;i<12;i++){
      const aa=i/12*Math.PI*2+time*.0008;
      sphere(ctx,w*.5+Math.cos(aa)*w*.33,h*.5+Math.sin(aa)*h*.28,5,[0xffd966,0xff7899,0x59c8ff][i%3]);
    }
  }

  ctx.fillStyle="rgba(91,52,65,.72)";
  ctx.font="800 12px system-ui,sans-serif";
  ctx.textAlign="right";
  ctx.fillText("3D 表示・内蔵描画",w-10,h-10);
}

function mount(host){
  dispose();
  const organ=host.closest(".organ");
  const canvas=document.createElement("canvas");
  canvas.setAttribute("aria-hidden","true");
  host.replaceChildren(canvas);
  organ.classList.add("three-active");
  const badge=document.createElement("div");
  badge.className="three-badge";
  badge.textContent="3D 表示 ✓";
  organ.appendChild(badge);
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw new Error("Canvas unavailable");
  let boost=0,raf=0;
  const resize=()=>{
    const r=host.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,1.7);
    canvas.width=Math.max(1,Math.round(r.width*dpr));
    canvas.height=Math.max(1,Math.round(r.height*dpr));
    canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const stage=stageIndex();
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loop=t=>{
    if(!current||current.host!==host)return;
    const r=host.getBoundingClientRect();
    drawModel(ctx,r.width,r.height,stage,reduce?0:t,boost);
    boost*=.9;
    if(!reduce){raf=requestAnimationFrame(loop);current.raf=raf}
  };
  current={host,canvas,ctx,organ,ro,raf,boost:()=>boost,setBoost:v=>boost=v};
  loop(0);
}

function tryMount(){
  const host=document.getElementById("threeHost");
  if(!host){dispose();return}
  if(current?.host===host)return;
  try{mount(host)}
  catch(err){
    console.warn("3D layer failed; keeping lightweight view.",err);
    host.closest(".organ")?.classList.remove("three-active");
    dispose();
  }
}

document.addEventListener("click",e=>{
  if(e.target?.id==="act"&&current)current.setBoost(1);
});

observer=new MutationObserver(tryMount);
observer.observe(document.getElementById("app"),{childList:true,subtree:true});
tryMount();
