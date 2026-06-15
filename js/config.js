// ============================================================================
// CONFIG — visual + behavioral settings for the XR connections graph
// Edit these values to retheme or tune the graph. No build step required.
// ============================================================================

export const CONFIG = {
  // ---- Color system (your aesthetic: terracotta + warm pastels on white) ----
  COLORS: {
    creator:   '#9C4A24', // terracotta — the people/channels
    tutorial:  '#D4A574', // sand — individual videos
    concept:   '#C9B8A8', // clay — topics / hashtags
    highlight: '#FF6B35', // hot terracotta — selected node + its neighbors
    dim:       '#E7E0D8', // faded — everything not in focus
    link:      '#D8CEC4', // default edge
    linkHi:    '#FF6B35', // edge touching the focused node
    background: '#FAF7F3', // warm off-white canvas
  },

  // ---- Physics / layout (passed to d3-force-3d) ----
  GRAPH: {
    chargeStrength: -180,  // node repulsion (more negative = more spread out)
    linkDistance:   55,    // ideal edge length
    cameraDistance: 320,   // starting zoom
    cooldownTicks:  120,   // how long the simulation runs before settling
  },

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
