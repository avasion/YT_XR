// ============================================================================
// CURATED GRAPH DATA  —  the source of truth for the connections graph.
//
// Three node categories:
//   • creator  — real channels/artists in the XR + creative-coding space
//   • tutorial — a video topic students can go watch
//   • concept  — a hashtag / topic that links videos and creators together
//
// `search` becomes a YouTube search link (always resolves — we don't fabricate
// specific video IDs). `popularity` (0–10) drives node size; it's a relative
// teaching estimate, not a verified view count.
//
// To extend the graph: add a node, then wire it up with one or more links.
// ============================================================================

export const graphData = {
  nodes: [
    // ---------------------------- CREATORS ---------------------------------
    { id: 'coding_train',  label: 'The Coding Train',  category: 'creator', popularity: 10,
      search: 'The Coding Train',
      description: 'Daniel Shiffman. Playful creative-coding tutorials — p5.js, ml5.js, and computer vision made approachable.' },
    { id: 'bruno_simon',   label: 'Bruno Simon',       category: 'creator', popularity: 9,
      search: 'Bruno Simon Three.js Journey',
      description: 'Creator of Three.js Journey, the definitive course for learning 3D on the web.' },
    { id: 'wael_yasmina',  label: 'Wael Yasmina',      category: 'creator', popularity: 8,
      search: 'Wael Yasmina three.js webxr',
      description: 'Three.js, WebXR and WebAR tutorials — building immersive experiences that run in the browser.' },
    { id: 'simondev',      label: 'SimonDev',          category: 'creator', popularity: 8,
      search: 'SimonDev three.js',
      description: 'Deep dives into graphics programming, shaders, and game-style 3D with Three.js.' },
    { id: 'akella',        label: 'Yuri Artiukh (akella)', category: 'creator', popularity: 7,
      search: 'akella webgl shader stream',
      description: 'Live-coded WebGL and shader effects — turning math into mesmerizing interactive visuals.' },
    { id: 'elekktronaut',  label: 'Bileam Tschepe (elekktronaut)', category: 'creator', popularity: 8,
      search: 'elekktronaut touchdesigner tutorial',
      description: 'TouchDesigner tutorials for generative, audio-reactive, and interactive installation art.' },
    { id: 'patt_vira',     label: 'Patt Vira',         category: 'creator', popularity: 7,
      search: 'Patt Vira touchdesigner p5js',
      description: 'Creative coding with p5.js and TouchDesigner — friendly, project-based interactive art.' },
    { id: 'cv_zone',       label: 'Murtaza / CVZone',  category: 'creator', popularity: 8,
      search: 'Murtaza computer vision zone mediapipe',
      description: 'Computer-vision project tutorials: hand tracking, pose, and gesture control with MediaPipe + OpenCV.' },

    // ---------------------------- TUTORIALS --------------------------------
    { id: 'v_mediapipe_hands', label: 'MediaPipe Hand Tracking', category: 'tutorial', popularity: 9,
      search: 'MediaPipe hand tracking tutorial javascript',
      description: 'Detect 21 hand landmarks in real time from a webcam — the foundation of gesture-controlled apps.' },
    { id: 'v_handpose_3d',     label: 'Control 3D Objects With Your Hands', category: 'tutorial', popularity: 8,
      search: 'mediapipe hand tracking three.js control 3d',
      description: 'Pipe MediaPipe hand landmarks into Three.js to grab, rotate, and move 3D objects with your fingers.' },
    { id: 'v_pose_game',       label: 'Pose-Controlled Browser Game', category: 'tutorial', popularity: 7,
      search: 'mediapipe pose detection browser game',
      description: 'Use full-body pose estimation to control a game — no controller, just your body.' },
    { id: 'v_face_filters',    label: 'Build AR Face Filters', category: 'tutorial', popularity: 8,
      search: 'mediapipe face mesh ar filter tutorial',
      description: 'Snapchat-style face filters using MediaPipe FaceMesh and a 3D overlay.' },
    { id: 'v_threejs_intro',   label: 'Three.js for Beginners', category: 'tutorial', popularity: 9,
      search: 'three.js tutorial for beginners',
      description: 'Your first scene, camera, mesh and render loop — the front door to 3D on the web.' },
    { id: 'v_shaders_intro',   label: 'Intro to GLSL Shaders', category: 'tutorial', popularity: 8,
      search: 'glsl shader tutorial introduction',
      description: 'How the GPU paints pixels — vertex and fragment shaders explained from zero.' },
    { id: 'v_webxr_vr',        label: 'Build a VR Scene With WebXR', category: 'tutorial', popularity: 8,
      search: 'webxr vr tutorial three.js headset',
      description: 'Put a Three.js scene into a VR headset using the WebXR Device API — no app store required.' },
    { id: 'v_webar_mobile',    label: 'WebAR on Your Phone', category: 'tutorial', popularity: 8,
      search: 'webxr ar tutorial phone augmented reality',
      description: 'Place 3D models into the real world through a phone browser with WebXR hit-testing.' },
    { id: 'v_td_audio',        label: 'Audio-Reactive Visuals in TouchDesigner', category: 'tutorial', popularity: 7,
      search: 'touchdesigner audio reactive tutorial',
      description: 'Make visuals dance to sound — the gateway drug to interactive installation art.' },
    { id: 'v_generative_p5',   label: 'Generative Art With p5.js', category: 'tutorial', popularity: 8,
      search: 'p5.js generative art tutorial',
      description: 'Rules + randomness = endless visuals. Loops, noise, and color in p5.js.' },
    { id: 'v_particles',       label: 'GPU Particle Systems', category: 'tutorial', popularity: 7,
      search: 'three.js gpu particles tutorial',
      description: 'Render hundreds of thousands of animated particles using shaders in Three.js.' },
    { id: 'v_gesture_ui',      label: 'Gesture-Controlled Web UI', category: 'tutorial', popularity: 7,
      search: 'hand gesture control website mediapipe',
      description: 'Swipe, pinch, and point to drive a webpage — accessibility and magic at once.' },
    { id: 'v_r3f_intro',       label: 'React Three Fiber Crash Course', category: 'tutorial', popularity: 7,
      search: 'react three fiber tutorial',
      description: 'Build Three.js scenes declaratively with React — the modern production stack for 3D web.' },

    // ----------------------------- CONCEPTS --------------------------------
    { id: 'c_mediapipe',   label: '#MediaPipe',      category: 'concept', popularity: 9,
      search: 'mediapipe', description: "Google's on-device ML toolkit for hands, face, pose, and more — in the browser." },
    { id: 'c_handtracking',label: '#HandTracking',   category: 'concept', popularity: 8,
      search: 'hand tracking', description: 'Detecting and following hands/fingers in 3D space.' },
    { id: 'c_pose',        label: '#PoseEstimation', category: 'concept', popularity: 7,
      search: 'pose estimation', description: 'Reading full-body skeleton position from a camera.' },
    { id: 'c_cv',          label: '#ComputerVision', category: 'concept', popularity: 8,
      search: 'computer vision', description: 'Teaching computers to understand images and video.' },
    { id: 'c_webxr',       label: '#WebXR',          category: 'concept', popularity: 9,
      search: 'webxr', description: 'The web standard for VR and AR — immersive experiences with just a URL.' },
    { id: 'c_ar',          label: '#AR',             category: 'concept', popularity: 9,
      search: 'augmented reality', description: 'Augmented reality — digital content layered onto the real world.' },
    { id: 'c_vr',          label: '#VR',             category: 'concept', popularity: 9,
      search: 'virtual reality', description: 'Virtual reality — fully immersive computer-generated worlds.' },
    { id: 'c_threejs',     label: '#ThreeJS',        category: 'concept', popularity: 10,
      search: 'three.js', description: 'The most popular library for 3D graphics on the web.' },
    { id: 'c_shaders',     label: '#ShaderArt',      category: 'concept', popularity: 7,
      search: 'shader art glsl', description: 'Art made directly on the GPU with GLSL.' },
    { id: 'c_touchdesigner',label: '#TouchDesigner', category: 'concept', popularity: 7,
      search: 'touchdesigner', description: 'Node-based visual programming for real-time interactive media.' },
    { id: 'c_generative',  label: '#GenerativeArt',  category: 'concept', popularity: 8,
      search: 'generative art', description: 'Art produced by autonomous systems and code.' },
    { id: 'c_creativecoding',label: '#CreativeCoding',category: 'concept', popularity: 8,
      search: 'creative coding', description: 'Coding as an expressive, artistic medium.' },
  ],

  links: [
    // creator → created videos
    { source: 'cv_zone',       target: 'v_mediapipe_hands', type: 'created' },
    { source: 'cv_zone',       target: 'v_pose_game',       type: 'created' },
    { source: 'cv_zone',       target: 'v_gesture_ui',      type: 'created' },
    { source: 'wael_yasmina',  target: 'v_handpose_3d',     type: 'created' },
    { source: 'wael_yasmina',  target: 'v_webxr_vr',        type: 'created' },
    { source: 'wael_yasmina',  target: 'v_webar_mobile',    type: 'created' },
    { source: 'wael_yasmina',  target: 'v_face_filters',    type: 'created' },
    { source: 'bruno_simon',   target: 'v_threejs_intro',   type: 'created' },
    { source: 'bruno_simon',   target: 'v_r3f_intro',       type: 'created' },
    { source: 'simondev',      target: 'v_shaders_intro',   type: 'created' },
    { source: 'simondev',      target: 'v_particles',       type: 'created' },
    { source: 'akella',        target: 'v_shaders_intro',   type: 'created' },
    { source: 'akella',        target: 'v_particles',       type: 'created' },
    { source: 'elekktronaut',  target: 'v_td_audio',        type: 'created' },
    { source: 'patt_vira',     target: 'v_generative_p5',   type: 'created' },
    { source: 'patt_vira',     target: 'v_td_audio',        type: 'created' },
    { source: 'coding_train',  target: 'v_generative_p5',   type: 'created' },
    { source: 'coding_train',  target: 'v_pose_game',       type: 'created' },

    // video → concept (relates_to)
    { source: 'v_mediapipe_hands', target: 'c_mediapipe',    type: 'relates_to' },
    { source: 'v_mediapipe_hands', target: 'c_handtracking', type: 'relates_to' },
    { source: 'v_mediapipe_hands', target: 'c_cv',           type: 'relates_to' },
    { source: 'v_handpose_3d',     target: 'c_handtracking', type: 'relates_to' },
    { source: 'v_handpose_3d',     target: 'c_threejs',      type: 'relates_to' },
    { source: 'v_handpose_3d',     target: 'c_mediapipe',    type: 'relates_to' },
    { source: 'v_pose_game',       target: 'c_pose',         type: 'relates_to' },
    { source: 'v_pose_game',       target: 'c_cv',           type: 'relates_to' },
    { source: 'v_face_filters',    target: 'c_ar',           type: 'relates_to' },
    { source: 'v_face_filters',    target: 'c_mediapipe',    type: 'relates_to' },
    { source: 'v_threejs_intro',   target: 'c_threejs',      type: 'relates_to' },
    { source: 'v_shaders_intro',   target: 'c_shaders',      type: 'relates_to' },
    { source: 'v_shaders_intro',   target: 'c_threejs',      type: 'relates_to' },
    { source: 'v_webxr_vr',        target: 'c_webxr',        type: 'relates_to' },
    { source: 'v_webxr_vr',        target: 'c_vr',           type: 'relates_to' },
    { source: 'v_webxr_vr',        target: 'c_threejs',      type: 'relates_to' },
    { source: 'v_webar_mobile',    target: 'c_webxr',        type: 'relates_to' },
    { source: 'v_webar_mobile',    target: 'c_ar',           type: 'relates_to' },
    { source: 'v_td_audio',        target: 'c_touchdesigner',type: 'relates_to' },
    { source: 'v_td_audio',        target: 'c_generative',   type: 'relates_to' },
    { source: 'v_generative_p5',   target: 'c_generative',   type: 'relates_to' },
    { source: 'v_generative_p5',   target: 'c_creativecoding',type: 'relates_to' },
    { source: 'v_particles',       target: 'c_shaders',      type: 'relates_to' },
    { source: 'v_particles',       target: 'c_threejs',      type: 'relates_to' },
    { source: 'v_gesture_ui',      target: 'c_handtracking', type: 'relates_to' },
    { source: 'v_gesture_ui',      target: 'c_mediapipe',    type: 'relates_to' },
    { source: 'v_r3f_intro',       target: 'c_threejs',      type: 'relates_to' },

    // video ↔ video (similar_topic) — the "you might also like" web
    { source: 'v_mediapipe_hands', target: 'v_handpose_3d',  type: 'similar_topic' },
    { source: 'v_handpose_3d',     target: 'v_gesture_ui',   type: 'similar_topic' },
    { source: 'v_pose_game',       target: 'v_face_filters', type: 'similar_topic' },
    { source: 'v_threejs_intro',   target: 'v_r3f_intro',    type: 'similar_topic' },
    { source: 'v_shaders_intro',   target: 'v_particles',    type: 'similar_topic' },
    { source: 'v_webxr_vr',        target: 'v_webar_mobile', type: 'similar_topic' },
    { source: 'v_td_audio',        target: 'v_generative_p5',type: 'similar_topic' },

    // creator → concept (expertise)
    { source: 'cv_zone',      target: 'c_cv',            type: 'expertise' },
    { source: 'wael_yasmina', target: 'c_webxr',         type: 'expertise' },
    { source: 'bruno_simon',  target: 'c_threejs',       type: 'expertise' },
    { source: 'simondev',     target: 'c_shaders',       type: 'expertise' },
    { source: 'akella',       target: 'c_shaders',       type: 'expertise' },
    { source: 'elekktronaut', target: 'c_touchdesigner', type: 'expertise' },
    { source: 'coding_train', target: 'c_creativecoding',type: 'expertise' },
    { source: 'patt_vira',    target: 'c_generative',    type: 'expertise' },
  ],
};

// Build a real, always-valid YouTube link from a node's `search` text.
export function youtubeLink(node) {
  const q = node.search || node.label;
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}
