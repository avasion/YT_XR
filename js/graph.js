// ============================================================================
// XR CONNECTIONS GRAPH  —  one centered galaxy of all nodes
//
// All nodes are visible at once in a stable, centered galaxy framed to the
// screen (no drifting, no re-simulation on click). Hubs (#topics / creators)
// are glowing spheres; each video is an HTML player card locked to its 3D
// position. Clicking a node grows it with a smooth, tasteful animation; click
// a video card and it plays a real YouTube embed inline.
//
// 3d-force-graph bundles three; we also load a standalone three for the cards
// (same major version, verified compatible).
// ============================================================================

import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { CONFIG, FEATURED_HASHTAGS } from './config.js';
import { graphData as demoData, youtubeLink } from './data.js';

// ---------------------------------------------------------------------------
// 1. Load data (live videos.json, else curated demo data)
// ---------------------------------------------------------------------------
async function loadGraph() {
  try {
    const r = await fetch('js/videos.json', { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      if (j.nodes && j.nodes.length) return { ...j, source: 'live' };
    }
  } catch { /* fall through */ }
  return { nodes: demoData.nodes, links: demoData.links, source: 'demo' };
}

const data = await loadGraph();
const masterNodes = data.nodes;
const masterLinks = data.links;

const idOf = x => (typeof x === 'object' && x ? x.id : x);
masterLinks.forEach(l => { l.srcId = idOf(l.source); l.tgtId = idOf(l.target); });

const nodeById = new Map(masterNodes.map(n => [n.id, n]));
const neighbors = new Map();
masterNodes.forEach(n => neighbors.set(n.id, new Set()));
masterLinks.forEach(l => {
  if (neighbors.has(l.srcId) && neighbors.has(l.tgtId)) {
    neighbors.get(l.srcId).add(l.tgtId);
    neighbors.get(l.tgtId).add(l.srcId);
  }
});

const isHub   = n => n.category === 'concept' || n.category === 'creator';
const isVideo = n => n.category === 'tutorial';
const colorFor = n => CONFIG.COLORS[n.category] || CONFIG.COLORS.concept;

const searchIndex = masterNodes.map(n => ({
  n, label: n.label.toLowerCase(), desc: (n.description || '').toLowerCase(),
}));

let grownId = null;   // the currently "grown"/focused node

// ---------------------------------------------------------------------------
// 2. Hub spheres (custom meshes so we can animate their scale on click)
// ---------------------------------------------------------------------------
const hubMeshes = new Map();   // id -> THREE.Mesh
function hubMesh(n) {
  const r = 3 + (n.popularity || 4) * 0.7;
  const mat = new THREE.MeshLambertMaterial({ color: colorFor(n) });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), mat);
  hubMeshes.set(n.id, mesh);
  return mesh;
}
// Videos are HTML cards (§4) → empty (invisible) WebGL object; links still connect.
function nodeThreeObject(n) {
  return isHub(n) ? hubMesh(n) : new THREE.Object3D();
}

function nodeTooltip(n) {
  if (isVideo(n)) return `<div class="gtip"><b>${n.label}</b></div>`;
  return `<div class="gtip"><b>${n.label}</b><br><span>${n.category} · click to focus</span></div>`;
}

// ---------------------------------------------------------------------------
// 3. Build the galaxy — every node visible, one stable layout
// ---------------------------------------------------------------------------
const container = document.getElementById('graph-container');
let framed = false;

const Graph = ForceGraph3D({ controlType: 'orbit' })(container)
  .backgroundColor(CONFIG.COLORS.background)
  .graphData({ nodes: masterNodes, links: masterLinks })
  .nodeId('id')
  .nodeLabel(nodeTooltip)
  .nodeThreeObject(nodeThreeObject)
  .nodeThreeObjectExtend(false)
  .linkColor(() => CONFIG.COLORS.link)
  .linkWidth(0.5)
  .linkOpacity(0.32)
  .cooldownTicks(CONFIG.GRAPH.cooldownTicks)
  .onNodeClick(node => { if (node) setGrown(node.id); })
  .onBackgroundClick(() => setGrown(null))
  .onEngineStop(() => { if (!framed) { Graph.zoomToFit(700, CONFIG.GRAPH.fitPadding); framed = true; } });

Graph.d3Force('charge').strength(CONFIG.GRAPH.chargeStrength);
Graph.d3Force('link').distance(CONFIG.GRAPH.linkDistance);
Graph.d3Force('recenter', recenterForce(CONFIG.GRAPH.recenter));   // keep galaxy centered
Graph.cameraPosition({ z: CONFIG.GRAPH.cameraDistance });

// Custom force: gently pull the node centroid back to the origin every tick so
// the galaxy never drifts off screen. (No d3 import needed.)
function recenterForce(strength) {
  let nodes = [];
  const force = () => {
    if (!nodes.length) return;
    let cx = 0, cy = 0, cz = 0;
    for (const n of nodes) { cx += n.x; cy += n.y; cz += n.z; }
    cx /= nodes.length; cy /= nodes.length; cz /= nodes.length;
    for (const n of nodes) { n.vx -= cx * strength; n.vy -= cy * strength; n.vz -= cz * strength; }
  };
  force.initialize = n => { nodes = n; };
  return force;
}

// ---------------------------------------------------------------------------
// 4. Video player cards, locked to their 3D position
// ---------------------------------------------------------------------------
const cardLayer = document.createElement('div');
cardLayer.className = 'vnode-layer';
container.appendChild(cardLayer);

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const cards = new Map();   // nodeId -> { el, node, grow }
for (const node of masterNodes) if (isVideo(node)) cards.set(node.id, { el: makeCard(node), node, grow: CONFIG.GROW.cardMin });

function makeCard(node) {
  const el = document.createElement('div');
  el.className = 'vnode';
  el.innerHTML = `
    <div class="vnode-media">
      <img class="vnode-thumb" src="${node.thumbnail || ''}" alt="" loading="lazy">
      <span class="vnode-play">▶</span>
    </div>
    <div class="vnode-bar"><span class="vnode-title" title="${esc(node.label)}">${esc(node.label)}</span></div>`;
  el.querySelector('.vnode-media').addEventListener('click', e => { e.stopPropagation(); setGrown(node.id); });
  cardLayer.appendChild(el);
  return el;
}

function playCard(c) {
  if (!c.node.videoId) { window.open(youtubeLink(c.node), '_blank', 'noopener'); return; }
  const media = c.el.querySelector('.vnode-media');
  if (c.el.classList.contains('playing')) return;
  media.innerHTML =
    `<iframe class="vnode-frame" src="https://www.youtube-nocookie.com/embed/${c.node.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
       allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen
       referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  c.el.classList.add('playing');
}
function unplayCard(c) {
  if (!c.el.classList.contains('playing')) return;
  c.el.classList.remove('playing');
  c.el.querySelector('.vnode-media').innerHTML =
    `<img class="vnode-thumb" src="${c.node.thumbnail || ''}" alt="" loading="lazy"><span class="vnode-play">▶</span>`;
  c.el.querySelector('.vnode-media').addEventListener('click', e => { e.stopPropagation(); setGrown(c.node.id); });
}

// ---------------------------------------------------------------------------
// 5. Focus / grow — the only interaction. No camera flying.
// ---------------------------------------------------------------------------
function setGrown(id) {
  if (grownId && grownId !== id) {            // shrink + stop the previously grown video
    const prev = cards.get(grownId);
    if (prev) unplayCard(prev);
  }
  grownId = id;
  if (id == null) { renderInfoPlaceholder(); return; }
  const c = cards.get(id);
  if (c) playCard(c);                          // video → starts playing as it grows
  renderInfo(nodeById.get(id));
}

// One render loop: animate hub scales + card growth, and place cards on screen.
const _v = new THREE.Vector3();
function tick() {
  const cam = Graph.camera();
  const w = container.clientWidth, h = container.clientHeight;
  const L = CONFIG.GROW.lerp;

  // Hub spheres grow toward 2.2x when focused, else back to 1x.
  for (const [id, m] of hubMeshes) {
    const target = id === grownId ? CONFIG.GROW.hub : 1;
    const s = m.scale.x + (target - m.scale.x) * L;
    m.scale.setScalar(s);
    m.material.emissive.setHex(id === grownId ? 0x222018 : 0x000000);
  }

  // Cards: project to screen, scale by depth × growth.
  for (const c of cards.values()) {
    const { el, node } = c;
    if (node.x == null) { el.style.display = 'none'; continue; }
    _v.set(node.x, node.y, node.z);
    const dist = cam.position.distanceTo(_v);
    _v.project(cam);
    if (_v.z > 1) { el.style.display = 'none'; continue; }
    const target = c.node.id === grownId ? CONFIG.GROW.cardMax : CONFIG.GROW.cardMin;
    c.grow += (target - c.grow) * L;
    const depth = Math.min(1.05, Math.max(0.6, (CONFIG.GRAPH.cameraDistance * 0.7) / dist));
    const sx = (_v.x * 0.5 + 0.5) * w, sy = (-_v.y * 0.5 + 0.5) * h;
    el.style.display = 'block';
    el.style.zIndex = String(Math.max(1, 2000 - Math.round(dist)) + (c.node.id === grownId ? 5000 : 0));
    el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${(depth * c.grow).toFixed(3)})`;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ---------------------------------------------------------------------------
// 6. Info panel
// ---------------------------------------------------------------------------
const infoEl = document.getElementById('nodeInfo');
function renderInfoPlaceholder() {
  infoEl.innerHTML = '<p class="info-placeholder">Click any node to focus it. Click a video to play it.</p>';
}
function renderInfo(node) {
  if (!node) return renderInfoPlaceholder();
  const conns = [...(neighbors.get(node.id) || [])].map(id => nodeById.get(id)).filter(Boolean);
  const connHtml = conns.slice(0, 24).map(c =>
    `<button class="conn-chip" data-id="${c.id}">${esc(c.label)}</button>`).join('');
  const watch = isVideo(node) && node.videoId
    ? `<a class="watch-link" href="https://www.youtube.com/watch?v=${node.videoId}" target="_blank" rel="noopener">▶ Open on YouTube ↗</a>` : '';

  infoEl.innerHTML = `
    <div class="node-title">${esc(node.label)}</div>
    <div class="node-category">${node.category}${node.channelTitle ? ' · ' + esc(node.channelTitle) : ''}</div>
    <div class="node-description">${esc(node.description || '')}</div>
    ${watch}
    <div class="node-stats">
      <strong>${conns.length}</strong> connection${conns.length === 1 ? '' : 's'}
      <div class="conn-list">${connHtml}</div>
    </div>`;
  infoEl.querySelectorAll('.conn-chip').forEach(btn =>
    btn.addEventListener('click', () => setGrown(btn.dataset.id)));
}

// ---------------------------------------------------------------------------
// 7. Search
// ---------------------------------------------------------------------------
const searchInput = document.getElementById('searchInput');
const resultsEl   = document.getElementById('searchResults');

function search(query) {
  const q = query.trim().toLowerCase();
  if (q.length < CONFIG.SEARCH.minLength) return [];
  return searchIndex
    .map(({ n, label, desc }) => {
      let score = 0;
      if (label === q || label === '#' + q) score = 100;
      else if (label.startsWith(q) || label.startsWith('#' + q)) score = 60;
      else if (label.includes(q)) score = 40;
      else if (desc.includes(q)) score = 15;
      if (score) score += (n.popularity || 0);
      return { n, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONFIG.SEARCH.maxResults)
    .map(r => r.n);
}

function renderResults(nodes) {
  if (!nodes.length) { resultsEl.innerHTML = '<p class="search-empty">No matches — try a hashtag below.</p>'; return; }
  resultsEl.innerHTML = nodes.map(n => `
    <div class="search-result-item" data-id="${n.id}">
      <span class="dot" style="background:${colorFor(n)}"></span>
      <div><div class="search-result-category">${n.category}</div><div>${esc(n.label)}</div></div>
    </div>`).join('');
  resultsEl.querySelectorAll('.search-result-item').forEach(item =>
    item.addEventListener('click', () => { setGrown(item.dataset.id); resultsEl.innerHTML = ''; }));
}

let debounce;
searchInput.addEventListener('input', e => {
  clearTimeout(debounce);
  const v = e.target.value;
  debounce = setTimeout(() => { v.trim() ? renderResults(search(v)) : (resultsEl.innerHTML = ''); }, CONFIG.SEARCH.debounceMs);
});
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const hits = search(searchInput.value);
    if (hits.length) { setGrown(hits[0].id); resultsEl.innerHTML = ''; }
  }
});

// ---------------------------------------------------------------------------
// 8. Chips, legend, reset, banner, deep link
// ---------------------------------------------------------------------------
const chipsEl = document.getElementById('hashtagChips');
chipsEl.innerHTML = FEATURED_HASHTAGS.map(h => `<button class="chip">${h}</button>`).join('');
chipsEl.querySelectorAll('.chip').forEach(btn =>
  btn.addEventListener('click', () => {
    searchInput.value = btn.textContent;
    const hits = search(btn.textContent);
    renderResults(hits);
    if (hits.length) setGrown(hits[0].id);
  }));

document.getElementById('resetBtn').addEventListener('click', () => {
  setGrown(null);
  searchInput.value = '';
  resultsEl.innerHTML = '';
  Graph.zoomToFit(700, CONFIG.GRAPH.fitPadding);
});

const counts = masterNodes.reduce((m, n) => (m[n.category] = (m[n.category] || 0) + 1, m), {});
document.getElementById('legend').innerHTML = [
  ['creator', 'Creators'], ['concept', '#Topics'], ['tutorial', 'Videos'],
].map(([cat, label]) =>
  `<div class="legend-item"><span class="dot" style="background:${CONFIG.COLORS[cat]}"></span>${label} (${counts[cat] || 0})</div>`
).join('');

const banner = document.getElementById('dataBanner');
if (data.source === 'live') { banner.className = 'data-banner live'; banner.textContent = `● Live data — ${counts.tutorial || 0} real videos`; }
else { banner.className = 'data-banner demo'; banner.innerHTML = '● Demo data — add your YouTube API key to load real videos (see SETUP.md)'; }

const onResize = () => { Graph.width(container.clientWidth).height(container.clientHeight); Graph.zoomToFit(500, CONFIG.GRAPH.fitPadding); };
window.addEventListener('resize', onResize);
Graph.width(container.clientWidth).height(container.clientHeight);

renderInfoPlaceholder();
const openId = new URLSearchParams(location.hash.slice(1)).get('open');
if (openId && nodeById.has(openId)) setGrown(openId);

console.log(`✅ XR galaxy (${data.source}): ${masterNodes.length} nodes, ${masterLinks.length} links`);
