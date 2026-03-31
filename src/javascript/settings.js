const defaultSettings = {
  showOrbs: true,
  glassPlayer: true,
  autoplayNext: true,
  showOscilloscope: true,
};

function readStoredSettings() {
  try {
    const stored = localStorage.getItem("flow-settings");
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (err) {
    console.warn("Failed to read settings from storage", err);
    return {};
  }
}

async function loadSettings() {
  let fileSettings = {};
  try {
    const res = await fetch("src/data/settings.json", { cache: "no-store" });
    if (res.ok) {
      fileSettings = await res.json();
    }
  } catch (err) {
    console.warn("Failed to load settings.json", err);
  }

  const stored = readStoredSettings();
  const settings = { ...defaultSettings, ...fileSettings, ...stored };
  window.flowSettings = settings;
  applySettings(settings);
  syncSettingsUI(settings);
  window.dispatchEvent(new CustomEvent("flow:settings", { detail: settings }));
  return settings;
}

function saveSettings(settings) {
  localStorage.setItem("flow-settings", JSON.stringify(settings));
  window.flowSettings = settings;
  applySettings(settings);
  window.dispatchEvent(new CustomEvent("flow:settings", { detail: settings }));
}

function applySettings(settings) {
  const body = document.body;
  const player = document.querySelector(".player");
  const oscilloscope = document.querySelector(".oscilloscope-wrap");
  const orbs = document.querySelector(".bg-orbs");

  if (body) {
    body.classList.toggle("orbs-off", !settings.showOrbs);
  }
  if (orbs) {
    orbs.style.display = settings.showOrbs ? "block" : "none";
  }
  if (player) {
    player.classList.toggle("player-flat", !settings.glassPlayer);
  }
  if (oscilloscope) {
    oscilloscope.classList.toggle("hidden", !settings.showOscilloscope);
  }
}

function syncSettingsUI(settings) {
  const orbs = document.getElementById("setting-orbs");
  const glass = document.getElementById("setting-glass");
  const autoplay = document.getElementById("setting-autoplay");
  const osc = document.getElementById("setting-osc");

  if (orbs) orbs.checked = settings.showOrbs;
  if (glass) glass.checked = settings.glassPlayer;
  if (autoplay) autoplay.checked = settings.autoplayNext;
  if (osc) osc.checked = settings.showOscilloscope;
}

function initSettingsUI() {
  const orbs = document.getElementById("setting-orbs");
  const glass = document.getElementById("setting-glass");
  const autoplay = document.getElementById("setting-autoplay");
  const osc = document.getElementById("setting-osc");

  const updateFromUI = () => {
    const settings = {
      ...defaultSettings,
      ...readStoredSettings(),
      showOrbs: orbs ? orbs.checked : defaultSettings.showOrbs,
      glassPlayer: glass ? glass.checked : defaultSettings.glassPlayer,
      autoplayNext: autoplay ? autoplay.checked : defaultSettings.autoplayNext,
      showOscilloscope: osc ? osc.checked : defaultSettings.showOscilloscope,
    };
    saveSettings(settings);
  };

  [orbs, glass, autoplay, osc].forEach((input) => {
    if (input) {
      input.addEventListener("change", updateFromUI);
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initSettingsUI();
});
