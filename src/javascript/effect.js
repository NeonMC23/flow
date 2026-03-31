const audioElement = document.getElementById("audio");
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 4096;

const source = audioCtx.createMediaElementSource(audioElement);
source.connect(analyser);
analyser.connect(audioCtx.destination);

const canvas = document.getElementById("oscilloscope");
const canvasCtx = canvas.getContext("2d");
const orbs = Array.from(document.querySelectorAll(".orb"));
const bufferLength = analyser.fftSize;
const dataArray = new Uint8Array(bufferLength);
let smoothRms = 0;
let gain = 1;

function resizeOscilloscope() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = 48 * dpr;
  canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeOscilloscope();
window.addEventListener("resize", resizeOscilloscope);

audioElement.addEventListener("play", () => {
  if (audioCtx.state !== "running") {
    audioCtx.resume();
  }
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

  analyser.getByteTimeDomainData(dataArray);

  canvasCtx.fillStyle = "rgba(6, 8, 12, 0.85)";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "#e055b8";
  canvasCtx.beginPath();

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
