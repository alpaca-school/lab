// WebAudioだけで作る効果音(外部音源なし・ライセンス不要)
let ac = null;
let muted = false;
let rainGain = null;
let snoreGain = null;
let snoreTimer = null;
let snoreOn = false;

export function initAudio() {
  if (ac) {
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    // 雨: ノイズ → バンドパス → ゲイン
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.6;
    rainGain = ac.createGain();
    rainGain.gain.value = 0;
    src.connect(bp).connect(rainGain).connect(ac.destination);
    src.start();
    // いびき: 低いのこぎり波
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 62;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    snoreGain = ac.createGain();
    snoreGain.gain.value = 0;
    osc.connect(lp).connect(snoreGain).connect(ac.destination);
    osc.start();
  } catch (e) {
    ac = null;
  }
}

export function setMuted(m) {
  muted = m;
  if (rainGain) rainGain.gain.setTargetAtTime(0, ac.currentTime, 0.05);
  if (m) setSnore(false);
}
export function isMuted() {
  return muted;
}

export function setRain(on) {
  if (!ac || !rainGain) return;
  rainGain.gain.setTargetAtTime(on && !muted ? 0.09 : 0, ac.currentTime, 0.12);
}

function snoreBeat() {
  if (!ac || !snoreGain || !snoreOn || muted) return;
  const t = ac.currentTime;
  snoreGain.gain.cancelScheduledValues(t);
  snoreGain.gain.setValueAtTime(0.0001, t);
  snoreGain.gain.linearRampToValueAtTime(0.06, t + 0.8);
  snoreGain.gain.linearRampToValueAtTime(0.0001, t + 1.7);
}
export function setSnore(on) {
  snoreOn = on;
  if (snoreTimer) {
    clearInterval(snoreTimer);
    snoreTimer = null;
  }
  if (!ac || !snoreGain) return;
  snoreGain.gain.cancelScheduledValues(ac.currentTime);
  snoreGain.gain.setTargetAtTime(0, ac.currentTime, 0.05);
  if (on && !muted) {
    snoreBeat();
    snoreTimer = setInterval(snoreBeat, 2200);
  }
}

function tone(freq, start, dur, type = 'sine', vol = 0.18) {
  if (!ac || muted) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ac.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function chime() {
  tone(660, 0, 0.25);
  tone(880, 0.12, 0.25);
  tone(1320, 0.24, 0.45);
}
export function pop() {
  tone(520, 0, 0.12, 'triangle', 0.14);
}
export function bad() {
  tone(300, 0, 0.18, 'triangle', 0.14);
  tone(240, 0.14, 0.25, 'triangle', 0.14);
}
export function splash() {
  tone(900, 0, 0.1, 'sine', 0.08);
  tone(1250, 0.07, 0.12, 'sine', 0.07);
}
export function wake() {
  tone(400, 0, 0.1, 'square', 0.1);
  tone(700, 0.08, 0.18, 'square', 0.1);
}

export function dig() {
  tone(150, 0, 0.12, 'triangle', 0.2);
  tone(95, 0.03, 0.14, 'sine', 0.18);
}
