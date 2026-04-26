# ◈ CINEVERSE — Movie & Anime Finder

A production-grade cinematic web application for discovering movies and anime.  
Built with vanilla HTML, CSS, and JavaScript. No frameworks. No build tools.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎬 Live Movie Data | TMDB API — trending, now playing, top rated, popular |
| ⛩️ Anime | Jikan API (MyAnimeList) — top anime, seasonal |
| 🔍 Smart Search | Debounced live search across movies + anime simultaneously |
| 🎤 Voice Search | Web Speech API — click mic and speak |
| 🎠 Hero Carousel | Auto-advancing spotlight with crossfade + parallax |
| 🃏 Movie Modal | Full detail popup with cast, similar, details tabs |
| 📄 Details Page | Dedicated full-screen details page with cast, videos, production |
| 🎞️ Trailers | YouTube embed player |
| 🔖 Watchlist | Persistent via localStorage, slide-in panel |
| ❤️ Favorites | Persistent via localStorage |
| 🎛️ Filters | Genre chips, sort (popularity/rating/date/revenue), year |
| 📱 Responsive | Mobile-first, works on all screen sizes |
| ✨ Animations | Skeleton loaders, card hover effects, parallax, stagger reveals |
| 💡 Hints | Trending keyword chips on search open |

---

## 📁 Project Structure

```
movie-app/
├── index.html              ← Main home page
├── pages/
│   └── details.html        ← Full movie/anime details page
├── css/
│   ├── style.css           ← Global styles, layout, navbar, hero
│   └── components.css      ← Cards, modals, panels, skeletons
├── js/
│   ├── app.js              ← Main controller (events, sections, hero)
│   ├── api.js              ← TMDB + Jikan API calls + caching
│   ├── ui.js               ← All DOM rendering functions
│   ├── storage.js          ← localStorage (watchlist, favorites, history)
│   └── utils.js            ← Debounce, toast, formatting helpers
└── assets/
    ├── images/
    └── icons/
```

---

## 🚀 How to Run

### Option 1 — Direct open (simplest)
Just open `index.html` in any modern browser.  
> ⚠️ Some browsers block API requests from `file://`. Use Option 2 if you see blank sections.

### Option 2 — Local server (recommended)

**Using VS Code Live Server:**
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` → **Open with Live Server**

**Using Python:**
```bash
cd movie-app
python3 -m http.server 8080
# Open: http://localhost:8080
```

**Using Node.js:**
```bash
cd movie-app
npx serve .
# Open the URL shown in terminal
```

---

## 🔑 API Keys

The app uses a free TMDB API key included by default. If you hit rate limits:
1. Register at [themoviedb.org](https://www.themoviedb.org/signup)
2. Get your API key from **Settings → API**
3. Replace `TMDB_KEY` in `js/api.js`:
   ```js
   TMDB_KEY: 'your_key_here',
   ```

Jikan (anime) requires no API key.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` or `Ctrl+K` | Open search |
| `Escape` | Close search / modal |

---

## 🎨 Design

- **Theme:** Dark luxury cinematic
- **Fonts:** Bebas Neue (display) · DM Serif Display (serif) · Outfit (body)
- **Accent:** Gold `#e8b84b`
- **Animation:** CSS transitions + intersection observer stagger

---

## 📡 APIs Used

- [TMDB API v3](https://developer.themoviedb.org/) — movies, TV shows, cast, trailers
- [Jikan API v4](https://jikan.moe/) — anime data from MyAnimeList

---

*Built for movie lovers. Data provided by TMDB & Jikan.*
