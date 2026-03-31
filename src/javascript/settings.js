const defaultSettings = {
  showOrbs: true,
  glassPlayer: true,
  autoplayNext: true,
  showOscilloscope: true,
  oscHeight: 48,
  oscWidth: 100,
  oscFftSize: 4096,
  oscLineWidth: 1,
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
  const root = document.documentElement;

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
  if (root) {
    root.style.setProperty("--osc-height", `${settings.oscHeight || defaultSettings.oscHeight}px`);
    root.style.setProperty("--osc-width", `${settings.oscWidth || defaultSettings.oscWidth}%`);
  }
}

function syncSettingsUI(settings) {
  const orbs = document.getElementById("setting-orbs");
  const glass = document.getElementById("setting-glass");
  const autoplay = document.getElementById("setting-autoplay");
  const osc = document.getElementById("setting-osc");
  const oscHeight = document.getElementById("setting-osc-height");
  const oscWidth = document.getElementById("setting-osc-width");
  const oscFft = document.getElementById("setting-osc-fft");
  const oscLine = document.getElementById("setting-osc-line");
  const oscHeightValue = document.getElementById("osc-height-value");
  const oscWidthValue = document.getElementById("osc-width-value");
  const oscLineValue = document.getElementById("osc-line-value");

  if (orbs) orbs.checked = settings.showOrbs;
  if (glass) glass.checked = settings.glassPlayer;
  if (autoplay) autoplay.checked = settings.autoplayNext;
  if (osc) osc.checked = settings.showOscilloscope;
  if (oscHeight) oscHeight.value = settings.oscHeight ?? defaultSettings.oscHeight;
  if (oscWidth) oscWidth.value = settings.oscWidth ?? defaultSettings.oscWidth;
  if (oscFft) oscFft.value = settings.oscFftSize ?? defaultSettings.oscFftSize;
  if (oscLine) oscLine.value = settings.oscLineWidth ?? defaultSettings.oscLineWidth;
  if (oscHeightValue) oscHeightValue.textContent = `${settings.oscHeight ?? defaultSettings.oscHeight}px`;
  if (oscWidthValue) oscWidthValue.textContent = `${settings.oscWidth ?? defaultSettings.oscWidth}%`;
  if (oscLineValue) oscLineValue.textContent = `${settings.oscLineWidth ?? defaultSettings.oscLineWidth}px`;
}

function initSettingsUI() {
  const orbs = document.getElementById("setting-orbs");
  const glass = document.getElementById("setting-glass");
  const autoplay = document.getElementById("setting-autoplay");
  const osc = document.getElementById("setting-osc");
  const oscHeight = document.getElementById("setting-osc-height");
  const oscWidth = document.getElementById("setting-osc-width");
  const oscFft = document.getElementById("setting-osc-fft");
  const oscLine = document.getElementById("setting-osc-line");
  const oscHeightValue = document.getElementById("osc-height-value");
  const oscWidthValue = document.getElementById("osc-width-value");
  const oscLineValue = document.getElementById("osc-line-value");
  const saveBtn = document.getElementById("save-settings");
  const saveStatus = document.getElementById("save-status");
  const resetBtn = document.getElementById("reset-settings");

  const collectSettings = () => ({
    ...defaultSettings,
    ...readStoredSettings(),
    showOrbs: orbs ? orbs.checked : defaultSettings.showOrbs,
    glassPlayer: glass ? glass.checked : defaultSettings.glassPlayer,
    autoplayNext: autoplay ? autoplay.checked : defaultSettings.autoplayNext,
    showOscilloscope: osc ? osc.checked : defaultSettings.showOscilloscope,
    oscHeight: oscHeight ? parseInt(oscHeight.value, 10) : defaultSettings.oscHeight,
    oscWidth: oscWidth ? parseInt(oscWidth.value, 10) : defaultSettings.oscWidth,
    oscFftSize: oscFft ? parseInt(oscFft.value, 10) : defaultSettings.oscFftSize,
    oscLineWidth: oscLine ? parseFloat(oscLine.value) : defaultSettings.oscLineWidth,
  });

  const markDirty = () => {
    if (saveStatus) saveStatus.textContent = "Not saved yet.";
    if (saveBtn) saveBtn.classList.remove("saved");
  };

  const updatePreview = () => {
    const settings = collectSettings();
    window.flowSettings = settings;
    applySettings(settings);
    window.dispatchEvent(new CustomEvent("flow:settings", { detail: settings }));
    if (oscHeightValue) oscHeightValue.textContent = `${settings.oscHeight}px`;
    if (oscWidthValue) oscWidthValue.textContent = `${settings.oscWidth}%`;
    if (oscLineValue) oscLineValue.textContent = `${settings.oscLineWidth}px`;
    markDirty();
  };

  const updateFromUI = () => {
    const settings = collectSettings();
    saveSettings(settings);
    if (saveStatus) saveStatus.textContent = "Saved locally.";
    if (saveBtn) {
      saveBtn.classList.remove("saved");
      requestAnimationFrame(() => saveBtn.classList.add("saved"));
    }
    if (oscHeightValue) oscHeightValue.textContent = `${settings.oscHeight}px`;
    if (oscWidthValue) oscWidthValue.textContent = `${settings.oscWidth}%`;
    if (oscLineValue) oscLineValue.textContent = `${settings.oscLineWidth}px`;
  };

  [orbs, glass, autoplay, osc, oscHeight, oscWidth, oscFft, oscLine].forEach((input) => {
    if (input) {
      input.addEventListener("change", updatePreview);
    }
  });

  if (oscHeight) {
    oscHeight.addEventListener("input", () => {
      if (oscHeightValue) oscHeightValue.textContent = `${oscHeight.value}px`;
      updatePreview();
    });
  }
  if (oscWidth) {
    oscWidth.addEventListener("input", () => {
      if (oscWidthValue) oscWidthValue.textContent = `${oscWidth.value}%`;
      updatePreview();
    });
  }
  if (oscLine) {
    oscLine.addEventListener("input", () => {
      if (oscLineValue) oscLineValue.textContent = `${oscLine.value}px`;
      updatePreview();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", updateFromUI);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      saveSettings(defaultSettings);
      syncSettingsUI(defaultSettings);
      if (saveStatus) saveStatus.textContent = "Reset to defaults.";
      if (saveBtn) {
        saveBtn.classList.remove("saved");
        requestAnimationFrame(() => saveBtn.classList.add("saved"));
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initSettingsUI();
});
