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
// 3. SHARED PROCEDURAL HIGH-RES TEXTURES (SINGLE PURE RED LINEA ROSSA)
// ============================================================================
function createTopCapTexture() {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // Conical brushed dark gunmetal titanium base matching the reference photo
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const sheen =
        Math.cos(angle * 2 + 0.8) * 24 +
        Math.sin(angle * 4 - 0.4) * 9 +
        Math.sin(r * 0.45) * 2 +
        (Math.random() - 0.5) * 4;
      const base = 68 + sheen;
      const idx = (y * size + x) * 4;
      data[idx] = Math.min(255, Math.max(0, base + 1));
      data[idx + 1] = Math.min(255, Math.max(0, base));
      data[idx + 2] = Math.min(255, Math.max(0, base - 2));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle dark outer chamfer shadow ring
  ctx.strokeStyle = 'rgba(12, 12, 11, 0.72)';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.47, 0, Math.PI * 2);
  ctx.stroke();

  // Engraved "GLOOVITO" wordmark at bottom parallel to the central Linea Rossa
  ctx.save();
  ctx.fillStyle = 'rgba(18, 18, 16, 0.92)';
  ctx.font = '700 44px "Sora", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GLOOVITO', cx, cy + size * 0.34);
  ctx.restore();

  // Strictly ONE single flush central Linea Rossa (#D91E00 / #E62200) across (0,0)
  const lineLen = size * 0.72;
  const lineThick = 26;
  ctx.fillStyle = '#141412';
  ctx.beginPath();
  ctx.roundRect(cx - lineLen / 2 - 4, cy - lineThick / 2 - 4, lineLen + 8, lineThick + 8, 15);
  ctx.fill();

  ctx.fillStyle = '#D91E00';
  ctx.beginPath();
  ctx.roundRect(cx - lineLen / 2, cy - lineThick / 2, lineLen, lineThick, 12);
  ctx.fill();

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

  // Deep matte black 4-layer solder mask (no yellow lines)
  ctx.fillStyle = '#0D0E0D';
  ctx.fillRect(0, 0, size, size);

  // Subtle dark grey perimeter ground ring
  ctx.strokeStyle = '#383A3C';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  // Central Y=0.00 optical slot & 3 hyper-red LEDs
  ctx.fillStyle = '#1E0603';
  ctx.fillRect(cx - 320, cy - 20, 640, 40);
  ctx.strokeStyle = '#D91E00';
  ctx.lineWidth = 4;
  ctx.strokeRect(cx - 320, cy - 20, 640, 40);

  [-240, 0, 240].forEach((dx) => {
    ctx.fillStyle = '#E62200';
    ctx.beginPath();
    ctx.arc(cx + dx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#B8B4AA';
  ctx.font = '600 22px "Sora", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GLOOVITO-PCB-S1 REV 2.0 • Y=0.00', cx, cy - 34);

  return c;
}

// ============================================================================
// 4. SECTION 02: SCROLLYTELLING 3D EXPLODED TEARDOWN ENGINE
// ============================================================================
const chapterTitles = [
  '01. Il Monolite Sigillato IP68 (Ø 28.0 × 7.5 mm)',
  '02. Inserto Ottico Centrale Linea Rossa (#FF3300)',
  '03. Calotta Unibody CNC in Alluminio 6061-T6',
  '04. Guarnizione Artica FKM Viton (-40 °C • IP68)',
  '05. Scheda Madre 4-Layer GLOOVITO-PCB-S1',
  '06. Attuatore Aptico LRA & Cella LiPo -20 °C (80 mAh)',
  '07. Baionetta Meccanica 15° & Dock Magnetico N52'
];

let teardownTargetStep = 0;
let teardownScrollProgress = 0;

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
  camera.position.set(0, 4.0, 8.0);
  camera.lookAt(0, 0, 0);

  // Use NoToneMapping so #D91E00 red NEVER skews toward yellow
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NoToneMapping;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Balanced neutral studio lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.78));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xd0d8e0, 0.65);
  fillLight.position.set(-5, -4, 5);
  scene.add(fillLight);

  const rootGroup = new THREE.Group();
  rootGroup.rotation.x = 0.48;
  rootGroup.rotation.y = -0.38;
  scene.add(rootGroup);

  // --- PART 1: CNC 6061-T6 UNIBODY TOP CAP WITH FLUSH CENTRAL LINEA ROSSA ---
  // (Single unified top piece: no second floating bar on top!)
  const partTopCap = new THREE.Group();
  const capTex = new THREE.CanvasTexture(createTopCapTexture());
  capTex.anisotropy = 8;
  const gunmetalSideMat = new THREE.MeshStandardMaterial({
    color: 0x383834,
    metalness: 0.78,
    roughness: 0.32
  });
  const gunmetalTopMat = new THREE.MeshStandardMaterial({
    map: capTex,
    metalness: 0.65,
    roughness: 0.32
  });
  const capMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.86, 1.9, 0.34, 64),
    [gunmetalSideMat, gunmetalTopMat, gunmetalSideMat]
  );
  partTopCap.add(capMesh);

  const bezelGeo = new THREE.TorusGeometry(1.86, 0.046, 20, 64);
  bezelGeo.rotateX(Math.PI / 2);
  const bezelMesh = new THREE.Mesh(bezelGeo, gunmetalSideMat);
  bezelMesh.position.y = 0.16;
  partTopCap.add(bezelMesh);
  rootGroup.add(partTopCap);

  // --- PART 2: FKM VITON ARCTIC O-RING SEAL (IP68) ---
  const partORing = new THREE.Group();
  const oringGeo = new THREE.TorusGeometry(1.68, 0.055, 20, 64);
  oringGeo.rotateX(Math.PI / 2);
  const oringMat = new THREE.MeshStandardMaterial({
    color: 0x181816,
    roughness: 0.65,
    metalness: 0.1
  });
  partORing.add(new THREE.Mesh(oringGeo, oringMat));
  rootGroup.add(partORing);

  // --- PART 3: 4-LAYER GLOOVITO-PCB-S1 (nRF52840 + LSM6DSOX + 3 RED LEDS) ---
  const partPCB = new THREE.Group();
  const pcbTex = new THREE.CanvasTexture(createPCBTexture());
  const pcbRimMat = new THREE.MeshStandardMaterial({ color: 0x2a2c2e, metalness: 0.7, roughness: 0.3 });
  const pcbFaceMat = new THREE.MeshStandardMaterial({ map: pcbTex, metalness: 0.35, roughness: 0.45 });

  const pcbBoard = new THREE.Mesh(
    new THREE.CylinderGeometry(1.62, 1.62, 0.08, 64),
    [pcbRimMat, pcbFaceMat, pcbFaceMat]
  );
  partPCB.add(pcbBoard);

  // U1 Raytac nRF52840 RF Shield + Ceramic Antenna
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.82, roughness: 0.25 });
  const u1Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.13, 0.62), shieldMat);
  u1Mesh.position.set(0, 0.095, -0.58);
  partPCB.add(u1Mesh);

  // 3 Equatorial Hyper-Red SMD LEDs along Y=0.00
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xd91e00,
    roughness: 0.3
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

  // --- PART 4: LRA HAPTIC ACTUATOR + ARCTIC LIPO CELL (-20°C, 80mAh) ---
  const partEnergyHaptic = new THREE.Group();
  const lraMat = new THREE.MeshStandardMaterial({ color: 0x7c8085, metalness: 0.8, roughness: 0.28 });
  const lraMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 32), lraMat);
  lraMesh.position.set(-0.52, 0.08, 0);
  partEnergyHaptic.add(lraMesh);

  const lipoMat = new THREE.MeshStandardMaterial({ color: 0x888d94, metalness: 0.72, roughness: 0.34 });
  const lipoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 1.18), lipoMat);
  lipoMesh.position.set(0.22, -0.02, 0);
  partEnergyHaptic.add(lipoMesh);

  rootGroup.add(partEnergyHaptic);

  // --- PART 5: RF LOWER SHELL + 15° BAYONET LUGS ---
  const partLowerShell = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x171715, metalness: 0.32, roughness: 0.52 });
  const shellBody = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.48, 0.24, 64), shellMat);
  partLowerShell.add(shellBody);

  const lugMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.09, 0.28), shellMat);
  lugMesh.position.y = -0.05;
  partLowerShell.add(lugMesh);
  rootGroup.add(partLowerShell);

  // --- PART 6: GLOVE MAGNETIC BAYONET DOCK RING (N52 MAGNETS) ---
  const partGloveDock = new THREE.Group();
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x10100e, metalness: 0.38, roughness: 0.48 });

  const dockTorusGeo = new THREE.TorusGeometry(1.94, 0.22, 24, 64);
  dockTorusGeo.rotateX(Math.PI / 2);
  partGloveDock.add(new THREE.Mesh(dockTorusGeo, dockMat));

  const dockFlange = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.26, 0.12, 64), dockMat);
  dockFlange.position.y = -0.12;
  partGloveDock.add(dockFlange);

  const contactMat = new THREE.MeshStandardMaterial({ color: 0xc0c6cc, metalness: 0.9, roughness: 0.18 });
  const pinGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 16);
  [-0.55, -0.18, 0.18, 0.55].forEach((px) => {
    const pin = new THREE.Mesh(pinGeo, contactMat);
    pin.position.set(px, 0.02, 0);
    partGloveDock.add(pin);
  });

  const n52Mat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.88, roughness: 0.22 });
  const n52Geo = new THREE.CylinderGeometry(0.19, 0.19, 0.09, 24);
  [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((ang) => {
    const mag = new THREE.Mesh(n52Geo, n52Mat);
    mag.position.set(Math.cos(ang) * 1.48, -0.02, Math.sin(ang) * 1.48);
    partGloveDock.add(mag);
  });

  rootGroup.add(partGloveDock);

  // Metadata for the 6 physical exploded layers & their 3D callout labels
  const layers = [
    {
      group: partTopCap,
      closedY: 0.24,
      openY: 1.95,
      label: '01. CALOTTA CNC 6061-T6 + LINEA ROSSA CENTRALE',
      side: 'left',
      focusSteps: [1, 2]
    },
    {
      group: partORing,
      closedY: 0.1,
      openY: 1.12,
      label: '02. GUARNIZIONE ARTICA FKM VITON (IP68)',
      side: 'right',
      focusSteps: [3]
    },
    {
      group: partPCB,
      closedY: 0.0,
      openY: 0.3,
      label: '03. SCHEDA 4-LAYER PCB-S1 (nRF52840 + LSM6DSOX)',
      side: 'left',
      focusSteps: [4]
    },
    {
      group: partEnergyHaptic,
      closedY: -0.12,
      openY: -0.58,
      label: '04. MOTORE APTICO LRA + CELLA LIPO -20 °C',
      side: 'right',
      focusSteps: [5]
    },
    {
      group: partLowerShell,
      closedY: -0.24,
      openY: -1.38,
      label: '05. SCOCCA INFERIORE RF + BAIONETTA 15°',
      side: 'left',
      focusSteps: [6]
    },
    {
      group: partGloveDock,
      closedY: -0.38,
      openY: -2.22,
      label: '06. ANELLO DOCK PASSIVO GUANTO (4× MAGNETI N52)',
      side: 'right',
      focusSteps: [6]
    }
  ];

  // Mouse/Touch Drag Orbit on Teardown Stage
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let userRotY = -0.38;
  let userRotX = 0.48;

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

  let smoothExplode = 0;
  let smoothFocusY = 0;

  function renderTeardown() {
    requestAnimationFrame(renderTeardown);

    if (!isDragging) {
      userRotY += 0.0028;
    }

    const targetExplode =
      teardownTargetStep === 0
        ? 0.0
        : Math.min(1.0, 0.35 + teardownTargetStep * 0.13);

    smoothExplode += (targetExplode - smoothExplode) * 0.08;

    let desiredFocusY = 0;
    layers.forEach((l) => {
      const curY = l.closedY + (l.openY - l.closedY) * smoothExplode;
      l.group.position.y += (curY - l.group.position.y) * 0.1;

      const isFocused = l.focusSteps.includes(teardownTargetStep);
      const targetScale = isFocused ? 1.06 : 1.0;
      l.group.scale.x += (targetScale - l.group.scale.x) * 0.1;
      l.group.scale.y += (targetScale - l.group.scale.y) * 0.1;
      l.group.scale.z += (targetScale - l.group.scale.z) * 0.1;

      if (isFocused) {
        desiredFocusY = curY * 0.25;
      }
    });

    smoothFocusY += (desiredFocusY - smoothFocusY) * 0.07;
    rootGroup.position.y = -smoothFocusY;

    const chapterTiltX = teardownTargetStep === 4 ? 0.65 : 0.45;
    rootGroup.rotation.x += (userRotX * 0.65 + chapterTiltX * 0.35 - rootGroup.rotation.x) * 0.09;
    rootGroup.rotation.y += (userRotY - rootGroup.rotation.y) * 0.09;

    renderer.render(scene, camera);

    if (svgOverlay) {
      if (smoothExplode < 0.18) {
        svgOverlay.innerHTML = '';
      } else {
        let svgMarkup = '';
        layers.forEach((l) => {
          const worldVec = new THREE.Vector3();
          l.group.getWorldPosition(worldVec);
          worldVec.x += l.side === 'left' ? -1.5 : 1.5;
          worldVec.project(camera);

          const sx = (worldVec.x * 0.5 + 0.5) * 800;
          const sy = (-worldVec.y * 0.5 + 0.5) * 600;
          const endX = l.side === 'left' ? 46 : 754;
          const elbowX = l.side === 'left' ? sx - 36 : sx + 36;
          const isFocused = l.focusSteps.includes(teardownTargetStep);
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
  renderer.toneMapping = THREE.NoToneMapping;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.78));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xc8d4e3, 0.65);
  fillLight.position.set(-4, -5, 4);
  scene.add(fillLight);

  const assembly = new THREE.Group();
  assembly.rotation.x = 0.48;
  assembly.rotation.y = -0.35;
  scene.add(assembly);

  // Layer 1: Top Cap with flush single Linea Rossa (NO duplicate 3D box!)
  const topCapGroup = new THREE.Group();
  const topCapTex = new THREE.CanvasTexture(createTopCapTexture());
  topCapTex.anisotropy = 8;

  const gunmetalSideMat = new THREE.MeshStandardMaterial({
    color: 0x383834,
    metalness: 0.78,
    roughness: 0.32
  });
  const gunmetalTopMat = new THREE.MeshStandardMaterial({
    map: topCapTex,
    metalness: 0.65,
    roughness: 0.32
  });

  const capGeo = new THREE.CylinderGeometry(1.85, 1.9, 0.34, 64);
  const capMesh = new THREE.Mesh(capGeo, [gunmetalSideMat, gunmetalTopMat, gunmetalSideMat]);
  topCapGroup.add(capMesh);

  const rimGeo = new THREE.TorusGeometry(1.86, 0.045, 20, 64);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, gunmetalSideMat);
  rimMesh.position.y = 0.16;
  topCapGroup.add(rimMesh);

  assembly.add(topCapGroup);

  // Layer 2: PCB
  const pcbGroup = new THREE.Group();
  const pcbTex = new THREE.CanvasTexture(createPCBTexture());
  const pcbSideMat = new THREE.MeshStandardMaterial({ color: 0x2a2c2e, metalness: 0.7, roughness: 0.3 });
  const pcbFaceMat = new THREE.MeshStandardMaterial({ map: pcbTex, metalness: 0.35, roughness: 0.45 });

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
    color: 0xd91e00,
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
// 6. GESTURE DEMO & SINGLE-LINE IMU OSCILLOGRAPH
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

  // Single pure #FF3300 red telemetry waveform
  oCtx.strokeStyle = '#FF3300';
  oCtx.lineWidth = 1.8;
  oCtx.beginPath();
  for (let x = 0; x < w; x++) {
    const env = Math.sin((x / w) * Math.PI);
    const wave =
      Math.sin(x * 0.05 + oscTime) * 3.0 +
      oscBurst * Math.sin(x * 0.26 - oscTime * 4) * env;
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
