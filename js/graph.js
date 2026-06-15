// ============================================================================
// XR CONNECTIONS GRAPH  —  drill-down sub-maps + playable videos
//
// Top level shows HUBS (creators + #topics). Click a hub and it expands into a
// smaller connections map of its actual videos. Click a video to play it in a
// real YouTube player overlaid on the 3D scene.
//
// Data comes from js/videos.json (built at deploy time from the YouTube API).
// If that file isn't there yet, we fall back to the curated demo dataset.
// 3d-force-graph bundles Three.js, so we don't import THREE ourselves.
// ============================================================================

import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { CONFIG, FEATURED_HASHTAGS } from './config.js';
import { graphData as demoData, youtubeLink } from './data.js';

const RELATED_LIMIT = 2;   // how many related videos a node reveals when expanded

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

// Normalize link endpoints to stable ids (3d-force-graph mutates source/target
// into objects after the first render, so we keep our own srcId/tgtId).
const idOf = x => (typeof x === 'object' && x ? x.id : x);
masterLinks.forEach(l => { l.srcId = idOf(l.source); l.tgtId = idOf(l.target); });

const nodeById = new Map(masterNodes.map(n => [n.id, n]));
const neighbors = new Map();
const incident  = new Map();
masterNodes.forEach(n => { neighbors.set(n.id, new Set()); incident.set(n.id, new Set()); });
masterLinks.forEach(l => {
  if (!neighbors.has(l.srcId) || !neighbors.has(l.tgtId)) return; // skip dangling
  neighbors.get(l.srcId).add(l.tgtId);
  neighbors.get(l.tgtId).add(l.srcId);
  incident.get(l.srcId).add(l);
  incident.get(l.tgtId).add(l);
});

const isHub   = n => n.category === 'concept' || n.category === 'creator';
const isVideo = n => n.category === 'tutorial';
const hubNodes = masterNodes.filter(isHub);   // always-visible nodes, computed once

// Lowercased search index — built once instead of per keystroke.
const searchIndex = masterNodes.map(n => ({
  n, label: n.label.toLowerCase(), desc: (n.description || '').toLowerCase(),
}));

// ---------------------------------------------------------------------------
// 2. Drill-down state: which hubs are expanded, and what's highlighted
// ---------------------------------------------------------------------------
const expanded = new Set();   // hub ids whose videos are currently shown
let focusId = null;           // selected node id (for highlighting)
const litNodes = new Set();
const litLinks = new Set();

// Up to RELATED_LIMIT related videos for a node, best (most popular) first.
// Memoized — the graph is static, so each node's answer never changes.
const relatedCache = new Map();
function relatedVideos(id) {
  let r = relatedCache.get(id);
  if (!r) {
    r = [...(neighbors.get(id) || [])]
      .map(x => nodeById.get(x))
      .filter(n => n && isVideo(n))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, RELATED_LIMIT)
      .map(n => n.id);
    relatedCache.set(id, r);
  }
  return r;
}

function computeVisible() {
  const vis = new Set();
  for (const n of hubNodes) vis.add(n.id);                        // hubs always visible
  for (const pid of expanded) {                                   // + up to 2 related videos
    for (const vid of relatedVideos(pid)) vis.add(vid);
  }
  const nodes = masterNodes.filter(n => vis.has(n.id));
  const links = masterLinks.filter(l => vis.has(l.srcId) && vis.has(l.tgtId));
  return { nodes, links };
}

function recomputeLit() {
  litNodes.clear(); litLinks.clear();
  if (focusId == null) return;
  litNodes.add(focusId);
  for (const nb of neighbors.get(focusId) || []) litNodes.add(nb);
  for (const l of incident.get(focusId) || []) litLinks.add(l);
}

// Push current visibility + repaint colors. Reusing node object refs keeps
// positions stable across expand/collapse (no jarring re-layout).
function refresh() {
  recomputeLit();
  const vis = computeVisible();
  Graph.graphData(vis);
  Graph.nodeColor(Graph.nodeColor())
       .linkColor(Graph.linkColor())
       .linkWidth(Graph.linkWidth());
  syncCards(vis.nodes.filter(isVideo));   // video nodes are HTML player cards (§5)
}

// ---------------------------------------------------------------------------
// 3. Build the graph
// ---------------------------------------------------------------------------
const container = document.getElementById('graph-container');

const Graph = ForceGraph3D({ controlType: 'orbit' })(container)
  .backgroundColor(CONFIG.COLORS.background)
  .graphData(computeVisible())   // seed the simulation so d3Force() is ready
  .nodeId('id')
  .nodeLabel(nodeTooltip)
  .nodeVal(n => CONFIG.SIZE.base + (n.popularity || 1) * CONFIG.SIZE.perPopularity)
  .nodeColor(nodeColor)
  .nodeOpacity(0.95)
  .nodeResolution(14)
  .nodeThreeObject(nodeThreeObject)   // video nodes render as their YouTube thumbnail
  .nodeThreeObjectExtend(false)
  .linkColor(l => (focusId != null && litLinks.has(l)) ? CONFIG.COLORS.linkHi
                  : (focusId != null ? CONFIG.COLORS.dim : CONFIG.COLORS.link))
  .linkWidth(l => (focusId != null && litLinks.has(l)) ? 1.6 : 0.4)
  .linkOpacity(0.5)
  .cooldownTicks(CONFIG.GRAPH.cooldownTicks)
  .onNodeClick(onNodeClick)
  .onBackgroundClick(() => { focusId = null; refresh(); renderInfoPlaceholder(); });

Graph.d3Force('charge').strength(CONFIG.GRAPH.chargeStrength);
Graph.d3Force('link').distance(CONFIG.GRAPH.linkDistance);
Graph.cameraPosition({ z: CONFIG.GRAPH.cameraDistance });

function nodeColor(n) {
  if (focusId == null) return CONFIG.COLORS[n.category] || CONFIG.COLORS.concept;
  if (n.id === focusId) return CONFIG.COLORS.highlight;
  if (litNodes.has(n.id)) return CONFIG.COLORS[n.category] || CONFIG.COLORS.concept;
  return CONFIG.COLORS.dim;
}

// Video nodes are drawn as HTML player cards (§5), so their WebGL object is
// empty/invisible — only their position is used (links still connect to it).
// Hubs (creators/#topics) return null → default colored sphere.
function nodeThreeObject(n) {
  return isVideo(n) ? new THREE.Object3D() : null;
}

function nodeTooltip(n) {
  if (isVideo(n)) return `<div class="gtip"><b>${n.label}</b></div>`;
  const hint = expanded.has(n.id) ? 'click to collapse' : 'click to reveal 2 videos';
  return `<div class="gtip"><b>${n.label}</b><br><span>${n.category} · ${hint}</span></div>`;
}

// ---------------------------------------------------------------------------
// 4. Interaction: hubs expand, videos play
// ---------------------------------------------------------------------------
// Single click: any node expands to reveal its 2 related videos (click again to
// collapse). Double-click a video: play it.
// Highlight a node, repaint, show its info, and fly to it. Shared by clicks,
// search results, and connection chips.
function focusOn(node) {
  focusId = node.id;
  refresh();
  renderInfo(node);
  const live = nodeById.get(node.id);   // the positioned instance
  if (live && live.x != null) flyTo(live);
}

function toggleExpand(id) {
  expanded.has(id) ? expanded.delete(id) : expanded.add(id);
}
function onNodeClick(node) {
  if (!node) return;       // hubs only — video nodes are HTML cards (§5)
  toggleExpand(node.id);
  focusOn(node);
}

function flyTo(node) {
  const r = Math.hypot(node.x || 0, node.y || 0, node.z || 0) || 1;
  const ratio = 1 + 110 / r;
  Graph.cameraPosition(
    { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
    node, 900
  );
}

// ---------------------------------------------------------------------------
// 5. Video nodes as HTML player cards, locked to their 3D position
// ---------------------------------------------------------------------------
const cardLayer = document.createElement('div');
cardLayer.className = 'vnode-layer';
container.appendChild(cardLayer);

const cards = new Map();   // nodeId -> { el, node }
const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function makeCard(node) {
  const el = document.createElement('div');
  el.className = 'vnode';
  el.innerHTML = `
    <div class="vnode-media">
      <img class="vnode-thumb" src="${node.thumbnail || ''}" alt="" loading="lazy">
      <span class="vnode-play">▶</span>
    </div>
    <div class="vnode-bar">
      <span class="vnode-title" title="${esc(node.label)}">${esc(node.label)}</span>
      <button class="vnode-rel" title="Reveal related videos">⊕</button>
    </div>`;
  el.querySelector('.vnode-media').addEventListener('click', () => { focusOn(node); playCard(node, el); });
  el.querySelector('.vnode-rel').addEventListener('click', e => {
    e.stopPropagation(); toggleExpand(node.id); focusOn(node);
  });
  cardLayer.appendChild(el);
  return el;
}

// Swap the thumbnail for a real, autoplaying YouTube iframe — the node becomes a player.
function playCard(node, el) {
  if (!node.videoId) { window.open(youtubeLink(node), '_blank', 'noopener'); return; }
  if (el.classList.contains('playing')) return;
  el.querySelector('.vnode-media').innerHTML =
    `<iframe class="vnode-frame" src="https://www.youtube-nocookie.com/embed/${node.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
       allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen
       referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  el.classList.add('playing');
}

// Called from the info panel / search: make sure the card exists, then play it.
function playVideo(node) {
  if (!node.videoId) { window.open(youtubeLink(node), '_blank', 'noopener'); return; }
  if (!cards.has(node.id)) selectNode(node);   // expands owning hub -> creates the card
  const c = cards.get(node.id);
  if (c) playCard(node, c.el);
}

// Keep the live cards matched to the currently-visible video nodes.
function syncCards(videoNodes) {
  const want = new Set(videoNodes.map(n => n.id));
  for (const [id, c] of cards) {
    if (!want.has(id)) { c.el.remove(); cards.delete(id); }
  }
  for (const node of videoNodes) {
    if (!cards.has(node.id)) cards.set(node.id, { el: makeCard(node), node });
  }
}

// Each frame: project every card's node to screen and place the card there.
const _v = new THREE.Vector3();
function positionCards() {
  const cam = Graph.camera();
  const w = container.clientWidth, h = container.clientHeight;
  for (const { el, node } of cards.values()) {
    if (node.x == null) { el.style.display = 'none'; continue; }
    _v.set(node.x, node.y, node.z);
    const dist = cam.position.distanceTo(_v);
    _v.project(cam);
    if (_v.z > 1) { el.style.display = 'none'; continue; }   // behind the camera
    const sx = (_v.x * 0.5 + 0.5) * w;
    const sy = (-_v.y * 0.5 + 0.5) * h;
    const scale = Math.min(1.2, Math.max(0.45, (CONFIG.GRAPH.cameraDistance * 0.7) / dist));
    el.style.display = 'block';
    el.style.zIndex = String(Math.max(1, 2000 - Math.round(dist)));
    el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
  }
  requestAnimationFrame(positionCards);
}
requestAnimationFrame(positionCards);

// ---------------------------------------------------------------------------
// 6. Info panel
// ---------------------------------------------------------------------------
const infoEl = document.getElementById('nodeInfo');

function renderInfoPlaceholder() {
  infoEl.innerHTML = '<p class="info-placeholder">Click a #topic or creator to open its videos, then click a video to play.</p>';
}

function renderInfo(node) {
  const conns = [...(neighbors.get(node.id) || [])].map(id => nodeById.get(id)).filter(Boolean);
  const connHtml = conns.slice(0, 24).map(c =>
    `<button class="conn-chip" data-id="${c.id}">${c.label}</button>`).join('');

  let primary = '';
  if (isVideo(node)) {
    primary = `<button class="watch-link" data-play="${node.id}">▶ Play video</button>`;
  } else {
    const open = expanded.has(node.id);
    primary = `<button class="watch-link" data-toggle="${node.id}">${open ? '⊖ Collapse' : '⊕ Reveal 2 videos'}</button>`;
  }

  infoEl.innerHTML = `
    <div class="node-title">${node.label}</div>
    <div class="node-category">${node.category}${node.channelTitle ? ' · ' + node.channelTitle : ''}</div>
    <div class="node-description">${node.description || ''}</div>
    ${primary}
    <div class="node-stats">
      <strong>${conns.length}</strong> connection${conns.length === 1 ? '' : 's'}
      <div class="conn-list">${connHtml}</div>
    </div>`;

  const playBtn = infoEl.querySelector('[data-play]');
  if (playBtn) playBtn.addEventListener('click', () => playVideo(node));
  const toggleBtn = infoEl.querySelector('[data-toggle]');
  if (toggleBtn) toggleBtn.addEventListener('click', () => onNodeClick(node));
  infoEl.querySelectorAll('.conn-chip').forEach(btn =>
    btn.addEventListener('click', () => selectNode(nodeById.get(btn.dataset.id))));
}

// Select a node from search / a chip: make sure it's visible, then focus it.
function selectNode(node) {
  if (!node) return;
  if (isVideo(node)) {
    // expand a hub that owns this video so it appears in the map
    const hub = [...(neighbors.get(node.id) || [])].map(id => nodeById.get(id)).find(p => p && isHub(p));
    if (hub) expanded.add(hub.id);
  } else {
    expanded.add(node.id);
  }
  focusOn(node);
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
  if (!nodes.length) {
    resultsEl.innerHTML = '<p class="search-empty">No matches — try a hashtag below.</p>';
    return;
  }
  resultsEl.innerHTML = nodes.map(n => `
    <div class="search-result-item" data-id="${n.id}">
      <span class="dot" style="background:${CONFIG.COLORS[n.category]}"></span>
      <div>
        <div class="search-result-category">${n.category}</div>
        <div>${n.label}</div>
      </div>
    </div>`).join('');
  resultsEl.querySelectorAll('.search-result-item').forEach(item =>
    item.addEventListener('click', () => { selectNode(nodeById.get(item.dataset.id)); resultsEl.innerHTML = ''; }));
}

let debounce;
searchInput.addEventListener('input', e => {
  clearTimeout(debounce);
  const v = e.target.value;
  debounce = setTimeout(() => {
    if (!v.trim()) { resultsEl.innerHTML = ''; return; }
    renderResults(search(v));
  }, CONFIG.SEARCH.debounceMs);
});
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const hits = search(searchInput.value);
    if (hits.length) { selectNode(hits[0]); resultsEl.innerHTML = ''; }
  }
});

// ---------------------------------------------------------------------------
// 8. Hashtag chips, legend, reset, data banner
// ---------------------------------------------------------------------------
const chipsEl = document.getElementById('hashtagChips');
chipsEl.innerHTML = FEATURED_HASHTAGS.map(h => `<button class="chip">${h}</button>`).join('');
chipsEl.querySelectorAll('.chip').forEach(btn =>
  btn.addEventListener('click', () => {
    searchInput.value = btn.textContent;
    const hits = search(btn.textContent);
    renderResults(hits);
    if (hits.length) selectNode(hits[0]);
  }));

document.getElementById('resetBtn').addEventListener('click', () => {
  expanded.clear();
  focusId = null;
  searchInput.value = '';
  resultsEl.innerHTML = '';
  refresh();
  renderInfoPlaceholder();
  Graph.cameraPosition({ x: 0, y: 0, z: CONFIG.GRAPH.cameraDistance }, { x: 0, y: 0, z: 0 }, 800);
});

const counts = masterNodes.reduce((m, n) => (m[n.category] = (m[n.category] || 0) + 1, m), {});
document.getElementById('legend').innerHTML = [
  ['creator', 'Creators'], ['concept', '#Topics (click to open)'], ['tutorial', 'Videos'],
].map(([cat, label]) =>
  `<div class="legend-item"><span class="dot" style="background:${CONFIG.COLORS[cat]}"></span>${label} (${counts[cat] || 0})</div>`
).join('');

const banner = document.getElementById('dataBanner');
if (data.source === 'live') {
  banner.className = 'data-banner live';
  banner.textContent = `● Live data — ${counts.tutorial || 0} real videos`;
} else {
  banner.className = 'data-banner demo';
  banner.innerHTML = `● Demo data — add your YouTube API key to load real, playable videos (see SETUP.md)`;
}

window.addEventListener('resize', () => Graph.width(container.clientWidth).height(container.clientHeight));
Graph.width(container.clientWidth).height(container.clientHeight);

refresh();
renderInfoPlaceholder();

// Optional deep link: open the app at #open=<hubId> to auto-expand a hub
// (handy for sharing a topic with a whole class).
const openId = new URLSearchParams(location.hash.slice(1)).get('open');
if (openId && nodeById.has(openId)) selectNode(nodeById.get(openId));

console.log(`✅ XR graph (${data.source}): ${masterNodes.length} nodes, ${masterLinks.length} links`);
