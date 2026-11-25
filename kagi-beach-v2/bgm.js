/* カーギーと未来のビーチ 共通BGM (v1.1)
 * Web Audio API だけで三線風の琉球音階BGMを合成する。外部音源なし。
 * 地図(index.html)とビーチ(beach.html)で共有し、ミュート設定は localStorage に保存する。
 * 公開API: window.KagiBgm
 */
(function () {
  "use strict";

  var MUTE_KEY = "kagi-mirai-beach-muted";
  var AC = window.AudioContext || window.webkitAudioContext;
  var SCALE = [0, 4, 5, 7, 11]; // 琉球音階 ド・ミ・ファ・ソ・シ

  // 場面ごとの設定。pat は琉球音階の度数(0-4 が基準オクターブ、5以上は1オクターブ上、-1 は休符)
  var SCENES = {
    map: {
      root: 60, bpm: 84, wave: 0, bright: 1,
      pat: [2, -1, 3, 4, 3, -1, 2, 0, 1, -1, 2, 3, 2, -1, -1, -1,
            4, -1, 5, 4, 3, -1, 2, 3, 1, -1, 0, 1, 0, -1, -1, -1]
    },
    title: {
      root: 57, bpm: 78, wave: 0.02, bright: 0.9,
      pat: [0, -1, 2, -1, 3, -1, 4, -1, 3, -1, 2, -1, 1, -1, 0, -1,
            2, -1, 3, -1, 4, -1, 5, -1, 4, -1, 3, -1, 2, -1, -1, -1]
    },
    stage0: { // 残波ビーチ: 明るく軽快
      root: 62, bpm: 96, wave: 0.05, bright: 1.15,
      pat: [0, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 7, 6, 5, 4, -1,
            5, 4, 3, 4, 2, 3, 4, 2, 3, 2, 1, 2, 0, -1, 0, -1]
    },
    stage1: { // 慶佐次川: ゆったり・音数少なめ
      root: 55, bpm: 76, wave: 0.035, bright: 0.85,
      pat: [4, -1, -1, 3, 2, -1, 0, -1, 1, -1, 2, -1, 3, -1, -1, -1,
            2, -1, -1, 1, 0, -1, 2, -1, 3, -1, 2, -1, 0, -1, -1, -1]
    },
    stage2: { // 波の上ビーチ: はずむ感じ
      root: 64, bpm: 100, wave: 0.055, bright: 1.1,
      pat: [0, -1, 2, 3, 4, -1, 3, 2, 4, -1, 5, 6, 5, -1, 4, -1,
            3, 4, 3, 2, 1, -1, 2, 3, 4, 3, 2, 1, 0, -1, -1, -1]
    },
    ending: { // エンディング: ゆっくり上って降りる
      root: 60, bpm: 66, wave: 0.03, bright: 0.95,
      pat: [0, -1, -1, 2, -1, -1, 3, -1, 4, -1, -1, 5, -1, -1, 6, -1,
            7, -1, 6, -1, 5, -1, 4, -1, 3, -1, 2, -1, 0, -1, -1, -1]
    }
  };

  var ctx = null, master = null, musicBus = null, delayIn = null, analyser = null;
  var waveGain = null, waveNode = null;
  var timer = null, nextTime = 0, step = 0;
  var sceneName = null, scene = SCENES.map;
  var muted = readMuted();
  var gestureDone = false, wantPlay = true, hidden = false;
  var noiseBuf = null;

  function readMuted() {
    try { return localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { return false; }
  }
  function writeMuted(v) {
    try { localStorage.setItem(MUTE_KEY, v ? "1" : "0"); } catch (e) {}
  }

  function stageFromUrl() {
    try {
      var raw = new URLSearchParams(location.search).get("stage");
      if (raw !== null && /^[0-5]$/.test(raw)) return Number(raw);
    } catch (e) {}
    return null;
  }

  function defaultScene() {
    var isBeach = /beach\.html$/.test(location.pathname);
    if (!isBeach) return "map";
    var st = stageFromUrl();
    return st === null ? "title" : "stage" + (st % 3);
  }

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function makeNoise() {
    var len = Math.floor(ctx.sampleRate * 2);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function ensureContext() {
    if (ctx || !AC) return !!ctx;
    try {
      ctx = new AC();
    } catch (e) { ctx = null; return false; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    master.connect(analyser);
    master.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(master);

    // ゆるい残響(フィードバックディレイ)
    delayIn = ctx.createGain();
    delayIn.gain.value = 0.22;
    var dl = ctx.createDelay(1);
    dl.delayTime.value = 0.27;
    var fb = ctx.createGain();
    fb.gain.value = 0.32;
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    delayIn.connect(dl);
    dl.connect(lp);
    lp.connect(fb);
    fb.connect(dl);
    lp.connect(musicBus);

    noiseBuf = makeNoise();
    return true;
  }

  // 波の音(ごく小さく): ローパスをかけたノイズをゆっくり揺らす
  function startWave() {
    if (waveNode || !ctx) return;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 650;
    waveGain = ctx.createGain();
    waveGain.gain.value = 0;
    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.35;
    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);
    src.connect(f);
    f.connect(waveGain);
    waveGain.connect(musicBus);
    src.start();
    lfo.start();
    waveNode = src;
    applyWave();
  }

  function applyWave() {
    if (!waveGain || !ctx) return;
    try { waveGain.gain.setTargetAtTime(scene.wave || 0, ctx.currentTime, 0.8); } catch (e) {}
  }

  // 三線風の撥弦音
  function pluck(freq, t, dur, vel, low) {
    var o1 = ctx.createOscillator();
    var o2 = ctx.createOscillator();
    o1.type = low ? "triangle" : "sawtooth";
    o2.type = "triangle";
    o1.frequency.setValueAtTime(freq * 1.012, t);
    o1.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
    o2.frequency.setValueAtTime(freq * 2.003, t);

    var filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    var top = Math.min(freq * (low ? 3 : 7) * scene.bright, 7000);
    filt.frequency.setValueAtTime(top, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.4, 220), t + Math.min(dur, 0.5));
    filt.Q.value = 0.8;

    var g = ctx.createGain();
    var peak = vel * (low ? 0.34 : 0.26);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    var g2 = ctx.createGain();
    g2.gain.value = 0.28;
    o1.connect(filt);
    o2.connect(g2);
    g2.connect(filt);
    filt.connect(g);
    g.connect(musicBus);
    if (!low) g.connect(delayIn);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);

    if (!low && noiseBuf) { // 撥(ばち)が当たるカツッという音
      var n = ctx.createBufferSource();
      n.buffer = noiseBuf;
      var bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2200;
      bp.Q.value = 1.2;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(vel * 0.1, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      n.connect(bp);
      bp.connect(ng);
      ng.connect(musicBus);
      n.start(t, Math.random());
      n.stop(t + 0.05);
    }
  }

  function degToMidi(deg) {
    var oct = Math.floor(deg / 5);
    return scene.root + SCALE[((deg % 5) + 5) % 5] + 12 * oct;
  }

  function scheduleStep(t, idx) {
    var beat = 60 / scene.bpm / 2; // 8分音符
    var s = idx % scene.pat.length;
    var deg = scene.pat[s];
    if (deg >= 0) {
      // たまに装飾音(三線のはじき)
      if (s % 8 === 0 && deg > 0 && (idx >> 5) % 2 === 1) {
        pluck(mtof(degToMidi(deg - 1)), t - 0.07, 0.25, 0.5, false);
      }
      pluck(mtof(degToMidi(deg)), t, beat * (s % 4 === 3 ? 3.2 : 4.5), s % 4 === 0 ? 1 : 0.8, false);
    }
    // 低音: 小節の頭と中ほどにルート/ソ
    if (s % 16 === 0) pluck(mtof(scene.root - 12), t, beat * 7, 0.9, true);
    if (s % 16 === 8) pluck(mtof(scene.root - 12 + 7), t, beat * 6, 0.7, true);
  }

  function tick() {
    if (!ctx || ctx.state !== "running") return;
    var beat = 60 / scene.bpm / 2;
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.35) {
      scheduleStep(nextTime, step);
      nextTime += beat;
      step++;
    }
  }

  function startLoop() {
    if (timer || !ctx) return;
    nextTime = ctx.currentTime + 0.08;
    timer = setInterval(tick, 90);
    startWave();
  }

  function stopLoop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function begin() {
    if (!AC || muted || hidden) return;
    if (!ensureContext()) return;
    var p;
    try { p = ctx.resume(); } catch (e) {}
    var go = function () {
      if (ctx && ctx.state === "running") {
        gestureDone = true;
        removeGestureListeners();
        if (!muted && !hidden) startLoop();
      }
    };
    if (p && p.then) p.then(go, function () {}); else go();
  }

  var GESTURES = ["pointerdown", "touchend", "click", "keydown"];
  function onGesture() { begin(); }
  function addGestureListeners() {
    for (var i = 0; i < GESTURES.length; i++) {
      document.addEventListener(GESTURES[i], onGesture, true);
    }
  }
  function removeGestureListeners() {
    for (var i = 0; i < GESTURES.length; i++) {
      document.removeEventListener(GESTURES[i], onGesture, true);
    }
  }

  function setScene(name) {
    if (!SCENES[name] || name === sceneName) return;
    sceneName = name;
    scene = SCENES[name];
    step = 0;
    if (ctx) {
      nextTime = ctx.currentTime + 0.1;
      applyWave();
    }
  }

  // beach.html の画面状態("title"/"play"/"ending"/…)から場面を決める
  function setScreen(screen) {
    if (screen === "ending" || screen === "truth") return setScene("ending");
    if (screen === "play") {
      var st = stageFromUrl();
      return setScene(st === null ? "stage0" : "stage" + (st % 3));
    }
    return setScene(defaultScene());
  }

  function setMuted(v) {
    muted = !!v;
    writeMuted(muted);
    if (master && ctx) {
      try { master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05); } catch (e) { master.gain.value = muted ? 0 : 1; }
    }
    if (muted) {
      stopLoop();
    } else {
      begin();
    }
    try { window.dispatchEvent(new CustomEvent("kagi-bgm-mute", { detail: muted })); } catch (e) {}
  }

  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (!ctx) return;
    if (hidden) {
      stopLoop();
      try { ctx.suspend(); } catch (e) {}
    } else if (gestureDone && !muted) {
      begin();
    }
  });

  window.addEventListener("storage", function (e) {
    if (e.key === MUTE_KEY) setMuted(e.newValue === "1");
  });

  sceneName = defaultScene();
  scene = SCENES[sceneName];
  addGestureListeners();
  // 自動再生が許される環境ではそのまま開始する(許されなければ最初のタップで開始)
  setTimeout(begin, 0);

  window.KagiBgm = {
    start: begin,
    setScene: setScene,
    setScreen: setScreen,
    setMuted: setMuted,
    isMuted: function () { return muted; },
    toggle: function () { setMuted(!muted); return muted; },
    isPlaying: function () { return !!(ctx && ctx.state === "running" && timer); },
    scene: function () { return sceneName; },
    level: function () { // 動作確認用: 現在の出力レベル(0〜1)
      if (!analyser) return 0;
      var a = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(a);
      var s = 0;
      for (var i = 0; i < a.length; i++) s += a[i] * a[i];
      return Math.sqrt(s / a.length);
    }
  };
})();
