// Initialisation du contexte audio
const audioElement = document.getElementById("audio");
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;

// Connexion du <audio> à l'analyseur
const source = audioCtx.createMediaElementSource(audioElement);
source.connect(analyser);
analyser.connect(audioCtx.destination);

// Préparation du canvas
const canvas = document.getElementById("oscilloscope");
const canvasCtx = canvas.getContext("2d");

function resizeOscilloscope() {
  canvas.width = canvas.offsetWidth;
  canvas.height = 100;
}
resizeOscilloscope();
window.addEventListener("resize", resizeOscilloscope);

// Dessin en boucle
function draw() {
  requestAnimationFrame(draw);

  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  canvasCtx.fillStyle = "#000";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "#e055b8";
  canvasCtx.beginPath();

  const sliceWidth = canvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;

    i === 0 ? canvasCtx.moveTo(x, y) : canvasCtx.lineTo(x, y);
    x += sliceWidth;
  }

  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
}

draw();
