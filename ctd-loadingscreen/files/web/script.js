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

// Fixed asset locations (do not expose paths in config)
const DEFAULT_LOGO_SRC = '../../assets/logo.png';

// State
let slides = [];
let slideIndex = 0;
let slideTimer = null;
let tracks = [];
let trackIndex = 0;
let isMuted = false;
let displayMs = 6000;
let transitionMs = 1200;
let shutdownSent = false;
let configApplied = false;


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
function setTrack(index) {
  if (!tracks.length || !music) return;
  
  trackIndex = ((index % tracks.length) + tracks.length) % tracks.length;
  const src = tracks[trackIndex];
  
  music.src = src;
  // Always play - mute button controls audio output only
  music.play().catch(() => {});
}

function updateMuteButton() {
  if (!muteBtn || !muteIcon) return;
  
  if (isMuted) {
    muteBtn.classList.add('muted');
    // Muted icon (speaker with X)
    muteIcon.innerHTML = '<path fill="white" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else {
    muteBtn.classList.remove('muted');
    // Unmuted icon (speaker with waves)
    muteIcon.innerHTML = '<path fill="white" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

function toggleMute() {
  isMuted = !isMuted;
  
  updateMuteButton();
  
  // Save preference to localStorage (persists across sessions)
  localStorage.setItem('ctd_loadingscreen_muted', isMuted.toString());
  
  // Only change mute state - music keeps playing in background
  if (music) {
    music.muted = isMuted;
  }
}

// Slideshow Controls
function setBackground(url) {
  if (!bg || !url) return;
  
  bg.style.transition = `opacity ${Math.max(transitionMs, 300)}ms ease`;
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

function scheduleNextSlide() {
  clearTimeout(slideTimer);
  if (slides.length <= 1) return;
  
  slideTimer = setTimeout(() => {
    showSlide(slideIndex + 1);
    scheduleNextSlide();
  }, Math.max(displayMs, transitionMs + 300));
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
        // NUI callback not ready yet — retry in 1s
        shutdownSent = false;
        setTimeout(tryShutdown, 1000);
      });
    }, 2000);
  }
}

// Config
function applyConfig(config) {
  const cfg = config || {};

  // Title/subtitle - always set, use config or keep current
  if (titleEl) {
    if (typeof cfg.title === 'string' && cfg.title) {
      titleEl.textContent = cfg.title;
    }
  }
  if (subtitleEl) {
    if (typeof cfg.subtitle === 'string' && cfg.subtitle) {
      subtitleEl.textContent = cfg.subtitle;
    }
  }
  
  // Images
  const fromCfgImages = Array.isArray(cfg.images) ? cfg.images : [];
  const fromServerImages = Array.isArray(cfg.imagesFromServer) ? cfg.imagesFromServer : [];
  
  // Default fallback image (Unsplash scenic)
  const defaultImage = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e';
  
  if (fromCfgImages.length) {
    slides = fromCfgImages;
  } else if (fromServerImages.length) {
    slides = fromServerImages;
  } else {
    slides = [defaultImage];
  }
  
  // Logo
  if (logo) logo.src = DEFAULT_LOGO_SRC;
  
  // Timings
  displayMs = Number(cfg.displayMs) || 6000;
  transitionMs = Number(cfg.transitionMs) || 1200;
  
  // Music
  if (music && cfg.musicFromServer && cfg.musicFromServer.length) {
    tracks = cfg.musicFromServer;
  } else {
    // Fallback to default music file
    tracks = ['../../assets/music.mp3'];
  }
  
  if (tracks.length > 0) {
    // Set initial mute state from config
    isMuted = cfg.musicMuted === true;
    music.muted = isMuted;
    updateMuteButton();
    
    // Set volume
    music.volume = typeof cfg.musicVolume === 'number' ? cfg.musicVolume : 0.08;
    music.loop = tracks.length <= 1;
    
    // Load first track
    setTrack(0);
    
    // Auto-advance tracks
    music.onended = tracks.length > 1 ? () => setTrack(trackIndex + 1) : null;
  }
  
  // Start slideshow
  if (slides.length) {
    showSlide(0);
    scheduleNextSlide();
  }
  
}

// Event Listeners
window.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'loadConfig' && data.config && !configApplied) {
    configApplied = true;
    // Preserve local mute preference over whatever the server sends
    const savedMuted = localStorage.getItem('ctd_loadingscreen_muted');
    data.config.musicMuted = savedMuted === 'true';
    applyConfig(data.config);
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

// Initialize on load
window.addEventListener('load', () => {
  const savedMuted = localStorage.getItem('ctd_loadingscreen_muted');
  const initialMuted = savedMuted === 'true';

  // Apply immediate defaults — real config arrives via SendNUIMessage from client.lua
  applyConfig({ musicMuted: initialMuted, musicVolume: 0.08 });
});
