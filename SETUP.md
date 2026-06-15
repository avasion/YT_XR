# Setup: real, playable videos (securely)

The graph works **right now** with curated demo data. To fill it with real,
playable YouTube videos, you add a YouTube Data API key. The golden rule:

> 🔐 **The key never goes in your code, never in Git, never in the browser.**
> It lives only in Netlify's environment (or a local `.env` that Git ignores).
> **Never paste your key into a chat, a commit, or `js/` files.**

A client-side site *cannot* hide a key — anything shipped to the browser is
readable by anyone. So instead of calling YouTube from the browser, we call it
**once at build time** and bake the results into a static `js/videos.json`.

---

## 1. Get a YouTube Data API v3 key

1. Go to <https://console.cloud.google.com> → create a project.
2. **APIs & Services → Library →** enable **YouTube Data API v3**.
3. **APIs & Services → Credentials → Create credentials → API key.**
4. Click the key → **API restrictions → Restrict key → YouTube Data API v3**.
   (This limits the damage if the key ever leaks.)

---

## 2. Give the key to Netlify (the live site)

1. In Netlify: **Site configuration → Environment variables → Add a variable.**
2. Key: `YOUTUBE_API_KEY`  ·  Value: *(paste your key here, in Netlify only)*.
3. **Deploys → Trigger deploy → Deploy site.**

On deploy, Netlify runs `scripts/fetch-videos.mjs` (see `netlify.toml`), which
fetches videos with `safeSearch=strict` and writes `js/videos.json`. Students
load that static file — the key stays on Netlify's build server.

> If the key isn't set, the build still succeeds and the site shows demo data.

---

## 3. (Optional) Run it locally

Only needed if you want real videos on `localhost`. Requires
[Node.js 18+](https://nodejs.org) (not currently installed on this machine).

```bash
cp .env.example .env        # then paste your key into .env  (.env is gitignored)
npm run fetch               # writes js/videos.json
npm run dev                 # serve at http://localhost:8000
```

---

## What to edit

- **Which topics get fetched:** the `TOPICS` array in
  [scripts/fetch-videos.mjs](scripts/fetch-videos.mjs).
- **How many videos per topic:** `PER_TOPIC` in the same file.
- **Colors / physics / featured hashtags:** [js/config.js](js/config.js).

## Security checklist

- [ ] `.env` is listed in `.gitignore` (it is) and never committed.
- [ ] The key is set in Netlify env vars, **not** in any `js/` file.
- [ ] The API key is restricted to *YouTube Data API v3* in Google Cloud.
- [ ] You never pasted the key into a chat, issue, or commit message.
- [ ] If a key ever leaks: delete it in Google Cloud and create a new one.
