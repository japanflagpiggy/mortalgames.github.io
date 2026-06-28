// MORTAL GAMES — Interactive Engine (extracted)
// Minimal helper selectors
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
const root = document.documentElement;

// ─── TOAST ───
const toastContainer = qs('#toast-container');
function toast(msg, type = 'info', dur = 3000) {
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.innerHTML = `<strong>${type === 'error' ? 'NOTICE' : 'INTEL'}:</strong> ${msg}`;
  toastContainer.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, dur);
}

// ─── ACHIEVEMENT ───
const achEl = qs('#achievement');
const achIcon = qs('#ach-icon');
const achName = qs('#ach-name');
const achievements = new Set(JSON.parse(localStorage.getItem('mg:ach') || '[]'));
function unlockAch(id, name, icon = '🏆') {
  if (achievements.has(id)) return;
  achievements.add(id);
  localStorage.setItem('mg:ach', JSON.stringify([...achievements]));
  achIcon.textContent = icon;
  achName.textContent = name;
  achEl.classList.add('show');
  setTimeout(() => achEl.classList.remove('show'), 4000);
}



// ─── HERO TITLE ANIMATION ───
(function animTitle() {
  const el = qs('#hero-title');
  const text = 'MORTAL GAMES';
  el.innerHTML = text.split('').map((c, i) =>
    c === ' ' ? ' ' : `<span class="char" style="animation-delay:${i*0.07}s">${c}</span>`
  ).join('');
})();

// ─── CUSTOM CURSOR ───
const cursorRing = qs('#cursor-ring');
const cursorDot = qs('#cursor-dot');
let cx = -200, cy = -200, rx = -200, ry = -200;
document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });
(function animCursor() {
  rx += (cx - rx) * 0.12;
  ry += (cy - ry) * 0.12;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top = ry + 'px';
  cursorDot.style.left = cx + 'px';
  cursorDot.style.top = cy + 'px';
  requestAnimationFrame(animCursor);
})();
document.querySelectorAll('a, button, .card, .fav-btn, .news-read, .hero-cta').forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
});

// ─── PARTICLE CANVAS ───
(function initParticles() {
  const canvas = qs('#particle-canvas');
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);
  const STAR_COUNT = 120;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: Math.random() * 1.2 + 0.2, vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12, a: Math.random()
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,212,224,${s.a * 0.7})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

 // ─── GLOBE CANVAS ───
 (function initGlobe() {
   const canvas = qs('#globe-canvas');
   const ctx = canvas.getContext('2d');
   const W = 260, H = 260, R = 120, CX = W/2, CY = H/2;
   let angle = 0;

   // Use an equirectangular world map texture (public domain). We rotate the texture horizontally
   // to simulate globe rotation by drawing two slices to handle wrapping.
   const img = new Image();
   img.crossOrigin = 'anonymous';
   img.src = 'https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg';

   let ready = false;
   img.onload = () => {
     ready = true;
   };

   function drawGlobe() {
     ctx.clearRect(0, 0, W, H);

     // base ocean
     const grad = ctx.createRadialGradient(CX-30, CY-30, 5, CX, CY, R);
     grad.addColorStop(0, '#1a2a3a');
     grad.addColorStop(0.5, '#0d1a28');
     grad.addColorStop(1, '#060c14');
     ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2);
     ctx.fillStyle = grad; ctx.fill();

     // atmosphere glow
     const atmo = ctx.createRadialGradient(CX, CY, R-10, CX, CY, R+8);
     atmo.addColorStop(0, 'rgba(212,168,67,0.08)');
     atmo.addColorStop(1, 'transparent');
     ctx.beginPath(); ctx.arc(CX, CY, R+8, 0, Math.PI*2);
     ctx.fillStyle = atmo; ctx.fill();

     // clip to circle and draw rotated map texture when ready
     ctx.save();
     ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.clip();

     if (ready) {
       // assume equirectangular image (width >= 2 * height). Scale so image height maps to globe diameter.
       const mapH = img.height;
       const mapW = img.width;
       // scale factor to make image height = 2*R (cover diameter)
       const scale = (2 * R) / mapH;
       const drawW = mapW * scale;
       const drawH = mapH * scale;

       // compute horizontal offset from angle (angle degrees -> offset in px)
       const rotPx = (angle % 360) / 360 * drawW;
       // draw two slices to handle wrapping
       const sx1 = (rotPx / scale) % mapW;
       // convert to source coords for drawImage: sx in [0,mapW)
       const srcX = (sx1 + mapW) % mapW;

       // we draw the image twice to cover the circle region, taking wrapping into account
       // destination top-left so the map's vertical center aligns with globe center
       const dx = CX - drawW / 2;
       const dy = CY - drawH / 2;

       // first slice: from srcX to image end
       const firstW = mapW - srcX;
       ctx.drawImage(img, srcX, 0, firstW, mapH, dx, dy, firstW * scale, drawH);
       // second slice: from start of image to remaining width
       if (srcX > 0) {
         ctx.drawImage(img, 0, 0, srcX, mapH, dx + firstW * scale, dy, srcX * scale, drawH);
       }
       // blend map slightly to match style
       ctx.globalCompositeOperation = 'multiply';
       ctx.fillStyle = 'rgba(10,12,16,0.15)';
       ctx.fillRect(dx, dy, drawW, drawH);
       ctx.globalCompositeOperation = 'source-over';
     } else {
       // fallback: faint grid/land hints while image loads
       ctx.strokeStyle = 'rgba(34,80,50,0.18)';
       ctx.lineWidth = 0.6;
       for (let i = -80; i <= 80; i += 20) {
         ctx.beginPath();
         const y = CY + (i / 90) * R;
         ctx.moveTo(CX - Math.sqrt(Math.max(0, R*R - (y - CY)*(y - CY))), y);
         ctx.lineTo(CX + Math.sqrt(Math.max(0, R*R - (y - CY)*(y - CY))), y);
         ctx.stroke();
       }
     }

     ctx.restore();

     // soft shadow and rim
     const shadowGrad = ctx.createLinearGradient(CX+R*0.3, CY-R, CX+R, CY+R);
     shadowGrad.addColorStop(0, 'transparent');
     shadowGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
     ctx.save();
     ctx.globalCompositeOperation = 'source-atop';
     ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2);
     ctx.fillStyle = shadowGrad; ctx.fill();
     ctx.restore();

     ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2);
     ctx.strokeStyle = 'rgba(212,168,67,0.15)'; ctx.lineWidth = 1; ctx.stroke();

     angle += 0.25;
     requestAnimationFrame(drawGlobe);
   }
   drawGlobe();

   // Mouse drag
   let dragging = false, lastX = 0;
   canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; });
   addEventListener('mouseup', () => dragging = false);
   addEventListener('mousemove', e => {
     if (!dragging) return;
     angle += (e.clientX - lastX) * 0.3;
     lastX = e.clientX;
   });
 })();

// ─── RADAR ───
(function initRadar() {
  const canvas = qs('#radar-canvas');
  const ctx = canvas.getContext('2d');
  const W = 220, H = 220, CX = 110, CY = 110, R = 105;
  let sweep = 0;

  const blipContainer = qs('#radar-blips');
  const blipData = [
    { x: '35%', y: '40%', delay: 0 },
    { x: '65%', y: '55%', delay: 0.8 },
    { x: '50%', y: '25%', delay: 1.6 },
    { x: '75%', y: '70%', delay: 2.4 },
    { x: '30%', y: '70%', delay: 1.2 },
  ];
  blipData.forEach(b => {
    const el = document.createElement('div');
    el.className = 'blip';
    el.style.left = b.x; el.style.top = b.y;
    el.style.animationDelay = b.delay + 's';
    blipContainer.appendChild(el);
  });

  function drawRadar() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2);
    ctx.clip();

    ctx.fillStyle = '#030806';
    ctx.fillRect(0, 0, W, H);

    [0.25, 0.5, 0.75, 1].forEach(f => {
      ctx.beginPath(); ctx.arc(CX, CY, R*f, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(0,255,127,${0.08 + f*0.05})`; ctx.lineWidth = 1; ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(0,255,127,0.08)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(CX-R, CY); ctx.lineTo(CX+R, CY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX, CY-R); ctx.lineTo(CX, CY+R); ctx.stroke();

    const sweepAngle = (sweep * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + Math.cos(sweepAngle) * R, CY + Math.sin(sweepAngle) * R);
    ctx.strokeStyle = 'rgba(0,255,127,0.9)'; ctx.lineWidth = 2; ctx.stroke();

    const trailStart = sweepAngle - 1.2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, trailStart, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,255,127,0.05)';
    ctx.fill();

    ctx.restore();

    ctx.beginPath(); ctx.arc(CX, CY, 3, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,255,127,0.6)'; ctx.fill();

    sweep = (sweep + 1.5) % 360;
    requestAnimationFrame(drawRadar);
  }
  drawRadar();
})();



// ─── INTERACTIVE 3D CARDS ───
qsa('.card').forEach(card => {
  const shine = card.querySelector('.card-shine');

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    const rx = (e.clientY - rect.top - rect.height / 2) / rect.height * -18;
    const ry = (e.clientX - rect.left - rect.width / 2) / rect.width * 18;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    if (shine) shine.style.setProperty('--mx', mx + '%');
    if (shine) shine.style.setProperty('--my', my + '%');
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ─── FAVOURITES ───
const FAVS_KEY = 'mg:favs:v2';
const favs = new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'));
const saveFavs = () => localStorage.setItem(FAVS_KEY, JSON.stringify([...favs]));

qsa('.fav-btn').forEach(btn => {
  const card = btn.closest('.card');
  const id = card.dataset.title;
  const update = () => {
    const on = favs.has(id);
    btn.classList.toggle('active', on);
    btn.textContent = on ? '★' : '☆';
  };
  update();
  btn.addEventListener('click', () => {
    if (favs.has(id)) { favs.delete(id); toast(`Removed from favourites: ${id}`); }
    else { favs.add(id); toast(`Added to favourites: ${id}`); }
    saveFavs(); update();
  });
});

if (favs.size) toast(`${favs.size} favourite(s) restored from last session.`);

/* ─── PLAY / LAUNCH HANDLER (no fake downloads) ───
   Replaced download simulation with a simple launch/wishlist flow.
*/
qsa('.btn-play').forEach(btn => {
  btn.addEventListener('click', () => {
    const game = btn.dataset.game;
    const card = btn.closest('.card');

    // If game is in beta, indicate launch attempt, otherwise open details/launch
    if (card.querySelector('.card-badge.new') || card.querySelector('.card-status.beta')) {
      toast(`Attempting to launch ${game} (Beta)…`);
      // Minimal placeholder behaviour: open details modal for beta builds
      const details = card.querySelector('.card-desc')?.textContent || 'Beta build — limited access.';
      openModal(game + ' — Beta', details);
    } else {
      toast(`Launching ${game}...`);
      openModal(game, 'Launching session — connecting to deployment.');
    }
  });
});

// ─── SEARCH ───
const searchInput = qs('#site-search');
const cards = qsa('.card');
searchInput.addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  cards.forEach(card => {
    const title = (card.dataset.title || '').toLowerCase();
    const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
    card.style.display = (!q || title.includes(q) || desc.includes(q)) ? '' : 'none';
  });
});

// ─── MODAL ───
const modalBackdrop = qs('#modal-backdrop');
const modalTitle = qs('#modal-title');
const modalBody = qs('#modal-body');
const modalClose = qs('#modal-close');

function openModal(title, body) {
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalBackdrop.classList.add('show');
  modalBackdrop.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  modalBackdrop.classList.remove('show');
  modalBackdrop.setAttribute('aria-hidden', 'true');
}

qsa('.card-image').forEach(img => {
  img.addEventListener('click', () => {
    const card = img.closest('.card');
    openModal(card.dataset.title, img.dataset.preview || 'Preview unavailable');
    unlockAch('scout', 'Scout', '🔍');
  });
});
qsa('.btn-details').forEach(btn => {
  btn.addEventListener('click', () => {
    openModal(btn.dataset.game, `[ ${btn.dataset.game} ] — Full details coming soon in the next update.`);
  });
});
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });

// ─── TIMELINE SCROLL REVEAL ───
(function initTimeline() {
  const items = qsa('.timeline-item');
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), 150);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  items.forEach(el => obs.observe(el));
})();

// ─── MUSIC TOGGLE ───
let musicOn = false;
let audioCtx = null;
let oscillators = [];
const musicBtn = qs('#music-btn');

function startMusic() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [110, 138.6, 165, 184, 220];
  const master = audioCtx.createGain();
  master.gain.value = 0.06;
  master.connect(audioCtx.destination);

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.5 - i * 0.08;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    oscillators.push(osc);
  });
  toast('Tactical audio enabled.');
}
function stopMusic() {
  oscillators.forEach(o => { try { o.stop(); } catch(e){} });
  oscillators = [];
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  toast('Audio disabled.');
}

musicBtn.addEventListener('click', () => {
  musicOn = !musicOn;
  musicBtn.textContent = musicOn ? '🔊 ON' : '🔊 OFF';
  musicOn ? startMusic() : stopMusic();
});

// ─── KEYBOARD SHORTCUTS ───
let eggBuffer = '';
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }
  if (e.key === 'Escape') {
    closeModal();
    eggBuffer = '';
    qs('#egg-overlay').classList.remove('active');
    return;
  }
  if (e.key.toLowerCase() === 'f' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
    const first = cards.find(c => c.style.display !== 'none');
    if (first) {
      const id = first.dataset.title;
      if (favs.has(id)) { favs.delete(id); toast(`Removed favourite: ${id}`); }
      else { favs.add(id); toast(`Added favourite: ${id}`); }
      saveFavs();
      qsa('.fav-btn').forEach(b => {
        const c = b.closest('.card');
        const on = favs.has(c.dataset.title);
        b.classList.toggle('active', on);
        b.textContent = on ? '★' : '☆';
      });
    }
    return;
  }

  if (e.key.length === 1) {
    eggBuffer = (eggBuffer + e.key.toUpperCase()).slice(-10);
    checkEasterEggs();
  }
});

// ─── EASTER EGGS ───
const eggOverlay = qs('#egg-overlay');
const eggText = qs('#egg-text');
qs('#egg-close').addEventListener('click', () => {
  eggOverlay.classList.remove('active');
  eggOverlay.className = '';
  eggBuffer = '';
});

function triggerEgg(cls, msg, achId, achName, achIcon) {
  eggOverlay.className = `active ${cls}`;
  eggText.textContent = msg;
  setTimeout(() => { eggOverlay.classList.remove('active'); eggOverlay.className = ''; }, 5000);
  unlockAch(achId, achName, achIcon);
  eggBuffer = '';
}

function checkEasterEggs() {
  if (eggBuffer.includes('HOI4')) triggerEgg('egg-hoi4', '⚡ WWII MODE ACTIVATED ⚡\nFor the Fatherland', 'hoi4', 'Warlord', '⚔️');
  else if (eggBuffer.includes('PARADOX')) triggerEgg('egg-paradox', '🌊 PARADOX PROTOCOL\nDiplomacy Unlocked', 'paradox', 'Grand Duke', '👑');
  else if (eggBuffer.includes('MORTAL')) triggerEgg('egg-mortal', '💀 MORTAL MODE\nYou Found the Code', 'mortal', 'Mortal', '💀');
}

// ─── CONTROL PANEL ───
(function initControls() {
  const toggle = qs('#ctrl-toggle');
  const box = qs('#ctrl-box');
  toggle.addEventListener('click', () => box.classList.toggle('open'));

  const PREFS = 'mg:prefs:v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(PREFS) || '{}'); } catch { return {}; } };
  const save = (p) => localStorage.setItem(PREFS, JSON.stringify(p));

  const prefs = load();

  const cGrid = qs('#c-grid');
  const cHue = qs('#c-hue');
  const cGlow = qs('#c-glow');
  const cScan = qs('#c-scan');

  if (prefs.grid) cGrid.value = prefs.grid;
  if (prefs.hue) cHue.value = prefs.hue;
  if (prefs.glow) cGlow.value = prefs.glow;
  if (prefs.scan) cScan.value = prefs.scan;

  const applyGrid = v => root.style.setProperty('--grid-sz', v + 'px');
  const applyHue = v => {
    root.style.setProperty('--gold', `hsl(${v},72%,55%)`);
    root.style.setProperty('--gold2', `hsl(${v},80%,68%)`);
    root.style.setProperty('--gold-dim', `hsla(${v},72%,55%,0.12)`);
  };
  const applyGlow = v => {
    root.style.setProperty('--card-glow-op', String(v/100));
  };
  const applyScan = v => {
    document.querySelector('.bg-scan').style.animationDuration = v + 's';
  };

  applyGrid(cGrid.value); applyHue(cHue.value); applyGlow(cGlow.value); applyScan(cScan.value);

  cGrid.addEventListener('input', e => { applyGrid(e.target.value); save({...load(), grid: e.target.value}); });
  cHue.addEventListener('input', e => { applyHue(e.target.value); save({...load(), hue: e.target.value}); });
  cGlow.addEventListener('input', e => { applyGlow(e.target.value); save({...load(), glow: e.target.value}); });
  cScan.addEventListener('input', e => { applyScan(e.target.value); save({...load(), scan: e.target.value}); });

  qs('#c-reset').addEventListener('click', () => {
    cGrid.value = 28; cHue.value = 42; cGlow.value = 40; cScan.value = 8;
    applyGrid(28); applyHue(42); applyGlow(40); applyScan(8);
    localStorage.removeItem(PREFS);
    toast('Visual controls reset to defaults.');
  });
})();

// ─── RANDOM ACHIEVEMENT POPUP ───
setTimeout(() => {
  if (!achievements.has('visitor')) {
    unlockAch('visitor', 'Visitor', '👁');
  }
}, 8000);

// ─── PARALLAX ON SCROLL ───
window.addEventListener('scroll', () => {
  const y = scrollY;
  const hero = qs('.hero');
  if (hero) hero.style.transform = `translateY(${y * 0.25}px)`;
  const rays = qs('.hero-rays');
  if (rays) rays.style.transform = `translateY(${y * 0.1}px) rotate(${y * 0.02}deg)`;
}, { passive: true });
