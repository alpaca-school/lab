const VERSION="0.187.0";
const THREE_URL="https://cdn.jsdelivr.net/npm/three@"+VERSION+"/build/three.module.js";
let THREE=null,current=null,observer=null;

function disposeCurrent(){
  if(!current)return;
  cancelAnimationFrame(current.raf);
  current.resizeObserver?.disconnect();
  current.renderer?.dispose();
  current.scene?.traverse?.(obj=>{
    obj.geometry?.dispose?.();
    if(Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose?.());
    else obj.material?.dispose?.();
  });
  current=null;
}

function colorForStage(i){
  return [0xe85c7a,0xf1a15a,0xf36f87,0xf3a84f,0xe59670,0xc66f7e,0x9a6548][i] ?? 0xe85c7a;
}

function mat(color,rough=.46,metal=.05){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
}

function addMouth(group,color){
  const lips=new THREE.Mesh(new THREE.TorusGeometry(1.08,.32,20,64),mat(color,.55));
  lips.scale.set(1.28,.72,.55);
  group.add(lips);
  const inner=new THREE.Mesh(new THREE.SphereGeometry(.67,32,20),mat(0x8d284b,.78));
  inner.scale.set(1.22,.54,.36); inner.position.z=-.05; group.add(inner);
  const toothMat=mat(0xfffbef,.36);
  for(let x=-.52;x<=.52;x+=.35){
    const t1=new THREE.Mesh(new THREE.BoxGeometry(.25,.2,.22),toothMat);t1.position.set(x,.34,.35);group.add(t1);
    const t2=t1.clone();t2.position.y=-.34;group.add(t2);
  }
}
function addEsophagus(group,color){
  const points=[new THREE.Vector3(0,1.35,0),new THREE.Vector3(-.12,.65,.08),new THREE.Vector3(.15,0,.02),new THREE.Vector3(-.1,-.75,.04),new THREE.Vector3(0,-1.35,0)];
  const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.32,18,false),mat(color,.58));
  group.add(tube);
  const bite=new THREE.Mesh(new THREE.SphereGeometry(.22,20,14),mat(0xffc25f,.7));bite.position.y=.8;group.add(bite);group.userData.moving=bite;
}
function addStomach(group,color){
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),mat(color,.48));
  body.scale.set(.9,1.2,.65);body.rotation.z=-.35;body.position.set(.2,-.05,0);group.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.27,.38,.9,24),mat(color,.5));neck.position.set(-.42,.9,0);neck.rotation.z=-.35;group.add(neck);
  const outlet=new THREE.Mesh(new THREE.TorusGeometry(.48,.19,18,42,Math.PI*1.3),mat(color,.5));outlet.position.set(.65,-.7,.05);outlet.rotation.z=.45;group.add(outlet);
}
function addSmallIntestine(group,color){
  const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(.78,.16,180,18,2,5),mat(color,.62));
  knot.scale.set(1.15,1.25,.65);group.add(knot);
}
function addLargeIntestine(group,color){
  const pts=[
    [-.9,-.9,0],[-1.05,.55,0],[-.75,1.05,0],[0,1.15,0],[.8,1.05,0],[1.05,.55,0],[1.0,-.65,0],[.55,-1.05,0],[.15,-.7,0]
  ].map(p=>new THREE.Vector3(...p));
  const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),100,.22,18,false),mat(color,.62));
  group.add(tube);
  const inner=new THREE.Mesh(new THREE.TorusKnotGeometry(.52,.10,120,14,2,3),mat(0xf3b18f,.72));inner.scale.z=.6;group.add(inner);
}
function addRectum(group,color){
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.5,.36,2.35,28),mat(color,.6));body.position.y=.15;group.add(body);
  const bend=new THREE.Mesh(new THREE.TorusGeometry(.48,.2,18,40,Math.PI*.95),mat(color,.6));bend.position.set(.42,-.86,0);bend.rotation.z=-.8;group.add(bend);
}
function addGoal(group,color){
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.82,2),mat(color,.34,.16));group.add(core);
  for(let i=0;i<9;i++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),mat([0xffd86b,0xff7c9e,0x69d6ff][i%3],.4));
    const a=i/9*Math.PI*2;s.position.set(Math.cos(a)*1.35,Math.sin(a)*1.1,(i%2?-.2:.2));group.add(s);
  }
}
function makeModel(stage){
  const g=new THREE.Group(),color=colorForStage(stage);
  [addMouth,addEsophagus,addStomach,addSmallIntestine,addLargeIntestine,addRectum,addGoal][stage]?.(g,color);
  g.rotation.x=.12;g.rotation.y=-.28;
  return g;
}

function stageFromPage(){
  const chips=[...document.querySelectorAll(".chip")];
  const on=chips.findIndex(c=>c.classList.contains("on"));
  return on<0?0:Math.min(on,6);
}

function mount(host){
  disposeCurrent();
  const organ=host.closest(".organ");
  const stage=stageFromPage();
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,50);camera.position.set(0,.15,5.3);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.replaceChildren(renderer.domElement);
  const hemi=new THREE.HemisphereLight(0xffffff,0x6b2842,2.5);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(3,4,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xff96b1,2.2);rim.position.set(-4,1,-2);scene.add(rim);
  const model=makeModel(stage);scene.add(model);
  const badge=document.createElement("div");badge.className="three-badge";badge.textContent="3D 表示";organ.appendChild(badge);
  organ.classList.add("three-active");

  const resize=()=>{
    const r=host.getBoundingClientRect(); if(!r.width||!r.height)return;
    renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
  };
  const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf=0,last=0,boost=0;
  const tick=(t)=>{
    if(!current||current.host!==host)return;
    const dt=Math.min((t-last||16)/1000,.05);last=t;
    if(!reduce){
      model.rotation.y += dt*(.22+boost);
      model.position.y=Math.sin(t*.0012)*.05;
      if(model.userData.moving) model.userData.moving.position.y=.82-Math.sin(t*.0018)*1.1;
      boost*=.92;
    }
    renderer.render(scene,camera);
    raf=requestAnimationFrame(tick); if(current)current.raf=raf;
  };
  current={host,organ,scene,camera,renderer,model,resizeObserver:ro,raf};
  raf=requestAnimationFrame(tick);current.raf=raf;
}

function tryMount(){
  const host=document.getElementById("threeHost");
  if(!host){disposeCurrent();return}
  if(current?.host===host)return;
  try{mount(host)}catch(err){
    console.warn("Three.js enhancement unavailable; using 2D fallback.",err);
    host.closest(".organ")?.classList.remove("three-active");
    disposeCurrent();
  }
}

document.addEventListener("click",e=>{
  if(e.target?.id==="act"&&current?.model){
    current.model.scale.set(1.12,1.12,1.12);
    setTimeout(()=>current?.model?.scale.set(1,1,1),180);
  }
});

(async()=>{
  try{
    THREE=await import(THREE_URL);
    observer=new MutationObserver(tryMount);
    observer.observe(document.getElementById("app"),{childList:true,subtree:true});
    tryMount();
  }catch(err){
    console.warn("Three.js could not be loaded. The lesson continues in lightweight mode.",err);
  }
})();