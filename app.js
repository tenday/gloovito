// ============================================================================
// GLOOVITO — WEBGL 3D PBR HARDWARE ENGINE & INTERACTIVE GESTURE SIMULATOR
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
// 3. REAL THREE.JS WEBGL 3D PBR STAGE FOR GLOOVITO POD-S1
// ============================================================================
let current3DMode = 'assembled'; // 'assembled' | 'exploded' | 'bayonet'
let gestureImpulseX = 0;
let gestureImpulseZ = 0;
let hapticRingScale = 0;
let hapticRingAlpha = 0;

function createTopCapTexture() {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // Conical brushed dark gunmetal titanium base matching the canonical photograph
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      // Anisotropic conical brushing sheen
      const sheen =
        Math.cos(angle * 2 + 0.8) * 26 +
        Math.sin(angle * 4 - 0.4) * 10 +
        Math.sin(r * 0.45) * 2.5 +
        (Math.random() - 0.5) * 5;
      const base = 74 + sheen;
      const idx = (y * size + x) * 4;
      data[idx] = Math.min(255, Math.max(0, base + 2));
      data[idx + 1] = Math.min(255, Math.max(0, base));
      data[idx + 2] = Math.min(255, Math.max(0, base - 3));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle outer chamfer shadow ring
  ctx.strokeStyle = 'rgba(15, 15, 14, 0.65)';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.47, 0, Math.PI * 2);
  ctx.stroke();

  // Engraved "GLOOVITO" wordmark at bottom parallel to the central Linea Rossa
  ctx.save();
  ctx.fillStyle = 'rgba(22, 22, 20, 0.88)';
  ctx.font = '700 44px "Sora", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('GLOOVITO', cx, cy + size * 0.34);
  ctx.restore();

  // Central recessed groove for the #FF3300 Linea Rossa across exact center (0,0)
  const lineLen = size * 0.74;
  const lineThick = 28;
  ctx.fillStyle = '#181816';
  ctx.beginPath();
  ctx.roundRect(cx - lineLen / 2 - 4, cy - lineThick / 2 - 4, lineLen + 8, lineThick + 8, 16);
  ctx.fill();

  // Physical non-emissive vermilion #FF3300 Linea Rossa inlay
  const redGrad = ctx.createLinearGradient(cx - lineLen / 2, cy - lineThick / 2, cx + lineLen / 2, cy + lineThick / 2);
  redGrad.addColorStop(0, '#E62E00');
  redGrad.addColorStop(0.5, '#FF3B0A');
  redGrad.addColorStop(1, '#CC2900');
  ctx.fillStyle = redGrad;
  ctx.beginPath();
  ctx.roundRect(cx - lineLen / 2, cy - lineThick / 2, lineLen, lineThick, 13);
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

  // Matte black 4-layer solder mask
  ctx.fillStyle = '#101211';
  ctx.fillRect(0, 0, size, size);

  // Gold ENIG perimeter ground ring
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  // Gold traces
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
  ctx.lineWidth = 4;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 38, cy - 320);
    ctx.lineTo(cx + i * 38, cy + 320);
    ctx.stroke();
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

  // Silkscreen text
  ctx.fillStyle = '#F5F2EB';
  ctx.font = '600 22px "Sora", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GLOOVITO-PCB-S1 REV 2.0 • Y=0.00 AXIS', cx, cy - 34);

  return c;
}

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

  // Studio 3-Point Lighting
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

  // Root Assembly Group
  const assembly = new THREE.Group();
  assembly.rotation.x = 0.42;
  assembly.rotation.y = -0.35;
  scene.add(assembly);

  // ---------------- LAYER 1: CNC 6061-T6 TOP CAP (Ø 28mm) ----------------
  const topCapGroup = new THREE.Group();
  const topCapTex = new THREE.CanvasTexture(createTopCapTexture());
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

  // Main CNC Cap Cylinder
  const capGeo = new THREE.CylinderGeometry(1.85, 1.9, 0.34, 64);
  const capMesh = new THREE.Mesh(capGeo, [gunmetalSideMat, gunmetalTopMat, gunmetalSideMat]);
  topCapGroup.add(capMesh);

  // Outer Machined Chamfer Ring
  const rimGeo = new THREE.TorusGeometry(1.86, 0.045, 20, 64);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, gunmetalSideMat);
  rimMesh.position.y = 0.16;
  topCapGroup.add(rimMesh);

  // Physical 3D Central Linea Rossa Bar (#FF3300)
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

  // ---------------- LAYER 2: 4-LAYER GLOOVITO-PCB-S1 (Ø 24.5mm) ----------------
  const pcbGroup = new THREE.Group();
  const pcbTex = new THREE.CanvasTexture(createPCBTexture());
  const pcbSideMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
  const pcbFaceMat = new THREE.MeshStandardMaterial({ map: pcbTex, metalness: 0.45, roughness: 0.4 });

  const pcbGeo = new THREE.CylinderGeometry(1.62, 1.62, 0.08, 64);
  const pcbMesh = new THREE.Mesh(pcbGeo, [pcbSideMat, pcbFaceMat, pcbFaceMat]);
  pcbGroup.add(pcbMesh);

  // U1 Raytac nRF52840 Metal Shield in Upper Hemisphere (Z < 0)
  const u1Geo = new THREE.BoxGeometry(0.95, 0.12, 0.62);
  const u1Mat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.85, roughness: 0.22 });
  const u1Mesh = new THREE.Mesh(u1Geo, u1Mat);
  u1Mesh.position.set(0, 0.09, -0.58);
  pcbGroup.add(u1Mesh);

  // U2 LSM6DSOX 6-Axis IMU in Lower Hemisphere (Z > 0)
  const u2Geo = new THREE.BoxGeometry(0.38, 0.09, 0.32);
  const u2Mat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.6 });
  const u2Mesh = new THREE.Mesh(u2Geo, u2Mat);
  u2Mesh.position.set(0, 0.075, 0.45);
  pcbGroup.add(u2Mesh);

  // DRV2605L & TPS62740 ICs
  const icMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.24), u2Mat);
  icMeshL.position.set(-0.58, 0.075, 0.45);
  pcbGroup.add(icMeshL);

  const icMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.28), u2Mat);
  icMeshR.position.set(0.58, 0.075, 0.45);
  pcbGroup.add(icMeshR);

  assembly.add(pcbGroup);

  // ---------------- LAYER 3: LIPO CELL + RF LOWER SHELL ----------------
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

  // 2 Bayonet Lugs on the lower boss
  const lugGeo = new THREE.BoxGeometry(3.18, 0.09, 0.28);
  const lugMesh = new THREE.Mesh(lugGeo, lowerShellMat);
  lugMesh.position.y = -0.14;
  bottomCaseGroup.add(lugMesh);

  assembly.add(bottomCaseGroup);

  // ---------------- LAYER 4: GLOVE MAGNETIC BAYONET DOCK RING ----------------
  const dockRingGroup = new THREE.Group();
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x121210, metalness: 0.4, roughness: 0.48 });

  // Outer Dock Ring (Torus + Base Flange)
  const dockTorusGeo = new THREE.TorusGeometry(1.92, 0.22, 24, 64);
  dockTorusGeo.rotateX(Math.PI / 2);
  const dockTorusMesh = new THREE.Mesh(dockTorusGeo, dockMat);
  dockRingGroup.add(dockTorusMesh);

  const dockBaseGeo = new THREE.CylinderGeometry(2.15, 2.18, 0.12, 64);
  const dockBaseMesh = new THREE.Mesh(dockBaseGeo, dockMat);
  dockBaseMesh.position.y = -0.12;
  dockRingGroup.add(dockBaseMesh);

  // 4 Gold Pogo-Pins & 4 N52 Neodymium Magnets inside Dock
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc83b, metalness: 0.95, roughness: 0.15 });
  const pogoGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16);
  [-0.55, -0.18, 0.18, 0.55].forEach((px) => {
    const pogo = new THREE.Mesh(pogoGeo, goldMat);
    pogo.position.set(px, -0.02, 0);
    dockRingGroup.add(pogo);
  });

  const magMat = new THREE.MeshStandardMaterial({ color: 0xa0a6ad, metalness: 0.9, roughness: 0.2 });
  const magGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24);
  [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((ang) => {
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(Math.cos(ang) * 1.45, -0.04, Math.sin(ang) * 1.45);
    dockRingGroup.add(mag);
  });

  assembly.add(dockRingGroup);

  // ---------------- 3D HAPTIC PULSE WAVE RING ----------------
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

  // ---------------- INTERACTIVE MOUSE & TOUCH ORBIT ----------------
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

  // ---------------- ANIMATION LOOP ----------------
  let clockTime = 0;
  function animate3D() {
    requestAnimationFrame(animate3D);
    clockTime += 0.018;

    if (!isDragging) {
      targetRotY += 0.0035;
    }

    // Apply smooth orbit + gesture impulse
    assembly.rotation.x += (targetRotX + gestureImpulseX - assembly.rotation.x) * 0.1;
    assembly.rotation.y += (targetRotY - assembly.rotation.y) * 0.1;
    assembly.rotation.z += (gestureImpulseZ - assembly.rotation.z) * 0.12;
    gestureImpulseX *= 0.88;
    gestureImpulseZ *= 0.88;

    // Layer vertical positions based on current3DMode
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
      // Cyclic 15-degree bayonet drop & lock animation
      const cycle = (Math.sin(clockTime * 1.8) + 1) * 0.5; // 0..1
      const drop = Math.max(0, 1 - cycle * 1.6);
      const twist = Math.max(0, (cycle - 0.5) * 2);
      targetTopY = 0.22 + drop * 0.95;
      targetPcbY = 0.02 + drop * 0.95;
      targetBotY = -0.14 + drop * 0.95;
      targetDockY = -0.28;
      // 15 degrees = 0.2618 radians
      targetCapTwist = (1 - twist) * -0.2618;
    }

    topCapGroup.position.y += (targetTopY - topCapGroup.position.y) * 0.09;
    pcbGroup.position.y += (targetPcbY - pcbGroup.position.y) * 0.09;
    bottomCaseGroup.position.y += (targetBotY - bottomCaseGroup.position.y) * 0.09;
    dockRingGroup.position.y += (targetDockY - dockRingGroup.position.y) * 0.09;

    topCapGroup.rotation.y += (targetCapTwist - topCapGroup.rotation.y) * 0.12;
    pcbGroup.rotation.y = topCapGroup.rotation.y;
    bottomCaseGroup.rotation.y = topCapGroup.rotation.y;

    // Haptic wave ring animation
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
  initPodWebGL();
});

// ============================================================================
// 4. GESTURE DEMO & IMU OSCILLOGRAPH
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
// 5. INTERACTIVE FOUNDING BACKER POLL & MODAL
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
