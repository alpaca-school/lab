"use strict";
const stages=[
 {name:"口",icon:"👄",organ:"👄",title:"口で かむ",lead:"歯で食べものを小さくし、だ液とまぜます。",task:"「かむ」ボタンを3回押して、食べものを細かくしよう。",fact:"だ液には、でんぷんの消化を助ける酵素がふくまれています。",need:3,action:"かむ"},
 {name:"食道",icon:"↘️",organ:"🫁",title:"食道を とおる",lead:"飲みこんだ食べものは、食道を通って胃へ運ばれます。",task:"「のみこむ」を押して、胃へ送ろう。",fact:"食道は、筋肉の動きで食べものを先へ送ります。",need:1,action:"のみこむ"},
 {name:"胃",icon:"🫙",organ:"🫙",title:"胃で まぜる",lead:"胃では食べものが胃液とまざり、どろどろになります。",task:"「まぜる」を3回押して、胃の動きを観察しよう。",fact:"胃液には強い酸がふくまれますが、胃の内側は粘液などで守られています。",need:3,action:"まぜる"},
 {name:"小腸",icon:"🌀",organ:"🌀",title:"小腸で 栄養を吸収",lead:"消化された栄養の多くは、小腸から体の中へ吸収されます。",task:"「吸収する」を3回押して、栄養を体へ届けよう。",fact:"小腸の内側には、栄養を吸収しやすくするための細かなひだがあります。",need:3,action:"吸収する"},
 {name:"大腸",icon:"💧",organ:"〰️",title:"大腸で 水分を吸収",lead:"残ったものから水分などが吸収され、便が形づくられていきます。",task:"「水分を吸収」を2回押して変化を見よう。",fact:"大腸は、内容物から水分や電解質を吸収する働きをします。",need:2,action:"水分を吸収"},
 {name:"直腸・肛門",icon:"🚻",organ:"🚻",title:"直腸から 肛門へ",lead:"便は直腸にたまり、最後に肛門から体の外へ出ます。",task:"「外へ出す」を押して、消化の旅を最後まで見届けよう。",fact:"直腸は便を一時的にため、肛門から体の外へ出す準備をする場所です。",need:1,action:"外へ出す"},
 {name:"ゴール",icon:"✨",organ:"💩",title:"しょうかの旅 ゴール！",lead:"食べものは口から肛門まで一本の消化管を通り、必要な栄養や水分が体に取りこまれました。",task:"旅をふり返ってクイズに挑戦しよう。",fact:"消化管は、口から食道・胃・小腸・大腸・直腸を通って肛門まで続く一本の道です。",need:1,action:"クイズへ"}
];
const quizzes=[
 {q:"食べものを最初に細かくする場所は？",choices:["口","胃","大腸"],a:0,why:"口では歯でかみ、だ液とまぜるところから消化が始まります。"},
 {q:"栄養の多くを吸収する場所は？",choices:["食道","小腸","直腸"],a:1,why:"消化された栄養の多くは小腸から吸収されます。"},
 {q:"残ったものから水分などを吸収する場所は？",choices:["大腸","口","食道"],a:0,why:"大腸では内容物から水分や電解質が吸収されます。"}
];
let food=null,stage=0,count=0,q=0,score=0,locked=false,introLockUntil=0;
const root=document.getElementById("app");
function safe(fn){try{fn()}catch(e){console.error(e);const box=document.getElementById("error");box.style.display="block";box.textContent="画面の表示でエラーが起きました。ページを再読み込みしてください。";}}
window.addEventListener("error",e=>{console.error(e.error||e.message)});
window.addEventListener("unhandledrejection",e=>{console.error(e.reason)});
function renderStart(){
 root.innerHTML='<section class="stage"><div class="card hero"><h1>🍙 しょうかの たび</h1><p>食べものといっしょに、からだの中へ出発！<br>自分で動かしながら、消化の流れを観察しよう。</p><div class="foods" aria-label="食べものを選ぶ"><button class="food" data-food="🍙 おにぎり"><span>🍙</span>おにぎり</button><button class="food" data-food="🍎 りんご"><span>🍎</span>りんご</button><button class="food" data-food="🥕 にんじん"><span>🥕</span>にんじん</button></div><button id="startBtn" class="primary" disabled>食べものを選んで出発！</button><p class="note">この教材は消化の流れを学ぶために簡略化しています。実際の体の働きは、複数の器官や消化液などが協力して進みます。</p></div></section>';
 document.querySelectorAll(".food").forEach(b=>b.addEventListener("click",()=>{food=b.dataset.food;document.querySelectorAll(".food").forEach(x=>x.classList.toggle("selected",x===b));const s=document.getElementById("startBtn");s.disabled=false;s.textContent=food+" と出発！";}));
 document.getElementById("startBtn").addEventListener("click",()=>{stage=0;count=0;renderStage();});
}
function chips(){return '<div class="topbar">'+stages.map((s,i)=>'<div class="chip '+(i<stage?'ok':i===stage?'on':'')+'"><b>'+s.icon+'</b>'+s.name+'</div>').join("")+'</div>'}
function renderStage(){
 const s=stages[stage], pct=Math.round((stage/(stages.length-1))*100);
 const autoGoal=stage===stages.length-1;
 const introLocked=!autoGoal&&Date.now()<introLockUntil;
 const actionLabel=autoGoal?"ゴール！":introLocked?"胃に到着…":s.action+"（"+count+"/"+s.need+"）";
 root.innerHTML='<section class="stage"><div class="card">'+chips()+'<div class="progress" aria-label="旅の進み具合"><i style="width:'+pct+'%"></i></div><div class="scene"><div class="organ"><div id="threeHost" class="three-host" aria-hidden="true" data-food="'+food+'" data-stage="'+stage+'" data-count="'+count+'"></div><div id="organ" class="organ-emoji">'+s.organ+'</div><div id="particles"></div></div><div class="info"><h2>'+s.title+'</h2><p class="lead">'+s.lead+'</p><div class="task">'+s.task+'</div><div class="fact">🔎 <b>観察ポイント</b><br>'+s.fact+'</div><div class="actions"><button id="act" class="primary" '+(autoGoal||introLocked?'disabled':'')+'>'+actionLabel+'</button><button id="restart" class="secondary">最初から</button></div></div></div></div></section>';
 document.getElementById("restart").addEventListener("click",()=>{food=null;stage=0;count=0;introLockUntil=0;renderStart();});
 if(!autoGoal){
   const actBtn=document.getElementById("act");
   actBtn.addEventListener("click",act);
   if(introLocked){
     const wait=Math.max(0,introLockUntil-Date.now());
     setTimeout(()=>{if(stage===2&&document.getElementById("act")===actBtn){actBtn.disabled=false;actBtn.textContent=s.action+"（"+count+"/"+s.need+"）"}},wait);
   }
 }
}
function act(){
 if(locked)return;locked=true;
 const s=stages[stage], organ=document.getElementById("organ");
 window.dispatchEvent(new CustomEvent("digestion-action",{detail:{stage,count,nextCount:count+1,food}}));
 organ.classList.remove("pulse");void organ.offsetWidth;organ.classList.add("pulse");
 burst(stage===3?"✨":stage===4?"💧":"✦");
 count++;
 const host=document.getElementById("threeHost");if(host)host.dataset.count=String(count);
 if(count>=s.need){
   const finishedStage=stage;
   const moveDelay=finishedStage===1?1200:finishedStage===5?1350:finishedStage===3?760:650;
   setTimeout(()=>{
     if(finishedStage!==5)locked=false;
     if(finishedStage===5){
       introLockUntil=0;
       finishJourney();
       return;
     }
     if(finishedStage===stages.length-1){renderQuiz();return}
     stage++;count=0;
     introLockUntil=stage===2?Date.now()+650:0;
     renderStage();
   },moveDelay);
 }else{document.getElementById("act").textContent=s.action+"（"+count+"/"+s.need+"）";locked=false}
}
function burst(symbol){const host=document.querySelector(".organ");for(let i=0;i<5;i++){const p=document.createElement("span");p.className="particle";p.textContent=symbol;p.style.left=(25+Math.random()*50)+"%";p.style.top=(50+Math.random()*25)+"%";host.appendChild(p);setTimeout(()=>p.remove(),1400)}}
function finishJourney(){
 const actBtn=document.getElementById("act");
 if(actBtn){actBtn.disabled=true;actBtn.textContent="体の外へ出ています…"}
 setTimeout(()=>{
   const organ=document.querySelector(".organ");
   if(organ){
     const poop=document.createElement("div");
     poop.textContent="💩";
     poop.setAttribute("aria-label","体の外へ出た便");
     poop.style.cssText="position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-size:86px;z-index:12;filter:drop-shadow(0 8px 12px #0008);animation:exitPoop 900ms ease-out both";
     organ.appendChild(poop);
     const msg=document.createElement("div");
     msg.textContent="🎉 体の外へ出た！";
     msg.style.cssText="position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:13;background:#ffd966;color:#5a2a00;padding:9px 14px;border-radius:999px;font-weight:900;white-space:nowrap;box-shadow:0 5px 16px #0005";
     organ.appendChild(msg);
   }
 },900);
 setTimeout(()=>{locked=false;stage=6;count=0;renderQuiz()},2100);
}
function renderQuiz(){q=0;score=0;renderQuestion()}
function renderQuestion(){
 const x=quizzes[q];
 root.innerHTML='<section class="stage"><div class="card quizbox"><div class="topbar"><div class="chip on"><b>🧠</b>クイズ '+(q+1)+' / '+quizzes.length+'</div></div><p class="question">'+x.q+'</p><div class="choices">'+x.choices.map((c,i)=>'<button class="choice" data-i="'+i+'">'+c+'</button>').join("")+'</div><div id="fb" class="feedback">答えを選んでね。</div></div></section>';
 document.querySelectorAll(".choice").forEach(b=>b.addEventListener("click",()=>answer(Number(b.dataset.i))));
}
function answer(i){
 const x=quizzes[q];document.querySelectorAll(".choice").forEach(b=>b.disabled=true);
 const buttons=[...document.querySelectorAll(".choice")];buttons[x.a].classList.add("good");
 if(i===x.a){score++;document.getElementById("fb").textContent="⭕ 正解！ "+x.why}else{buttons[i].classList.add("bad");document.getElementById("fb").textContent="💡 "+x.why}
 setTimeout(()=>{q++;q<quizzes.length?renderQuestion():renderEnd()},1200);
}
function renderEnd(){
 root.innerHTML='<section class="stage"><div class="card result"><div class="bigemoji">🎉</div><h2>しょうかの たび 完走！</h2><p><b>'+food+'</b> といっしょに体の中を旅したよ。</p><div class="stamps">'+stages.map(s=>'<div class="stamp">'+s.icon+'</div>').join("")+'</div><div class="route"><b>今回のルート</b><br>口 → 食道 → 胃 → 小腸 → 大腸 → 直腸 → 肛門 → 体の外<br><br><b>クイズ：</b>'+score+' / '+quizzes.length+' 問正解</div><button id="again" class="primary" style="margin-top:16px">もう一度 旅する</button><p class="note">学習用の簡略モデルです。実際の消化には、肝臓・すい臓・胆のうなども関わります。</p></div></section>';
 document.getElementById("again").addEventListener("click",()=>{food=null;stage=0;count=0;renderStart();});
}
safe(renderStart);