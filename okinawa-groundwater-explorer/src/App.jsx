import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createEngine } from './engine.js';
import * as audio from './audio.js';

// {漢字|よみ} を ルビに する
function R({ t }) {
  const out = [];
  const re = /\{([^|}]+)\|([^}]+)\}/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(t.slice(last, m.index));
    out.push(
      <ruby key={i++}>
        {m[1]}
        <rt>{m[2]}</rt>
      </ruby>
    );
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push(t.slice(last));
  return <>{out}</>;
}

const LAB_URL = 'https://lab.alpaca-school.okinawa/';
const BADGE_KEY = 'okinawa-groundwater-explorer-qa-v1-badges';

const STAGES = {
  s1: {
    title: 'しみこみくらべ',
    intro: [
      'ふわぁ…あめだねぇ。',
      'この{雨|あめ}、じめんの{下|した}で どう なるのかなぁ。',
      '{石灰岩|せっかいがん}・{赤土|あかつち}・{泥岩|でいがん}に あめを ふらせて、くらべてみてね。',
      '{実験|じっけん}は まかせたよ。ぼくは ちょっと ねるねぇ…ふぁぁ。',
    ],
    hint: 'くもを うごかして、3つの ところに ぜんぶ あめを ふらせよう。',
    goalText: 'どの ところにも あめを ふらせよう',
    quiz: {
      q: 'いちばん {深|ふか}く しみこんだのは、どれかなぁ?',
      choices: ['{石灰岩|せっかいがん}', '{赤土|あかつち}', '{泥岩|でいがん}'],
      correct: 0,
      explain:
        '{石灰岩|せっかいがん}は すきまが おおくて、みずが とおりやすいんだ。{泥岩|でいがん}は とおりにくくて、みずは ながれていくよ。(かんたんな もけいだよ)',
    },
  },
  tama: {
    title: '{玉泉洞|ぎょくせんどう}',
    intro: [
      'ここは {南城市|なんじょうし}の {玉泉洞|ぎょくせんどう}の イメージだよ。',
      '{洞窟|どうくつ}は どうやって できたのかなぁ…ふわぁ…',
      'ぼくは ひるねを するから、{時間|じかん}を ぎゅっと すすめて みてねぇ。zzz…',
    ],
    hint: 'じかんボタンを おして、3000ねんぶん すすめよう。',
    goalText: '3000ねん すすめよう',
    quiz: {
      q: '{洞窟|どうくつ}は なにで できたのかなぁ?',
      choices: ['あまみずが {石灰岩|せっかいがん}を すこしずつ とかした', 'ひとが ぜんぶ ほった', 'かぜが ふいて あなが あいた'],
      correct: 0,
      explain:
        'あまみずが、ながい ながい じかんを かけて {石灰岩|せっかいがん}を すこしずつ とかしたんだ。ぶらさがる つらら{石|いし}も、すこしずつ のびるよ。{見学|けんがく}の ルールを まもろうね。',
    },
  },
  spring: {
    title: '{湧水|わきみず}と {井戸|いど}',
    intro: [
      'しみこんだ みずは、どこへ いくのかなぁ。',
      '{泥岩|でいがん}の うえに たまって、がけから でてくるよ。',
      'それが {湧水|わきみず}。{井戸|いど}も ほってみよう!',
      '{実験|じっけん}は まかせたよ。ぼくは ちょっと ねるねぇ…ふぁぁ。',
    ],
    hint: 'あめを ふらせて みずを ためよう。しろい わくの ところに、{井戸|いど}を ほるよ。',
    goalText: '{湧水|わきみず}を だして、{井戸|いど}で みずを みつけよう',
    quiz: {
      q: '{湧水|わきみず}は どうして でてくるのかなぁ?',
      choices: [
        'しみこんだ みずが {泥岩|でいがん}の うえを ながれて でてくる',
        'そらから ふってくる',
        'うみの みずが わいてくる',
      ],
      correct: 0,
      explain:
        'しみこんだ みずは、とおりにくい {泥岩|でいがん}の うえに たまって、よこへ ながれて がけから でてくるんだ。{湧水|わきみず}は そのまま のまないでね。',
    },
  },
  shiokawa: {
    engine: 'shiokawa',
    title: '{塩川|しおかわ}',
    intro: [
      'ここは {本部町|もとぶちょう}の {塩川|しおかわ}の イメージだよ。',
      '{海|うみ}の ちかくの {石灰岩|せっかいがん}から、{塩|しお}あじの みずが わきでる、めずらしい {川|かわ}なんだ。',
      'どうして なのかは、まだ ぜんぶは わかって いないんだって…ふわぁ。',
      'あめを ふらせて、{塩|しお}けが どう かわるか みてねぇ。ぼくは ねるよ…',
    ],
    hint: 'あめを ふらせると、{地下|ちか}の まみずが ふえるよ。{海|うみ}の みちひきも ためしてね。',
    goalText: 'あめを たくさん ふらせて、{塩|しお}けを うすめよう',
    quiz: {
      q: '{大雨|おおあめ}が ふると、{塩川|しおかわ}の みずの {塩|しお}けは どうなるのかなぁ?',
      choices: ['うすく なる', 'もっと こく なる', 'ぜんぜん かわらない'],
      correct: 0,
      explain:
        'あめが ふると、{塩|しお}けが うすく なると いわれているよ。ほんものは 1{日|にち}くらい おくれて かわるんだ。どうして {塩|しお}みずが わくのかは、まだ ぜんぶは わかって いないよ。(かんたんな もけい)',
    },
  },
  kakinohana: {
    engine: 'kakinohana',
    title: '{垣花樋川|かきのはなひーじゃー}',
    intro: [
      'ここは {南城市|なんじょうし}の {垣花樋川|かきのはなひーじゃー}の イメージだよ。',
      '{名水百選|めいすいひゃくせん}に えらばれた、がけの とちゅうから わきでる みずだよ。',
      'むかしから、みんなで たいせつに つかって きた ばしょなんだ。',
      'あめを ふらせて、みずが でるのを みてねぇ。ぼくは ねるよ…',
    ],
    hint: 'あめを ふらせて {湧水|わきみず}を だそう。したの 3つの ボタンも おして みてね。',
    goalText: '{湧水|わきみず}を だして、3つの つかいみちを みよう',
    quiz: {
      q: '{垣花樋川|かきのはなひーじゃー}の みずは、どこから でているのかなぁ?',
      choices: ['がけの とちゅうの いわの ねもとから', 'やまの てっぺんの うえから', 'うみの なかから'],
      correct: 0,
      explain:
        'しみこんだ あめが、がけの とちゅうの いわの ねもとから わきでるよ。{拝所|うがんじゅ}では しずかに おまいりしよう。{湧水|わきみず}は そのまま のまないでね。',
    },
  },
  akatsuchi: {
    engine: 'akatsuchi',
    title: '{赤土|あかつち}の ながれ',
    intro: [
      'はたけの {赤土|あかつち}は、おおあめで みずと いっしょに うみへ ながれる ことが あるんだ。',
      'うみが にごると、サンゴが よわって しまうよ。',
      'たいさくを えらんで、{赤土|あかつち}を ふせいで みてねぇ。ぼくは ねるよ…',
    ],
    hint: 'あめを ふらせて ようすを みよう。したの たいさくを 2つ いじょう つかおう。',
    goalText: 'たいさくを 2つ つかって、うみを きれいに まもろう',
    quiz: {
      q: '{赤土|あかつち}が うみに ながれると、なにが こまるのかなぁ?',
      choices: ['サンゴが よわって しまう', 'うみの みずが あまくなる', 'さかなが ふえすぎる'],
      correct: 0,
      explain:
        '{赤土|あかつち}で うみが にごると、サンゴが よわって しまうよ。はたけの まわりの グリーンベルトや、つちを ためる {沈砂池|ちんしゃち}で ふせげるんだ。',
    },
  },
  dam: {
    engine: 'dam',
    title: '{宮古島|みやこじま}の {地下|ちか}ダム',
    intro: [
      'ここは {宮古島|みやこじま}の イメージだよ。',
      '{島|しま}じゅうが {石灰岩|せっかいがん}で、あめが すぐ うみへ にげて しまうんだ。',
      'だから {地下|ちか}に かべを つくって、みずを ためる {地下|ちか}ダムが あるよ。',
      'かべの ばしょを えらんで、つくって みてねぇ。ぼくは ねるよ…',
    ],
    hint: 'しろい わくで かべの ばしょを えらぼう。{海|うみ}に ちかい ほうが たくさん ためられるよ。🌱 ひりょうも ためしてね。',
    goalText: '{地下|ちか}ダムを つくって、ひでりを のりこえよう',
    quiz: {
      q: '{地下|ちか}ダムの みずを たいせつに つかうには、どうしたら いいかなぁ?',
      choices: ['ひりょうを まきすぎない ように する', 'ひりょうを たくさん まく', 'かべを こわして しまう'],
      correct: 0,
      explain:
        '{地下|ちか}ダムは にげる みずを ためて、{畑|はたけ}に つかえるよ。でも ためた みずは、よごれも たまりやすいんだ。ひりょうの よごれは {宮古島|みやこじま}でも しんぱいされて いるよ。',
    },
  },
  mirai: {
    engine: 'mirai',
    title: '{未来|みらい}の {島|しま}',
    intro: [
      'さいごは {未来|みらい}の {島|しま}を つくるよ。',
      '{森|もり}・はたけ・まち・こうじょうを ならべて、あめを ふらせてみよう。',
      'みずが しみこむか、きれいかを しらべて、くらしと みずが りょうりつ する {島|しま}に しようねぇ。ぼくは ねるよ…',
    ],
    hint: '{島|しま}を タップして ばしょを えらび、ボタンで おこう。あめで しらべるよ。',
    goalText: 'みずも くらしも だいじな {島|しま}を つくろう',
    quiz: {
      q: '{島|しま}の みずを まもる まちづくりは、どれかなぁ?',
      choices: ['{森|もり}を のこして、みずが しみこむ ところを たもつ', 'ぜんぶ コンクリートに する', 'こうじょうだけを たくさん つくる'],
      correct: 0,
      explain:
        '{森|もり}や はたけの しみこみを のこしながら、まちや こうじょうの よごれを ふせぐと、みずと くらしを りょうりつ しやすいよ。{未来|みらい}の {島|しま}は、きみたちが えらぶんだ。',
    },
  },
};

const PLANS = {
  A: {
    name: 'ガンジューの {沖縄|おきなわ}{地下水|ちかすい}だいぼうけん',
    short: 'ぜんぶ',
    gameId: 'okinawa-groundwater-explorer',
    stages: ['s1', 'spring', 'tama', 'shiokawa', 'kakinohana', 'akatsuchi', 'dam', 'mirai'],
    desc: 'しみこみ → {井戸|いど} → {玉泉洞|ぎょくせんどう} → {塩川|しおかわ} → {垣花樋川|かきのはなひーじゃー} → {赤土|あかつち} → {地下|ちか}ダム → {未来|みらい}の{島|しま}',
    ending: '{沖縄|おきなわ}の みずは、{洞窟|どうくつ}にも {湧水|わきみず}にも {地下|ちか}ダムにも つながっていたねぇ。{未来|みらい}の {島|しま}は、きみたちが えらぶよ。…ふわぁ、ねむい。',
  },
};

function loadBadges() {
  try {
    return JSON.parse(localStorage.getItem(BADGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
function saveBadges(b) {
  try {
    localStorage.setItem(BADGE_KEY, JSON.stringify(b));
  } catch (e) {
    /* noop */
  }
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path fill="currentColor" d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z" />
  </svg>
);
const SoundIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path fill="currentColor" d="M3 9v6h4l5 4V5L7 9z" />
    {off ? (
      <path stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="m15 9 6 6m0-6-6 6" />
    ) : (
      <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" d="M15.5 8.5a5 5 0 0 1 0 7m2.5-9.5a9 9 0 0 1 0 12" />
    )}
  </svg>
);

export default function App() {
  const holder = useRef(null);
  const eng = useRef(null);
  const [screen, setScreen] = useState('title'); // title | game | end
  const [plan, setPlan] = useState('A');
  const [si, setSi] = useState(0);
  const [phase, setPhase] = useState('intro'); // intro | play | quiz | snore | wrong | explain
  const [li, setLi] = useState(0);
  const [stats, setStats] = useState({ zoneRain: [0, 0, 0], maxDepth: [0, 0, 0] });
  const [muted, setMuted] = useState(false);
  const [rain, setRain] = useState(false);
  const [cloud, setCloud] = useState(0.5);
  const [wellPos, setWellPos] = useState(0.15);
  const [timeOn, setTimeOn] = useState(false);
  const [awake, setAwake] = useState(false);
  const [badges, setBadges] = useState(loadBadges);
  const [showHelp, setShowHelp] = useState(false);
  const [tideHigh, setTideHigh] = useState(false);
  const [wallPos, setWallPos] = useState(0.85);
  const [fertOn, setFertOn] = useState(false);
  const [meas, setMeas] = useState({ green: false, pond: false, grade: false });
  const [seen, setSeen] = useState([]);
  const [infoMsg, setInfoMsg] = useState('');

  const [graphicsError, setGraphicsError] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [pendingStart, setPendingStart] = useState(null);

  useEffect(() => {
    if (!pendingStart || !holder.current || eng.current) return;
    let e;
    try {
      e = createEngine(holder.current);
    } catch (error) {
      console.warn('3D initialization failed', error);
      holder.current.replaceChildren();
      setGraphicsError(true);
      setPendingStart(null);
      return;
    }
    eng.current = e;
    setEngineReady(true);
    const id = setInterval(() => {
      const s0 = e.getStats();
      setStats({ ...s0, zoneRain: [...s0.zoneRain], maxDepth: [...s0.maxDepth], slots: [...s0.slots] });
    }, 150);
    return () => {
      clearInterval(id);
      e.dispose();
      eng.current = null;
    };
  }, [pendingStart]);

  const stageName = PLANS[plan].stages[si];
  const st = STAGES[stageName];

  const enterStage = useCallback((p, i) => {
    const sid = PLANS[p].stages[i];
    const name = STAGES[sid].engine || sid;
    const e = eng.current;
    e.loadStage(name);
    setTideHigh(false);
    setWallPos(0.85);
    setFertOn(false);
    setMeas({ green: false, pond: false, grade: false });
    setSeen([]);
    setInfoMsg('');
    if (name === 'dam') e.setWallPreview(0.85);
    e.setCloud(0.5);
    setRain(false);
    setCloud(0.5);
    setWellPos(0.15);
    setTimeOn(false);
    setAwake(false);
    if (name === 'spring') e.setWellPreview(0.15);
    setShowHelp(false);
    setPhase('intro');
    setLi(0);
    setScreen('game');
  }, []);

  const startPlan = (p, i = 0) => {
    audio.initAudio();
    audio.pop();
    setPlan(p);
    setSi(i);
    if (eng.current) enterStage(p, i);
    else setPendingStart({ p, i });
  };

  useEffect(() => {
    if (engineReady && pendingStart && eng.current) enterStage(pendingStart.p, pendingStart.i);
  }, [engineReady, pendingStart, enterStage]);

  const toTitle = () => {
    audio.pop();
    eng.current.loadStage('title');
    setScreen('title');
  };

  const toggleMute = () => {
    audio.initAudio();
    const m = !muted;
    setMuted(m);
    audio.setMuted(m);
    if (!m) audio.pop();
  };

  const sl = stats.slots || [0, 0, 0, 0, 0, 0];
  const hasTown = sl.includes(3);
  const hasWork = sl.includes(2) || sl.includes(4);
  const live = (hasTown ? 0.5 : 0) + (hasWork ? 0.5 : 0);
  const miraiOk = hasTown && hasWork && stats.mLand >= 60 && stats.mQty >= 0.55 && stats.mQual >= 0.6;

  // --- ゴール判定 ---
  const goal = (() => {
    if (!eng.current) return false;
    if (stageName === 's1') return stats.zoneRain.every((z) => z >= 35);
    if (stageName === 'tama') return stats.years >= 3000;
    if (stageName === 'spring') return stats.spring >= 25 && stats.wellOk >= 1;
    if (stageName === 'shiokawa') return stats.maxFresh >= 0.7;
    if (stageName === 'kakinohana') return stats.spring >= 20 && seen.length >= 3;
    if (stageName === 'dam') return stats.droughtOk >= 1;
    if (stageName === 'akatsuchi') return stats.rained >= 120 && stats.nMeas >= 2 && stats.turb < 0.3;
    if (stageName === 'mirai') return miraiOk;
    return false;
  })();

  const setRainOn = (b) => {
    audio.initAudio();
    setRain(b);
    eng.current.setRain(b);
    audio.pop();
  };
  const onCloud = (v) => {
    setCloud(v);
    eng.current.setCloud(v);
  };
  const toggleTime = () => {
    audio.initAudio();
    const b = !timeOn;
    setTimeOn(b);
    eng.current.setSleepTime(b);
    audio.pop();
  };
  const onWellPos = (v) => {
    setWellPos(v);
    eng.current.setWellPreview(v);
  };
  const dig = () => {
    audio.initAudio();
    eng.current.digWell(wellPos);
  };
  const onWallPos = (v) => {
    setWallPos(v);
    eng.current.setWallPreview(v);
  };
  const build = () => {
    audio.initAudio();
    eng.current.buildWall(wallPos);
  };
  const doDrought = () => {
    audio.initAudio();
    setRain(false);
    eng.current.setRain(false);
    eng.current.startDrought();
  };
  const toggleFert = () => {
    const b = !fertOn;
    setFertOn(b);
    eng.current.setFert(b);
    audio.pop();
  };
  const toggleTide = () => {
    audio.initAudio();
    const b = !tideHigh;
    setTideHigh(b);
    eng.current.setTide(b);
  };
  const toggleMeas = (k) => {
    audio.initAudio();
    const nb = { ...meas, [k]: !meas[k] };
    setMeas(nb);
    eng.current.setMeasure(k, nb[k]);
  };
  const showInfo = (k, text) => {
    audio.initAudio();
    audio.pop();
    if (!seen.includes(k)) setSeen([...seen, k]);
    setInfoMsg(text);
  };
  const place = (t) => {
    audio.initAudio();
    eng.current.placeSlot(t);
  };

  // はじめる: ガンジューは ねて、じっけんが はじまる
  const startPlay = () => {
    audio.initAudio();
    audio.pop();
    eng.current.setGanjuu('sleep');
    setPhase('play');
  };

  // 進むとき: かたを トントン して おこす
  const wakeToQuiz = () => {
    eng.current.setRain(false);
    eng.current.setSleepTime(false);
    eng.current.setGanjuu('wake');
    audio.wake();
    setRain(false);
    setTimeOn(false);
    setAwake(true);
    setPhase('quiz');
  };

  const pickChoice = (i) => {
    if (i === st.quiz.correct) {
      audio.chime();
      eng.current.setGanjuu('happy');
      const nb = Array.from(new Set([...badges, stageName]));
      setBadges(nb);
      saveBadges(nb);
      setPhase('explain');
    } else {
      audio.bad();
      setPhase('wrong');
    }
  };

  const nextStage = () => {
    audio.pop();
    if (si + 1 < PLANS[plan].stages.length) {
      setSi(si + 1);
      enterStage(plan, si + 1);
    } else {
      eng.current.setGanjuu('happy');
      setScreen('end');
    }
  };

  const retryPlay = () => {
    audio.pop();
    eng.current.setGanjuu('idle');
    setPhase('play');
  };

  const restart = (p) => {
    audio.pop();
    setPlan(p);
    setSi(0);
    enterStage(p, 0);
  };

  // --- 画面 ---
  const bubble = (text, who = 'ガンジュー') => (
    <div className="bubble">
      <div className="who">{who}</div>
      <p className="say">
        <R t={text} />
      </p>
    </div>
  );

  let panel = null;

  if (screen === 'title') {
    panel = (
      <div className="panel">
        <h1 className="title">
          <R t="ガンジューの {地下水|ちかすい}たんけん" />
        </h1>
        <p className="sub">
          <R t="【じっき けんしょうばん・きょうざい みかくにん】" />
        </p>
        {graphicsError ? (
          <div className="bubble" role="alert">
            <p className="say">この ブラウザでは 3D を はじめられなかったよ。</p>
            <p className="hint">3D（WebGL）が つかえないことが あるよ。べつの ブラウザや ききで ためしてね。</p>
            <a className="btn lab" href={LAB_URL}>ラボいちらんに もどる</a>
          </div>
        ) : pendingStart && !engineReady ? <p role="status">3Dを よみこんでいるよ…</p> : ['A'].map((p) => (
          <div key={p} className="cardwrap">
            <button className="card" onClick={() => startPlan(p)}>
              <span className="tag">
                <R t={PLANS[p].short} />
              </span>
              <span className="cname">
                <R t={PLANS[p].name} />
              </span>
              <span className="cdesc">
                <R t={PLANS[p].desc} />
              </span>
            </button>
            <div className="chips">
              <span className="chl">ステージを えらぶ</span>
              {PLANS[p].stages.map((sid, i) => (
                <button key={sid} className="chip" onClick={() => startPlan(p, i)} aria-label={'ステージ' + (i + 1)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  } else if (screen === 'end') {
    panel = (
      <div className="panel">
        {bubble(PLANS[plan].ending)}
        <div className="badges">
          {PLANS[plan].stages.map((s) => (
            <span key={s} className={'badge ' + (badges.includes(s) ? 'on' : '')}>
              💧 <R t={STAGES[s].title} />
            </span>
          ))}
        </div>
        <p className="note">
          <R t="これは かんたんな もけいだよ。ほんものの {地下水|ちかすい}は もっと ふくざつ。{洞窟|どうくつ}に かってに はいったり、{湧水|わきみず}を そのまま のんだり しないでね。" />
        </p>
        <div className="row">
          <button className="btn pri" onClick={() => restart(plan)}>もういちど あそぶ</button>

        </div>
        <a className="btn lab" href={LAB_URL} target="_blank" rel="noopener noreferrer">
          ← 🔬 ラボ一覧に もどる
        </a>
        <p className="gid">game_id: {PLANS[plan].gameId} / しさくばん(じっき QA まえ)</p>
      </div>
    );
  } else {
    const stageTitle = st.title;
    if (phase === 'intro') {
      const lines = st.intro;
      panel = (
        <div className="panel">
          <div className="stagename">
            ステージ{si + 1}: <R t={stageTitle} />
          </div>
          {bubble(lines[li])}
          <button
            className="btn pri big"
            onClick={() => {
              audio.pop();
              if (li + 1 < lines.length) setLi(li + 1);
              else startPlay();
            }}
          >
            {li + 1 < lines.length ? 'つぎへ ▶' : 'はじめる!'}
          </button>
        </div>
      );
    } else if (phase === 'play') {
      panel = (
        <div className="panel">
          <div className="stagename">
            ステージ{si + 1}: <R t={stageTitle} />
          </div>
          <p className="hint">
            <R t={st.hint} />
          </p>

          {stageName === 's1' && (
            <div className="gauges">
              {['{石灰岩|せっかいがん}', '{赤土|あかつち}', '{泥岩|でいがん}'].map((n, z) => (
                <div key={z} className="gauge">
                  <div className="gl">
                    <R t={n} />
                  </div>
                  <div className="gbar">
                    <i style={{ width: Math.min(100, (stats.maxDepth[z] / 16) * 100) + '%' }} />
                  </div>
                  <div className="gs">ふらせた {Math.min(35, stats.zoneRain[z])}/35</div>
                </div>
              ))}
            </div>
          )}

          {stageName === 'tama' && (
            <div className="gauges">
              <div className="gauge wide">
                <div className="gl">じかん: {Math.floor(stats.years || 0)} ねん</div>
                <div className="gbar">
                  <i style={{ width: Math.min(100, (stats.years / 3000) * 100) + '%' }} />
                </div>
              </div>
            </div>
          )}

          {stageName === 'spring' && (
            <div className="gauges">
              <div className="gauge wide">
                <div className="gl">
                  <R t="{湧水|わきみず}" /> ・ <R t={'{井戸|いど}: ' + (stats.wellOk >= 1 ? 'みつけた!' : 'まだ')} />
                </div>
                <div className="gbar">
                  <i style={{ width: Math.min(100, ((stats.spring || 0) / 25) * 100) + '%' }} />
                </div>
              </div>
            </div>
          )}

          {stageName === 'shiokawa' && (
            <div className="gauges">
              <div className="gauge wide">
                <div className="gl">
                  <R t="{塩|しお}けの めやす" /> <span className="gs">(こい ⇄ うすい)</span>
                </div>
                <div className="gbar salt">
                  <i style={{ width: Math.max(4, Math.min(100, (1 - 0.75 * (stats.fresh || 0)) * 100)) + '%' }} />
                </div>
              </div>
            </div>
          )}

          {stageName === 'kakinohana' && (
            <div className="gauges">
              <div className="gauge wide">
                <div className="gl">
                  <R t="{湧水|わきみず}" /> ・ <R t={'つかいみち ' + seen.length + '/3'} />
                </div>
                <div className="gbar">
                  <i style={{ width: Math.min(100, ((stats.spring || 0) / 20) * 100) + '%' }} />
                </div>
              </div>
            </div>
          )}

          {(stageName === 'dam') && (
            <div className="gauges">
              <div className="gauge">
                <div className="gl">
                  <R t="ためた みず" />
                </div>
                <div className="gbar rel">
                  <i style={{ width: Math.min(100, ((stats.store || 0) / 6) * 100) + '%' }} />
                  {stats.wallState === 'done' && <b className="tick" style={{ left: Math.min(98, (stats.need || 0.6) * 100) + '%' }} />}
                </div>
                {stats.wallState === 'done' && <div className="gs">しろい せんまで ためよう</div>}
              </div>
              <div className="gauge">
                <div className="gl">
                  <R t="うみへ にげた みず" />
                </div>
                <div className="gs big">{stats.spring || 0}</div>
              </div>
              {stageName === 'dam' && (
                <div className="gauge">
                  <div className="gl">
                    <R t="よごれ" />
                  </div>
                  <div className="gbar dirty">
                    <i style={{ width: Math.min(100, (stats.nitrate || 0) * 100) + '%' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {stageName === 'akatsuchi' && (
            <div className="gauges">
              <div className="gauge">
                <div className="gl">
                  <R t="うみの にごり" />
                </div>
                <div className="gbar dirty">
                  <i style={{ width: Math.min(100, (stats.turb || 0) * 100) + '%' }} />
                </div>
              </div>
              <div className="gauge">
                <div className="gl">
                  <R t="サンゴ" />
                </div>
                <div className="gbar good">
                  <i style={{ width: Math.min(100, (stats.coral ?? 1) * 100) + '%' }} />
                </div>
              </div>
              <div className="gauge">
                <div className="gl">
                  <R t="あめ" />
                </div>
                <div className="gs">{Math.min(120, stats.rained || 0)}/120</div>
              </div>
            </div>
          )}

          {stageName === 'mirai' && (
            <>
              <div className="gauges">
                <div className="gauge">
                  <div className="gl">
                    <R t="しみこむ" /> {stats.mQty >= 0.55 && stats.mLand >= 60 ? '✓' : ''}
                  </div>
                  <div className="gbar">
                    <i style={{ width: Math.min(100, (stats.mQty || 0) * 100) + '%' }} />
                  </div>
                </div>
                <div className="gauge">
                  <div className="gl">
                    <R t="きれい" /> {stats.mQual >= 0.6 && stats.mLand >= 60 ? '✓' : ''}
                  </div>
                  <div className="gbar good">
                    <i style={{ width: Math.min(100, (stats.mLand ? stats.mQual : 0) * 100) + '%' }} />
                  </div>
                </div>
                <div className="gauge">
                  <div className="gl">
                    <R t="くらし" /> {live >= 1 ? '✓' : ''}
                  </div>
                  <div className="gbar warm">
                    <i style={{ width: live * 100 + '%' }} />
                  </div>
                </div>
              </div>
              <div className="pal">
                {[
                  [1, '🌳', 'もり'],
                  [2, '🌾', 'はたけ'],
                  [3, '🏠', 'まち'],
                  [4, '🏭', 'こうじょう'],
                  [0, '⬜', 'あきち'],
                ].map(([t, ic, nm]) => (
                  <button key={t} className="btn pbtn" onClick={() => place(t)} aria-label={nm}>
                    <span className="pic">{ic}</span>
                    <span className="pnm">{nm}</span>
                  </button>
                ))}
              </div>
              <p className="wmsg">
                {stats.mLand < 60
                  ? 'あめを ふらせて しらべよう (' + (stats.mLand || 0) + '/60)'
                  : !hasTown || !hasWork
                  ? 'まちと、はたけか こうじょうが ひつようだよ'
                  : stats.mQual < 0.6
                  ? 'みずが よごれて いるよ…'
                  : stats.mQty < 0.55
                  ? 'あめが しみこまず ながれて いるよ…'
                  : 'いい かんじ! 💧'}
              </p>
            </>
          )}

          {stageName !== 'tama' && (
            <div className="ctl">
              <button className={'btn rainb ' + (rain ? 'on' : 'pri')} style={stageName === 'mirai' ? { flex: 1 } : undefined} disabled={!!stats.drought} onClick={() => setRainOn(!rain)}>
                {rain ? '☔ とめる' : stageName === 'mirai' ? '☔ あめで しらべる' : '☔ あめ'}
              </button>
              {stageName !== 'mirai' && <label className="slab">
                <span aria-hidden="true">☁</span>
                <input type="range" min="0" max="1" step="0.01" value={cloud} onChange={(e) => onCloud(parseFloat(e.target.value))} aria-label="くもの いち" />
              </label>}
            </div>
          )}

          {stageName === 'tama' && (
            <button className={'btn big ' + (timeOn ? 'on' : 'pri')} onClick={toggleTime}>
              {timeOn ? '⏸ じかんを とめる' : '⏩ じかんを すすめる'}
            </button>
          )}

          {stageName === 'shiokawa' && (
            <button className={'btn ' + (tideHigh ? 'on' : '')} onClick={toggleTide}>
              🌊 {tideHigh ? 'ひきしおに する' : 'みちしおに する'}
            </button>
          )}

          {stageName === 'kakinohana' && (
            <>
              <div className="mini3">
                {[
                  ['kawa', '💧', '{男|おとこ}・{女|おんな}の{川|かわ}', 'むかしは {男|おとこ}の{人|ひと}と {女|おんな}の{人|ひと}で、べつべつの {川|かわ}を つかって いた なごりが あるよ。'],
                  ['haisho', '🙏', '{拝所|うがんじゅ}', '{拝所|うがんじゅ}は いのりの ばしょ。しずかに、うやまう きもちで おまいりしよう。'],
                  ['cress', '🌱', 'クレソン', '{湧水|わきみず}は クレソンの はたけにも つかわれて いるよ。'],
                ].map(([k, ic, nm, tx]) => (
                  <button key={k} className={'btn mbtn ' + (seen.includes(k) ? 'seen' : '')} onClick={() => showInfo(k, tx)}>
                    <span className="pic">{ic}</span>
                    <span className="pnm">
                      <R t={nm} />
                      {seen.includes(k) ? ' ✓' : ''}
                    </span>
                  </button>
                ))}
              </div>
              {infoMsg && (
                <p className="wmsg info">
                  <R t={infoMsg} />
                </p>
              )}
            </>
          )}

          {(stageName === 'dam') && (
            <>
              <div className="ctl">
                <button className="btn rainb" onClick={build} disabled={stats.wallState === 'building'}>
                  {stats.wallState === 'done' ? '🏗 つくりなおす' : '🏗 つくる'}
                </button>
                <label className="slab">
                  <span aria-hidden="true">↔</span>
                  <input type="range" min="0" max="1" step="0.01" value={wallPos} onChange={(e) => onWallPos(parseFloat(e.target.value))} aria-label="かべの いち" />
                </label>
              </div>
              <div className="row">
                <button className="btn" onClick={doDrought} disabled={!!stats.drought || stats.wallState === 'building'}>
                  {stats.drought ? '☀ ひでりちゅう…' : '☀ ひでりを ためす'}
                </button>
                {stageName === 'dam' && (
                  <button className={'btn ' + (fertOn ? 'on' : '')} onClick={toggleFert}>
                    🌱 ひりょう {fertOn ? 'あり' : 'なし'}
                  </button>
                )}
              </div>
              {stats.wallState === 'building' && <p className="wmsg dg">かべを つくってるよ… 🏗</p>}
              {stats.wallState === 'done' && stats.droughtOk < 1 && stats.droughtFail < 1 && !stats.drought && (
                <p className="wmsg ok">かべが できたよ! あめを ふらせて、みずを ためよう。</p>
              )}
              {stats.droughtFail >= 1 && stats.droughtOk < 1 && !stats.drought && (
                <p className="wmsg">
                  <R t="みずが たりなかった…。あめを ふらせて ためて、もういちど ためそう。{海|うみ}に ちかい ほうが たくさん ためられるよ。" />
                </p>
              )}
              {stats.droughtOk >= 1 && <p className="wmsg ok">ひでりでも はたけは みどり! 🌾</p>}
            </>
          )}

          {stageName === 'akatsuchi' && (
            <div className="mini3">
              {[
                ['green', '🌿', 'グリーンベルト'],
                ['pond', '🏞', '{沈砂池|ちんしゃち}'],
                ['grade', '⛰', 'なだらかに'],
              ].map(([k, ic, nm]) => (
                <button key={k} className={'btn mbtn ' + (meas[k] ? 'sel' : '')} onClick={() => toggleMeas(k)}>
                  <span className="pic">{ic}</span>
                  <span className="pnm">
                    <R t={nm} />
                  </span>
                </button>
              ))}
            </div>
          )}

          {stageName === 'spring' && (
            <>
              <div className="ctl">
                <button className="btn rainb" onClick={dig} disabled={stats.wellState === 'digging'}>
                  <R t="⛏ ほる" />
                </button>
                <label className="slab">
                  <span aria-hidden="true">↔</span>
                  <input type="range" min="0" max="1" step="0.01" value={wellPos} onChange={(e) => onWellPos(parseFloat(e.target.value))} aria-label="井戸の いち" />
                </label>
              </div>
              {stats.wellState === 'digging' && <p className="wmsg dg">ほってるよ… ⛏</p>}
              {stats.wellState === 'water' && <p className="wmsg ok">みずが でたよ! 💧</p>}
              {stats.wellState === 'dry' && (
                <p className="wmsg">
                  <R t="からっぽだった…。あめを ふらせて、みずが たまる ところに {井戸|いど}を ほろう。" />
                </p>
              )}
            </>
          )}

          {goal && (
            awake ? (
              <button className="btn go big" onClick={() => setPhase('quiz')}>
                もんだいに もどる ▶
              </button>
            ) : (
              <button className="btn go big" onClick={wakeToQuiz}>
                👆 かたを トントン して おこす
              </button>
            )
          )}
        </div>
      );
    } else if (phase === 'quiz') {
      panel = (
        <div className="panel">
          {bubble(st.quiz.q)}
          <div className="choices">
            {st.quiz.choices.map((c, i) => (
              <button key={i} className="btn choice" onClick={() => pickChoice(i)}>
                <R t={c} />
              </button>
            ))}
          </div>
        </div>
      );
    } else if (phase === 'wrong') {
      panel = (
        <div className="panel">
          {bubble('うーん、おしい! もういちど よく みてみよう。')}
          <button className="btn pri big" onClick={retryPlay}>もういちど みる</button>
        </div>
      );
    } else if (phase === 'explain') {
      panel = (
        <div className="panel">
          {bubble('せいかいだねぇ! ' + st.quiz.explain)}
          <div className="badge on got">
            💧 しずくバッジ ゲット! <R t={stageTitle} />
          </div>
          <button className="btn pri big" onClick={nextStage}>
            {si + 1 < PLANS[plan].stages.length ? 'つぎの ステージへ ▶' : 'おわり ▶'}
          </button>
        </div>
      );
    }
  }

  return (
    <div className="app">
      <div className="hud">
        <a className="hbtn labl" href={LAB_URL} aria-label="ラボいちらんに もどる">
          ← 🔬 ラボ一覧
        </a>
        <div className="hsp" />
        {screen !== 'title' && (
          <button className="hbtn icon" onClick={toTitle} aria-label="タイトルがめんに もどる">
            <HomeIcon />
          </button>
        )}
        <button className="hbtn icon" onClick={toggleMute} aria-label={muted ? 'おとを ならす' : 'おとを けす'}>
          <SoundIcon off={muted} />
        </button>
        {screen === 'game' && (
          <button className="hbtn icon" onClick={() => setShowHelp(!showHelp)} aria-label="せつめい">
            ?
          </button>
        )}
      </div>
      {showHelp && screen === 'game' && (
        <div className="help" onClick={() => setShowHelp(false)}>
          <p>
            <R t="ゆびで よこに なぞると、ジオラマが まわるよ。{雨|あめ}は {地面|じめん}に しみこんだり、ながれたりするよ。(かんたんな もけい)" />
          </p>
          <p className="tapc">とじる</p>
        </div>
      )}
      <div className="stagebox"><div ref={holder} style={{position:'absolute',inset:0}} />{screen === 'title' && !engineReady && !graphicsError && <div aria-hidden="true" style={{display:'grid',placeItems:'center',height:'100%',fontSize:'72px',pointerEvents:'none'}}>🦙💧</div>}</div>
      {panel}
    </div>
  );
}
