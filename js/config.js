// ============================================================================
// CONFIG — visual + behavioral settings for the XR connections graph
// Edit these values to retheme or tune the graph. No build step required.
// ============================================================================

export const CONFIG = {
  // ---- Color system (dark, clean: black canvas + two accents) ----
  COLORS: {
    creator:   '#FF6B35', // warm accent — the people/channels
    tutorial:  '#FFD166', // amber — video fallback before its thumbnail loads
    concept:   '#4EA8DE', // cool accent — topics / hashtags
    highlight: '#FFFFFF', // white — selected node + its neighbors
    dim:       '#34353B', // faded — everything not in focus
    link:      '#4A4C54', // default edge
    linkHi:    '#FF6B35', // edge touching the focused node
    background: '#08080A', // near-black canvas
  },

  // ---- Physics / layout (passed to d3-force-3d) ----
  GRAPH: {
    chargeStrength: -110,  // node repulsion (more negative = more spread out)
    linkDistance:   34,    // ideal edge length
    cameraDistance: 360,   // starting zoom (zoomToFit reframes once settled)
    cooldownTicks:  140,   // how long the simulation runs before settling
    recenter:       0.05,  // pull the whole galaxy back toward center each tick
    fitPadding:     70,    // px padding when framing the galaxy to the screen
  },

  // ---- Click-to-grow animation ----
  GROW: { hub: 2.2, cardMin: 0.8, cardMax: 2.0, lerp: 0.12 },

  // ---- Search behavior ----
  SEARCH: {
    minLength:  1,
    maxResults: 10,
    debounceMs: 180,
  },

  // ---- Node sizing: maps a node's `popularity` (0–10) to a sphere radius ----
  SIZE: { base: 2, perPopularity: 0.9 },
};

// The hashtags we curate around — also rendered as clickable chips in the UI.
// These are the best discovery tags for viral MediaPipe / XR / interactive content.
export const FEATURED_HASHTAGS = [
  '#MediaPipe', '#HandTracking', '#WebXR', '#AR', '#VR', '#ThreeJS',
  '#ReactThreeFiber', '#ShaderArt', '#TouchDesigner', '#GenerativeArt',
  '#CreativeCoding', '#VibeCoding', '#MLModels', '#PoseEstimation',
];
