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
  Graph.graphData(computeVisible());
  Graph.nodeColor(Graph.nodeColor())
       .linkColor(Graph.linkColor())
       .linkWidth(Graph.linkWidth())
       .linkDirectionalParticles(Graph.linkDirectionalParticles());
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
  .linkDirectionalParticles(l => (focusId != null && litLinks.has(l)) ? 3 : 0)
  .linkDirectionalParticleWidth(2)
  .linkDirectionalParticleColor(() => CONFIG.COLORS.highlight)
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

// Video nodes → a billboard sprite showing the real YouTube thumbnail.
// Hubs (creators/#topics) return null → default colored sphere.
const texCache = new Map();
function nodeThreeObject(n) {
  if (!isVideo(n) || !n.thumbnail) return null;
  let tex = texCache.get(n.thumbnail);
  if (!tex) {
    tex = new THREE.TextureLoader().load(n.thumbnail);
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(n.thumbnail, tex);
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
  const h = 10 + (n.popularity || 4);        // scale with popularity
  sprite.scale.set(h * 16 / 9, h, 1);        // 16:9 thumbnail
  return sprite;
}

function nodeTooltip(n) {
  const thumb = n.thumbnail ? `<img src="${n.thumbnail}" class="tip-thumb" alt="">` : '';
  const hint = isVideo(n)
    ? (expanded.has(n.id) ? 'double-click ▶ play · click to collapse' : 'double-click ▶ play · click for related')
    : (expanded.has(n.id) ? 'click to collapse' : 'click to reveal 2 videos');
  return `<div class="gtip">${thumb}<b>${n.label}</b><br><span>${n.category} · ${hint}</span></div>`;
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

let lastClick = { id: null, t: 0 };
function onNodeClick(node) {
  if (!node) return;
  const now = Date.now();
  if (isVideo(node) && lastClick.id === node.id && now - lastClick.t < 350) {
    playVideo(node); lastClick = { id: null, t: 0 }; return;
  }
  lastClick = { id: node.id, t: now };
  expanded.has(node.id) ? expanded.delete(node.id) : expanded.add(node.id);
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
// 5. Playable video overlay (real YouTube player)
// ---------------------------------------------------------------------------
const overlay     = document.getElementById('player-overlay');
const playerFrame = document.getElementById('playerFrame');
const playerTitle = document.getElementById('playerTitle');
const playerMeta  = document.getElementById('playerMeta');

function playVideo(node) {
  if (!node.videoId) {
    // Demo data has no real IDs — open a YouTube search instead.
    window.open(youtubeLink(node), '_blank', 'noopener');
    return;
  }
  playerTitle.textContent = node.label;
  // youtube-nocookie = privacy-friendly (good for classrooms). rel=0 keeps
  // suggested videos limited to the same channel.
  playerFrame.src = `https://www.youtube-nocookie.com/embed/${node.videoId}?autoplay=1&rel=0&modestbranding=1`;
  const views = node.viewCount ? Number(node.viewCount).toLocaleString() + ' views' : '';
  playerMeta.innerHTML = `${node.channelTitle ? '<strong>' + node.channelTitle + '</strong>' : ''}
    ${views ? ' · ' + views : ''}
    · <a href="https://www.youtube.com/watch?v=${node.videoId}" target="_blank" rel="noopener">Open on YouTube ↗</a>`;
  overlay.hidden = false;
}

function closePlayer() {
  overlay.hidden = true;
  playerFrame.src = '';   // stop playback
}
document.getElementById('playerClose').addEventListener('click', closePlayer);
overlay.addEventListener('click', e => { if (e.target === overlay) closePlayer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });

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
console.log(`✅ XR graph (${data.source}): ${masterNodes.length} nodes, ${masterLinks.length} links`);
