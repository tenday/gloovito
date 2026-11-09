// ============================================================================
// GLOOVITO — 3D SCROLLYTELLING TEARDOWN ENGINE & WEBGL GESTURE SIMULATOR
// ============================================================================

let soundActive = false;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playMechanicalSwitch(freq = 520) {
  if (!soundActive || !audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.045);

  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.055);
}

const soundBtn = document.getElementById('sound-btn');
const soundLabel = document.getElementById('sound-label');
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    ensureAudio();
    soundActive = !soundActive;
    soundBtn.classList.toggle('on', soundActive);
    soundLabel.textContent = soundActive ? 'SUONO ON' : 'SUONO OFF';
    if (soundActive) playMechanicalSwitch(680);
  });
}

// ============================================================================
// 1. INTERSECTION OBSERVER: SCROLL REVEALS
// ============================================================================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal-up').forEach((el) => {
  revealObserver.observe(el);
});

// ============================================================================
// 2. SCROLLYTELLING HERO PARALLAX
// ============================================================================
const heroWrapper = document.getElementById('hero-wrapper');
const heroMedia = document.getElementById('hero-media');
const heroTitle = document.getElementById('hero-title');

window.addEventListener('scroll', () => {
  if (heroWrapper && heroMedia) {
    const rect = heroWrapper.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / (window.innerHeight * 0.95)));
    const scale = 1 + progress * 0.12;
    heroMedia.style.transform = `scale(${scale.toFixed(4)})`;
    heroMedia.style.filter = `contrast(1.12) brightness(${0.92 - progress * 0.2})`;
    if (heroTitle) {
      heroTitle.style.transform = `translateY(${(-progress * 28).toFixed(1)}px)`;
    }
  }
});

// ============================================================================
// 3. SHARED PROCEDURAL HIGH-RES TEXTURES (CONICAL BRUSHED METAL & 4-LAYER PCB)
// ============================================================================
function createTopCapTexture(includeRedLine = true) {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const sheen =
        Math.cos(angle * 2 + 0.8) * 26 +
        Math.sin(angle * 4 - 0.4) * 10 +
        Math.sin(r * 0.45) * 2.5 +
        (Math.random() - 0.5) * 4.5;
      const base = 76 + sheen;
      const idx = (y * size + x) * 4;
      data[idx] = Math.min(255, Math.max(0, base + 2));
      data[idx + 1] = Math.min(255, Math.max(0, base));
      data[idx + 2] = Math.min(255, Math.max(0, base - 3));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Outer chamfer shadow ring
  ctx.strokeStyle = 'rgba(15, 15, 14, 0.65)';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.47, 0, Math.PI * 2);
  ctx.stroke();

  // Engraved "GLOOVITO" wordmark at bottom parallel to the central Linea Rossa
  ctx.save();
  ctx.fillStyle = 'rgba(20, 20, 18, 0.9)';
  ctx.font = '700 44px "Sora", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GLOOVITO', cx, cy + size * 0.34);
  ctx.restore();

  // Central milled slot for the #FF3300 Linea Rossa across exact center (0,0)
  const lineLen = size * 0.74;
  const lineThick = 28;
  ctx.fillStyle = '#121210';
  ctx.beginPath();
  ctx.roundRect(cx - lineLen / 2 - 4, cy - lineThick / 2 - 4, lineLen + 8, lineThick + 8, 16);
  ctx.fill();

  if (includeRedLine) {
    const redGrad = ctx.createLinearGradient(cx - lineLen / 2, cy - lineThick / 2, cx + lineLen / 2, cy + lineThick / 2);
    redGrad.addColorStop(0, '#E62E00');
    redGrad.addColorStop(0.5, '#FF3B0A');
    redGrad.addColorStop(1, '#CC2900');
    ctx.fillStyle = redGrad;
    ctx.beginPath();
    ctx.roundRect(cx - lineLen / 2, cy - lineThick / 2, lineLen, lineThick, 13);
    ctx.fill();
  }

  return c;
}

function createPCBTexture() {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#0E100F';
  ctx.fillRect(0, 0, size, size);

  // Gold ENIG perimeter ring
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  // Copper/Gold differential traces
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
  ctx.lineWidth = 4;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 34, cy - 340);
    ctx.lineTo(cx + i * 34, cy + 340);
    ctx.stroke();
  }

  // Gold Vias
  ctx.fillStyle = '#E5C158';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
    const vx = cx + Math.cos(a) * (size * 0.41);
    const vy = cy + Math.sin(a) * (size * 0.41);
    ctx.beginPath();
    ctx.arc(vx, vy, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central Y=0.00 optical slot & 3 hyper-red LEDs
  ctx.fillStyle = '#240804';
  ctx.fillRect(cx - 340, cy - 22, 680, 44);
  ctx.strokeStyle = '#FF3300';
  ctx.lineWidth = 4;
  ctx.strokeRect(cx - 340, cy - 22, 680, 44);

  [-260, 0, 260].forEach((dx) => {
    ctx.fillStyle = '#FF3300';
    ctx.beginPath();
    ctx.arc(cx + dx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#F5F2EB';
  ctx.font = '600 22px "Sora", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GLOOVITO-PCB-S1 REV 2.0 • Y=0.00', cx, cy - 34);

  return c;
}

// ============================================================================
// 4. SECTION 02: SCROLLYTELLING 8-PART 3D EXPLODED TEARDOWN ENGINE
// ============================================================================
const chapterTitles = [
  '01. Il Monolite Sigillato IP68 (Ø 28.0 × 7.5 mm)',
  '02. Inserto Ottico Centrale Linea Rossa (#FF3300)',
  '03. Calotta Unibody CNC in Alluminio 6061-T6',
  '04. Guarnizione Artica FKM Viton (-40 °C • IP68)',
  '05. Scheda Madre 4-Layer GLOOVITO-PCB-S1 (ENIG Gold)',
  '06. Attuatore Aptico LRA & Cella LiPo -20 °C (80 mAh)',
  '07. Baionetta Meccanica 15° & Dock Magnetico N52'
];

let teardownTargetStep = 0;
let teardownScrollProgress = 0; // 0..1 across the whole section

window.scrollToTeardownStep = function (stepIndex) {
  playMechanicalSwitch(660);
  const steps = document.querySelectorAll('.teardown-step');
  if (steps[stepIndex]) {
    steps[stepIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

function initTeardownScrolly3D() {
  const container = document.getElementById('teardown-webgl-canvas');
  const svgOverlay = document.getElementById('teardown-callout-svg');
  if (!container || typeof THREE === 'undefined') return;

  const width = container.clientWidth || 720;
  const height = container.clientHeight || 540;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(0, 3.8, 8.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Studio Lighting
  scene.add(new THREE.AmbientLight(0xf5f2eb, 0.7));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(6, 9, 7);
  scene.add(keyLight);

  const signalLight = new THREE.DirectionalLight(0xff3300, 1.0);
  signalLight.position.set(-7, 4, -5);
  scene.add(signalLight);

  const fillLight = new THREE.DirectionalLight(0xc8d6e8, 0.95);
  fillLight.position.set(-5, -6, 5);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.rotation.x = 0.44;
  rootGroup.rotation.y = -0.42;
  scene.add(rootGroup);

  // Central subtle vertical guide axis line when exploded
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -3.2, 0),
    new THREE.Vector3(0, 3.2, 0)
  ]);
  const axisMat = new THREE.LineBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.0
  });
  const axisLine = new THREE.Line(axisGeo, axisMat);
  rootGroup.add(axisLine);

  // --- PART 1: LINEA ROSSA OPTICAL WAVEGUIDE INLAY (#FF3300) ---
  const partLineaRossa = new THREE.Group();
  const lineaGeo = new THREE.BoxGeometry(2.64, 0.08, 0.12);
  const lineaMat = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    roughness: 0.25,
    metalness: 0.15,
    emissive: 0xff2200,
    emissiveIntensity: 0.18
  });
  const lineaMesh = new THREE.Mesh(lineaGeo, lineaMat);
  partLineaRossa.add(lineaMesh);
  // Subtle micro-prism ribs under the waveguide
  const prismGeo = new THREE.BoxGeometry(2.4, 0.04, 0.06);
  const prismMesh = new THREE.Mesh(prismGeo, lineaMat);
  prismMesh.position.y = -0.05;
  partLineaRossa.add(prismMesh);
  rootGroup.add(partLineaRossa);

  // --- PART 2: CNC 6061-T6 UNIBODY TOP CAP ---
  const partTopCap = new THREE.Group();
  const capTex = new THREE.CanvasTexture(createTopCapTexture(false));
  capTex.anisotropy = 8;
  const gunmetalSideMat = new THREE.MeshStandardMaterial({
    color: 0x3b3b37,
    metalness: 0.86,
    roughness: 0.27
  });
  const gunmetalTopMat = new THREE.MeshStandardMaterial({
    map: capTex,
    metalness: 0.78,
    roughness: 0.26
  });
  const capMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.86, 1.9, 0.34, 64),
    [gunmetalSideMat, gunmetalTopMat, gunmetalSideMat]
  );
  partTopCap.add(capMesh);

  const bezelGeo = new THREE.TorusGeometry(1.86, 0.048, 20, 64);
  bezelGeo.rotateX(Math.PI / 2);
  const bezelMesh = new THREE.Mesh(bezelGeo, gunmetalSideMat);
  bezelMesh.position.y = 0.16;
  partTopCap.add(bezelMesh);
  rootGroup.add(partTopCap);

  // --- PART 3: FKM VITON ARCTIC O-RING SEAL (IP68) ---
  const partORing = new THREE.Group();
  const oringGeo = new THREE.TorusGeometry(1.68, 0.055, 20, 64);
  oringGeo.rotateX(Math.PI / 2);
  const oringMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1a,
    roughness: 0.65,
    metalness: 0.1
  });
  partORing.add(new THREE.Mesh(oringGeo, oringMat));
  rootGroup.add(partORing);

  // --- PART 4: 4-LAYER GLOOVITO-PCB-S1 (ENIG GOLD + nRF52840 + LSM6DSOX) ---
  const partPCB = new THREE.Group();
  const pcbTex = new THREE.CanvasTexture(createPCBTexture());
  const pcbGoldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.18 });
  const pcbFaceMat = new THREE.MeshStandardMaterial({ map: pcbTex, metalness: 0.48, roughness: 0.38 });

  const pcbBoard = new THREE.Mesh(
    new THREE.CylinderGeometry(1.62, 1.62, 0.08, 64),
    [pcbGoldMat, pcbFaceMat, pcbFaceMat]
  );
  partPCB.add(pcbBoard);

  // U1 Raytac nRF52840 RF Shield + Ceramic Antenna
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 0.88, roughness: 0.2 });
  const u1Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.13, 0.62), shieldMat);
  u1Mesh.position.set(0, 0.095, -0.58);
  partPCB.add(u1Mesh);

  const antMat = new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.3, metalness: 0.1 });
  const antMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.16), antMat);
  antMesh.position.set(0.32, 0.08, -1.02);
  partPCB.add(antMesh);

  // 3 Equatorial Hyper-Red SMD LEDs along Y=0.00 (Z=0 in 3D cylinder coordinates)
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    emissive: 0xff2200,
    emissiveIntensity: 0.65
  });
  [-0.85, 0, 0.85].forEach((lx) => {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), ledMat);
    led.position.set(lx, 0.065, 0);
    partPCB.add(led);
  });

  // U2 LSM6DSOX 6-Axis IMU + U3 DRV2605L + U5 TPS62740
  const icDarkMat = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.25, roughness: 0.55 });
  const u2Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.32), icDarkMat);
  u2Mesh.position.set(0, 0.08, 0.46);
  partPCB.add(u2Mesh);

  const u3Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.25), icDarkMat);
  u3Mesh.position.set(-0.58, 0.08, 0.46);
  partPCB.add(u3Mesh);

  const u5Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.28), icDarkMat);
  u5Mesh.position.set(0.58, 0.08, 0.46);
  partPCB.add(u5Mesh);

  rootGroup.add(partPCB);

  // --- PART 5: LRA HAPTIC ACTUATOR + ARCTIC LIPO CELL (-20°C, 80mAh) ---
  const partEnergyHaptic = new THREE.Group();
  // LRA Pancake Motor (Silver/Copper cylinder)
  const lraMat = new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.85, roughness: 0.24 });
  const lraMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 32), lraMat);
  lraMesh.position.set(-0.52, 0.08, 0);
  partEnergyHaptic.add(lraMesh);

  // Arctic LiPo 80mAh Pouch Cell with Amber Kapton Collar
  const lipoMat = new THREE.MeshStandardMaterial({ color: 0x90959c, metalness: 0.76, roughness: 0.32 });
  const lipoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 1.18), lipoMat);
  lipoMesh.position.set(0.22, -0.02, 0);
  partEnergyHaptic.add(lipoMesh);

  const kaptonMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.2 });
  const kaptonMesh = new THREE.Mesh(new THREE.BoxGeometry(1.37, 0.19, 0.26), kaptonMat);
  kaptonMesh.position.set(0.22, -0.02, -0.45);
  partEnergyHaptic.add(kaptonMesh);

  rootGroup.add(partEnergyHaptic);

  // --- PART 6: RF LOWER SHELL + 15° BAYONET LUGS ---
  const partLowerShell = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x171715, metalness: 0.32, roughness: 0.52 });
  const shellBody = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.48, 0.24, 64), shellMat);
  partLowerShell.add(shellBody);

  const lugMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.09, 0.28), shellMat);
  lugMesh.position.y = -0.05;
  partLowerShell.add(lugMesh);
  rootGroup.add(partLowerShell);

  // --- PART 7: GLOVE MAGNETIC BAYONET DOCK RING (N52 + 4 GOLD POGO-PINS) ---
  const partGloveDock = new THREE.Group();
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x10100e, metalness: 0.38, roughness: 0.48 });

  const dockTorusGeo = new THREE.TorusGeometry(1.94, 0.22, 24, 64);
  dockTorusGeo.rotateX(Math.PI / 2);
  partGloveDock.add(new THREE.Mesh(dockTorusGeo, dockMat));

  const dockFlange = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.26, 0.12, 64), dockMat);
  dockFlange.position.y = -0.12;
  partGloveDock.add(dockFlange);

  const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xffc83b, metalness: 0.96, roughness: 0.14 });
  const pinGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 16);
  [-0.55, -0.18, 0.18, 0.55].forEach((px) => {
    const pin = new THREE.Mesh(pinGeo, goldPinMat);
    pin.position.set(px, 0.02, 0);
    partGloveDock.add(pin);
  });

  const n52Mat = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, metalness: 0.9, roughness: 0.2 });
  const n52Geo = new THREE.CylinderGeometry(0.19, 0.19, 0.09, 24);
  [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((ang) => {
    const mag = new THREE.Mesh(n52Geo, n52Mat);
    mag.position.set(Math.cos(ang) * 1.48, -0.02, Math.sin(ang) * 1.48);
    partGloveDock.add(mag);
  });

  rootGroup.add(partGloveDock);

  // Metadata for the 7 exploded layers & their 3D callout labels
  const layers = [
    {
      group: partLineaRossa,
      closedY: 0.41,
      openY: 2.35,
      label: '01. GUIDA OTTICA LINEA ROSSA (#FF3300)',
      side: 'right',
      focusStep: 1
    },
    {
      group: partTopCap,
      closedY: 0.24,
      openY: 1.65,
      label: '02. CALOTTA UNIBODY CNC 6061-T6 (Ø 28 MM)',
      side: 'left',
      focusStep: 2
    },
    {
      group: partORing,
      closedY: 0.1,
      openY: 0.95,
      label: '03. GUARNIZIONE ARTICA FKM VITON (IP68)',
      side: 'right',
      focusStep: 3
    },
    {
      group: partPCB,
      closedY: 0.0,
      openY: 0.22,
      label: '04. SCHEDA 4-LAYER PCB-S1 (nRF52840 + LSM6DSOX)',
      side: 'left',
      focusStep: 4
    },
    {
      group: partEnergyHaptic,
      closedY: -0.12,
      openY: -0.62,
      label: '05. MOTORE APTICO LRA + CELLA LIPO -20 °C',
      side: 'right',
      focusStep: 5
    },
    {
      group: partLowerShell,
      closedY: -0.24,
      openY: -1.42,
      label: '06. SCOCCA INFERIORE RF + BAIONETTA 15°',
      side: 'left',
      focusStep: 6
    },
    {
      group: partGloveDock,
      closedY: -0.38,
      openY: -2.28,
      label: '07. ANELLO DOCK PASSIVO GUANTO (4× N52 + POGO)',
      side: 'right',
      focusStep: 6
    }
  ];

  // Mouse/Touch Drag Orbit on Teardown Stage
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let userRotY = -0.42;
  let userRotX = 0.42;

  const startDrag = (x, y) => {
    isDragging = true;
    prevX = x;
    prevY = y;
  };
  const moveDrag = (x, y) => {
    if (!isDragging) return;
    userRotY += (x - prevX) * 0.01;
    userRotX = Math.max(-1.1, Math.min(1.2, userRotX + (y - prevY) * 0.01));
    prevX = x;
    prevY = y;
  };
  const endDrag = () => {
    isDragging = false;
  };

  container.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
  window.addEventListener('mouseup', endDrag);

  container.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );
  container.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );
  container.addEventListener('touchend', endDrag);

  // Scroll Tracking across .teardown-scrolly-wrapper and .teardown-step cards
  const scrollyWrapper = document.getElementById('teardown-scrolly');
  const stepElements = document.querySelectorAll('.teardown-step');
  const hudTitle = document.getElementById('hud-chapter-title');
  const hudPct = document.getElementById('hud-explode-pct');
  const hudBar = document.getElementById('hud-explode-bar');
  const pillButtons = document.querySelectorAll('.ch-pill');

  function updateScrollState() {
    if (!scrollyWrapper) return;
    const rect = scrollyWrapper.getBoundingClientRect();
    const totalScrollable = Math.max(1, rect.height - window.innerHeight);
    const rawProgress = -rect.top / totalScrollable;
    teardownScrollProgress = Math.min(1, Math.max(0, rawProgress));

    // Find which step card is closest to viewport center
    let closestStep = 0;
    let minDist = Infinity;
    const viewMid = window.innerHeight * 0.48;
    stepElements.forEach((el, idx) => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const d = Math.abs(mid - viewMid);
      if (d < minDist) {
        minDist = d;
        closestStep = idx;
      }
    });

    if (closestStep !== teardownTargetStep) {
      teardownTargetStep = closestStep;
      stepElements.forEach((el, i) => el.classList.toggle('active', i === closestStep));
      pillButtons.forEach((btn, i) => btn.classList.toggle('active', i === closestStep));
      if (hudTitle && chapterTitles[closestStep]) {
        hudTitle.textContent = chapterTitles[closestStep];
      }
    }

    // Explosion factor reaches 100% smoothly as you leave Step 0
    const explodeFactor = Math.min(1, Math.max(0, teardownScrollProgress * 1.28));
    const pctVal = Math.round(explodeFactor * 100);
    if (hudPct) hudPct.textContent = `APERTURA 3D: ${pctVal}%`;
    if (hudBar) hudBar.style.width = `${pctVal}%`;
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  window.addEventListener('resize', () => {
    const nw = container.clientWidth || 720;
    const nh = container.clientHeight || 540;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });

  // Render Loop with Real-Time 3D-to-SVG Leader Lines
  let smoothExplode = 0;
  let smoothFocusY = 0;

  function renderTeardown() {
    requestAnimationFrame(renderTeardown);

    if (!isDragging) {
      userRotY += 0.003;
    }

    // Target explosion factor: 0 on step 0, progressively opening to 1.0 on steps 1..6
    const targetExplode =
      teardownTargetStep === 0
        ? Math.min(0.25, teardownScrollProgress * 1.4)
        : Math.min(1.0, 0.35 + teardownTargetStep * 0.13);

    smoothExplode += (targetExplode - smoothExplode) * 0.08;
    axisMat.opacity = smoothExplode * 0.38;

    // Camera vertical pan slightly tracks the focused component
    let desiredFocusY = 0;
    layers.forEach((l) => {
      const curY = l.closedY + (l.openY - l.closedY) * smoothExplode;
      l.group.position.y += (curY - l.group.position.y) * 0.1;

      // Highlight active step layer by giving it a subtle scale/spin boost
      const isFocused = teardownTargetStep === l.focusStep;
      const targetScale = isFocused ? 1.07 : 1.0;
      l.group.scale.x += (targetScale - l.group.scale.x) * 0.1;
      l.group.scale.y += (targetScale - l.group.scale.y) * 0.1;
      l.group.scale.z += (targetScale - l.group.scale.z) * 0.1;

      if (isFocused) {
        desiredFocusY = curY * 0.28;
      }
    });

    smoothFocusY += (desiredFocusY - smoothFocusY) * 0.07;
    rootGroup.position.y = -smoothFocusY;

    // Tilt adjustments per chapter for dramatic perspective
    const chapterTiltX = teardownTargetStep === 4 ? 0.65 : 0.38;
    rootGroup.rotation.x += (userRotX * 0.65 + chapterTiltX * 0.35 - rootGroup.rotation.x) * 0.09;
    rootGroup.rotation.y += (userRotY - rootGroup.rotation.y) * 0.09;

    renderer.render(scene, camera);

    // Update SVG Leader Lines anchored to actual 3D layer coordinates
    if (svgOverlay) {
      if (smoothExplode < 0.18) {
        svgOverlay.innerHTML = '';
      } else {
        let svgMarkup = '';
        layers.forEach((l) => {
          const worldVec = new THREE.Vector3();
          l.group.getWorldPosition(worldVec);
          // Offset anchor to rim edge of the component
          worldVec.x += l.side === 'left' ? -1.45 : 1.45;
          worldVec.project(camera);

          const sx = (worldVec.x * 0.5 + 0.5) * 800;
          const sy = (-worldVec.y * 0.5 + 0.5) * 600;
          const endX = l.side === 'left' ? 54 : 746;
          const elbowX = l.side === 'left' ? sx - 38 : sx + 38;
          const isFocused = teardownTargetStep === l.focusStep;
          const strokeCol = isFocused ? '#FF3300' : 'rgba(245, 242, 235, 0.32)';
          const textCol = isFocused ? '#FF3300' : 'rgba(245, 242, 235, 0.78)';
          const strokeW = isFocused ? '2' : '1';
          const anchor = l.side === 'left' ? 'start' : 'end';

          svgMarkup += `
            <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${isFocused ? 4.5 : 3}" fill="${strokeCol}" />
            <polyline points="${sx.toFixed(1)},${sy.toFixed(1)} ${elbowX.toFixed(1)},${sy.toFixed(1)} ${endX},${sy.toFixed(1)}"
              fill="none" stroke="${strokeCol}" stroke-width="${strokeW}" />
            <text x="${endX}" y="${(sy - 7).toFixed(1)}" fill="${textCol}"
              font-family="Sora, sans-serif" font-size="${isFocused ? '11.5' : '10'}" font-weight="${isFocused ? '700' : '500'}"
              text-anchor="${anchor}" letter-spacing="0.06em">${l.label}</text>
          `;
        });
        svgOverlay.innerHTML = svgMarkup;
      }
    }
  }

  renderTeardown();
}

// ============================================================================
// 5. SECTION 04: REAL THREE.JS WEBGL 3D GESTURE BENCH FOR GLOOVITO POD-S1
// ============================================================================
let current3DMode = 'assembled';
let gestureImpulseX = 0;
let gestureImpulseZ = 0;
let hapticRingScale = 0;
let hapticRingAlpha = 0;

function initPodWebGL() {
  const container = document.getElementById('pod-webgl-container');
  if (!container || typeof THREE === 'undefined') return;

  const width = container.clientWidth || 560;
  const height = container.clientHeight || 440;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(0, 4.6, 6.4);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xf5f2eb, 0.65);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xff3300, 0.85);
  rimLight.position.set(-6, 3, -5);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xc8d4e3, 0.9);
  fillLight.position.set(-4, -5, 4);
  scene.add(fillLight);

  const assembly = new THREE.Group();
  assembly.rotation.x = 0.42;
  assembly.rotation.y = -0.35;
  scene.add(assembly);

  // Layer 1: Top Cap
  const topCapGroup = new THREE.Group();
  const topCapTex = new THREE.CanvasTexture(createTopCapTexture(true));
  topCapTex.anisotropy = 8;

  const gunmetalSideMat = new THREE.MeshStandardMaterial({
    color: 0x3b3b37,
    metalness: 0.86,
    roughness: 0.28
  });
  const gunmetalTopMat = new THREE.MeshStandardMaterial({
    map: topCapTex,
    metalness: 0.78,
    roughness: 0.26
  });

  const capGeo = new THREE.CylinderGeometry(1.85, 1.9, 0.34, 64);
  const capMesh = new THREE.Mesh(capGeo, [gunmetalSideMat, gunmetalTopMat, gunmetalSideMat]);
  topCapGroup.add(capMesh);

  const rimGeo = new THREE.TorusGeometry(1.86, 0.045, 20, 64);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, gunmetalSideMat);
  rimMesh.position.y = 0.16;
  topCapGroup.add(rimMesh);

  const lineaGeo = new THREE.BoxGeometry(2.62, 0.04, 0.095);
  const lineaMat = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    roughness: 0.35,
    metalness: 0.1
  });
  const lineaMesh = new THREE.Mesh(lineaGeo, lineaMat);
  lineaMesh.position.set(0, 0.162, 0);
  topCapGroup.add(lineaMesh);
  assembly.add(topCapGroup);

  // Layer 2: PCB
  const pcbGroup = new THREE.Group();
  const pcbTex = new THREE.CanvasTexture(createPCBTexture());
  const pcbSideMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
  const pcbFaceMat = new THREE.MeshStandardMaterial({ map: pcbTex, metalness: 0.45, roughness: 0.4 });

  const pcbGeo = new THREE.CylinderGeometry(1.62, 1.62, 0.08, 64);
  const pcbMesh = new THREE.Mesh(pcbGeo, [pcbSideMat, pcbFaceMat, pcbFaceMat]);
  pcbGroup.add(pcbMesh);

  const u1Geo = new THREE.BoxGeometry(0.95, 0.12, 0.62);
  const u1Mat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.85, roughness: 0.22 });
  const u1Mesh = new THREE.Mesh(u1Geo, u1Mat);
  u1Mesh.position.set(0, 0.09, -0.58);
  pcbGroup.add(u1Mesh);

  const u2Geo = new THREE.BoxGeometry(0.38, 0.09, 0.32);
  const u2Mat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.6 });
  const u2Mesh = new THREE.Mesh(u2Geo, u2Mat);
  u2Mesh.position.set(0, 0.075, 0.45);
  pcbGroup.add(u2Mesh);
  assembly.add(pcbGroup);

  // Layer 3: Bottom Case & LiPo
  const bottomCaseGroup = new THREE.Group();
  const pouchGeo = new THREE.BoxGeometry(1.55, 0.16, 1.25);
  const pouchMat = new THREE.MeshStandardMaterial({ color: 0x8c9096, metalness: 0.7, roughness: 0.35 });
  const pouchMesh = new THREE.Mesh(pouchGeo, pouchMat);
  pouchMesh.position.y = 0.08;
  bottomCaseGroup.add(pouchMesh);

  const lowerShellMat = new THREE.MeshStandardMaterial({ color: 0x161614, metalness: 0.3, roughness: 0.55 });
  const lowerShellGeo = new THREE.CylinderGeometry(1.82, 1.48, 0.24, 64);
  const lowerShellMesh = new THREE.Mesh(lowerShellGeo, lowerShellMat);
  lowerShellMesh.position.y = -0.08;
  bottomCaseGroup.add(lowerShellMesh);
  assembly.add(bottomCaseGroup);

  // Layer 4: Dock Ring
  const dockRingGroup = new THREE.Group();
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x121210, metalness: 0.4, roughness: 0.48 });
  const dockTorusGeo = new THREE.TorusGeometry(1.92, 0.22, 24, 64);
  dockTorusGeo.rotateX(Math.PI / 2);
  dockRingGroup.add(new THREE.Mesh(dockTorusGeo, dockMat));

  const dockBaseGeo = new THREE.CylinderGeometry(2.15, 2.18, 0.12, 64);
  const dockBaseMesh = new THREE.Mesh(dockBaseGeo, dockMat);
  dockBaseMesh.position.y = -0.12;
  dockRingGroup.add(dockBaseMesh);
  assembly.add(dockRingGroup);

  // Haptic Wave Ring
  const waveGeo = new THREE.RingGeometry(2.05, 2.13, 64);
  waveGeo.rotateX(-Math.PI / 2);
  const waveMat = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0
  });
  const waveMesh = new THREE.Mesh(waveGeo, waveMat);
  assembly.add(waveMesh);

  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let targetRotX = 0.52;
  let targetRotY = -0.35;
  const cadReadout = document.getElementById('cad-angle-readout');

  const onDown = (x, y) => {
    isDragging = true;
    prevX = x;
    prevY = y;
  };
  const onMove = (x, y) => {
    if (!isDragging) return;
    const dx = x - prevX;
    const dy = y - prevY;
    prevX = x;
    prevY = y;
    targetRotY += dx * 0.011;
    targetRotX = Math.max(-1.2, Math.min(1.35, targetRotX + dy * 0.011));
    if (cadReadout) {
      const degY = Math.round(((targetRotY * 180) / Math.PI) % 360);
      const degX = Math.round((targetRotX * 180) / Math.PI);
      cadReadout.textContent = `INCLINAZIONE 3D: X ${degX}° • Y ${degY}°`;
    }
  };
  const onUp = () => {
    isDragging = false;
  };

  container.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onUp);

  container.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );
  container.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: true }
  );
  container.addEventListener('touchend', onUp);

  window.addEventListener('resize', () => {
    const nw = container.clientWidth || 560;
    const nh = container.clientHeight || 440;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });

  let clockTime = 0;
  function animate3D() {
    requestAnimationFrame(animate3D);
    clockTime += 0.018;

    if (!isDragging) {
      targetRotY += 0.0035;
    }

    assembly.rotation.x += (targetRotX + gestureImpulseX - assembly.rotation.x) * 0.1;
    assembly.rotation.y += (targetRotY - assembly.rotation.y) * 0.1;
    assembly.rotation.z += (gestureImpulseZ - assembly.rotation.z) * 0.12;
    gestureImpulseX *= 0.88;
    gestureImpulseZ *= 0.88;

    let targetTopY = 0.22;
    let targetPcbY = 0.02;
    let targetBotY = -0.14;
    let targetDockY = -0.28;
    let targetCapTwist = 0;

    if (current3DMode === 'exploded') {
      targetTopY = 1.25;
      targetPcbY = 0.42;
      targetBotY = -0.38;
      targetDockY = -1.25;
    } else if (current3DMode === 'bayonet') {
      const cycle = (Math.sin(clockTime * 1.8) + 1) * 0.5;
      const drop = Math.max(0, 1 - cycle * 1.6);
      const twist = Math.max(0, (cycle - 0.5) * 2);
      targetTopY = 0.22 + drop * 0.95;
      targetPcbY = 0.02 + drop * 0.95;
      targetBotY = -0.14 + drop * 0.95;
      targetDockY = -0.28;
      targetCapTwist = (1 - twist) * -0.2618;
    }

    topCapGroup.position.y += (targetTopY - topCapGroup.position.y) * 0.09;
    pcbGroup.position.y += (targetPcbY - pcbGroup.position.y) * 0.09;
    bottomCaseGroup.position.y += (targetBotY - bottomCaseGroup.position.y) * 0.09;
    dockRingGroup.position.y += (targetDockY - dockRingGroup.position.y) * 0.09;

    topCapGroup.rotation.y += (targetCapTwist - topCapGroup.rotation.y) * 0.12;
    pcbGroup.rotation.y = topCapGroup.rotation.y;
    bottomCaseGroup.rotation.y = topCapGroup.rotation.y;

    if (hapticRingAlpha > 0.01) {
      hapticRingScale += 0.035;
      hapticRingAlpha *= 0.92;
      waveMesh.scale.set(hapticRingScale, hapticRingScale, 1);
      waveMat.opacity = hapticRingAlpha;
    } else {
      waveMat.opacity = 0;
    }

    renderer.render(scene, camera);
  }

  animate3D();
}

window.set3DMode = function (mode) {
  current3DMode = mode;
  playMechanicalSwitch(680);
  hapticRingScale = 1.0;
  hapticRingAlpha = 0.85;

  document.getElementById('btn-3d-assembled')?.classList.toggle('active', mode === 'assembled');
  document.getElementById('btn-3d-exploded')?.classList.toggle('active', mode === 'exploded');
  document.getElementById('btn-3d-bayonet')?.classList.toggle('active', mode === 'bayonet');

  const cadReadout = document.getElementById('cad-angle-readout');
  if (cadReadout) {
    if (mode === 'assembled') cadReadout.textContent = 'VISTA ASSEMBLATA IP68 • TRASCINA PER RUOTARE';
    if (mode === 'exploded') cadReadout.textContent = 'VISTA ESPLOSA 4 LIVELLI: CALOTTA + PCB-S1 + LIPO + DOCK';
    if (mode === 'bayonet') cadReadout.textContent = 'SIMULAZIONE INNESTO A BAIONETTA 15° ATTIVA';
  }
};

window.addEventListener('DOMContentLoaded', () => {
  initTeardownScrolly3D();
  initPodWebGL();
});

// ============================================================================
// 6. GESTURE DEMO & IMU OSCILLOGRAPH
// ============================================================================
const oscCanvas = document.getElementById('imu-oscillograph');
const oCtx = oscCanvas ? oscCanvas.getContext('2d') : null;
let oscBurst = 0;
let oscTime = 0;

function renderOscillograph() {
  if (!oscCanvas || !oCtx) return;
  const w = oscCanvas.width;
  const h = oscCanvas.height;
  oCtx.clearRect(0, 0, w, h);

  oCtx.strokeStyle = 'rgba(245, 242, 235, 0.1)';
  oCtx.lineWidth = 1;
  oCtx.beginPath();
  oCtx.moveTo(0, h / 2);
  oCtx.lineTo(w, h / 2);
  oCtx.stroke();

  oCtx.strokeStyle = '#F5F2EB';
  oCtx.lineWidth = 1.6;
  oCtx.beginPath();
  for (let x = 0; x < w; x++) {
    const env = Math.sin((x / w) * Math.PI);
    const wave =
      Math.sin(x * 0.05 + oscTime) * 3.5 +
      oscBurst * Math.sin(x * 0.28 - oscTime * 4) * env;
    const y = h / 2 + wave;
    if (x === 0) oCtx.moveTo(x, y);
    else oCtx.lineTo(x, y);
  }
  oCtx.stroke();

  oCtx.strokeStyle = '#FF3300';
  oCtx.lineWidth = 1.4;
  oCtx.beginPath();
  for (let x = 0; x < w; x++) {
    const env = Math.sin((x / w) * Math.PI);
    const wave =
      Math.cos(x * 0.035 + oscTime * 0.7) * 2.5 +
      oscBurst * 0.75 * Math.cos(x * 0.19 - oscTime * 3) * env;
    const y = h / 2 + wave;
    if (x === 0) oCtx.moveTo(x, y);
    else oCtx.lineTo(x, y);
  }
  oCtx.stroke();

  oscTime += 0.09;
  oscBurst *= 0.92;
  requestAnimationFrame(renderOscillograph);
}
renderOscillograph();

const teKeys = document.querySelectorAll('.te-key');
const monitorAction = document.getElementById('monitor-action');
const monitorCode = document.getElementById('monitor-code');

const cmdData = {
  play: {
    action: 'Spotify • Apple Music: Pausa o Riproduzione avviata nelle cuffie',
    code: 'VIBRAZIONE APTICA SINGOLA',
    impX: 0.28,
    impZ: 0.0
  },
  next: {
    action: 'Brano successivo avviato (il telefono resta chiuso in tasca)',
    code: 'VIBRAZIONE APTICA DOPPIA',
    impX: 0.12,
    impZ: -0.32
  },
  vol: {
    action: 'Volume cuffie regolato tramite giroscopio a 6 assi LSM6DSOX',
    code: 'ROTAZIONE GIROSCOPICA',
    impX: -0.22,
    impZ: 0.38
  },
  call: {
    action: 'Chiamata in arrivo: risposta attivata direttamente negli auricolari',
    code: 'CHIAMATA VOCALE ATTIVA',
    impX: 0.32,
    impZ: 0.18
  },
  clutch: {
    action: 'Sicura sbloccata + Registrazione video avviata su GoPro Hero',
    code: 'GOPRO REC AVVIATO',
    impX: -0.34,
    impZ: -0.25
  }
};

function activateCommand(key) {
  const info = cmdData[key];
  if (!info) return;

  playMechanicalSwitch(640);
  oscBurst = 24;
  gestureImpulseX = info.impX;
  gestureImpulseZ = info.impZ;
  hapticRingScale = 1.0;
  hapticRingAlpha = 0.95;

  teKeys.forEach((btn) => btn.classList.toggle('active', btn.dataset.cmd === key));
  if (monitorAction) monitorAction.textContent = info.action;
  if (monitorCode) monitorCode.textContent = info.code;
}

teKeys.forEach((btn) => {
  btn.addEventListener('click', () => activateCommand(btn.dataset.cmd));
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const map = { '1': 'play', '2': 'next', '3': 'vol', '4': 'call', '5': 'clutch' };
  if (map[e.key]) activateCommand(map[e.key]);
});

// ============================================================================
// 7. INTERACTIVE FOUNDING BACKER POLL & MODAL
// ============================================================================
const pollVotes = [151, 96, 64, 31];
let hasVoted = false;

window.castVote = function (index) {
  playMechanicalSwitch(700);
  if (!hasVoted) {
    pollVotes[index] += 1;
    hasVoted = true;
  }
  const total = pollVotes.reduce((a, b) => a + b, 0);
  const buttons = document.querySelectorAll('.poll-btn');
  buttons.forEach((btn, i) => {
    btn.classList.toggle('voted', i === index);
    const pct = Math.round((pollVotes[i] / total) * 100);
    document.getElementById(`pbar-${i}`).style.width = `${pct}%`;
    document.getElementById(`ppct-${i}`).textContent = `${pct}% (${pollVotes[i]} voti)`;
  });
  const thanks = document.getElementById('poll-thanks');
  if (thanks) thanks.style.display = 'block';
};

const modalOverlay = document.getElementById('modal-overlay');
const modalTierLabel = document.getElementById('modal-tier-label');
const modalOk = document.getElementById('modal-ok');

window.openReserveModal = function (label) {
  playMechanicalSwitch(720);
  modalTierLabel.textContent = label;
  modalOk.style.display = 'none';
  modalOverlay.classList.add('open');
};

window.closeReserveModal = function () {
  modalOverlay.classList.remove('open');
};

window.pickSize = function (btn) {
  playMechanicalSwitch(580);
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('selected'));
  btn.classList.add('selected');
};

window.submitReserve = function () {
  playMechanicalSwitch(880);
  modalOk.style.display = 'block';
  const topCount = document.getElementById('top-backer-count');
  const stickyCount = document.getElementById('sticky-backer-count');
  if (topCount) {
    const nextVal = parseInt(topCount.textContent, 10) + 1;
    topCount.textContent = String(nextVal);
    if (stickyCount) {
      stickyCount.textContent = `${nextVal} SU 500 ISCRITTI`;
    }
  }
};
