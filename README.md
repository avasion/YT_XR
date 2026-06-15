# XR Interactive Graph Search Engine

A 3D force-directed graph visualization for exploring curated MediaPipe, XR, AR, VR, and interactive coding tutorials. Built with Three.js + three-force-graph for your 10-day XR summer intensive.

## Features

✨ **3D Force-Directed Graph** - Nodes represent creators, videos, and concepts; edges show relationships  
🔍 **Full-Text Search** - Find creators, videos, and topics across the graph  
⌨️ **WASD Navigation** - Fly through the graph with keyboard controls + mouse  
🎨 **Your Design System** - IBM Plex fonts, terracotta accents (#9C4A24), white backgrounds  
📱 **Responsive UI** - Works on desktop and mobile  
🚀 **Ready for YouTube API** - Plugged in and ready for real data  

## Project Structure

```
xr-graph-search/
├── index.html           # Entry point (ES-module importmap → 3d-force-graph)
├── style.css            # Styling (IBM Plex + terracotta aesthetic)
├── js/
│   ├── graph.js         # App logic: render, search, highlight, fly-to
│   ├── config.js        # Colors, physics, search + featured hashtags
│   └── data.js          # Curated dataset (creators / videos / concepts)
└── README.md            # This file
```

> **Run it:** ES modules must be served over HTTP, not opened as a file.
> Use VS Code Live Server, or `python -m http.server 8000` then open
> http://localhost:8000.

## Getting Started (2 minutes)

### 1. Open in VS Code
```bash
# Clone or download the project
cd xr-graph-search

# Open in VS Code
code .
```

### 2. Run Locally (no build required!)
Option A: **Using VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"
- Opens at `http://localhost:5500`

Option B: **Using Python's built-in server**
```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

Option C: **Using Node.js**
```bash
npx http-server
```

### 3. Test the Graph
- Graph loads immediately with **seed data** (no API key needed)
- Try searching for "MediaPipe", "Zach", or "HandTracking"
- Click nodes to see details
- Use **WASD** to navigate, **mouse** to look around

---

## Real, playable videos (the secure way)

Each **#topic** and **creator** is a hub; click it to drill down into a smaller
connections map of its **actual videos**, then click a video to play it in a
real YouTube player overlaid on the 3D scene.

Out of the box the graph uses curated demo data. To load real videos, add a
YouTube Data API key — but **never put the key in the code or Git.** Instead it
lives in Netlify's environment, and a build-time script bakes the results into
a static `js/videos.json`.

👉 **Full steps + security checklist: [SETUP.md](SETUP.md).**

In short:
1. Get a YouTube Data API v3 key and restrict it to that API.
2. Add it as `YOUTUBE_API_KEY` in **Netlify → Environment variables** (not in code).
3. Redeploy — `scripts/fetch-videos.mjs` fetches `safeSearch=strict`, embeddable
   videos and writes `js/videos.json`, which the site loads automatically.

---

## How It Works

### Graph Data Structure

**Nodes:**
- **Creators** (category: 'creator') - YouTube channels and artists
- **Videos** (category: 'tutorial') - Individual video tutorials
- **Concepts** (category: 'concept') - Topics and hashtags

**Links (Edges):**
- `created` - Creator made this video
- `relates_to` - Video discusses this concept
- `similar_topic` - Two videos cover similar material
- `expertise` - Creator specializes in this concept

### Search

- Full-text search across node labels and descriptions
- Results filtered and ranked by relevance
- Click result to select node and pan camera

### Navigation

- **Mouse**: Drag to look around
- **WASD**: Move forward/backward (W/S), strafe left/right (A/D)
- **Click**: Select node, view details, focus camera

---

## Design System (Your Aesthetic)

```css
Colors:
- Primary: Terracotta #9C4A24
- Accents: Warm pastels (#d4a574, #c9b8a8)
- Background: White #ffffff
- Text: Dark gray #1a1a1a

Typography:
- Headings: IBM Plex Serif Italic
- Body: IBM Plex Sans
- Labels: IBM Plex Mono

Sizing:
- Search panel: 340px wide
- Info panel: 320px wide
- Node sizes: Scaled by importance/views
```

---

## Deployment

### Deploy to Netlify (Recommended)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit: XR graph search"
git remote add origin https://github.com/avasion/xr-graph-search
git push origin main

# 2. Connect to Netlify
# Go to app.netlify.com → New site from Git
# Select your repo, deploy!
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

---

## Customization

### Change Seed Data
Edit `js/seed-data.js` to add more creators, videos, and concepts before integrating YouTube API.

### Change Colors
Update `CONFIG.COLORS` in `js/config.js` to match your theme.

### Adjust Physics
Tweak `CONFIG.GRAPH.*` values:
- `PHYSICS_STRENGTH`: Node repulsion (-30 = stronger)
- `PHYSICS_DISTANCE`: Link distance (100 = longer)
- `CAMERA_DISTANCE`: Starting zoom (300 = farther out)

### Add More Hashtags
In `js/api.js`, update the `curatedHashtags` array in `buildInitialGraph()`.

---

## Troubleshooting

**Q: Graph not rendering**  
A: Check browser console (F12) for errors. Ensure all scripts loaded (index.html references correct paths).

**Q: Search not working**  
A: Make sure seed data loaded. Check that `seed-data.js` is loaded before `graph.js`.

**Q: YouTube API returning no results**  
A: Verify API key is correct and API is enabled in Google Cloud Console. Check rate limits (10,000 quota units/day).

**Q: Camera movement janky**  
A: WASD movement runs on 30ms interval. Adjust `cameraSpeed` variable in `js/graph.js` (increase = faster).

---

## For Your Students

Show them:
1. **The graph as curriculum** - Watch it grow with curated videos
2. **Connections as learning paths** - Follow edges to discover related concepts
3. **Search as exploration** - Let curiosity drive discovery
4. **The code as teaching tool** - Show how Three.js + APIs power interactive experiences

Suggest they:
- Create their own graphs for different topics
- Build custom node types (articles, tools, artists)
- Add real-time multiplayer with WebSockets
- Export graph as data for analysis

---

## Tech Stack

- **Three.js** (3D graphics)
- **three-force-graph** (Force-directed graph layout)
- **YouTube Data API v3** (Real video data)
- **Vanilla JS** (No frameworks, easy to teach)
- **CSS Grid** (Responsive layout)

---

## Next Steps

1. ✅ Test with seed data locally
2. ⬜ Get YouTube API key
3. ⬜ Use Claude Code in VS Code to integrate real API
4. ⬜ Deploy to Netlify
5. ⬜ Show your students!

---

Questions? Check the inline comments in each `.js` file or ask Claude Code for help!

Happy vibe coding. 🌀
