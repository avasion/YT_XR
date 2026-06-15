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
├── index.html           # Main HTML entry point
├── style.css            # Styling (IBM Plex + your aesthetic)
├── js/
│   ├── graph.js         # Main visualization logic (three-force-graph)
│   ├── api.js           # YouTube API integration (to be extended)
│   ├── config.js        # Configuration + API key placeholder
│   └── seed-data.js     # Test data (works immediately, no API needed)
└── README.md            # This file
```

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

## Adding YouTube API (Handoff to Claude Code)

The project is **structured for Claude Code in VS Code** to handle YouTube API integration.

### Step 1: Get Your YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Search for "YouTube Data API v3" and enable it
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### Step 2: Add Key to Config

1. Open `js/config.js`
2. Find this line:
   ```javascript
   YOUTUBE_API_KEY: '', // TODO: Replace with your actual API key
   ```
3. Paste your key:
   ```javascript
   YOUTUBE_API_KEY: 'YOUR_ACTUAL_KEY_HERE',
   ```
4. Set feature flag to enable API:
   ```javascript
   FEATURES: {
       USE_YOUTUBE_API: true, // Changed from false
   }
   ```

### Step 3: Use Claude Code to Implement API Integration

In VS Code with Claude Code installed:

1. Open the command palette: **Cmd+Shift+P** (Mac) or **Ctrl+Shift+P** (Windows)
2. Type "Claude Code" and select it
3. Paste this prompt:

```
I have a 3D graph visualization project for exploring XR/AR tutorials. 
The file js/api.js has placeholder functions for YouTube API integration.

My YouTube API key is now in js/config.js

Please implement the real YouTube API functionality in js/api.js:

1. Implement fetchVideosFromYouTube() to:
   - Build search queries from hashtags (#MediaPipe, #XR, #AR, #VR, #WebXR, #InteractiveArt, #ThreeJS, #TouchDesigner, #GenerativeArt)
   - Call YouTube Search API to find videos
   - Fetch video details (id, title, description, thumbnail, viewCount, publishedAt)
   - Transform results into graph nodes and links

2. Add logic to:
   - Create video nodes (category: 'tutorial')
   - Create creator nodes from channel owners (category: 'creator')
   - Build semantic connections between similar videos using keywords
   - Color code by relevance/views

3. Make sure:
   - API calls use CONFIG.YOUTUBE_API_KEY
   - Error handling falls back to seed data
   - Results merge with existing seed data structure
   - Node colors follow the terracotta theme (#9C4A24 primary, lighter pastels for other categories)

The seed data structure in js/seed-data.js shows the expected format.

Keep the code clean and well-commented for teaching purposes.
```

4. Claude Code will implement the full YouTube API integration
5. Test by searching for topics in the UI

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
