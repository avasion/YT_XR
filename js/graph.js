// ============================================================================
// XR CONNECTIONS GRAPH  —  main app logic
//
// Loaded as an ES module (see index.html importmap). 3d-force-graph bundles
// Three.js + d3-force-3d, so we don't import THREE ourselves — that avoids the
// classic "two copies of three" bug and keeps this file focused on behavior.
// ============================================================================

import ForceGraph3D from '3d-force-graph';
import { CONFIG, FEATURED_HASHTAGS } from './config.js';
import { graphData, youtubeLink } from './data.js';

// ---- Pre-compute a neighbor index so highlighting is instant -------------
const neighbors = new Map();   // nodeId -> Set(neighborNodeId)
const incident  = new Map();   // nodeId -> Set(link)
graphData.nodes.forEach(n => { neighbors.set(n.id, new Set()); incident.set(n.id, new Set()); });
graphData.links.forEach(l => {
  neighbors.get(l.source).add(l.target);
  neighbors.get(l.target).add(l.source);
  incident.get(l.source).add(l);
  incident.get(l.target).add(l);
});
const nodeById = new Map(graphData.nodes.map(n => [n.id, n]));

// ---- Focus state: which node is selected, and what to keep bright ---------
let focusId = null;                  // currently selected node id (or null)
const litNodes = new Set();          // node ids drawn bright
const litLinks = new Set();          // link objects drawn bright

function setFocus(id) {
  focusId = id;
  litNodes.clear();
  litLinks.clear();
  if (id != null) {
    litNodes.add(id);
    neighbors.get(id).forEach(nb => litNodes.add(nb));
    incident.get(id).forEach(l => litLinks.add(l));
  }
  // Re-assigning the accessors forces 3d-force-graph to repaint colors.
  Graph.nodeColor(Graph.nodeColor())
       .linkColor(Graph.linkColor())
       .linkWidth(Graph.linkWidth())
       .linkDirectionalParticles(Graph.linkDirectionalParticles());
}

// ---------------------------------------------------------------------------
// Build the graph
// ---------------------------------------------------------------------------
const container = document.getElementById('graph-container');

const Graph = ForceGraph3D({ controlType: 'orbit' })(container)
  .backgroundColor(CONFIG.COLORS.background)
  .graphData(graphData)
  .nodeId('id')
  .nodeLabel(n => `<div class="gtip"><b>${n.label}</b><br><span>${n.category}</span></div>`)
  .nodeVal(n => CONFIG.SIZE.base + (n.popularity || 1) * CONFIG.SIZE.perPopularity)
  .nodeColor(n => {
    if (focusId == null) return CONFIG.COLORS[n.category] || CONFIG.COLORS.concept;
    if (n.id === focusId) return CONFIG.COLORS.highlight;
    if (litNodes.has(n.id)) return CONFIG.COLORS[n.category] || CONFIG.COLORS.concept;
    return CONFIG.COLORS.dim;
  })
  .nodeOpacity(0.95)
  .nodeResolution(16)
  .linkColor(l => (focusId != null && litLinks.has(l)) ? CONFIG.COLORS.linkHi
                  : (focusId != null ? CONFIG.COLORS.dim : CONFIG.COLORS.link))
  .linkWidth(l => (focusId != null && litLinks.has(l)) ? 1.6 : 0.4)
  .linkOpacity(0.55)
  .linkDirectionalParticles(l => (focusId != null && litLinks.has(l)) ? 3 : 0)
  .linkDirectionalParticleWidth(2)
  .linkDirectionalParticleColor(() => CONFIG.COLORS.highlight)
  .cooldownTicks(CONFIG.GRAPH.cooldownTicks)
  .onNodeClick(node => selectNode(node))
  .onBackgroundClick(() => { setFocus(null); renderInfoPlaceholder(); });

// Tune the physics once the forces exist.
Graph.d3Force('charge').strength(CONFIG.GRAPH.chargeStrength);
Graph.d3Force('link').distance(CONFIG.GRAPH.linkDistance);
Graph.cameraPosition({ z: CONFIG.GRAPH.cameraDistance });

// ---------------------------------------------------------------------------
// Selecting a node: highlight it + neighbors, fly the camera in, show details
// ---------------------------------------------------------------------------
function selectNode(node) {
  if (!node) return;
  setFocus(node.id);
  renderInfo(node);
  flyTo(node);
}

function flyTo(node) {
  const dist = 90;
  const r = Math.hypot(node.x || 0, node.y || 0, node.z || 0) || 1;
  const ratio = 1 + dist / r;
  Graph.cameraPosition(
    { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
    node,        // look at the node
    1000         // ms transition
  );
}

// ---------------------------------------------------------------------------
// Info panel
// ---------------------------------------------------------------------------
const infoEl = document.getElementById('nodeInfo');

function renderInfoPlaceholder() {
  infoEl.innerHTML = '<p class="info-placeholder">Click any node to explore its connections.</p>';
}

function renderInfo(node) {
  const conns = [...neighbors.get(node.id)].map(id => nodeById.get(id));
  const connHtml = conns.map(c =>
    `<button class="conn-chip" data-id="${c.id}">${c.label}</button>`).join('');

  infoEl.innerHTML = `
    <div class="node-title">${node.label}</div>
    <div class="node-category">${node.category}</div>
    <div class="node-description">${node.description || ''}</div>
    <a class="watch-link" href="${youtubeLink(node)}" target="_blank" rel="noopener">
      ▶ ${node.category === 'creator' ? 'Find on YouTube' : 'Watch on YouTube'}
    </a>
    <div class="node-stats">
      <strong>${conns.length}</strong> connection${conns.length === 1 ? '' : 's'}
      <div class="conn-list">${connHtml}</div>
    </div>`;

  // Clicking a connection chip jumps to that neighbor.
  infoEl.querySelectorAll('.conn-chip').forEach(btn =>
    btn.addEventListener('click', () => selectNode(nodeById.get(btn.dataset.id))));
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
const searchInput   = document.getElementById('searchInput');
const resultsEl     = document.getElementById('searchResults');

function search(query) {
  const q = query.trim().toLowerCase();
  if (q.length < CONFIG.SEARCH.minLength) return [];
  return graphData.nodes
    .map(n => {
      const label = n.label.toLowerCase();
      const desc  = (n.description || '').toLowerCase();
      let score = 0;
      if (label === q || label === '#' + q) score = 100;
      else if (label.startsWith(q) || label.startsWith('#' + q)) score = 60;
      else if (label.includes(q)) score = 40;
      else if (desc.includes(q)) score = 15;
      if (score) score += (n.popularity || 0); // tie-break by popularity
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
    item.addEventListener('click', () => {
      selectNode(nodeById.get(item.dataset.id));
      resultsEl.innerHTML = '';
    }));
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
// Hashtag chips + legend + reset
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
  setFocus(null);
  searchInput.value = '';
  resultsEl.innerHTML = '';
  renderInfoPlaceholder();
  Graph.cameraPosition({ x: 0, y: 0, z: CONFIG.GRAPH.cameraDistance }, { x: 0, y: 0, z: 0 }, 800);
});

// Legend
const counts = graphData.nodes.reduce((m, n) => (m[n.category] = (m[n.category] || 0) + 1, m), {});
document.getElementById('legend').innerHTML = [
  ['creator', 'Creators'], ['tutorial', 'Videos'], ['concept', 'Topics / Hashtags'],
].map(([cat, label]) =>
  `<div class="legend-item"><span class="dot" style="background:${CONFIG.COLORS[cat]}"></span>${label} (${counts[cat] || 0})</div>`
).join('');

// Keep the canvas full-size on resize.
window.addEventListener('resize', () => {
  Graph.width(container.clientWidth).height(container.clientHeight);
});
Graph.width(container.clientWidth).height(container.clientHeight);

renderInfoPlaceholder();
console.log(`✅ XR graph: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);
