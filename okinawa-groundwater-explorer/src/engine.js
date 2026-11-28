import * as THREE from 'three';
import * as audio from './audio.js';

// ===== 断面ジオラマのモデル(かんたんな もけい) =====
export const W = 24; // 横のマス数
export const H = 20; // 空気4行 + 地面16行
export const SURF = 4; // 地面の はじまる行
const G = H - SURF;
const CELL = 0.4;
const DEPTH = 3;
const S = 20; // 1マスのピクセル数

const T = { AIR: 0, LIME: 1, RED: 2, MUD: 3, CAVE: 4, SEA: 5, WALL: 6 };
// しみこむ はやさ(マス/秒の もと): 石灰岩 > 赤土 > 泥岩
const PERM = [0, 3.4, 0.75, 0.12, 4.2, 0, 0];
const COL = ['#d6efff', '#eadfbf', '#b4502e', '#6d7479', '#231a2a', '#2f86d4', '#bdb7a8'];
// つぶの いろ: 0 あめ / 1 あかつち / 2 こうじょう / 3 ひりょう / 4 まち / 5 まみず(うみ)
const PCOL = [0x3aa0ff, 0x8a5a32, 0x5a3f6e, 0xb6d43a, 0x9aa0a6, 0xbfeaff];
const MAXP = 520;

function mulberry(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function textSprite(text, color, bg) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg;
  x.beginPath();
  x.arc(64, 64, 56, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = color;
  x.font = 'bold 64px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(0.8, 0.8, 1);
  sp.renderOrder = 10;
  return sp;
}

// ===== ガンジュー(アルパカ) =====
function buildGanjuu() {
  const root = new THREE.Group();
  const wool = new THREE.MeshStandardMaterial({ color: 0xd8dcde, roughness: 1 });
  const woolShade = new THREE.MeshStandardMaterial({ color: 0xbfc4c8, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3b3538, roughness: 0.6 });
  const nose = new THREE.MeshStandardMaterial({ color: 0x8c7f82, roughness: 0.8 });
  const inner = new THREE.MeshStandardMaterial({ color: 0xe4b8b4, roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 18), wool);
  body.scale.set(1, 0.85, 1.25);
  body.position.y = 1.15;
  root.add(body);
  // ふわふわの毛玉
  const puffs = [
    [-0.35, 1.6, -0.2, 0.32], [0.38, 1.55, 0.1, 0.3], [0, 1.72, -0.5, 0.34],
    [-0.45, 1.15, 0.35, 0.3], [0.45, 1.1, -0.35, 0.3], [0, 1.65, 0.3, 0.3],
  ];
  puffs.forEach(([x, y, z, r]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), wool);
    m.position.set(x, y, z);
    root.add(m);
  });
  // あし
  [[-0.3, 0.5], [0.3, 0.5], [-0.3, -0.5], [0.3, -0.5]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.75, 10), woolShade);
    leg.position.set(x, 0.4, z);
    root.add(leg);
    const hoof = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), dark);
    hoof.scale.set(1, 0.6, 1.2);
    hoof.position.set(x, 0.04, z + 0.02);
    root.add(hoof);
  });
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), wool);
  tail.position.set(0, 1.35, -0.85);
  root.add(tail);

  // くび・あたま
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, 1.4, 0.62);
  root.add(neckPivot);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 0.78, 14), wool);
  neck.position.y = 0.38;
  neckPivot.add(neck);
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.82, 0);
  neckPivot.add(headPivot);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), wool);
  head.scale.set(1.0, 1.0, 1.05);
  headPivot.add(head);
  const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), wool);
  tuft.position.set(0, 0.26, -0.02);
  headPivot.add(tuft);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), nose);
  snout.scale.set(1, 0.85, 1);
  snout.position.set(0, -0.1, 0.33);
  headPivot.add(snout);
  const nostrils = [-0.06, 0.06].map((x) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), dark);
    n.position.set(x, -0.06, 0.49);
    headPivot.add(n);
    return n;
  });
  void nostrils;
  [-0.19, 0.19].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 10), wool);
    ear.position.set(x, 0.5, -0.02);
    ear.rotation.z = x < 0 ? 0.35 : -0.35;
    headPivot.add(ear);
    const ei = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 8), inner);
    ei.position.set(x * 1.02, 0.48, 0.03);
    ei.rotation.z = x < 0 ? 0.35 : -0.35;
    headPivot.add(ei);
  });
  const eyes = [-0.15, 0.15].map((x) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), dark);
    e.position.set(x, 0.08, 0.3);
    headPivot.add(e);
    return e;
  });
  // ほっぺ
  [-0.2, 0.2].forEach((x) => {
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), inner);
    ch.scale.set(1.2, 0.7, 0.4);
    ch.position.set(x, -0.04, 0.3);
    headPivot.add(ch);
  });

  const zzz = textSprite('Zzz', '#ffffff', 'rgba(70,90,170,0.9)');
  zzz.position.set(-0.75, 3.0, 0.6);
  zzz.visible = false;
  root.add(zzz);
  const exm = textSprite('!', '#ffffff', 'rgba(240,90,60,0.95)');
  exm.position.set(-0.75, 3.0, 0.6);
  exm.visible = false;
  root.add(exm);

  root.rotation.y = -0.35;
  return { root, body, neckPivot, eyes, zzz, exm };
}

// ===== エンジン本体 =====
export function createEngine(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const el = renderer.domElement;
  el.style.display = 'block';
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.touchAction = 'pan-y';
  container.appendChild(el);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb4c8, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 10, 9);
  scene.add(sun);

  const block = new THREE.Group();
  scene.add(block);

  // --- テクスチャ(前面・上面・左右) ---
  const fc = document.createElement('canvas');
  fc.width = W * S;
  fc.height = G * S;
  const fx = fc.getContext('2d');
  const ftex = new THREE.CanvasTexture(fc);
  ftex.colorSpace = THREE.SRGBColorSpace;
  const tc = document.createElement('canvas');
  tc.width = W * 8;
  tc.height = 64;
  const tx = tc.getContext('2d');
  const ttex = new THREE.CanvasTexture(tc);
  ttex.colorSpace = THREE.SRGBColorSpace;
  const mkSide = () => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = G * 8;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { c, x: c.getContext('2d'), t };
  };
  const sideL = mkSide();
  const sideR = mkSide();
  const plain = new THREE.MeshStandardMaterial({ color: 0x7b6a55 });
  const mats = [
    new THREE.MeshStandardMaterial({ map: sideR.t }),
    new THREE.MeshStandardMaterial({ map: sideL.t }),
    new THREE.MeshStandardMaterial({ map: ttex }),
    plain,
    new THREE.MeshBasicMaterial({ map: ftex }),
    plain,
  ];
  const box = new THREE.Mesh(new THREE.BoxGeometry(W * CELL, G * CELL, DEPTH), mats);
  block.add(box);

  // 地面のふち(土台)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(W * CELL + 0.5, 0.25, DEPTH + 0.5),
    new THREE.MeshStandardMaterial({ color: 0x5b4a3a, roughness: 1 })
  );
  base.position.y = -G * CELL / 2 - 0.12;
  block.add(base);

  // --- 雨つぶ ---
  const pGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pcols = PCOL.map((c) => new THREE.Color(c));
  const pMesh = new THREE.InstancedMesh(pGeo, pMat, MAXP);
  pMesh.frustumCulled = false;
  pMesh.count = 0;
  block.add(pMesh);
  const dummy = new THREE.Object3D();

  // --- 土しぶき・水しぶき ---
  const MAXD = 90;
  const dMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }), MAXD);
  dMesh.frustumCulled = false;
  dMesh.count = 0;
  block.add(dMesh);
  const dirt = [];
  const cBrown = new THREE.Color(0x7a4e2a);
  const cBlue = new THREE.Color(0x4ab0ff);

  // --- くも ---
  const cloud = new THREE.Group();
  const cm = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [[0, 0, 0, 0.55], [-0.6, -0.1, 0, 0.42], [0.62, -0.08, 0, 0.45], [0.25, 0.28, 0.05, 0.4], [-0.3, 0.25, 0, 0.35]].forEach(([x, y, z, r]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), cm);
    m.position.set(x, y, z);
    cloud.add(m);
  });
  cloud.position.set(0, ((SURF + G / 2) + 2.4) * CELL, 0.4);
  block.add(cloud);

  // --- ガンジュー ---
  const gj = buildGanjuu();
  const GJ_BASE_Y = G * CELL / 2;
  gj.root.position.set(3.2, GJ_BASE_Y, 0.8);
  gj.root.scale.setScalar(1.25);
  block.add(gj.root);

  // --- ゲームのじょうたい ---
  let stage = 'title';
  let g = [];
  let wet = [];
  let openAt = [];
  let parts = [];
  let flowDir = 1;
  let rainOn = false;
  let manualRain = false;
  let sleeping = false;
  let cloudX = W / 2;
  let acc = 0;
  let well = null;
  let preview = null;
  let years = 0;
  let gstate = 'idle';
  let gtime = 0;
  let yawTarget = 0.12;
  let yaw = 0.12;
  let dragging = false;
  let lastRainAudio = false;
  const rnd = mulberry(11);
  const spk = [];
  for (let y = 0; y < H; y++) {
    spk[y] = [];
    for (let x = 0; x < W; x++) {
      spk[y][x] = [0, 1, 2].map(() => ({ dx: rnd() * (S - 3), dy: rnd() * (S - 3), r: 1.5 + rnd() * 2.5, l: rnd() }));
    }
  }
  // --- あたらしい ステージ用 ---
  let seaX = W; // これより みぎは うみ
  let seaTop = SURF + 1; // うみの みずの うえの ぎょう
  let poolRow = null;
  let springRow = 9;
  let surf = null; // 赤土ステージの じめんの たかさ
  let tide = 0;
  let tideT = 0;
  let fresh = 0;
  let wall = null;
  let wpreview = null;
  let store = 0;
  let nitrAcc = 0;
  let storedAll = 0;
  let droughtT = 0;
  let cropG = 1;
  let fert = false;
  let meas = { green: false, pond: false, grade: false };
  let turb = 0;
  let coral = 1;
  let pondFill = 0;
  let slots = [0, 0, 0, 0, 0, 0];
  let selSlot = 0;
  let mq = { land: 0, infil: 0, clean: 0 };
  const slotGroups = [];
  const cGray = new THREE.Color(0xbdb7a8);
  const base0 = () => ({ stage, rained: 0, zoneRain: [0, 0, 0], maxDepth: [0, 0, 0], runoff: 0, spring: 0, years: 0, wellOk: 0, wellTry: 0, wellDry: false, wellState: 'none', rainOn: false, fresh: 0, maxFresh: 0, tide: 0, store: 0, wallState: 'none', droughtOk: 0, droughtFail: 0, drought: false, crop: 1, nitrate: 0, turb: 0, coral: 1, nMeas: 0, mLand: 0, mQty: 0, mQual: 1, slots: [0, 0, 0, 0, 0, 0], selSlot: 0 });
  const stats = base0();

  // --- かざり(木・いえ・はたけ) ---
  const deco = new THREE.Group();
  block.add(deco);
  const TOP = (G * CELL) / 2;
  const gx = (x) => (x + 0.5 - W / 2) * CELL;
  const mTrunk = new THREE.MeshStandardMaterial({ color: 0x7a5230 });
  const mLeaf = new THREE.MeshStandardMaterial({ color: 0x3f9a45 });
  const mWallW = new THREE.MeshStandardMaterial({ color: 0xfaf3e3 });
  const mRoof = new THREE.MeshStandardMaterial({ color: 0xd9552f });
  const mFact = new THREE.MeshStandardMaterial({ color: 0x8d9298 });
  const mCrop = new THREE.MeshStandardMaterial({ color: 0x5bb04a });
  const mCress = new THREE.MeshStandardMaterial({ color: 0x4fae55 });
  const mStone = new THREE.MeshStandardMaterial({ color: 0xa9a49a });
  const gTrunk = new THREE.CylinderGeometry(0.035, 0.05, 0.22, 6);
  const gLeaf = new THREE.ConeGeometry(0.2, 0.5, 7);
  const gHouse = new THREE.BoxGeometry(0.42, 0.28, 0.38);
  const gRoof = new THREE.ConeGeometry(0.36, 0.22, 4);
  const gFact = new THREE.BoxGeometry(0.8, 0.36, 0.5);
  const gChim = new THREE.CylinderGeometry(0.06, 0.07, 0.55, 8);
  const gStalk = new THREE.BoxGeometry(0.045, 0.42, 0.045);
  const gCress = new THREE.BoxGeometry(0.34, 0.05, 0.4);
  const gStone = new THREE.BoxGeometry(0.28, 0.18, 0.28);
  const mk = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  };
  function mkTree(x, z, sc = 1) {
    const g0 = new THREE.Group();
    g0.add(mk(gTrunk, mTrunk, 0, 0.11, 0));
    g0.add(mk(gLeaf, mLeaf, 0, 0.45, 0));
    g0.scale.setScalar(sc);
    g0.position.set(x, TOP, z);
    return g0;
  }
  function mkHouse(x, z) {
    const g0 = new THREE.Group();
    g0.add(mk(gHouse, mWallW, 0, 0.14, 0));
    const r = mk(gRoof, mRoof, 0, 0.39, 0);
    r.rotation.y = Math.PI / 4;
    g0.add(r);
    g0.position.set(x, TOP, z);
    return g0;
  }
  function mkFactory(x, z) {
    const g0 = new THREE.Group();
    g0.add(mk(gFact, mFact, 0, 0.18, 0));
    g0.add(mk(gChim, mFact, 0.22, 0.45, 0));
    g0.position.set(x, TOP, z);
    return g0;
  }
  function mkField(x, z, mat = mCrop) {
    const g0 = new THREE.Group();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g0.add(mk(gStalk, mat, (i - 1) * 0.16, 0.21, (j - 0.5) * 0.5));
    g0.position.set(x, TOP, z);
    return g0;
  }
  const crane = new THREE.Group();
  crane.add(mk(new THREE.BoxGeometry(0.07, 1.3, 0.07), new THREE.MeshStandardMaterial({ color: 0xf2b630 }), 0, 0.65, 0));
  crane.add(mk(new THREE.BoxGeometry(0.7, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xf2b630 }), 0.3, 1.28, 0));
  crane.add(mk(new THREE.BoxGeometry(0.05, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: 0x555555 }), 0.55, 1.1, 0));
  crane.visible = false;
  block.add(crane);
  const sunSp = textSprite('☀', '#ff8a00', 'rgba(255,238,140,0.95)');
  sunSp.scale.set(1.2, 1.2, 1);
  sunSp.position.set(-3.9, TOP + 1.7, 0.6);
  sunSp.visible = false;
  block.add(sunSp);
  const selMark = new THREE.Mesh(
    new THREE.BoxGeometry(3 * CELL - 0.06, 0.05, DEPTH + 0.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  selMark.visible = false;
  block.add(selMark);

  function clearDeco() {
    while (deco.children.length) deco.remove(deco.children[0]);
    slotGroups.length = 0;
  }
  function buildDeco(name) {
    clearDeco();
    const zr = (i) => ((i * 37) % 7) / 7 * 1.6 - 0.8;
    if (name === 'shiokawa') {
      [1, 3, 6, 9, 12].forEach((x, i) => deco.add(mkTree(gx(x), zr(i + 2), 1)));
      deco.add(mkHouse(gx(15), 0.2));
    } else if (name === 'kakinohana') {
      [0, 1, 2, 3, 4, 5].forEach((x, i) => deco.add(mkTree(gx(x), zr(i), 1.1)));
      [8, 10, 12].forEach((x, i) => deco.add(mkHouse(gx(x), zr(i + 3) * 0.7)));
      const st = new THREE.Group();
      st.add(mk(gStone, mStone, 0, 0.09, 0));
      st.add(mk(new THREE.BoxGeometry(0.12, 0.12, 0.12), mStone, 0, 0.24, 0));
      st.position.set(gx(15.5), TOP, 0.3);
      deco.add(st);
      [19, 20, 21, 22, 23].forEach((x, i) => {
        deco.add(mk(gCress, mCress, gx(x), TOP + 0.03, -0.5 + (i % 2) * 0.9));
        deco.add(mk(gCress, mCress, gx(x), TOP + 0.03, 0.4 - (i % 2) * 0.5));
      });
    } else if (name === 'dam') {
      for (let x = 1; x <= 16; x += 2) deco.add(mkField(gx(x), 0, mCrop));
      [0, 17].forEach((x, i) => deco.add(mkTree(gx(x), zr(i + 1), 0.9)));
    } else if (name === 'mirai') {
      for (let i = 0; i < 6; i++) {
        const sg = new THREE.Group();
        sg.position.set(gx(i * 3 + 1), 0, 0);
        deco.add(sg);
        slotGroups.push(sg);
      }
      slots.forEach((_, i) => fillSlot(i, false));
    }
  }
  function fillSlot(i, pop) {
    const sg = slotGroups[i];
    if (!sg) return;
    while (sg.children.length) sg.remove(sg.children[0]);
    const t = slots[i];
    if (t === 0) {
      [-0.4, 0.4].forEach((dx, k) => sg.add(mk(new THREE.BoxGeometry(0.2, 0.04, 0.2), mCress, dx, TOP + 0.02, -0.4 + k * 0.8)));
    } else if (t === 1) {
      [[-0.35, -0.5], [0.3, 0.4], [0, -0.1], [-0.2, 0.7], [0.4, -0.7]].forEach(([dx, dz], k) => {
        const tr = mkTree(dx, dz, 0.9 + (k % 2) * 0.25);
        sg.add(tr);
      });
    } else if (t === 2) {
      [-0.35, 0.35].forEach((dx) => {
        const f = mkField(dx, 0, mCrop);
        f.scale.setScalar(0.85);
        sg.add(f);
      });
    } else if (t === 3) {
      sg.add(mkHouse(-0.32, -0.3));
      sg.add(mkHouse(0.32, 0.4));
    } else if (t === 4) {
      sg.add(mkFactory(0, 0));
    }
    sg.userData.pop = pop ? 0 : 1;
    sg.scale.setScalar(pop ? 0.2 : 1);
  }

  function loadStage(name) {
    stage = name;
    g = Array.from({ length: H }, () => new Array(W).fill(T.AIR));
    wet = Array.from({ length: H }, () => new Array(W).fill(0));
    openAt = Array.from({ length: H }, () => new Array(W).fill(Infinity));
    parts = [];
    rainOn = false;
    manualRain = false;
    sleeping = false;
    well = null;
    preview = null;
    dirt.length = 0;
    years = 0;
    acc = 0;
    cloudX = W / 2;
    gstate = 'idle';
    flowDir = 1;
    seaX = W;
    seaTop = SURF + 1;
    poolRow = null;
    springRow = 9;
    surf = null;
    tide = 0;
    tideT = 0;
    fresh = 0;
    wall = null;
    wpreview = null;
    store = 0;
    nitrAcc = 0;
    storedAll = 0;
    droughtT = 0;
    cropG = 1;
    fert = false;
    meas = { green: false, pond: false, grade: false };
    turb = 0;
    coral = 1;
    pondFill = 0;
    slots = [0, 0, 0, 0, 0, 0];
    selSlot = 0;
    mq = { land: 0, infil: 0, clean: 0 };
    crane.visible = false;
    sunSp.visible = false;
    selMark.visible = false;
    cloud.visible = true;
    mCrop.color.setRGB(0.36, 0.69, 0.29);
    const coast = (limeRows) => {
      seaX = 18;
      for (let y = SURF; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (x < seaX) g[y][x] = y < SURF + limeRows ? T.LIME : T.MUD;
          else g[y][x] = y === SURF ? T.AIR : y < SURF + limeRows ? T.SEA : T.MUD;
        }
      }
    };
    if (name === 'shiokawa') {
      seaX = 18;
      poolRow = SURF + 4.5;
      for (let y = SURF; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = x < seaX ? T.LIME : y === SURF ? T.AIR : T.SEA;
    } else if (name === 'kakinohana') {
      flowDir = -1;
      springRow = 7;
      for (let y = SURF; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = y < SURF + 8 ? T.LIME : T.MUD;
    } else if (name === 'dam') {
      coast(10);
    } else if (name === 'mirai') {
      coast(10);
    } else if (name === 'akatsuchi') {
      seaX = 17;
      seaTop = SURF + 4;
      surf = [];
      for (let x = 0; x < W; x++) surf[x] = x < seaX ? SURF + Math.round(x * 0.22) : SURF + 4;
      for (let y = SURF; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (y >= H - 3) g[y][x] = T.MUD;
          else if (x >= seaX) g[y][x] = y < SURF + 4 ? T.AIR : T.SEA;
          else if (y < surf[x]) g[y][x] = T.AIR;
          else g[y][x] = y < surf[x] + 3 ? T.RED : T.LIME;
        }
      }
    } else if (name === 's1' || name === 'title') {
      for (let y = SURF; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = x < 8 ? T.LIME : x < 16 ? T.RED : T.MUD;
    } else if (name === 'spring') {
      flowDir = -1;
      for (let y = SURF; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = y < SURF + 10 ? T.LIME : T.MUD;
    } else if (name === 'tama') {
      for (let y = SURF; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = T.LIME;
      const cy = SURF + 8.5;
      for (let y = SURF; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const d = Math.hypot((x + 0.5 - W / 2) / 10, (y + 0.5 - cy) / 2.7);
          if (d <= 1) openAt[y][x] = d * 2500 + rnd() * 350;
        }
      }
    }
    Object.assign(stats, base0(), { stage: name });
    gj.root.position.x = seaX < W ? -3.7 : 3.2;
    buildDeco(name);
    if (name === 'mirai') {
      selMark.visible = true;
      selMark.position.set(gx(selSlot * 3 + 1), TOP + 0.03, 0);
      stats.selSlot = selSlot;
    }
    audio.setRain(false);
    audio.setSnore(false);
    drawTop();
  }

  function drawTop() {
    for (let x = 0; x < W; x++) {
      const c = g[SURF][x];
      tx.fillStyle = c === T.LIME ? '#a8cf8f' : c === T.RED ? '#b86a3e' : c === T.MUD ? '#7f8c88' : c === T.SEA ? '#2f86d4' : c === T.AIR && x >= seaX ? '#2f86d4' : c === T.WALL ? '#bdb7a8' : '#a8cf8f';
      tx.fillRect(x * 8, 0, 8, 64);
      tx.fillStyle = 'rgba(255,255,255,0.15)';
      tx.fillRect(x * 8 + 1, ((x * 7) % 56) + 2, 3, 3);
    }
    ttex.needsUpdate = true;
  }

  function drawSide(s, colX, isLeft) {
    const cx = s.x;
    for (let r = 0; r < G; r++) {
      cx.fillStyle = COL[g[SURF + r][colX]] || '#000';
      cx.fillRect(0, r * 8, 16, 8);
    }
    if (isLeft && (stage === 'spring' || stage === 'kakinohana') && stats.spring > 0) {
      cx.fillStyle = 'rgba(70,170,255,0.9)';
      cx.fillRect(0, springRow * 8 + 5, 16, 3);
    }
    s.t.needsUpdate = true;
  }

  function drawExtras() {
    const t = performance.now() / 1000;
    // うみ
    if (seaX < W) {
      const topPx = (seaTop - SURF) * S - (stage === 'shiokawa' ? tide * 0.85 * S : 0);
      const sx = seaX * S;
      const sw = (W - seaX) * S;
      if (stage === 'shiokawa' && tide > 0.01) {
        fx.fillStyle = COL[T.SEA];
        fx.fillRect(sx, topPx, sw, (seaTop - SURF) * S - topPx + 1);
      }
      if (stage === 'akatsuchi' && turb > 0.01) {
        fx.fillStyle = `rgba(150,92,48,${Math.min(0.62, turb * 0.7)})`;
        fx.fillRect(sx, topPx, sw, (H - 3 - SURF) * S - topPx);
      }
      fx.strokeStyle = 'rgba(255,255,255,0.75)';
      fx.lineWidth = 2;
      fx.beginPath();
      for (let i = 0; i <= sw; i += 4) {
        const yy = topPx + Math.sin(t * 2.2 + i * 0.06) * 2;
        if (i === 0) fx.moveTo(sx + i, yy);
        else fx.lineTo(sx + i, yy);
      }
      fx.stroke();
    }
    // 塩川: しおみずの くさび(かんたんな もけい)
    if (stage === 'shiokawa') {
      fx.fillStyle = 'rgba(30,150,170,0.38)';
      fx.beginPath();
      fx.moveTo(0, H * S);
      for (let x = 0; x <= seaX; x++) {
        const b = SURF + 5 + 7 * (1 - x / seaX);
        fx.lineTo(x * S, (b - SURF) * S);
      }
      fx.lineTo(seaX * S, (H - SURF) * S);
      fx.lineTo(0, (H - SURF) * S);
      fx.closePath();
      fx.fill();
      fx.fillStyle = 'rgba(255,255,255,0.9)';
      fx.font = 'bold 15px sans-serif';
      fx.textAlign = 'left';
      fx.textBaseline = 'middle';
      fx.fillText('しおみず', 8, (H - SURF - 1.6) * S);
      fx.fillStyle = 'rgba(40,110,60,0.9)';
      fx.fillText('まみず', 8, (SURF + 3 - SURF) * S);
    }
    // 地下ダム: ためた みず・かべ・ドリル
    if (stage === 'dam') {
      if (wall && store > 0.02) {
        const n = stats.nitrate;
        const r = Math.round(30 + 120 * n);
        const gg = Math.round(120 + 50 * n);
        const bb = Math.round(235 - 195 * n);
        fx.fillStyle = `rgba(${r},${gg},${bb},0.62)`;
        const topY = (10 - store) * S;
        fx.fillRect(0, topY, wall.x * S, store * S);
        fx.fillStyle = 'rgba(255,255,255,0.5)';
        fx.fillRect(0, topY, wall.x * S, 2);
      }
      if (wall && wall.state === 'building') {
        const tipY = wall.depth * S;
        const cxp = wall.x * S + S / 2;
        fx.fillStyle = '#ffd24a';
        fx.beginPath();
        fx.moveTo(cxp - 8, tipY);
        fx.lineTo(cxp + 8, tipY);
        fx.lineTo(cxp, tipY + 12);
        fx.closePath();
        fx.fill();
      }
      if (wpreview !== null && !(wall && wall.state === 'building')) {
        fx.fillStyle = 'rgba(255,255,255,0.28)';
        fx.fillRect(wpreview * S, 0, S, 10 * S);
        fx.strokeStyle = 'rgba(255,255,255,0.95)';
        fx.lineWidth = 2;
        fx.setLineDash([5, 4]);
        fx.strokeRect(wpreview * S + 1, 1, S - 2, 10 * S - 2);
        fx.setLineDash([]);
        fx.fillStyle = '#ffffff';
        fx.font = 'bold 18px sans-serif';
        fx.textAlign = 'center';
        fx.textBaseline = 'middle';
        fx.fillText('▼', wpreview * S + S / 2, 12);
      }
    }
    // 赤土: はたけ・たいさく・さんご
    if (stage === 'akatsuchi') {
      for (let x = 0; x < seaX; x++) {
        const top = (surf[x] - SURF) * S;
        fx.fillStyle = '#6cb04a';
        if (x % 2 === 0) fx.fillRect(x * S + 7, top - 7, 5, 7);
      }
      if (meas.grade) {
        fx.fillStyle = '#8e3b21';
        [1, 4, 7, 10].forEach((x) => fx.fillRect(x * S, (surf[x] - SURF) * S + 3, S * 2.4, 4));
      }
      if (meas.green) {
        for (let x = 12; x <= 14; x++) {
          const top = (surf[x] - SURF) * S;
          fx.fillStyle = '#2f8a3a';
          fx.fillRect(x * S + 1, top - 15, S - 2, 15);
          fx.fillStyle = '#58b552';
          fx.fillRect(x * S + 4, top - 19, 5, 6);
          fx.fillRect(x * S + 11, top - 17, 5, 5);
        }
      }
      if (meas.pond) {
        const top = (surf[15] - SURF) * S;
        fx.fillStyle = '#6b4a2e';
        fx.fillRect(15 * S, top, S * 2, S * 0.9);
        fx.fillStyle = `rgba(170,115,70,${0.6 + pondFill * 0.3})`;
        fx.fillRect(15 * S + 2, top + 3, S * 2 - 4, S * 0.9 - 5);
      }
      // さんご
      const base = (H - 3 - SURF) * S;
      const hc = coral;
      const cr = Math.round(207 + (255 - 207) * hc);
      const cg = Math.round(198 + (138 - 198) * hc);
      const cb = Math.round(184 + (166 - 184) * hc);
      for (let k = 0; k < 6; k++) {
        const cxp = (seaX + 0.5 + k * 1.0) * S;
        const hh = (0.9 + (k % 2) * 0.5) * S;
        fx.strokeStyle = `rgb(${cr},${cg},${cb})`;
        fx.lineWidth = 3;
        fx.beginPath();
        fx.moveTo(cxp, base);
        fx.lineTo(cxp, base - hh);
        fx.moveTo(cxp, base - hh * 0.5);
        fx.lineTo(cxp - 8, base - hh * 0.9);
        fx.moveTo(cxp, base - hh * 0.6);
        fx.lineTo(cxp + 8, base - hh);
        fx.stroke();
        fx.fillStyle = `rgb(${cr},${cg},${cb})`;
        fx.beginPath();
        fx.arc(cxp, base - hh, 3.5, 0, Math.PI * 2);
        fx.arc(cxp - 8, base - hh * 0.9, 3, 0, Math.PI * 2);
        fx.arc(cxp + 8, base - hh, 3, 0, Math.PI * 2);
        fx.fill();
      }
      if (coral > 0.55) {
        fx.font = '18px sans-serif';
        fx.textAlign = 'center';
        fx.textBaseline = 'middle';
        fx.fillText('🐟', (seaX + 2.5 + Math.sin(t * 0.8) * 1.6) * S, base - 2.4 * S + Math.sin(t * 2) * 4);
      }
    }
  }

  function drawFront() {
    fx.clearRect(0, 0, fc.width, fc.height);
    for (let y = SURF; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = g[y][x];
        const px = x * S;
        const py = (y - SURF) * S;
        fx.fillStyle = COL[c];
        fx.fillRect(px, py, S, S);
        if (c === T.WALL) {
          fx.fillStyle = 'rgba(0,0,0,0.12)';
          fx.fillRect(px + S / 2 - 1, py, 2, S);
          fx.fillStyle = 'rgba(255,255,255,0.35)';
          fx.fillRect(px + 2, py + 2, 3, S - 4);
        } else if (c === T.AIR || c === T.SEA) {
          /* いろだけ */
        } else if (c !== T.CAVE) {
          for (const k of spk[y][x]) {
            fx.fillStyle = k.l > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)';
            fx.fillRect(px + k.dx, py + k.dy, k.r, k.r);
          }
        } else {
          fx.fillStyle = 'rgba(120,90,160,0.18)';
          fx.fillRect(px + 2, py + 2, S - 4, S - 4);
        }
        const w = wet[y][x];
        if (w > 0.03 && c !== T.AIR && c !== T.SEA) {
          fx.fillStyle = `rgba(30,120,235,${Math.min(0.62, w * 0.62)})`;
          fx.fillRect(px, py, S, S);
        }
      }
    }
    drawExtras();
    // しょうにゅうどう(つらら石)
    if (stage === 'tama') {
      for (let y = SURF + 1; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (g[y][x] === T.CAVE && g[y - 1][x] === T.LIME) {
            const len = Math.min(0.85, Math.max(0, (years - openAt[y][x]) / 1700));
            if (len > 0.03) {
              const px = x * S + S / 2;
              const py = (y - SURF) * S;
              fx.fillStyle = '#efe6cf';
              fx.beginPath();
              fx.moveTo(px - 5, py);
              fx.lineTo(px + 5, py);
              fx.lineTo(px, py + len * S);
              fx.closePath();
              fx.fill();
            }
          }
        }
      }
    }
    if (preview !== null && !well) {
      fx.fillStyle = 'rgba(255,255,255,0.28)';
      fx.fillRect(preview * S, 0, S, 10 * S);
      fx.strokeStyle = 'rgba(255,255,255,0.95)';
      fx.lineWidth = 2;
      fx.setLineDash([5, 4]);
      fx.strokeRect(preview * S + 1, 1, S - 2, 10 * S - 2);
      fx.setLineDash([]);
      fx.fillStyle = '#ffffff';
      fx.font = 'bold 18px sans-serif';
      fx.textAlign = 'center';
      fx.textBaseline = 'middle';
      fx.fillText('▼', preview * S + S / 2, 12);
    }
    if (well) {
      const cxp = well.x * S + S / 2;
      const sw = 16;
      const px = cxp - sw / 2;
      const dep = well.depth * S;
      fx.fillStyle = '#2a1c12';
      fx.fillRect(px, 0, sw, dep);
      if (well.state === 'water') {
        const h = Math.min(dep, well.water * 3.2 * S);
        fx.fillStyle = 'rgba(70,170,255,0.96)';
        fx.fillRect(px + 1, dep - h, sw - 2, h);
      }
      fx.fillStyle = '#9a7648';
      fx.fillRect(px - 4, -1, sw + 8, 5);
      fx.textAlign = 'center';
      fx.textBaseline = 'middle';
      if (well.state === 'digging') {
        fx.font = '34px sans-serif';
        fx.fillText('⛏', cxp + Math.sin(performance.now() / 55) * 3, dep + 12);
      } else if (well.state === 'dry') {
        fx.fillStyle = 'rgba(255,255,255,0.9)';
        fx.font = 'bold 16px sans-serif';
        fx.fillText('…', cxp, dep - 8);
      }
    }
    ftex.needsUpdate = true;
  }

  function spawn() {
    if (parts.length >= MAXP) return;
    const p = { x: Math.max(0.3, Math.min(seaX - 0.3, cloudX + (Math.random() - 0.5) * 3.2)), y: -2.4, m: 0, c: 0 };
    if (stage === 'dam' && fert) {
      p.c = 3;
      p.n = true;
    }
    parts.push(p);
    stats.rained++;
  }

  function spawnDirt(cx, n, color, yRow) {
    for (let i = 0; i < n && dirt.length < MAXD; i++) {
      dirt.push({
        x: (cx + 0.5 - W / 2) * CELL + (Math.random() - 0.5) * 0.25,
        y: yRow === undefined ? (G * CELL) / 2 + 0.05 : (SURF + G / 2 - yRow) * CELL + 0.05,
        vx: (Math.random() - 0.5) * 2.2,
        vy: 2.2 + Math.random() * 2.4,
        life: 0.7 + Math.random() * 0.35,
        c: color,
      });
    }
  }

  function landing(p, cx) {
    if (stage === 'akatsuchi') {
      p.m = 0;
      if (Math.random() < (meas.grade ? 0.5 : 0.92)) {
        p.m = 2;
        p.c = 1;
        p.y = surf[cx] - 0.05;
      }
    } else if (stage === 'mirai') {
      const t = slots[Math.min(5, Math.floor(cx / 3))];
      const run = [0.04, 0, 0.3, 0.6, 0.7][t];
      mq.land++;
      if (Math.random() < run) {
        p.m = 2;
        p.y = SURF - 0.04;
        p.c = t === 2 ? 1 : t === 4 ? 2 : 4;
      } else {
        mq.infil++;
        const dirty = [0, 0, 0.5, 0.2, 1][t];
        if (Math.random() < dirty) {
          p.c = t === 2 ? 3 : t === 4 ? 2 : 4;
        } else mq.clean++;
      }
    }
  }
  const landStage = () => stage === 'akatsuchi' || stage === 'mirai';

  function addStore(p) {
    storedAll++;
    if (p.n) nitrAcc++;
    store = Math.min(6, store + 1 / (wall.x * 0.8));
    stats.nitrate = storedAll ? nitrAcc / storedAll : 0;
  }

  function step(dt) {
    const eff = (manualRain && droughtT <= 0) || (sleeping && stage === 'tama');
    rainOn = eff;
    stats.rainOn = eff;
    if (stage === 'mirai' && eff) cloudX = seaX / 2 + Math.sin(performance.now() / 1500) * (seaX / 2 - 1.5);
    if (eff !== lastRainAudio) {
      lastRainAudio = eff;
      audio.setRain(eff);
    }
    if (eff) {
      acc += dt * 15;
      while (acc >= 1) {
        acc -= 1;
        spawn();
      }
    }
    if (stage === 'tama' && sleeping) {
      years = Math.min(3200, years + dt * 280);
      stats.years = years;
      for (let y = SURF; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === T.LIME && openAt[y][x] <= years) g[y][x] = T.CAVE;
      cloudX = W / 2 + Math.sin(performance.now() / 1800) * 6;
    }
    if (stage === 'title') {
      cloudX = W / 2 + Math.sin(performance.now() / 2400) * 8;
      rainOn = true;
      acc += dt * 6;
      while (acc >= 1) {
        acc -= 1;
        spawn();
      }
    }

    if (well) {
      if (well.state === 'digging') {
        well.depth = Math.min(10, well.depth + dt * 3.2);
        well.tick += dt;
        if (well.tick > 0.26) {
          well.tick = 0;
          audio.dig();
          spawnDirt(well.x, 3, cBrown);
        }
        if (well.depth >= 10) {
          const ok = wet[SURF + 9][well.x] >= 0.18;
          well.ok = ok;
          well.state = ok ? 'water' : 'dry';
          stats.wellState = well.state;
          stats.wellTry++;
          if (ok) {
            stats.wellOk++;
            audio.chime();
            spawnDirt(well.x, 16, cBlue);
          } else {
            audio.bad();
            spawnDirt(well.x, 6, cBrown);
          }
        }
      } else if (well.state === 'water') {
        well.water = Math.min(1, well.water + dt * 0.6);
      }
    }
    for (let i = dirt.length - 1; i >= 0; i--) {
      const d = dirt[i];
      d.vy -= 9 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0) {
        dirt[i] = dirt[dirt.length - 1];
        dirt.pop();
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      let dead = false;
      if (p.m === 0) {
        if (p.y < SURF) {
          p.y += 9 * dt;
          if (p.y >= SURF) p.y = SURF + 0.001;
        } else if (g[Math.min(H - 1, Math.floor(p.y))][Math.max(0, Math.min(W - 1, Math.floor(p.x)))] === T.AIR) {
          p.y += 9 * dt;
        } else if (g[Math.min(H - 1, Math.floor(p.y))][Math.max(0, Math.min(W - 1, Math.floor(p.x)))] === T.SEA) {
          dead = true;
        } else if (g[Math.min(H - 1, Math.floor(p.y))][Math.max(0, Math.min(W - 1, Math.floor(p.x)))] === T.WALL) {
          dead = true;
        } else {
          const cx = Math.max(0, Math.min(W - 1, Math.floor(p.x)));
          const cy = Math.min(H - 1, Math.floor(p.y));
          const cell = g[cy][cx];
          const zone = Math.min(2, Math.floor(cx / 8));
          if (!p.hit) {
            p.hit = true;
            if (landStage()) landing(p, cx);
          }
          if (p.m !== 0) continue;
          if (stage === 's1' && p.fresh !== true) {
            p.fresh = true;
            stats.zoneRain[zone]++;
          }
          wet[cy][cx] = Math.min(1, wet[cy][cx] + 0.9 * dt);
          if (stage === 's1') stats.maxDepth[zone] = Math.max(stats.maxDepth[zone], cy - SURF + (p.y - cy));
          if (cell === T.MUD && cy === SURF && p.y < SURF + 0.35 && p.run === undefined) {
            p.run = Math.random() < 0.8;
          }
          if (cell === T.MUD && p.run) {
            p.m = 2;
            p.y = SURF - 0.04;
          } else {
            p.y += PERM[cell] * 0.9 * dt;
            const below = cy + 1 < H ? g[cy + 1][cx] : T.AIR;
            if (cy + 1 < H && PERM[cell] >= 1 && PERM[below] <= 0.3 && PERM[below] > 0 && p.y >= cy + 0.8) {
              p.m = 1;
              p.y = cy + 0.8;
            }
            if (poolRow !== null && p.y >= poolRow) {
              p.m = 1;
              p.y = poolRow;
            }
            if (p.y >= H - 0.2) dead = true;
          }
        }
      } else if (p.m === 1) {
        const cy = Math.floor(p.y);
        const nx = p.x + flowDir * 1.7 * dt;
        const ncx = Math.floor(nx);
        const ocx = Math.floor(p.x);
        if (wall && cy >= 0 && cy < H && ((ncx >= 0 && ncx < W && g[cy][ncx] === T.WALL) || (ocx >= 0 && ocx < W && g[cy][ocx] === T.WALL))) {
          addStore(p);
          dead = true;
        } else {
          p.x = nx;
          const cx = Math.floor(p.x);
          if (cx >= 0 && cx < W && cy < H) wet[cy][cx] = Math.min(1, wet[cy][cx] + 1.3 * dt);
          if (p.x < 0 || p.x >= seaX) {
            p.m = 3;
            p.c = seaX < W ? 5 : p.c;
            stats.spring++;
            if (stage === 'shiokawa') {
              fresh = Math.min(1, fresh + 0.03);
              stats.maxFresh = Math.max(stats.maxFresh, fresh);
            }
            if (stats.spring % 6 === 1) audio.splash();
          }
        }
      } else if (p.m === 2) {
        if (stage === 'akatsuchi') {
          const ox = Math.floor(p.x);
          p.x += 2.6 * dt;
          const nxc = Math.floor(p.x);
          if (nxc !== ox && nxc < seaX) {
            if (meas.green && nxc >= 12 && nxc <= 14 && Math.random() < 0.45) {
              p.m = 0;
              p.c = 0;
              p.hit = true;
              p.y = surf[nxc] + 0.1;
            } else if (meas.pond && nxc >= 15 && nxc <= 16 && Math.random() < 0.8) {
              pondFill = Math.min(1, pondFill + 0.012);
              dead = true;
            }
          }
          if (!dead && p.m === 2) {
            if (p.x >= seaX) {
              stats.runoff++;
              turb = Math.min(1, turb + 0.012);
              if (Math.random() < 0.45) spawnDirt(seaX - 0.4, 1, cBrown, seaTop - 0.1);
              dead = true;
            } else p.y = surf[Math.floor(p.x)] - 0.05;
          }
        } else {
          p.x += 3 * dt;
          if (p.x >= seaX) {
            stats.runoff++;
            p.m = 3;
          }
        }
      } else if (seaX < W && p.x >= seaX) {
        p.x += 1.2 * dt;
        p.y -= 2.2 * dt;
        if (p.y <= seaTop + 0.25) dead = true;
      } else {
        p.x += flowDir * 1.6 * dt;
        p.y += 5 * dt;
        if (p.y > H + 2) dead = true;
      }
      if (dead) {
        parts[i] = parts[parts.length - 1];
        parts.pop();
      }
    }
    // ぬれ(じかんで すこし かわく)
    const k = 1 - 0.03 * dt;
    for (let y = SURF; y < H; y++) {
      const row = wet[y];
      for (let x = 0; x < W; x++) if (row[x] > 0) row[x] *= k;
    }
    stageTick(dt);
  }

  function stageTick(dt) {
    if (stage === 'shiokawa') {
      fresh = Math.max(0, fresh - 0.02 * dt);
      tide += (tideT - tide) * Math.min(1, dt * 1.5);
      stats.fresh = fresh;
      stats.tide = tideT;
    } else if (stage === 'akatsuchi') {
      turb = Math.max(0, turb - 0.018 * dt);
      const tgt = 1 - Math.min(1, turb * 1.6);
      coral += (tgt - coral) * Math.min(1, dt * (tgt < coral ? 0.9 : 0.18));
      stats.turb = turb;
      stats.coral = coral;
      stats.nMeas = (meas.green ? 1 : 0) + (meas.pond ? 1 : 0) + (meas.grade ? 1 : 0);
    } else if (stage === 'dam') {
      if (wall && wall.state === 'building') {
        wall.depth = Math.min(10, wall.depth + dt * 2.4);
        for (let r = 0; r < Math.floor(wall.depth); r++) g[SURF + r][wall.x] = T.WALL;
        wall.tick += dt;
        crane.rotation.z = Math.sin(performance.now() / 120) * 0.03;
        if (wall.tick > 0.28) {
          wall.tick = 0;
          audio.dig();
          spawnDirt(wall.x, 3, cGray, SURF - 0.1);
        }
        if (wall.depth >= 10) {
          wall.state = 'done';
          stats.wallState = 'done';
          crane.visible = false;
          audio.chime();
        }
      }
      let cropT = 1;
      if (droughtT > 0) {
        droughtT -= dt;
        if (wall && wall.state === 'done') store = Math.max(0, store - (dt * 4.5) / (wall.x * 0.8));
        cropT = store > 0.05 ? 1 : 0;
        if (droughtT <= 0) {
          droughtT = 0;
          sunSp.visible = false;
          cloud.visible = true;
          if (store > 0.05) {
            stats.droughtOk++;
            audio.chime();
          } else {
            stats.droughtFail++;
            audio.bad();
          }
        }
      }
      cropG += (cropT - cropG) * Math.min(1, dt * 1.4);
      mCrop.color.setRGB(0.78 + (0.36 - 0.78) * cropG, 0.68 + (0.69 - 0.68) * cropG, 0.25 + (0.29 - 0.25) * cropG);
      stats.store = store;
      stats.need = wall ? Math.min(1.05, (4.5 * 7) / (wall.x * 0.8) / 6) : 0.6;
      stats.drought = droughtT > 0;
      stats.crop = cropG;
    } else if (stage === 'mirai') {
      stats.mLand = mq.land;
      stats.mQty = mq.land ? mq.infil / mq.land : 0;
      stats.mQual = mq.infil ? mq.clean / mq.infil : 1;
      stats.slots = slots.slice();
      stats.selSlot = selSlot;
      slotGroups.forEach((sg) => {
        if (sg.userData.pop < 1) {
          sg.userData.pop = Math.min(1, sg.userData.pop + dt * 3.5);
          const q = sg.userData.pop;
          sg.scale.setScalar(0.2 + 0.8 * (1 - Math.pow(1 - q, 3)) * (1 + 0.12 * Math.sin(q * Math.PI)));
        }
      });
    }
  }

  function updateGanjuu(dt, t) {
    let neckT = -0.12 + Math.sin(t * 1.3) * 0.04;
    let eyeT = 1;
    let jump = 0;
    let zz = false;
    let ex = false;
    if (gstate === 'sleep') {
      neckT = 0.95;
      eyeT = 0.08;
      zz = true;
    } else if (gstate === 'wake') {
      gtime += dt;
      const k = gtime / 1.0;
      if (k < 1) {
        jump = Math.abs(Math.sin(Math.PI * k * 2)) * 0.7 * (1 - k * 0.6);
        neckT = -0.4;
        eyeT = 1.35;
        ex = true;
      } else {
        gstate = 'idle';
      }
    } else if (gstate === 'happy') {
      jump = Math.abs(Math.sin(t * 5)) * 0.22;
      neckT = -0.3;
    } else if (t % 4 < 0.12) {
      eyeT = 0.1;
    }
    const a = Math.min(1, dt * 8);
    gj.neckPivot.rotation.x += (neckT - gj.neckPivot.rotation.x) * a;
    gj.eyes.forEach((e) => (e.scale.y += (eyeT - e.scale.y) * Math.min(1, dt * 14)));
    gj.root.position.y = GJ_BASE_Y + jump;
    const br = gstate === 'sleep' ? 1.5 : 2.2;
    gj.body.scale.y = 0.85 * (1 + (gstate === 'sleep' ? 0.06 : 0.025) * Math.sin(t * br));
    gj.zzz.visible = zz;
    gj.zzz.position.y = 2.95 + Math.sin(t * 2) * 0.12;
    gj.zzz.material.opacity = 0.75 + Math.sin(t * 2) * 0.25;
    gj.exm.visible = ex;
  }

  function render() {
    // 雨つぶの表示
    pMesh.count = parts.length;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      dummy.position.set((p.x - W / 2) * CELL, (SURF + G / 2 - p.y) * CELL, DEPTH / 2 + 0.1);
      dummy.scale.setScalar(p.m === 1 ? 1.1 : 1);
      dummy.updateMatrix();
      pMesh.setMatrixAt(i, dummy.matrix);
      pMesh.setColorAt(i, pcols[p.c || 0]);
    }
    pMesh.instanceMatrix.needsUpdate = true;
    if (pMesh.instanceColor) pMesh.instanceColor.needsUpdate = true;
    dMesh.count = dirt.length;
    for (let i = 0; i < dirt.length; i++) {
      const d = dirt[i];
      dummy.position.set(d.x, d.y, DEPTH / 2 + 0.14);
      dummy.scale.setScalar(Math.max(0.2, Math.min(1, d.life * 2)));
      dummy.updateMatrix();
      dMesh.setMatrixAt(i, dummy.matrix);
      dMesh.setColorAt(i, d.c);
    }
    dMesh.instanceMatrix.needsUpdate = true;
    if (dMesh.instanceColor) dMesh.instanceColor.needsUpdate = true;
    cloud.position.x = (cloudX - W / 2) * CELL;
    sunSp.visible = droughtT > 0;
    cloud.visible = droughtT <= 0;
    if (stage === 'dam' && wall) {
      crane.position.set(gx(wall.x) - 0.3, TOP, 0.2);
    }
    if (stage === 'mirai') selMark.position.set(gx(selSlot * 3 + 1), TOP + 0.03, 0);
    drawFront();
    drawSide(sideL, 0, true);
    drawSide(sideR, W - 1, false);
    if (stage === 'tama') drawTop();
    renderer.render(scene, camera);
  }

  // --- 画面サイズ ---
  function resize() {
    const w = container.clientWidth || 360;
    const h = container.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const needW = 6.0; // 横に 見せたい はんい(半分)
    const needH = 7.0; // 縦
    const dist = Math.max(needW / (camera.aspect * half), needH / half);
    camera.position.set(0, 2.5, dist);
    camera.lookAt(0, 2.3, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // --- ドラッグでジオラマを まわす(よこだけ) ---
  let lastX = 0;
  let downX = 0;
  let downY = 0;
  const rc = new THREE.Raycaster();
  const onTap = (e) => {
    if (stage !== 'mirai') return;
    const rect = el.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    rc.setFromCamera(ndc, camera);
    block.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(block.matrixWorld).invert();
    const o = rc.ray.origin.clone().applyMatrix4(inv);
    const d = rc.ray.direction.clone().transformDirection(inv);
    if (Math.abs(d.z) < 1e-4) return;
    const t = (DEPTH / 2 - o.z) / d.z;
    const hx = o.x + d.x * t;
    const col = Math.floor(hx / CELL + W / 2);
    if (col >= 0 && col < seaX) {
      selSlot = Math.min(5, Math.floor(col / 3));
      stats.selSlot = selSlot;
      audio.pop();
    }
  };
  const onDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    downX = e.clientX;
    downY = e.clientY;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
  };
  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    yawTarget = Math.max(-0.75, Math.min(0.75, yawTarget + dx * 0.007));
  };
  const onUp = (e) => {
    dragging = false;
    if (e && e.type === 'pointerup' && Math.hypot(e.clientX - downX, e.clientY - downY) < 8) onTap(e);
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);

  // --- ループ ---
  let raf = 0;
  let last = performance.now();
  let tAll = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tAll += dt;
    if (document.hidden) return;
    if (!dragging) yawTarget += (0.12 - yawTarget) * Math.min(1, dt * 0.5);
    if (stage === 'title') yawTarget = 0.12 + Math.sin(tAll * 0.5) * 0.25;
    yaw += (yawTarget - yaw) * Math.min(1, dt * 6);
    block.rotation.y = yaw;
    step(dt);
    updateGanjuu(dt, tAll);
    render();
  }
  raf = requestAnimationFrame(loop);

  loadStage('title');

  const api = {
    loadStage,
    setRain(b) {
      manualRain = b;
    },
    setCloud(f) {
      cloudX = 0.6 + f * (seaX - 1.2);
    },
    setSleepTime(b) {
      sleeping = b;
    },
    setGanjuu(s) {
      gstate = s;
      gtime = 0;
      audio.setSnore(s === 'sleep');
    },
    digWell(f) {
      if (stage !== 'spring') return false;
      if (well && well.state === 'digging') return false;
      const wx = Math.max(0, Math.min(W - 1, Math.floor(f * W)));
      well = { x: wx, depth: 0, state: 'digging', water: 0, tick: 0, ok: false };
      preview = null;
      stats.wellState = 'digging';
      audio.dig();
      spawnDirt(wx, 4, cBrown);
      return true;
    },
    setWellPreview(f) {
      if (stage !== 'spring') return;
      if (well && well.state === 'digging') return;
      well = null;
      stats.wellState = 'none';
      preview = Math.max(0, Math.min(W - 1, Math.floor(f * W)));
    },
    clearWell() {
      well = null;
    },
    // 塩川: みちひき
    setTide(b) {
      tideT = b ? 1 : 0;
      stats.tide = tideT;
      audio.pop();
    },
    // 地下ダム: かべ
    setWallPreview(f) {
      if (stage !== 'dam') return;
      if (wall && wall.state === 'building') return;
      wpreview = 6 + Math.round(Math.max(0, Math.min(1, f)) * 10);
    },
    buildWall(f) {
      if (stage !== 'dam') return false;
      if (wall && wall.state === 'building') return false;
      if (wall) for (let r = 0; r < 10; r++) g[SURF + r][wall.x] = T.LIME;
      store = 0;
      nitrAcc = 0;
      storedAll = 0;
      stats.nitrate = 0;
      stats.droughtOk = 0;
      stats.droughtFail = 0;
      const wx = 6 + Math.round(Math.max(0, Math.min(1, f)) * 10);
      wall = { x: wx, depth: 0, state: 'building', tick: 0 };
      wpreview = null;
      stats.wallState = 'building';
      crane.visible = true;
      audio.dig();
      return true;
    },
    startDrought() {
      if (stage !== 'dam' || droughtT > 0) return false;
      manualRain = false;
      droughtT = 7;
      stats.drought = true;
      audio.pop();
      return true;
    },
    setFert(b) {
      fert = b;
    },
    // 赤土: たいさく
    setMeasure(name, b) {
      if (stage !== 'akatsuchi') return;
      meas[name] = b;
      audio.pop();
    },
    // 未来の島: ならべる
    placeSlot(type) {
      if (stage !== 'mirai') return;
      slots[selSlot] = type;
      fillSlot(selSlot, true);
      mq = { land: 0, infil: 0, clean: 0 };
      stats.slots = slots.slice();
      audio.pop();
      selSlot = (selSlot + 1) % 6;
      stats.selSlot = selSlot;
    },
    selectSlot(i) {
      if (stage !== 'mirai') return;
      selSlot = Math.max(0, Math.min(5, i));
      stats.selSlot = selSlot;
    },
    getStats() {
      return stats;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      audio.setRain(false);
      audio.setSnore(false);
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    },
  };
  if (typeof window !== 'undefined' && /[?&]qa=1/.test(window.location.search)) window.__gj = api;
  return api;
}
