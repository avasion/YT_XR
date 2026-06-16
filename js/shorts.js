// ============================================================================
// XR SHORTS  —  a curved 3D scrolling wheel of interactive-project Shorts
//
// Pure CSS 3D: each short is a vertical card placed on a cylinder
//   transform: rotateY(i·step) translateZ(radius)
// and the whole wheel is rotated by scroll / drag / arrow keys. The front card
// is "active"; click it to swap its thumbnail for a real YouTube player.
// No WebGL, no dependencies — iframes can live in a CSS-3D scene (not in WebGL).
// ============================================================================

const stage    = document.getElementById('wheel-stage');
const wheel     = document.getElementById('wheel');
const searchEl  = document.getElementById('shortsSearch');
const filtersEl = document.getElementById('shortsFilters');
const countEl   = document.getElementById('shortsCount');

// Card geometry. radius scales with N so spacing between cards stays constant
// (a clean wheel whether you're viewing 5 shorts or 60).
const SPACING = 210, MIN_R = 360, LERP = 0.12;

let all = [], topics = [], view = [], cards = [];
let step = 0, radius = MIN_R, rotation = 0, targetRot = 0;
let activeFilter = 'All', playingIndex = -1;

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------------------------------------------------------------
async function load() {
  try {
    const r = await fetch('js/shorts.json', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); all = j.shorts || []; topics = j.topics || []; }
  } catch { /* empty */ }
  buildFilters();
  applyFilter('All', '');
  loop();
}

function buildFilters() {
  const tags = ['All', ...topics];
  filtersEl.innerHTML = tags.map(t =>
    `<button class="chip${t === 'All' ? ' active' : ''}" data-tag="${t}">${t === 'All' ? 'All' : '#' + t}</button>`).join('');
  filtersEl.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
    filtersEl.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    activeFilter = b.dataset.tag;
    applyFilter(activeFilter, searchEl.value);
  }));
}

function applyFilter(tag, q) {
  q = (q || '').trim().toLowerCase();
  view = all.filter(s => {
    const okTag = tag === 'All' || s.topic === tag;
    const okQ = !q || s.title.toLowerCase().includes(q)
      || (s.channelTitle || '').toLowerCase().includes(q)
      || s.topic.toLowerCase().includes(q);
    return okTag && okQ;
  });
  buildWheel();
}

function buildWheel() {
  stopPlaying();
  wheel.innerHTML = ''; cards = []; rotation = 0; targetRot = 0;
  const N = view.length;
  countEl.textContent = N ? `${N} short${N === 1 ? '' : 's'}` : '';
  stage.classList.toggle('empty', N === 0);
  if (!N) return;

  step = 360 / N;
  radius = Math.max(MIN_R, SPACING * N / (2 * Math.PI));

  view.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'short';
    el.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
    el.innerHTML = `
      <div class="short-media">
        <img class="short-thumb" src="${s.thumbnail}" alt="" loading="lazy">
        <span class="short-play">▶</span>
        <span class="short-topic">#${esc(s.topic)}</span>
      </div>
      <div class="short-title">${esc(s.title)}</div>`;
    el.addEventListener('click', () => { if (!dragMoved) onCardClick(i); });
    wheel.appendChild(el);
    cards.push(el);
  });
}

function activeIndex() {
  const N = view.length;
  return N ? ((Math.round(-rotation / step) % N) + N) % N : -1;
}

function onCardClick(i) {
  if (i === activeIndex()) playShort(i);
  else targetRot = -i * step;          // spin it to the front
}

function playShort(i) {
  if (playingIndex === i) return;
  stopPlaying();
  const s = view[i], el = cards[i];
  if (!s.videoId) return;
  el.querySelector('.short-media').innerHTML =
    `<iframe class="short-frame" src="https://www.youtube-nocookie.com/embed/${s.videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1"
       allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen
       referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  el.classList.add('playing');
  playingIndex = i;
}

function stopPlaying() {
  if (playingIndex < 0 || !cards[playingIndex]) { playingIndex = -1; return; }
  const s = view[playingIndex], el = cards[playingIndex];
  el.classList.remove('playing');
  el.querySelector('.short-media').innerHTML =
    `<img class="short-thumb" src="${s.thumbnail}" alt=""><span class="short-play">▶</span><span class="short-topic">#${esc(s.topic)}</span>`;
  playingIndex = -1;
}

// ---------------------------------------------------------------------------
// Animation loop: ease the wheel toward its target and mark the active card.
function loop() {
  rotation += (targetRot - rotation) * LERP;
  wheel.style.transform = `translateZ(${-radius}px) rotateY(${rotation}deg)`;
  const active = activeIndex();
  for (let i = 0; i < cards.length; i++) cards[i].classList.toggle('active', i === active);
  if (playingIndex >= 0 && playingIndex !== active) stopPlaying();   // stop when spun away
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Input: scroll, drag, arrow keys
stage.addEventListener('wheel', e => {
  e.preventDefault();
  if (step) targetRot += (e.deltaY > 0 ? -step : step);
}, { passive: false });

let dragging = false, lastX = 0, dragMoved = false;
stage.addEventListener('pointerdown', e => { dragging = true; dragMoved = false; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX; lastX = e.clientX;
  if (Math.abs(dx) > 2) dragMoved = true;
  rotation += dx * 0.25; targetRot += dx * 0.25;
});
stage.addEventListener('pointerup', () => {
  dragging = false;
  if (step) targetRot = Math.round(targetRot / step) * step;   // snap to a card
  setTimeout(() => { dragMoved = false; }, 0);
});
window.addEventListener('keydown', e => {
  if (!step) return;
  if (e.key === 'ArrowRight') targetRot -= step;
  else if (e.key === 'ArrowLeft') targetRot += step;
});

searchEl.addEventListener('input', () => applyFilter(activeFilter, searchEl.value));

load();
