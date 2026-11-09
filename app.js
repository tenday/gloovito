// ============================================================================
// GLOOVITO V2 — KINETIC CINEMA ENGINE, 3D TILT & MAGNETIC POD SWAP
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

function playMagneticSwapSound() {
  if (!soundActive || !audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(480, now + 0.35);
  osc.frequency.exponentialRampToValueAtTime(190, now + 0.55);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.6);
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

// (Custom magnetic cursor removed: using clean native system cursor)

// ============================================================================
// 2. INTERSECTION OBSERVER: SHUTTER UNMASKING & KINETIC REVEALS
// ============================================================================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll('.reveal-up, .shutter-reveal').forEach((el) => {
  revealObserver.observe(el);
});

// ============================================================================
// 3. 3D PERSPECTIVE TILT & SPECULAR SHEEN ON ALL BRANDED IMAGES
// ============================================================================
document.querySelectorAll('.tilt-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;

    const rotY = normX * 9;
    const rotX = -normY * 9;

    card.style.transform = `perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    card.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg)';
  });
});

// ============================================================================
// 4. SCROLLYTELLING HERO ZOOM
// ============================================================================
const heroWrapper = document.getElementById('hero-wrapper');
const heroMedia = document.getElementById('hero-media');
const heroTitle = document.getElementById('hero-title');

window.addEventListener('scroll', () => {
  if (heroWrapper && heroMedia) {
    const rect = heroWrapper.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / (window.innerHeight * 0.95)));
    const scale = 1 + progress * 0.16;
    heroMedia.style.transform = `scale(${scale.toFixed(4)})`;
    heroMedia.style.filter = `contrast(1.14) brightness(${0.9 - progress * 0.22})`;
    if (heroTitle) {
      heroTitle.style.transform = `translateY(${(-progress * 34).toFixed(1)}px)`;
    }
  }
});

// ============================================================================
// 5. INTERACTIVE MAGNETIC POD SWAP STAGE (URBAN-01 ⇄ ALPINE-PRO)
// ============================================================================
const swapCanvas = document.getElementById('swap-canvas');
const sCtx = swapCanvas.getContext('2d');
const btnTriggerSwap = document.getElementById('btn-trigger-swap');
const swapStatusText = document.getElementById('swap-status-text');

let swapTarget = 0; // 0 = Docked on URBAN-01 (Left), 1 = Docked on ALPINE-PRO (Right)
let swapPos = 0;    // Animated 0..1
let swapSnapBurst = 0;

function triggerPodSwap() {
  swapTarget = swapTarget === 0 ? 1 : 0;
  playMagneticSwapSound();
  swapSnapBurst = 1.0;
  if (swapTarget === 1) {
    swapStatusText.textContent = 'INNESTATO SU GLOOVITO ALPINE-PRO (PROFILO PISTA -20°C + GOPRO ATTIVO)';
  } else {
    swapStatusText.textContent = 'INNESTATO SU GLOOVITO URBAN-01 (PROFILO CITTÀ -5°C ATTIVO)';
  }
}

if (btnTriggerSwap) btnTriggerSwap.addEventListener('click', triggerPodSwap);
if (swapCanvas) swapCanvas.addEventListener('click', triggerPodSwap);

function renderSwapStage() {
  if (!swapCanvas) return;
  const w = swapCanvas.width;
  const h = swapCanvas.height;
  sCtx.clearRect(0, 0, w, h);

  // Smooth spring-like ease toward swapTarget
  swapPos += (swapTarget - swapPos) * 0.075;
  swapSnapBurst *= 0.93;

  const leftDockX = w * 0.23;
  const rightDockX = w * 0.77;
  const centerY = h * 0.54;

  // Background Grid lines
  sCtx.strokeStyle = 'rgba(245, 242, 235, 0.05)';
  sCtx.lineWidth = 1;
  for (let gx = 60; gx < w; gx += 60) {
    sCtx.beginPath();
    sCtx.moveTo(gx, 0);
    sCtx.lineTo(gx, h);
    sCtx.stroke();
  }

  // Magnetic trajectory arc between Left Dock and Right Dock
  sCtx.setLineDash([6, 6]);
  sCtx.strokeStyle = 'rgba(245, 242, 235, 0.22)';
  sCtx.lineWidth = 1.5;
  sCtx.beginPath();
  sCtx.moveTo(leftDockX, centerY);
  sCtx.quadraticCurveTo(w * 0.5, centerY - 95, rightDockX, centerY);
  sCtx.stroke();
  sCtx.setLineDash([]);

  // Draw Left Dock Station: GLOOVITO URBAN-01
  drawGloveDock(leftDockX, centerY, 'GLOOVITO URBAN-01', 'DOCK CITTÀ // -5°C', 1 - swapPos);

  // Draw Right Dock Station: GLOOVITO ALPINE-PRO
  drawGloveDock(rightDockX, centerY, 'GLOOVITO ALPINE-PRO', 'DOCK PISTA // -20°C', swapPos);

  // Compute current Pod coordinates along parabolic arc
  const t = swapPos;
  const podX = (1 - t) * (1 - t) * leftDockX + 2 * (1 - t) * t * (w * 0.5) + t * t * rightDockX;
  const podY = (1 - t) * (1 - t) * centerY + 2 * (1 - t) * t * (centerY - 95) + t * t * centerY;
  const inFlight = Math.sin(t * Math.PI); // 0 at docks, 1 at apex

  // Draw magnetic lock wave
  if (swapSnapBurst > 0.03) {
    sCtx.strokeStyle = `rgba(255, 51, 0, ${swapSnapBurst.toFixed(2)})`;
    sCtx.lineWidth = 2.5;
    sCtx.beginPath();
    sCtx.arc(podX, podY, 64 + (1 - swapSnapBurst) * 44, 0, Math.PI * 2);
    sCtx.stroke();
  }

  // Draw Moving GLOOVITO POD-S1 Capsule
  const podRadius = 56 + inFlight * 10;
  sCtx.save();
  sCtx.translate(podX, podY);
  sCtx.rotate(t * Math.PI * 2);

  // Shadow in flight
  sCtx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  sCtx.shadowBlur = 18 + inFlight * 24;

  const grad = sCtx.createLinearGradient(-podRadius, -podRadius, podRadius, podRadius);
  grad.addColorStop(0, '#32322E');
  grad.addColorStop(0.5, '#141412');
  grad.addColorStop(1, '#292925');

  sCtx.fillStyle = grad;
  sCtx.beginPath();
  sCtx.arc(0, 0, podRadius, 0, Math.PI * 2);
  sCtx.fill();

  sCtx.strokeStyle = '#F5F2EB';
  sCtx.lineWidth = 1.8;
  sCtx.stroke();

  // Iconic Red-Orange Linea Rossa Stripe across the Pod
  sCtx.strokeStyle = '#FF3300';
  sCtx.lineWidth = 4;
  sCtx.beginPath();
  sCtx.moveTo(-podRadius * 0.62, -podRadius * 0.45);
  sCtx.lineTo(podRadius * 0.62, podRadius * 0.45);
  sCtx.stroke();

  sCtx.restore();

  // Pod Label below/above capsule
  sCtx.fillStyle = '#F5F2EB';
  sCtx.font = '700 12px "Sora", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.fillText('GLOOVITO POD-S1', podX, podY - podRadius - 14);

  requestAnimationFrame(renderSwapStage);
}

function drawGloveDock(x, y, modelName, subLabel, activeWeight) {
  // Outer Glove Silhouette Plate
  sCtx.fillStyle = activeWeight > 0.5 ? 'rgba(255, 51, 0, 0.07)' : 'rgba(245, 242, 235, 0.02)';
  sCtx.strokeStyle = activeWeight > 0.5 ? 'rgba(255, 51, 0, 0.55)' : 'rgba(245, 242, 235, 0.16)';
  sCtx.lineWidth = 1.5;
  sCtx.beginPath();
  sCtx.roundRect(x - 165, y - 92, 330, 184, 8);
  sCtx.fill();
  sCtx.stroke();

  // Empty Magnetic Ring Socket
  sCtx.strokeStyle = 'rgba(245, 242, 235, 0.28)';
  sCtx.lineWidth = 2;
  sCtx.beginPath();
  sCtx.arc(x, y, 60, 0, Math.PI * 2);
  sCtx.stroke();

  // Model Name Typography
  sCtx.fillStyle = '#F5F2EB';
  sCtx.font = '800 16px "Sora", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.fillText(modelName, x, y + 122);

  sCtx.fillStyle = activeWeight > 0.5 ? '#FF3300' : '#74716A';
  sCtx.font = '600 11px "Sora", sans-serif';
  sCtx.fillText(subLabel, x, y - 108);
}

renderSwapStage();

// ============================================================================
// 6. GLOOVITO POD-S1 PRECISION CAD VIEW
// ============================================================================
const podCanvas = document.getElementById('pod-hardware-canvas');
const pCtx = podCanvas.getContext('2d');
const cadAngleReadout = document.getElementById('cad-angle-readout');

let podAngle = 0;
let targetAngle = 0;
let pulseEnergy = 0;
let activeGestureLabel = 'PLAY / PAUSA MUSICA';

podCanvas.addEventListener('mousemove', (e) => {
  const r = podCanvas.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  targetAngle = Math.atan2(dy, dx);
  cadAngleReadout.textContent = 'SENSORE INERZIALE POD-S1 ATTIVO';
});

podCanvas.addEventListener('click', () => {
  pulseEnergy = 1.0;
  playMechanicalSwitch(740);
});

function renderPodCad() {
  const w = podCanvas.width;
  const h = podCanvas.height;
  const cx = w / 2;
  const cy = h / 2;

  pCtx.clearRect(0, 0, w, h);
  podAngle += (targetAngle - podAngle) * 0.08;
  pulseEnergy *= 0.92;

  pCtx.strokeStyle = 'rgba(245, 242, 235, 0.08)';
  pCtx.lineWidth = 1;
  pCtx.beginPath();
  pCtx.moveTo(40, cy);
  pCtx.lineTo(w - 40, cy);
  pCtx.moveTo(cx, 30);
  pCtx.lineTo(cx, h - 30);
  pCtx.stroke();

  pCtx.setLineDash([3, 5]);
  pCtx.strokeStyle = 'rgba(245, 242, 235, 0.2)';
  pCtx.beginPath();
  pCtx.arc(cx, cy, 156, 0, Math.PI * 2);
  pCtx.stroke();
  pCtx.setLineDash([]);

  if (pulseEnergy > 0.02) {
    pCtx.strokeStyle = `rgba(255, 51, 0, ${pulseEnergy.toFixed(2)})`;
    pCtx.lineWidth = 2.5;
    pCtx.beginPath();
    pCtx.arc(cx, cy, 130 + (1 - pulseEnergy) * 52, 0, Math.PI * 2);
    pCtx.stroke();
  }

  const bezelGrad = pCtx.createLinearGradient(cx - 130, cy - 130, cx + 130, cy + 130);
  bezelGrad.addColorStop(0, '#2C2C29');
  bezelGrad.addColorStop(0.5, '#151513');
  bezelGrad.addColorStop(1, '#252522');

  pCtx.fillStyle = bezelGrad;
  pCtx.beginPath();
  pCtx.arc(cx, cy, 130, 0, Math.PI * 2);
  pCtx.fill();

  pCtx.strokeStyle = 'rgba(245, 242, 235, 0.35)';
  pCtx.lineWidth = 1.5;
  pCtx.stroke();

  pCtx.save();
  pCtx.translate(cx, cy);
  pCtx.rotate(podAngle * 0.25);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const isMajor = i % 5 === 0;
    const r1 = isMajor ? 114 : 119;
    const r2 = 126;
    pCtx.strokeStyle = isMajor ? 'rgba(245, 242, 235, 0.48)' : 'rgba(245, 242, 235, 0.16)';
    pCtx.lineWidth = isMajor ? 1.4 : 1;
    pCtx.beginPath();
    pCtx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    pCtx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    pCtx.stroke();
  }
  pCtx.restore();

  pCtx.fillStyle = '#0A0A09';
  pCtx.beginPath();
  pCtx.arc(cx, cy, 102, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.strokeStyle = 'rgba(245, 242, 235, 0.2)';
  pCtx.lineWidth = 1;
  pCtx.stroke();

  pCtx.strokeStyle = '#FF3300';
  pCtx.lineWidth = 3.5;
  pCtx.beginPath();
  pCtx.arc(cx, cy, 92, podAngle - 0.55, podAngle + 0.55);
  pCtx.stroke();

  pCtx.fillStyle = '#FF3300';
  pCtx.fillRect(cx - 88, cy - 3, 176, 6);

  pCtx.fillStyle = '#F5F2EB';
  pCtx.font = '700 13px "Sora", sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText('GLOOVITO POD-S1', cx, cy - 22);

  pCtx.fillStyle = '#B8B4AA';
  pCtx.font = '500 9px "Sora", sans-serif';
  pCtx.fillText(activeGestureLabel, cx, cy + 28);

  pCtx.fillStyle = '#B8B4AA';
  pCtx.font = '400 10px "Sora", sans-serif';
  pCtx.textAlign = 'left';
  pCtx.fillText('MODELLO: POD-S1 // TITANIO ANODIZZATO', 22, 28);
  pCtx.textAlign = 'right';
  pCtx.fillText('COMPATIBILE CON URBAN-01 E ALPINE-PRO', w - 22, h - 18);

  requestAnimationFrame(renderPodCad);
}
renderPodCad();

// ============================================================================
// 7. GESTURE DEMO & OSCILLOGRAPH
// ============================================================================
const oscCanvas = document.getElementById('imu-oscillograph');
const oCtx = oscCanvas.getContext('2d');
let oscBurst = 0;
let oscTime = 0;

function renderOscillograph() {
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
    action: 'Spotify / Apple Music: Pausa o Riproduzione avviata nelle cuffie',
    code: 'VIBRAZIONE SINGOLA',
    cad: 'PLAY / PAUSA MUSICA'
  },
  next: {
    action: 'Brano successivo avviato (il telefono resta chiuso in tasca)',
    code: 'VIBRAZIONE DOPPIA',
    cad: 'BRANO SUCCESSIVO'
  },
  vol: {
    action: 'Volume cuffie alzato ruotando leggermente il polso',
    code: 'REGOLAZIONE FLUIDA',
    cad: 'VOLUME + / -'
  },
  call: {
    action: 'Chiamata in arrivo: risposta attivata direttamente negli auricolari',
    code: 'CHIAMATA ATTIVA',
    cad: 'RISPOSTA CHIAMATA'
  },
  clutch: {
    action: 'Sicura sbloccata + Registrazione video avviata su GoPro Hero',
    code: 'REC AVVIATO',
    cad: 'SICURA + GOPRO REC'
  }
};

function activateCommand(key) {
  const info = cmdData[key];
  if (!info) return;

  playMechanicalSwitch(640);
  oscBurst = 24;
  pulseEnergy = 1.0;
  targetAngle += 0.65;
  activeGestureLabel = info.cad;

  teKeys.forEach((btn) => btn.classList.toggle('active', btn.dataset.cmd === key));
  monitorAction.textContent = info.action;
  monitorCode.textContent = info.code;
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
// 8. INTERACTIVE FOUNDING BACKER POLL & MODAL
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
      stickyCount.textContent = `${nextVal} / 500 ISCRITTI`;
    }
  }
};
