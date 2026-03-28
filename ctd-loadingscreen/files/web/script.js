// DOM Elements
const fill = document.getElementById('fill');
const status = document.getElementById('status');
const bg = document.querySelector('.bg');
const logo = document.querySelector('.logo');
const music = document.getElementById('music');
const muteBtn = document.getElementById('muteBtn');
const muteIcon = document.getElementById('muteIcon');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');

// Fixed asset locations
const DEFAULT_LOGO_SRC = '../../assets/logo.png';
const DEFAULT_MUSIC_SRC = '../../assets/music.mp3';
const DEFAULT_BG = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e';

// State
let slides = [];
let slideIndex = 0;
let slideTimer = null;
let isMuted = false;
let shutdownSent = false;


// NUI Helpers
function getResourceName() {
  if (typeof GetParentResourceName === 'function') {
    const name = GetParentResourceName();
    if (name) return name;
  }
  return window.__resourceName || window.resourceName || 'ctd-loadingscreen';
}

function postNui(route, payload) {
  return fetch(`https://${getResourceName()}/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
}

// Music Controls
function updateMuteButton() {
  if (!muteBtn || !muteIcon) return;

  if (isMuted) {
    muteBtn.classList.add('muted');
    muteIcon.innerHTML = '<path fill="white" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else {
    muteBtn.classList.remove('muted');
    muteIcon.innerHTML = '<path fill="white" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

function toggleMute() {
  isMuted = !isMuted;
  updateMuteButton();
  localStorage.setItem('ctd_loadingscreen_muted', isMuted.toString());
  if (music) music.muted = isMuted;
}

// Slideshow Controls
function setBackground(url) {
  if (!bg || !url) return;
  bg.style.opacity = '0';
  setTimeout(() => {
    bg.style.backgroundImage = `url("${url}")`;
    bg.style.opacity = '1';
  }, 150);
}

function showSlide(index) {
  if (!slides.length) return;
  slideIndex = ((index % slides.length) + slides.length) % slides.length;
  setBackground(slides[slideIndex]);
}

function scheduleNextSlide(displayMs, transitionMs) {
  clearTimeout(slideTimer);
  if (slides.length <= 1) return;
  const interval = Math.max(displayMs || 6000, (transitionMs || 1200) + 300);
  slideTimer = setTimeout(() => {
    showSlide(slideIndex + 1);
    scheduleNextSlide(displayMs, transitionMs);
  }, interval);
}

// Progress
function updateProgress(percent, text) {
  const pct = Math.min(Math.max(Number(percent) || 0, 0), 100);

  if (fill) fill.style.width = `${pct}%`;
  if (status) status.textContent = text || (pct >= 99 ? 'Almost done...' : `Loading... ${Math.floor(pct)}%`);

  if (pct >= 100 && !shutdownSent) {
    shutdownSent = true;
    setTimeout(function tryShutdown() {
      postNui('shutdown', {}).catch(() => {
        shutdownSent = false;
        setTimeout(tryShutdown, 1000);
      });
    }, 2000);
  }
}

// Apply background images from Lua scan
function applyImages(images) {
  if (!Array.isArray(images) || !images.length) return;
  slides = images;
  clearTimeout(slideTimer);
  showSlide(0);
  scheduleNextSlide();
}

// Apply display config fetched from config.json
function applyConfig(cfg) {
  if (!cfg) return;

  if (titleEl && typeof cfg.title === 'string') {
    titleEl.textContent = cfg.title;
  }
  if (subtitleEl && typeof cfg.subtitle === 'string') {
    subtitleEl.textContent = cfg.subtitle;
  }

  const displayMs = Number(cfg.displayMs) || 6000;
  const transitionMs = Number(cfg.transitionMs) || 1200;

  if (logo) logo.src = DEFAULT_LOGO_SRC;

  // Music
  if (music) {
    music.volume = typeof cfg.musicVolume === 'number' ? cfg.musicVolume : 0.08;
    music.muted = isMuted;
    music.src = DEFAULT_MUSIC_SRC;
    music.loop = true;
    music.play().catch(() => {});
  }

  // Start slideshow with default image; Lua may override later with custom images
  slides = [DEFAULT_BG];
  showSlide(0);
  scheduleNextSlide(displayMs, transitionMs);

  // Store timings for when images are updated later
  window._displayMs = displayMs;
  window._transitionMs = transitionMs;
}


// Event Listeners
window.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'loadImages' && Array.isArray(data.images) && data.images.length > 0) {
    applyImages(data.images);
  } else if (typeof data.loadFraction === 'number') {
    updateProgress(data.loadFraction * 100, data.status || data.text || data.loadName);
  } else if (typeof data.progress === 'number') {
    updateProgress(data.progress, data.status || data.text);
  }
});

// Mute button click handler
if (muteBtn) {
  muteBtn.addEventListener('click', toggleMute);
}

// Initialize on load — fetch config.json directly (no Lua message timing issues)
window.addEventListener('load', () => {
  const savedMuted = localStorage.getItem('ctd_loadingscreen_muted') === 'true';
  isMuted = savedMuted;
  updateMuteButton();

  fetch(`https://${getResourceName()}/config.json`)
    .then(r => r.json())
    .then(cfg => applyConfig(cfg))
    .catch(() => applyConfig({ musicVolume: 0.08 }));
});
