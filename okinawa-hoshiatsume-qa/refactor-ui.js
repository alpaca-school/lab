(function(){
"use strict";
const pages=[
{k:"わたしの夢つむぎ から",t:"まだ、外へ出るのが こわかったころ",b:["サラバンジにも、外《そと》へ出《で》たり、新《あたら》しいことを始《はじ》めたりするのを迷《まよ》っていた時期《じき》がありました。","「やってみたい。でも、うまくできるかな」——そんな気持《きも》ちを抱《かか》えながら、夢《ゆめ》つむぎの島《しま》で、いろいろな経験《けいけん》を重《かさ》ねてきました。"]},
{k:"旅立ちの山",t:"一歩ずつ、山を こえて",b:["考《かんが》えたり、失敗《しっぱい》したり、もう一度《いちど》やってみたり。そうしてサラバンジは「旅立《たびだ》ちの山《やま》」をこえ、少《すこ》しずつ外《そと》の世界《せかい》へ出《で》かけるようになりました。","Q:「全部《ぜんぶ》わかってからじゃなくても、まず行《い》ってみよう！」"]},
{k:"山の向こうの沖縄で",t:"ある夜、星を 見上げて",b:["旅《たび》をするようになったサラバンジは、沖縄《おきなわ》の夜空《よぞら》を見《み》て、またひとつ思《おも》いつきました。","Q:「沖縄《おきなわ》って、場所《ばしょ》が変《か》わったら、見《み》える星《ほし》も変《か》わるのかな？」","気《き》になったら、じっとしていられません。"]},
{k:"サラバンジらしい作戦",t:"写真を 撮れば、わかるっしょ！",b:["Q:「とりあえず写真《しゃしん》を連写《れんしゃ》！ あとで見《み》れば何《なん》とかなるっしょ！」","ところが、あとで見返《みかえ》すと……。","Q:「あれ？ 何時《なんじ》？ どっち向《む》き？」","写真《しゃしん》だけでは、どこで見《み》た星《ほし》なのか、よく分《わ》かりません。"]},
{k:"沖縄で星集め",t:"だったら、自分で 見に行こう！",b:["サラバンジは、すぐに次《つぎ》の作戦《さくせん》を思《おも》いつきました。","Q:「沖縄《おきなわ》のいろんなところを回《まわ》って、自分《じぶん》の目《め》で星《ほし》を見《み》ればいい！」","辺戸岬《へどみさき》から沖縄《おきなわ》の島々《しまじま》まで。場所《ばしょ》をめぐり、星《ほし》を見《み》つけ、星座《せいざ》をつないでいく新《あたら》しい旅《たび》の始《はじ》まりです。","さあ、サラバンジといっしょに、好《す》きな場所《ばしょ》から出《で》かけよう。"]}];
 const KEY="okinawa-hoshiatsume-photos-device-qa-20261125";
 const LEGACY_META={photo_id:"manzamo-taurus-v1",spot_id:1,place_name:"万座毛",municipality:"恩納村",constellation_id:"taurus",constellation_name:"おうし座",background_id:"manzamo-illustration-v1",card_version:1,kind:"game-illustration"};
 const stars=[[76,75],[52,60],[57,48],[22,23],[15,59],[88,43]],lines=[[0,1],[1,2],[2,3],[1,4]];
 const ids=["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
 let stages=[];
 const plain=x=>x.replace(/\{[^}]*\}/g,"");
 const esc=x=>String(x).replace(/[&<>"\x27]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\x27":"&#39;"}[c]));
 function setStages(data){stages=data.slice(0,12)}
 function meta(i){const stage=stages[i];if(!stage||!Number.isInteger(i)||i<0||i>=12)return null;if(i===1)return LEGACY_META;return {photo_id:ids[i]+"-v1",spot_id:i,place_name:plain(stage.name),municipality:plain(stage.muni),constellation_id:ids[i],constellation_name:stage.zodiac.replace(/ざ$/,"座"),background_id:"generic-night-sky-v1",card_version:1,kind:"game-illustration"}}
 function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a:[]}catch{return[]}}
 function save(i){const m=meta(i);if(!m)return false;const xs=read();if(!xs.some(x=>x?.photo_id===m.photo_id)){xs.push({...m,acquired_at:new Date().toISOString()});try{localStorage.setItem(KEY,JSON.stringify(xs))}catch{return false}}return true}
 function svg(i){const stage=stages[i],p=i===1?stars:stage.stars.map(([x,y])=>[50+x*17,40-y*17]),edges=i===1?lines:stage.lines;return '<svg viewBox="0 0 100 100" aria-hidden="true">'+edges.map(x=>'<line x1="'+p[x[0]][0]+'" y1="'+p[x[0]][1]+'" x2="'+p[x[1]][0]+'" y2="'+p[x[1]][1]+'"/>').join("")+p.map(x=>'<circle cx="'+x[0]+'" cy="'+x[1]+'" r="2.2"/>').join("")+'</svg>'}

let active=null;
function dialog(className,html,onClose){
 if(active)return null;
 const focus=document.activeElement,el=document.createElement("div");
 el.className=className;el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.innerHTML=html;document.body.append(el);
 const root=document.getElementById("root");root.inert=true;
 const close=()=>{if(!el.isConnected)return;el.remove();root.inert=false;active=null;focus?.focus?.({preventScroll:true});onClose?.()};
 active={el,close};el.querySelector("button")?.focus({preventScroll:true});return active;
}
function story(openMenu){
 const d=dialog("storygate expanded",'<div class="storycard storypages"><div class="storyhead"><div class="storyeyebrow"></div><h2></h2></div><div class="storyscroll" data-reading-scroll></div><div class="storyfoot"><div class="storydots"></div><div class="storynav"><button class="storyprev">← まえ</button><button class="storynext">つぎへ →</button></div><button class="storyskip">お話を とじる</button></div></div>',openMenu);
 if(!d)return;let i=0;const el=d.el,body=el.querySelector(".storyscroll"),prev=el.querySelector(".storyprev"),next=el.querySelector(".storynext");
 function draw(){const p=pages[i];el.querySelector(".storyeyebrow").textContent=p.k;el.querySelector("h2").textContent=p.t;body.replaceChildren();p.b.forEach(x=>{const q=x.startsWith("Q:"),node=document.createElement("p");if(q)node.className="storyquote";LabCore.renderRubyText(node,q?x.slice(2):x);body.append(node)});body.scrollTop=0;el.querySelector(".storydots").textContent=pages.map((_,j)=>j===i?"●":"○").join(" ");prev.disabled=i===0;next.textContent=i===pages.length-1?"お話を とじる":"つぎへ →"}
 prev.onclick=()=>{if(i>0){i--;draw()}};next.onclick=()=>{if(i<pages.length-1){i++;draw()}else d.close()};el.querySelector(".storyskip").onclick=d.close;draw();
}
function photo(i){return '<div class="photo3-photo'+(i===1?'':' photo3-generic')+'"><div class="photo3-stars">'+svg(i)+'</div></div>'}
function album(){
 const got=new Set(read().filter(Boolean).map(x=>x.photo_id));let slots="";
 for(let i=0;i<12;i++){const m=meta(i);slots+=m&&got.has(m.photo_id)?'<div class="photo3-mini">'+photo(i)+'<b>'+esc(m.place_name)+' × '+esc(m.constellation_name)+'</b></div>':'<div class="photo3-empty">？<br>まだ とっていないよ</div>'}
 const d=dialog("photo3-album",'<div class="photo3-album-card"><div class="photo3-album-head"><button aria-label="とじる">←</button><h2>📔 ぼうけんアルバム</h2></div><p class="photo3-album-note">ゲーム内の星空イラストです。</p><div class="photo3-grid">'+slots+'</div></div>');if(d)d.el.querySelector("button").onclick=d.close;
}
function photograph(i){
 const m=meta(i);if(!m)return;
 const d=dialog("photo3-stage",'<div class="photo3-flash"></div><div class="photo3-camera"><div class="photo3-title">📸 とれた！ 旅の写真</div><div class="photo3-polaroid">'+photo(i)+'<div class="photo3-caption"><b>'+esc(m.place_name)+'</b><span>'+esc(m.constellation_name)+' '+esc(stages[i].emoji)+'</span><div class="photo3-note">ゲーム内イラスト</div></div></div><button class="photo3-save">📔 アルバムにしまう</button><p class="photo3-message" role="status"></p></div>');
 if(!d)return;d.el.querySelector("button").onclick=()=>{if(save(i))d.close();else d.el.querySelector(".photo3-message").textContent="保存できなかったよ。もう一度ためしてね。"};
}
let frame=0;
function layout(){
 const home=document.querySelector(".journeyexit.materialhome"),guide=document.querySelector(".toppill"),bar=document.querySelector(".bottombar"),sheet=document.querySelector(".sheet"),progress=document.querySelector(".hud .progress"),buttons=document.querySelector(".hudbtns");
 if(guide){const h=window.visualViewport?.height||innerHeight;guide.style.setProperty("--guide-bottom",Math.max(18,...[bar,sheet].filter(Boolean).map(x=>h-x.getBoundingClientRect().top+12))+"px");}
 if(home)LabCore.placeFloatingControl(home,{blockers:[guide,bar,sheet,progress,buttons].filter(Boolean),padding:8,collisionPadding:8});
}
function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;layout()})}
window.addEventListener("resize",schedule,{passive:true});window.visualViewport?.addEventListener("resize",schedule,{passive:true});
window.HoshiUI={story,album,photograph,setStages,schedule,resetPhotos(){try{localStorage.removeItem(KEY)}catch{}}};
LabCore.init();
})();
