// ============================================================================
// fetch-shorts.mjs — rebuild js/shorts.json (real YouTube Shorts of people
// interacting with their interactive projects). No API key needed: it reads
// real Shorts IDs from YouTube search and oEmbed-verifies embeddability.
//
// Run locally with Node 18+:  node scripts/fetch-shorts.mjs
// ============================================================================

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'js', 'shorts.json');

const TOPICS = [
  { tag: 'HandTracking',   query: 'mediapipe hand tracking project #shorts' },
  { tag: 'AR',             query: 'augmented reality filter demo #shorts' },
  { tag: 'VR',             query: 'vr interactive demo #shorts' },
  { tag: 'TouchDesigner',  query: 'touchdesigner interactive installation #shorts' },
  { tag: 'CreativeCoding', query: 'creative coding interactive #shorts' },
  { tag: 'Installation',   query: 'interactive art installation #shorts' },
  { tag: 'Projection',     query: 'projection mapping interactive #shorts' },
  { tag: 'Arduino',        query: 'arduino interactive project #shorts' },
  { tag: 'LED',            query: 'led interactive wall #shorts' },
  { tag: 'Kinect',         query: 'kinect interactive installation #shorts' },
  { tag: 'GenerativeArt',  query: 'generative art interactive #shorts' },
  { tag: 'WebXR',          query: 'webxr three.js demo #shorts' },
];
const PER = 5;

async function text(url) {
  const r = await fetch(url, { headers: { 'Accept-Language': 'en-US' } });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.text();
}
async function oembed(id) {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`);
  return r.ok ? r.json() : null;
}

const shorts = [];
const seen = new Set();
for (const t of TOPICS) {
  let html;
  try { html = await text(`https://www.youtube.com/results?search_query=${encodeURIComponent(t.query)}`); }
  catch (e) { console.warn(`  ${t.tag} search failed: ${e.message}`); continue; }
  const ids = [...new Set([...html.matchAll(/reelWatchEndpoint":\{"videoId":"([\w-]{11})"/g)].map(m => m[1]))];
  let added = 0;
  for (const id of ids) {
    if (added >= PER) break;
    if (seen.has(id)) continue;
    let oe; try { oe = await oembed(id); } catch { oe = null; }
    if (!oe || !oe.title) continue;
    seen.add(id); added++;
    shorts.push({ id, videoId: id, title: oe.title, channelTitle: oe.author_name, thumbnail: oe.thumbnail_url, topic: t.tag });
  }
  console.log(`  ${t.tag}: ${added} shorts`);
}

const out = { shorts, topics: TOPICS.map(t => t.tag), generatedAt: new Date().toISOString() };
await writeFile(OUT, JSON.stringify(out, null, 2));
console.log(`✅ Wrote ${shorts.length} shorts -> js/shorts.json`);
