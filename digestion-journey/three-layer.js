"use strict";
/*
  しょうかの たび：連続消化管レイヤー v4
  口→食道→胃→小腸→大腸→直腸→肛門までを常に1枚に表示し、
  同じ食べものが一本の道を連続して進む。
  外部ライブラリなし。教材本体はこのレイヤーに依存しない。
*/
let current=null,observer=null;

const STAGE_RANGES=[
  [0.00,0.10], // 口
  [0.10,0.25], // 食道
  [0.25,0.39], // 胃
  [0.39,0.70], // 小腸
  [0.70,0.90], // 大腸
  [0.90,1.00], // 直腸・肛門
  [1.00,1.06]  // 体外
];

function dispose(){
  if(!current)return;
  cancelAnimationFrame(current.raf||0);
  current.ro?.disconnect();
  current=null;
}
function stageIndex(host){
  const n=Number(host?.dataset?.stage);
  return Number.isFinite(n)?Math.max(0,Math.min(6,n)):0;
}
function actionCount(host){
  const n=Number(host?.dataset?.count);
  return Number.isFinite(n)?Math.max(0,n):0;
}
function foodKind(host){
  const s=host?.dataset?.food||"";
  if(s.includes("りんご"))return "apple";
  if(s.includes("にんじん"))return "carrot";
  return "rice";
}
function foodColor(k){return k==="apple"?"#e94f62":k==="carrot"?"#f28a2e":"#e9c772"}
function lerp(a,b,t){return a+(b-a)*t}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

function buildPath(w,h){
  const p=[];
  const add=(x,y,z=0,part="")=>p.push({x:x*w,y:y*h,z,part});

  // mouth / pharynx
  add(.50,.095,.30,"mouth");
  add(.50,.125,.28,"mouth");
  add(.50,.155,.20,"mouth");

  // esophagus
  for(let i=0;i<=18;i++){
    const u=i/18;
    add(.50+Math.sin(u*Math.PI*3)*.012,.155+u*.205,.12*Math.sin(u*Math.PI*2),"esophagus");
  }

  // stomach: curved J-shaped route
  for(let i=0;i<=28;i++){
    const u=i/28,a=-Math.PI*.72+u*Math.PI*1.55;
    const x=.535+Math.cos(a)*(.075+.02*u);
    const y=.405+Math.sin(a)*(.085-.015*u);
    add(x,y,.18*Math.sin(a),"stomach");
  }

  // outlet toward small intestine
  add(.545,.475,.08,"small");
  add(.515,.49,.03,"small");

  // small intestine: continuous serpentine coils
  const rows=6;
  for(let r=0;r<rows;r++){
    const y=.515+r*.045;
    const dir=r%2===0?1:-1;
    for(let i=0;i<=22;i++){
      const u=i/22;
      const x=dir===1?lerp(.405,.605,u):lerp(.605,.405,u);
      add(x,y+Math.sin(u*Math.PI)*.012,.12*Math.sin((r+u)*Math.PI*.8),"small");
    }
  }

  // large intestine frame: ascending -> transverse -> descending -> sigmoid
  for(let i=0;i<=14;i++){const u=i/14;add(.365,lerp(.755,.485,u),.05,"large")}
  for(let i=0;i<=20;i++){const u=i/20;add(lerp(.365,.665,u),.465-.012*Math.sin(u*Math.PI),.08*Math.sin(u*Math.PI),"large")}
  for(let i=0;i<=15;i++){const u=i/15;add(.665,lerp(.475,.765,u),.04,"large")}
  for(let i=0;i<=14;i++){
    const u=i/14;
    add(.665-.13*u,.765+.025*Math.sin(u*Math.PI),-.02,"large");
  }

  // rectum and anus
  for(let i=0;i<=13;i++){
    const u=i/13;
    add(.535+.012*Math.sin(u*Math.PI),lerp(.79,.905,u),.02,"rectum");
  }
  add(.535,.93,.02,"anus");
  add(.535,.985,.0,"outside");
  return p;
}

function partColor(part){
  return ({
    mouth:"#db5575",esophagus:"#ef9a74",stomach:"#df627c",
    small:"#e7a358",large:"#cf7d69",rectum:"#a85f70",
    anus:"#8d5966",outside:"#8d5966"
  })[part]||"#d77a78";
}
function stagePart(si){
  return ["mouth","esophagus","stomach","small","large","rectum","outside"][si]||"mouth";
}

function drawBody(ctx,w,h){
  ctx.save();
  ctx.strokeStyle="rgba(255,210,224,.18)";
  ctx.lineWidth=Math.max(2,w*.008);
  ctx.fillStyle="rgba(255,231,239,.075)";
  ctx.beginPath();
  ctx.ellipse(w*.50,h*.105,w*.105,h*.085,0,0,Math.PI*2);
  ctx.moveTo(w*.455,h*.19);
  ctx.bezierCurveTo(w*.36,h*.22,w*.32,h*.36,w*.335,h*.57);
  ctx.bezierCurveTo(w*.35,h*.77,w*.41,h*.90,w*.47,h*.95);
  ctx.lineTo(w*.57,h*.95);
  ctx.bezierCurveTo(w*.63,h*.90,w*.70,h*.77,w*.71,h*.57);
  ctx.bezierCurveTo(w*.73,h*.36,w*.67,h*.22,w*.55,h*.19);
  ctx.closePath();
  ctx.fill();ctx.stroke();
  ctx.restore();
}
function drawCavityBubbles(ctx,w,h,time,si){
  ctx.save();
  for(let i=0;i<13;i++){
    const a=i*2.399+time*.00014*(i%2?1:-1);
    const x=w*(.12+.76*((Math.sin(a*1.7+i)+1)/2));
    const y=h*(.10+.80*((Math.cos(a*1.23+i*.7)+1)/2));
    const r=2.5+(i%4)*1.8;
    ctx.globalAlpha=.08+(i%3)*.035;
    ctx.fillStyle=i%3===0?"#ffd966":i%3===1?"#ff7a9c":"#59c8ff";
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawTube(ctx,path,activePart){
  // dark back tube gives pseudo depth
  ctx.save();
  ctx.lineCap="round";ctx.lineJoin="round";
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i];
    const c=partColor(b.part);
    const active=b.part===activePart || (activePart==="rectum"&&b.part==="anus");
    const pulse=1+Math.sin((i*.58)+performance.now()*.004)*.07;
    ctx.strokeStyle=active?c:"rgba(181,96,126,.30)";
    ctx.lineWidth=(active?18:11)*pulse;
    ctx.shadowColor=active?c:"rgba(66,15,35,.24)";
    ctx.shadowBlur=active?15:4;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();

    ctx.strokeStyle=active?"rgba(255,238,243,.60)":"rgba(255,225,235,.16)";
    ctx.lineWidth=active?3.5:2;
    ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  ctx.restore();
}

function drawTubeRings(ctx,path,activePart){
  ctx.save();
  for(let i=6;i<path.length;i+=9){
    const p=path[i], prev=path[i-1];
    if(p.part!==activePart && !(activePart==="rectum"&&p.part==="anus")) continue;
    const ang=Math.atan2(p.y-prev.y,p.x-prev.x);
    ctx.translate(p.x,p.y);ctx.rotate(ang);
    ctx.strokeStyle="rgba(92,25,52,.34)";
    ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,7,3.2,0,0,Math.PI*2);ctx.stroke();
    ctx.rotate(-ang);ctx.translate(-p.x,-p.y);
  }
  ctx.restore();
}

function drawOrganLandmarks(ctx,w,h,si){
  ctx.save();
  // mouth
  ctx.fillStyle=si===0?"#ff6f9a":"rgba(255,111,154,.22)";
  ctx.beginPath();ctx.ellipse(w*.5,h*.105,w*.045,h*.018,0,0,Math.PI*2);ctx.fill();

  // stomach silhouette
  ctx.fillStyle=si===2?"rgba(223,98,124,.24)":"rgba(223,98,124,.10)";
  ctx.beginPath();
  ctx.ellipse(w*.555,h*.405,w*.078,h*.075,-.38,0,Math.PI*2);
  ctx.fill();

  // small intestine zone
  ctx.strokeStyle=si===3?"rgba(231,163,88,.38)":"rgba(231,163,88,.14)";
  ctx.lineWidth=2;ctx.strokeRect(w*.385,h*.49,w*.24,h*.29);

  // colon frame
  ctx.strokeStyle=si===4?"rgba(207,125,105,.34)":"rgba(207,125,105,.12)";
  ctx.lineWidth=3;
  ctx.strokeRect(w*.345,h*.45,w*.34,h*.34);

  // anus marker
  ctx.fillStyle=si===5?"#ffd966":"rgba(255,217,102,.30)";
  ctx.beginPath();ctx.arc(w*.535,h*.93,si===5?7:4,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function pathIndexAtT(path,t){
  if(t<=0)return 0;
  if(t>=1)return path.length-1;
  return Math.floor(t*(path.length-1));
}
function posAt(path,t){
  if(t<=1){
    const raw=clamp(t,0,1)*(path.length-1);
    const i=Math.floor(raw),f=raw-i;
    const a=path[i],b=path[Math.min(path.length-1,i+1)];
    return{x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f),part:b.part};
  }
  const end=path[path.length-1];
  return{x:end.x,y:end.y+(t-1)*220,part:"outside"};
}
function stageProgress(host,si){
  const count=actionCount(host);
  const needs=[3,1,3,3,2,1,1];
  const n=needs[si]||1;
  const [a,b]=STAGE_RANGES[si];
  let local=clamp(count/n,0,1);
  const anim=current?.actionAnim;
  if(anim&&anim.stage===si){
    const ph=ease(clamp((performance.now()-anim.start)/anim.duration,0,1));
    local=clamp((anim.fromCount+ph)/n,0,1);
  }
  return lerp(a,b,local);
}

function drawFood(ctx,path,t,kind,si,time){
  const p=posAt(path,t);
  let size=si===0?15:si===1?12:si===2?9:si===3?6:si===4?8:si===5?10:8;
  const base=foodColor(kind);

  ctx.save();
  ctx.shadowColor="rgba(88,43,54,.35)";ctx.shadowBlur=8;

  if(si===0){
    const pieces=1+Math.min(6,actionCount(current.host)*2);
    for(let i=0;i<pieces;i++){
      const a=i/Math.max(1,pieces)*Math.PI*2+time*.001;
      const rr=pieces===1?0:9+pieces*1.2;
      ctx.fillStyle=base;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr*.55,Math.max(4,size-pieces),0,Math.PI*2);ctx.fill();
    }
  }else if(si===2){
    for(let i=0;i<9;i++){
      const a=i/9*Math.PI*2+time*.0012;
      ctx.fillStyle=base;ctx.beginPath();
      ctx.arc(p.x+Math.cos(a)*18,p.y+Math.sin(a*1.25)*12,4.5,0,Math.PI*2);ctx.fill();
    }
  }else if(si===3){
    // food remnants in lumen
    for(let i=0;i<7;i++){
      const q=posAt(path,clamp(t-.035+i*.010,STAGE_RANGES[3][0],STAGE_RANGES[3][1]));
      ctx.fillStyle=base;ctx.beginPath();ctx.arc(q.x,q.y,3.5,0,Math.PI*2);ctx.fill();
    }
    // nutrients leave the tube
    const absorbed=Math.min(12,actionCount(current.host)*4+(current.actionAnim?4:0));
    for(let i=0;i<absorbed;i++){
      const a=i/Math.max(1,absorbed)*Math.PI*2+time*.0008;
      const dist=22+(i%4)*9;
      ctx.fillStyle=["#ffd64d","#59c8ff","#70d27d"][i%3];
      ctx.beginPath();ctx.arc(p.x+Math.cos(a)*dist,p.y+Math.sin(a)*dist*.7,3.5,0,Math.PI*2);ctx.fill();
    }
  }else if(si===4){
    ctx.fillStyle="#8e623f";ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();
    const water=Math.max(0,8-actionCount(current.host)*3);
    for(let i=0;i<water;i++){
      const a=i/Math.max(1,water)*Math.PI*2-time*.0008;
      ctx.fillStyle="#59c8ff";ctx.beginPath();ctx.arc(p.x+Math.cos(a)*22,p.y+Math.sin(a)*16,3.5,0,Math.PI*2);ctx.fill();
    }
  }else if(si>=5){
    ctx.fillStyle="#805638";ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#9c6b47";ctx.beginPath();ctx.arc(p.x+5,p.y-3,size*.55,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle=base;ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();

  // wet glossy highlight + tiny face on the travelling bite
  if(si<5){
    ctx.save();
    ctx.globalAlpha=.8;
    ctx.fillStyle="rgba(255,255,255,.72)";
    ctx.beginPath();ctx.arc(p.x-size*.28,p.y-size*.30,Math.max(1.8,size*.18),0,Math.PI*2);ctx.fill();
    if(size>=9){
      ctx.fillStyle="#3d2030";
      ctx.beginPath();ctx.arc(p.x-size*.22,p.y+size*.05,1.4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(p.x+size*.22,p.y+size*.05,1.4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#3d2030";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(p.x,p.y+size*.12,size*.18,0,Math.PI);ctx.stroke();
    }
    ctx.restore();
  }

  if(si===6){
    const anim=current?.actionAnim;
    let drop=.05;
    if(anim) drop=ease(clamp((performance.now()-anim.start)/anim.duration,0,1));
    const y=p.y+drop*46;
    ctx.save();
    ctx.font=Math.round(Math.max(42,Math.min(82,w*.18)))+"px serif";
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.shadowColor="rgba(0,0,0,.35)";ctx.shadowBlur=12;
    ctx.fillText("💩",p.x,y);
    ctx.restore();
  }

  // current position halo
  ctx.save();ctx.strokeStyle="rgba(255,217,102,.92)";ctx.lineWidth=2;
  ctx.shadowColor="#ffd966";ctx.shadowBlur=9;
  ctx.beginPath();ctx.arc(p.x,p.y,size+8+Math.sin(time*.006)*2,0,Math.PI*2);ctx.stroke();ctx.restore();
}

function drawLabels(ctx,w,h,si){
  const labels=[
    ["口","かむ"],["食道","胃へ送る"],["胃","まぜる"],
    ["小腸","栄養を吸収"],["大腸","水分を吸収"],["直腸→肛門","体外へ"],["体の外","ゴール"]
  ];
  ctx.save();
  ctx.fillStyle="rgba(255,238,244,.95)";
  ctx.font="900 14px system-ui,sans-serif";
  ctx.textAlign="left";ctx.fillText("一本の消化管を旅しているよ",12,22);
  ctx.font="700 11px system-ui,sans-serif";
  ctx.fillStyle="rgba(255,216,229,.74)";
  ctx.fillText(labels[si][0]+"： "+labels[si][1],12,39);

  ctx.textAlign="center";ctx.font="800 10px system-ui,sans-serif";
  const marks=[
    [.50,.07,"口"],[.44,.27,"食道"],[.67,.39,"胃"],[.28,.61,"小腸"],[.78,.61,"大腸"],[.64,.91,"肛門"]
  ];
  for(const [x,y,t] of marks){
    ctx.fillStyle=t===labels[si][0]||labels[si][0].includes(t)?"#ffd966":"rgba(255,224,233,.42)";
    ctx.fillText(t,w*x,h*y);
  }
  ctx.textAlign="right";ctx.fillStyle="rgba(255,224,233,.50)";
  ctx.fillText("連続消化管 3/3",w-10,h-10);
  ctx.restore();
}


function cameraTarget(path,t,si,w,h){
  const p=posAt(path,Math.min(t,1));
  const zooms=[1.48,1.78,1.62,1.48,1.50,1.72,1.28];
  let z=zooms[si]||1.45;
  if(w<300)z*=.90;
  let x=p.x,y=p.y;
  if(si===0)y+=h*.035;
  if(si===2)y+=h*.025;
  if(si===3)y+=h*.015;
  if(si===5)y-=h*.025;
  if(si===6){x=w*.535;y=h*.90}
  return{x,y,z};
}
function updateCamera(target){
  if(!current)return target;
  if(!current.camera)current.camera={x:target.x,y:target.y,z:1};
  const k=.10;
  current.camera.x=lerp(current.camera.x,target.x,k);
  current.camera.y=lerp(current.camera.y,target.y,k);
  current.camera.z=lerp(current.camera.z,target.z,.075);
  return current.camera;
}
function beginCamera(ctx,w,h,cam){
  ctx.save();
  ctx.translate(w*.50,h*.56);
  ctx.scale(cam.z,cam.z);
  ctx.translate(-cam.x,-cam.y);
}
function endCamera(ctx){ctx.restore()}

function drawTunnelEdges(ctx,w,h,time,si){
  if(si===6)return;
  ctx.save();
  const wob=Math.sin(time*.0018)*6;
  const left=ctx.createLinearGradient(0,0,w*.22,0);
  left.addColorStop(0,"rgba(65,9,31,.92)");
  left.addColorStop(.55,"rgba(128,36,72,.45)");
  left.addColorStop(1,"rgba(128,36,72,0)");
  ctx.fillStyle=left;
  ctx.beginPath();
  ctx.moveTo(0,0);ctx.lineTo(w*.22+wob,0);
  ctx.bezierCurveTo(w*.15,h*.28,w*.19,h*.70,w*.24-wob,h);
  ctx.lineTo(0,h);ctx.closePath();ctx.fill();

  const right=ctx.createLinearGradient(w,0,w*.78,0);
  right.addColorStop(0,"rgba(65,9,31,.92)");
  right.addColorStop(.55,"rgba(128,36,72,.45)");
  right.addColorStop(1,"rgba(128,36,72,0)");
  ctx.fillStyle=right;
  ctx.beginPath();
  ctx.moveTo(w,0);ctx.lineTo(w*.78-wob,0);
  ctx.bezierCurveTo(w*.85,h*.28,w*.81,h*.70,w*.76+wob,h);
  ctx.lineTo(w,h);ctx.closePath();ctx.fill();

  ctx.globalAlpha=.28;
  ctx.fillStyle="#ff9ab8";
  for(let i=0;i<8;i++){
    const a=time*.001+i*1.7;
    const x=i%2===0?18+Math.sin(a)*10:w-18+Math.cos(a)*10;
    const y=h*(.12+(i/8)*.78);
    ctx.beginPath();ctx.arc(x,y,3+(i%3)*1.4,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawMiniMap(ctx,w,h,path,t,si){
  const mw=Math.min(92,Math.max(70,w*.27));
  const mh=Math.min(128,Math.max(96,h*.38));
  const x=w-mw-8,y=49;
  ctx.save();
  ctx.fillStyle="rgba(12,4,10,.76)";
  ctx.strokeStyle="rgba(255,217,102,.52)";
  ctx.lineWidth=1.5;
  roundRect(ctx,x,y,mw,mh,14);
  ctx.fill();ctx.stroke();

  const pad=10,px=x+pad,py=y+18,pw=mw-pad*2,ph=mh-34;
  ctx.lineCap="round";ctx.lineJoin="round";
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i];
    const ax=px+(a.x/w)*pw, ay=py+(a.y/h)*ph;
    const bx=px+(b.x/w)*pw, by=py+(b.y/h)*ph;
    ctx.strokeStyle=partColor(b.part);
    ctx.globalAlpha=b.part===stagePart(si)|| (si===5&&b.part==="anus")?.95:.34;
    ctx.lineWidth=b.part===stagePart(si)?3:1.8;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
  }
  ctx.globalAlpha=1;
  const p=posAt(path,Math.min(t,1));
  const mx=px+(p.x/w)*pw,my=py+(p.y/h)*ph;
  ctx.fillStyle="#ffd966";ctx.shadowColor="#ffd966";ctx.shadowBlur=9;
  ctx.beginPath();ctx.arc(mx,my,4.5+Math.sin(performance.now()*.006),0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle="#ffd966";ctx.textAlign="center";ctx.font="900 10px system-ui,sans-serif";
  ctx.fillText("いま ここ",x+mw/2,y+12);
  ctx.restore();
}
function roundRect(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function drawFrame(ctx,w,h,si,time,host){
  ctx.clearRect(0,0,w,h);
  const bg=ctx.createRadialGradient(w*.5,h*.36,8,w*.5,h*.5,Math.max(w,h)*.78);
  bg.addColorStop(0,"#6b2847");bg.addColorStop(.48,"#381226");bg.addColorStop(1,"#1b0812");
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  drawCavityBubbles(ctx,w,h,time,si);

  const path=buildPath(w,h);
  const t=stageProgress(host,si);
  const cam=updateCamera(cameraTarget(path,t,si,w,h));

  beginCamera(ctx,w,h,cam);
  drawBody(ctx,w,h);
  drawOrganLandmarks(ctx,w,h,si);
  drawTube(ctx,path,stagePart(si));
  drawTubeRings(ctx,path,stagePart(si));
  drawFood(ctx,path,t,foodKind(host),si,time);
  endCamera(ctx);

  drawTunnelEdges(ctx,w,h,time,si);
  drawMiniMap(ctx,w,h,path,t,si);
  drawLabels(ctx,w,h,si);
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
  badge.textContent="食べもの追尾中 ✓";
  organ.appendChild(badge);

  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw new Error("Canvas unavailable");

  const ro=new ResizeObserver(()=>{
    const r=host.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.7);
    canvas.width=Math.max(1,Math.round(r.width*dpr));
    canvas.height=Math.max(1,Math.round(r.height*dpr));
    canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  });
  ro.observe(host);

  const si=stageIndex(host),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  current={host,organ,canvas,ctx,ro,si,actionAnim:null,raf:0,camera:null};

  const loop=t=>{
    if(!current||current.host!==host)return;
    const r=host.getBoundingClientRect();
    drawFrame(ctx,r.width,r.height,si,reduce?0:t,host);
    if(!reduce)current.raf=requestAnimationFrame(loop);
  };
  loop(0);
}

function tryMount(){
  const host=document.getElementById("threeHost");
  if(!host){dispose();return}
  if(current?.host===host)return;
  try{mount(host)}catch(err){
    console.warn("Continuous digestion layer failed; keeping lightweight view.",err);
    host.closest(".organ")?.classList.remove("three-active");
    dispose();
  }
}

window.addEventListener("digestion-action",e=>{
  if(!current)return;
  const d=e.detail||{},si=Number(d.stage);
  if(si!==current.si)return;
  current.actionAnim={
    stage:si,start:performance.now(),
    duration:si===1?820:si===5?1100:700,
    fromCount:Number(d.count)||0,
    toCount:Number(d.nextCount)||1
  };
});
observer=new MutationObserver(tryMount);
observer.observe(document.getElementById("app"),{childList:true,subtree:true});
tryMount();
