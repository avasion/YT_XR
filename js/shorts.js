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
const SPACING = 210, MIN_R = 360;
const SCROLL_NOTCH = 80;   // wheel/trackpad delta needed to advance one card
const EASE = 0.18;         // how quickly the wheel settles onto a card

let all = [], topics = [], view = [], cards = [];
let step = 0, radius = MIN_R, rotation = 0, targetRot = 0, accum = 0;
let dragging = false, dragMoved = false, lastX = 0;
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
  wheel.innerHTML = ''; cards = []; rotation = 0; targetRot = 0; accum = 0;
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
    el.dataset.i = i;          // tap handled in pointerup (pointer-capture-safe)
    wheel.appendChild(el);
    cards.push(el);
  });
}

function activeIndex() {
  const N = view.length;
  return N ? ((Math.round(-rotation / step) % N) + N) % N : -1;
}

function onCardClick(i) {
  if (playingIndex === i) stopPlaying();   // click again to stop + resume browsing
  else playShort(i);                        // play it; the wheel eases it to front
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
// Animation loop. The wheel always eases toward `targetRot`, which is always a
// whole number of cards — so it snaps a card cleanly to center. Playing a short
// just sets the target to that card.
function move(deltaCards) {           // advance the wheel by N cards (signed)
  if (!step) return;
  targetRot -= deltaCards * step;
}
function loop() {
  if (playingIndex >= 0 && cards[playingIndex]) {
    let t = -playingIndex * step;
    while (t - targetRot > 180) t -= 360;
    while (t - targetRot < -180) t += 360;
    targetRot = t;                    // keep the playing short centered
  }
  rotation += (targetRot - rotation) * EASE;
  wheel.style.transform = `translateZ(${-radius}px) rotateY(${rotation}deg)`;
  const active = playingIndex >= 0 ? playingIndex : activeIndex();
  for (let i = 0; i < cards.length; i++) cards[i].classList.toggle('active', i === active);
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Input. Scroll / two-finger swipe steps card-by-card and snaps. Drag to fling.
// Tap a card to play. Arrow keys step.
stage.addEventListener('wheel', e => {
  e.preventDefault();
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  accum += d;
  while (accum >= SCROLL_NOTCH)  { move(1);  accum -= SCROLL_NOTCH; }   // one card per notch
  while (accum <= -SCROLL_NOTCH) { move(-1); accum += SCROLL_NOTCH; }
}, { passive: false });

let downIdx = -1;
stage.addEventListener('pointerdown', e => {
  dragging = true; dragMoved = false; lastX = e.clientX;
  const card = e.target.closest('.short');
  downIdx = card ? Number(card.dataset.i) : -1;
  try { stage.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
});
stage.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX; lastX = e.clientX;
  if (Math.abs(dx) > 3) dragMoved = true;
  rotation += dx * 0.3;
  targetRot = rotation;                       // follow the finger; snap on release
});
stage.addEventListener('pointerup', () => {
  dragging = false;
  if (!dragMoved && downIdx >= 0) onCardClick(downIdx);          // tap → play / stop
  else if (step) targetRot = Math.round(rotation / step) * step; // release → snap to card
  downIdx = -1;
});

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') move(1);
  else if (e.key === 'ArrowLeft') move(-1);
});

searchEl.addEventListener('input', () => applyFilter(activeFilter, searchEl.value));

load();
