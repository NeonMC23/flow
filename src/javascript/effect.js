const audioElement = document.getElementById("audio");
let audioCtx = null;
let analyser = null;
let source = null;
let desiredFftSize = 4096;
let desiredLineWidth = 1;
let desiredOscColor = "#ff66cc";

const canvas = document.getElementById("oscilloscope");
const canvasCtx = canvas.getContext("2d");
const orbs = Array.from(document.querySelectorAll(".orb"));
let dataArray = new Uint8Array(desiredFftSize);
let smoothRms = 0;
let gain = 1;

function resizeOscilloscope() {
  const dpr = window.devicePixelRatio || 1;
  const height = parseFloat(getComputedStyle(canvas).height) || 48;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = height * dpr;
  canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeOscilloscope();
window.addEventListener("resize", resizeOscilloscope);

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = desiredFftSize;
    source = audioCtx.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    canvasCtx.lineWidth = desiredLineWidth;
  }
  if (audioCtx.state !== "running") {
    audioCtx.resume();
  }
}

audioElement.addEventListener("play", () => {
  ensureAudioContext();
});

document.addEventListener("pointerdown", () => {
  ensureAudioContext();
});

function initOrbs() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minSize = 160;
  const maxSize = 520;

  orbs.forEach((orb) => {
    const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = 0.45 + Math.random() * 0.35;

    orb.style.setProperty("--orb-size", `${size}px`);
    orb.style.opacity = alpha.toString();
    orb.style.left = `${x}px`;
    orb.style.top = `${y}px`;
    orb.dataset.baseX = x.toString();
    orb.dataset.baseY = y.toString();
  });
}

initOrbs();
window.addEventListener("resize", initOrbs);

function draw() {
  requestAnimationFrame(draw);

  if (!analyser) {
    canvasCtx.fillStyle = "rgba(6, 8, 12, 0.85)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = desiredLineWidth;
    canvasCtx.strokeStyle = desiredOscColor;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2);
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
    return;
  }

  if (dataArray.length !== analyser.fftSize) {
    dataArray = new Uint8Array(analyser.fftSize);
  }
  analyser.getByteTimeDomainData(dataArray);

  canvasCtx.fillStyle = "rgba(6, 8, 12, 0.85)";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = desiredOscColor;
  canvasCtx.beginPath();

  const bufferLength = analyser.fftSize;
  const sliceWidth = canvas.width / bufferLength;
  let x = 0;
  let sum = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const centered = v - 1.0;
    sum += centered * centered;
  }

  const rms = Math.sqrt(sum / bufferLength);
  smoothRms = smoothRms * 0.85 + rms * 0.15;

  const target = smoothRms > 0.0001 ? 0.45 / smoothRms : 1;
  const clampedTarget = Math.min(Math.max(target, 1.0), 2.6);
  const attack = 0.25;
  const release = 0.05;
  gain = gain + (clampedTarget - gain) * (clampedTarget > gain ? attack : release);

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const centered = (v - 1.0) * gain;
    const y = canvas.height / 2 + centered * (canvas.height / 2);

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();

  if (orbs.length > 0) {
    const pulse = 0.7 + rms * 1.6;
    const t = performance.now() * 0.00025;

    orbs.forEach((orb, i) => {
      const driftX = Math.sin(t + i) * 20;
      const driftY = Math.cos(t * 1.3 + i) * 18;
      const scale = pulse + i * 0.06;
      orb.style.transform = `translate3d(${driftX}px, ${driftY}px, 0) scale(${scale})`;
    });
  }
}

draw();

function applyOscSettings(settings) {
  if (!settings) return;
  const fft = parseInt(settings.oscFftSize, 10);
  if (Number.isFinite(fft)) {
    const clamped = Math.min(Math.max(fft, 256), 16384);
    desiredFftSize = clamped;
    if (analyser && analyser.fftSize !== clamped) {
      analyser.fftSize = clamped;
    }
  }
  if (Number.isFinite(settings.oscLineWidth)) {
    desiredLineWidth = settings.oscLineWidth;
    canvasCtx.lineWidth = settings.oscLineWidth;
  }
  if (settings.oscColor) {
    desiredOscColor = settings.oscColor;
  }
  resizeOscilloscope();
}

window.addEventListener("flow:settings", (e) => {
  applyOscSettings(e.detail);
});

if (window.flowSettings) {
  applyOscSettings(window.flowSettings);
}
