"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const core = window.LabCore;
  if (!core) return;
  core.init();

  const stages = [
    {
      label:"① 旅行計画・事前調査",
      title:"旅行計画",
      question:"最初に何を確認する？",
      detail:"ホテルだけ決めても、浴室・トイレ・ベッド・介助・緊急時の条件が合わなければ旅は続かない。",
      chips:["宿泊条件","介助者","病院・修理先"],
      choices:[
        {text:"バリアフリーホテルの表示だけ見て予約する", good:false, load:1, feedback:"表示だけでは、浴室・トイレ・ベッドの実寸や介助条件まで分からないことがある。個別確認を残そう。"},
        {text:"浴室・トイレ・ベッド、介助者、病院・車椅子修理先まで確認する", good:true, load:2, feedback:"いい判断。『泊まれるか』だけでなく『生活できるか』『困った時に戻せるか』まで見るのが旅行支援計画。"},
        {text:"現地に着いてから必要なものを探す", good:false, load:3, feedback:"現地対応だけに頼ると、選択肢が少ない場面で詰まりやすい。事前確認できるものは先に押さえよう。"}
      ]
    },
    {
      label:"② 出発1〜2週間前",
      title:"出発前",
      question:"荷造りと日常生活をどう両立する？",
      detail:"旅行準備に介助時間を使いすぎると、普段の食事や生活支援が圧迫されることがある。",
      chips:["荷造り計画","介助時間","車椅子・航空会社"],
      choices:[
        {text:"荷造りは出発前日にまとめて行う", good:false, load:3, feedback:"一気に準備すると、普段の生活に必要な介助時間を圧迫しやすい。少しずつ分ける設計が有効。"},
        {text:"荷造りを数日に分け、ヘルパー時間・日常支援・バッテリー・航空会社への申告を調整する", good:true, load:2, feedback:"旅行準備を『追加作業』として見るのがポイント。日常生活を崩さずに準備できる計画にしよう。"},
        {text:"車椅子の仕様は当日空港で説明する", good:false, load:2, feedback:"電動車椅子やバッテリーは事前申告が必要になる場合がある。航空会社の最新条件を事前確認するのが安全。"}
      ]
    },
    {
      label:"③ 出発・航空機への搭乗",
      title:"空港・搭乗",
      question:"移動の“つなぎ目”で何を見る？",
      detail:"自宅→空港→搭乗口→機内→到着空港→ホテル。区間ごとではなく、乗り継ぎ全体で考える。",
      chips:["空港移動","機内移乗","到着後移動"],
      choices:[
        {text:"航空券が取れたので移動計画は完成とする", good:false, load:2, feedback:"航空券は旅の一部分。搭乗口までの車椅子利用、機内用車椅子、座席移乗、到着後の移動もつながっている。"},
        {text:"自宅からホテルまでを一続きにして、各移乗ポイントと支援方法を確認する", good:true, load:2, feedback:"その視点が大事。『区間最適』ではなく『旅全体が切れないか』を確認する。"},
        {text:"空港スタッフに全部任せる", good:false, load:3, feedback:"現場スタッフの支援は重要。ただし本人の車椅子仕様や移乗方法など、事前共有できる情報は整理しておこう。"}
      ]
    },
    {
      label:"④ 観光・イベント参加",
      title:"観光・イベント",
      question:"行きたい場所を“行ける場所”にするには？",
      detail:"移動経路、福祉タクシー、会場トイレ、介助者。現地での生活動線まで見よう。",
      chips:["移動経路","福祉タクシー","会場・トイレ"],
      choices:[
        {text:"観光地の公式サイトに『バリアフリー』とあれば十分", good:false, load:1, feedback:"『バリアフリー』の中身は場所ごとに違う。入口・経路・トイレ・座席・介助条件まで具体化しよう。"},
        {text:"徒歩・電車・車の経路、福祉タクシー、車椅子対応トイレ、介助者をセットで確認する", good:true, load:2, feedback:"観光の楽しさを守るための確認。行きたい場所を諦めるのではなく、実現条件を具体化する。"},
        {text:"現地の混雑やトイレは運次第なので考えない", good:false, load:3, feedback:"全部は予測できなくても、代替経路や休憩・トイレ候補を持つと選択肢が増える。"}
      ]
    },
    {
      label:"⑤ 宿泊・夜間の生活支援",
      title:"宿泊・夜間",
      question:"夜に支援が途切れないために？",
      detail:"入浴、ベッド移乗、就寝・起床、夜間排泄。昼間の観光だけでなく24時間の生活として考える。",
      chips:["入浴","ベッド移乗","夜間介助"],
      choices:[
        {text:"夜はホテルに戻るので支援計画は不要", good:false, load:3, feedback:"ホテルは生活の場。夜間の排泄や移乗など、本人に必要な支援がある場合は具体的な確保方法が必要。"},
        {text:"入浴・移乗・就寝起床・夜間排泄を分け、誰が何時に対応できるか確認する", good:true, load:3, feedback:"ここはAIだけでは埋められない重要部分。必要時間を可視化し、人・事業者・制度と調整する。"},
        {text:"友人が一緒なら全部お願いする前提にする", good:false, load:2, feedback:"友人支援は選択肢になり得るけれど、本人・友人双方の負担と合意を具体的に確認する必要がある。"}
      ]
    },
    {
      label:"⑥ 全行程を通じた緊急時対応",
      title:"緊急時",
      question:"予定が崩れた時の“戻り道”を作ろう",
      detail:"受診、車椅子故障、介助者キャンセル。ゼロにはできないリスクへ代替手段を用意する。",
      chips:["医療機関","修理・代替機","代替介助"],
      choices:[
        {text:"問題が起きたら、その場で検索して考える", good:false, load:3, feedback:"検索は役立つけれど、緊急時は時間と選択肢が少ない。候補連絡先や代替策を事前に持とう。"},
        {text:"医療・車椅子修理／代替機・介助者の代替手段を、連絡先と一緒に準備する", good:true, load:2, feedback:"これで『旅が止まる一点』を減らせる。AIは候補整理を支援できるが、実際の確保は人・事業者との確認が必要。"},
        {text:"旅行保険に入れば全て対応できると考える", good:false, load:2, feedback:"保険の補償範囲と現地で利用できる支援は別問題。具体的な連絡先・利用条件まで確認しよう。"}
      ]
    }
  ];

  const state = { index:0, answers:[] };

  const intro = "旅行《りょこう》に 行《い》きたい 気持《きも》ちが あっても、予約《よやく》だけでは 出発《しゅっぱつ》できないことがあります。車椅子《くるまいす》、介助《かいじょ》、移動《いどう》、宿泊《しゅくはく》、夜間《やかん》の生活《せいかつ》、緊急時《きんきゅうじ》まで、旅《たび》の 全体《ぜんたい》を つなげる 必要《ひつよう》があります。このゲームでは、AIが 得意《とくい》な『整理《せいり》・比較《ひかく》・文章作成《ぶんしょうさくせい》』と、人《ひと》や 制度《せいど》との 調整《ちょうせい》が 必要《ひつよう》なことを 分《わ》けながら、旅行支援計画《りょこうしえんけいかく》を 作《つく》ります。";
  core.renderRubyText(document.getElementById("intro-text"), intro, {budoux:true});

  const els = {
    kicker:document.getElementById("stage-kicker"),
    title:document.getElementById("stage-title"),
    label:document.getElementById("stage-label"),
    question:document.getElementById("stage-question"),
    detail:document.getElementById("stage-detail"),
    choices:document.getElementById("choice-list"),
    feedbackPanel:document.getElementById("feedback-panel"),
    feedback:document.getElementById("feedback"),
    chips:document.getElementById("plan-chips"),
    confirmed:document.getElementById("confirmed-count"),
    open:document.getElementById("open-count"),
    load:document.getElementById("support-load"),
    next:document.getElementById("next-btn")
  };

  function resetGame(){
    state.index = 0;
    state.answers = [];
    renderStage();
  }

  function renderMeters(){
    const confirmed = state.answers.filter(a => a.good).length;
    const load = state.answers.reduce((sum,a)=>sum+a.load,0);
    els.confirmed.textContent = String(confirmed);
    els.open.textContent = String(stages.length-confirmed);
    els.load.textContent = String(load);
  }

  function renderStage(){
    const stage = stages[state.index];
    els.kicker.textContent = "ミッション " + (state.index+1) + " / " + stages.length;
    els.title.textContent = stage.title;
    els.label.textContent = stage.label;
    els.question.textContent = stage.question;
    els.detail.textContent = stage.detail;
    els.feedbackPanel.hidden = true;
    els.feedback.textContent = "";
    els.feedback.classList.remove("good");
    els.chips.replaceChildren();
    els.next.disabled = true;
    els.next.textContent = state.index === stages.length-1 ? "結果を見る" : "次へ";
    els.choices.replaceChildren();

    stage.choices.forEach((choice,choiceIndex)=>{
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn" + (choice.good ? "" : " risky");
      button.textContent = choice.text;
      button.addEventListener("click",()=>selectChoice(choiceIndex,button));
      els.choices.appendChild(button);
    });
    renderMeters();
  }

  function selectChoice(choiceIndex, button){
    if (!els.next.disabled) return;
    const stage = stages[state.index];
    const choice = stage.choices[choiceIndex];
    state.answers[state.index] = {
      good:choice.good,
      load:choice.load,
      text:choice.text,
      label:stage.label,
      chips:stage.chips
    };

    [...els.choices.children].forEach(el=>el.disabled=true);
    button.classList.add("selected");
    els.feedback.textContent = choice.feedback;
    els.feedback.classList.toggle("good", choice.good);
    els.feedbackPanel.hidden = false;
    stage.chips.forEach(text=>{
      const chip=document.createElement("span");
      chip.className="plan-chip";
      chip.textContent=text;
      els.chips.appendChild(chip);
    });
    els.next.disabled = false;
    renderMeters();
    core.beep(choice.good ? "success" : "tap");
  }

  function showResult(){
    const score = state.answers.filter(a=>a.good).length;
    document.getElementById("result-score").textContent = score + " / " + stages.length;
    const emoji = document.getElementById("result-emoji");
    const title = document.getElementById("result-title");

    if (score === 6){ emoji.textContent="🌟"; title.textContent="旅を実現する条件がよくつながった！"; }
    else if (score >= 4){ emoji.textContent="🧭"; title.textContent="かなり実現可能。残った穴を埋めよう"; }
    else { emoji.textContent="🧩"; title.textContent="予約より先に、支援条件の確認を増やそう"; }

    const okList=document.getElementById("result-confirmed");
    const openList=document.getElementById("result-open");
    okList.replaceChildren();
    openList.replaceChildren();

    stages.forEach((stage,i)=>{
      const answer=state.answers[i];
      const li=document.createElement("li");
      li.textContent=stage.label + "： " + stage.chips.join("・");
      (answer && answer.good ? okList : openList).appendChild(li);
    });

    if (!okList.children.length){
      const li=document.createElement("li");
      li.textContent="今回は確認済みにできた場面がありません。もう一度、各場面の『生活が途切れない条件』を探してみよう。";
      okList.appendChild(li);
    }
    if (!openList.children.length){
      const li=document.createElement("li");
      li.textContent="重要6場面はすべて確認できました。実際の旅行では最新の制度・事業者・施設条件を個別に再確認します。";
      openList.appendChild(li);
    }
    core.showScreen("screen-final");
  }

  document.getElementById("start-btn").addEventListener("click",()=>{ resetGame(); core.beep("start"); core.showScreen("screen-play"); });
  document.getElementById("story-btn").addEventListener("click",()=>core.showScreen("screen-story"));
  document.getElementById("story-start-btn").addEventListener("click",()=>{ resetGame(); core.showScreen("screen-play"); });
  document.getElementById("sound-btn").addEventListener("click",(e)=>core.toggleMute(e.currentTarget));
  document.getElementById("home-btn").addEventListener("click",()=>core.showScreen("screen-title"));
  document.getElementById("next-btn").addEventListener("click",()=>{
    if (els.next.disabled) return;
    if (state.index >= stages.length-1) showResult();
    else { state.index += 1; renderStage(); }
  });
  document.getElementById("retry-btn").addEventListener("click",()=>{ resetGame(); core.showScreen("screen-play"); });
  document.querySelectorAll("[data-go]").forEach((el)=>{ el.addEventListener("click",()=>core.showScreen(el.dataset.go)); });

  core.registerServiceWorker("./sw.js");
});