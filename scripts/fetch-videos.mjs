// ============================================================================
// fetch-videos.mjs  —  builds js/videos.json from the YouTube Data API v3.
//
// Runs at BUILD TIME only (locally via `npm run fetch`, or on Netlify).
// The API key comes from the YOUTUBE_API_KEY environment variable (Netlify)
// or a local .env file. It is NEVER written into the output or shipped to
// the browser. If no key is found, the script exits cleanly so the site
// falls back to the curated demo data.
//
// Zero dependencies — uses Node 18+ built-in fetch.
// ============================================================================

import { writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'js', 'videos.json');

// ---- The topics students explore. Edit freely; each becomes a hub node. ----
// id        : stable node id        query : what to search YouTube for
// hashtag   : label shown in the graph
const TOPICS = [
  { id: 'c_mediapipe',     hashtag: '#MediaPipe',      query: 'MediaPipe hand tracking javascript tutorial' },
  { id: 'c_handtracking',  hashtag: '#HandTracking',   query: 'hand tracking interactive web tutorial' },
  { id: 'c_pose',          hashtag: '#PoseEstimation', query: 'pose estimation body tracking webcam tutorial' },
  { id: 'c_cv',            hashtag: '#ComputerVision', query: 'computer vision browser tensorflow.js tutorial' },
  { id: 'c_webxr',         hashtag: '#WebXR',          query: 'WebXR tutorial three.js' },
  { id: 'c_ar',            hashtag: '#AR',             query: 'web augmented reality tutorial' },
  { id: 'c_vr',            hashtag: '#VR',             query: 'web VR three.js tutorial' },
  { id: 'c_threejs',       hashtag: '#ThreeJS',        query: 'three.js tutorial' },
  { id: 'c_r3f',           hashtag: '#ReactThreeFiber',query: 'react three fiber tutorial' },
  { id: 'c_shaders',       hashtag: '#ShaderArt',      query: 'glsl shader art tutorial' },
  { id: 'c_touchdesigner', hashtag: '#TouchDesigner',  query: 'touchdesigner tutorial interactive' },
  { id: 'c_generative',    hashtag: '#GenerativeArt',  query: 'generative art coding tutorial' },
  { id: 'c_creativecoding',hashtag: '#CreativeCoding', query: 'creative coding p5.js tutorial' },
  { id: 'c_vibecoding',    hashtag: '#VibeCoding',     query: 'AI vibe coding tutorial' },
  { id: 'c_mlmodels',      hashtag: '#MLModels',       query: 'machine learning models in the browser tutorial' },
  { id: 'c_contentgen',    hashtag: '#ContentGeneration', query: 'AI content generation tutorial' },
];

const PER_TOPIC = 8;          // videos to pull per topic (8 * 16 topics ~ a rich map)
const API = 'https://www.googleapis.com/youtube/v3';

// ---- Load the key from env or a local .env (no dotenv dependency) ----------
function loadKey() {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY.trim();
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, 'utf8').match(/^\s*YOUTUBE_API_KEY\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const KEY = loadKey();

if (!KEY) {
  console.warn('⚠️  No YOUTUBE_API_KEY found — skipping fetch. The site will use curated demo data.');
  process.exit(0); // exit cleanly so Netlify builds still succeed
}

// ---- Small helpers ---------------------------------------------------------
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.replace(KEY, 'KEY')}`);
  return res.json();
}

// Map a view count to a 1–10 popularity (log scale) for node sizing.
function popularityFromViews(views) {
  const v = Number(views) || 0;
  if (v <= 0) return 1;
  return Math.max(1, Math.min(10, Math.round(Math.log10(v + 1) * 1.4)));
}

// ---- Fetch one topic: search -> hydrate stats ------------------------------
async function fetchTopic(topic) {
  const searchUrl = `${API}/search?part=snippet&type=video&videoEmbeddable=true`
    + `&safeSearch=strict&maxResults=${PER_TOPIC}&order=relevance`
    + `&q=${encodeURIComponent(topic.query)}&key=${KEY}`;
  const search = await getJSON(searchUrl);
  const ids = (search.items || []).map(it => it.id?.videoId).filter(Boolean);
  if (!ids.length) return { videos: [] };

  const detailUrl = `${API}/videos?part=snippet,statistics&id=${ids.join(',')}&key=${KEY}`;
  const detail = await getJSON(detailUrl);

  const videos = (detail.items || []).map(it => ({
    videoId: it.id,
    title: it.snippet.title,
    description: (it.snippet.description || '').slice(0, 240),
    channelId: it.snippet.channelId,
    channelTitle: it.snippet.channelTitle,
    thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || '',
    viewCount: it.statistics?.viewCount || '0',
    publishedAt: it.snippet.publishedAt,
  }));
  return { videos };
}

// ---- Build the graph (nodes + links) from all topics -----------------------
async function build() {
  const nodes = new Map();   // id -> node
  const links = [];
  const seenLink = new Set();
  const addLink = (source, target, type) => {
    const k = `${source}->${target}:${type}`;
    if (seenLink.has(k)) return;
    seenLink.add(k);
    links.push({ source, target, type });
  };

  for (const topic of TOPICS) {
    // concept (hub) node
    nodes.set(topic.id, {
      id: topic.id, label: topic.hashtag, category: 'concept', popularity: 6,
      description: `Videos about ${topic.hashtag.replace('#', '')}.`,
      search: topic.query,
    });

    let result;
    try {
      result = await fetchTopic(topic);
      console.log(`  ${topic.hashtag}: ${result.videos.length} videos`);
    } catch (e) {
      console.warn(`  ⚠️  ${topic.hashtag} failed: ${e.message}`);
      continue;
    }

    const topicVideoIds = [];
    for (const v of result.videos) {
      const vid = 'v_' + v.videoId;
      topicVideoIds.push(vid);

      // video node (dedupe across topics by videoId)
      if (!nodes.has(vid)) {
        nodes.set(vid, {
          id: vid, label: v.title, category: 'tutorial',
          popularity: popularityFromViews(v.viewCount),
          description: v.description,
          videoId: v.videoId, thumbnail: v.thumbnail,
          channelTitle: v.channelTitle, viewCount: v.viewCount,
          publishedAt: v.publishedAt,
        });
      }
      // creator node (dedupe by channelId)
      const cid = 'ch_' + v.channelId;
      if (!nodes.has(cid)) {
        nodes.set(cid, {
          id: cid, label: v.channelTitle, category: 'creator', popularity: 5,
          description: `Creator on YouTube.`, search: v.channelTitle,
        });
      }
      // links
      addLink(cid, vid, 'created');
      addLink(vid, topic.id, 'relates_to');
      addLink(cid, topic.id, 'expertise');
    }

    // chain videos within a topic so each hub is a little "connections map"
    for (let i = 0; i < topicVideoIds.length - 1; i++) {
      addLink(topicVideoIds[i], topicVideoIds[i + 1], 'similar_topic');
    }
  }

  return { nodes: [...nodes.values()], links };
}

// ---- Run -------------------------------------------------------------------
console.log('🎥 Fetching videos from YouTube Data API…');
try {
  const graph = await build();
  graph.generatedAt = new Date().toISOString();
  await writeFile(OUT, JSON.stringify(graph, null, 2));
  console.log(`✅ Wrote ${graph.nodes.length} nodes, ${graph.links.length} links -> js/videos.json`);
} catch (e) {
  console.error('❌ Fetch failed:', e.message);
  console.warn('   Site will fall back to curated demo data.');
  process.exit(0); // don't fail the Netlify build
}
