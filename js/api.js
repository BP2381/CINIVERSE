// ============================================================
// CINEVERSE — api.js
// All API calls proxied through Netlify functions
// ============================================================

const API = {
  // ─── CONFIG ───────────────────────────────────────────────
  BASE: '/.netlify/functions',

  TMDB_IMG:  'https://image.tmdb.org/t/p',
  JIKAN_BASE: 'https://api.jikan.moe/v4',
  CACHE:      new Map(),
  CACHE_TTL:  5 * 60 * 1000,

  // ─── CACHE ────────────────────────────────────────────────
  _cached(key) {
    const entry = this.CACHE.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.CACHE_TTL) { this.CACHE.delete(key); return null; }
    return entry.data;
  },
  _store(key, data) {
    this.CACHE.set(key, { data, ts: Date.now() });
    return data;
  },

  // ─── FETCH HELPER ─────────────────────────────────────────
  async _fetch(url) {
    const cached = this._cached(url);
    if (cached) return cached;
    Utils.showProgress();
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      Utils.hideProgress();
      return this._store(url, data);
    } catch (err) {
      Utils.hideProgress();
      console.error('[API Error]', url, err);
      throw err;
    }
  },

  // ─── IMAGE URLS ───────────────────────────────────────────
  poster(path, size = 'w342') {
    if (!path) return null;
    return `${this.TMDB_IMG}/${size}${path}`;
  },
  backdrop(path, size = 'w1280') {
    if (!path) return null;
    return `${this.TMDB_IMG}/${size}${path}`;
  },

  // ─── TMDB ENDPOINTS (proxied through Netlify functions) ───
  async getTrending(page = 1) {
    return this._fetch(`${this.BASE}/trending?page=${page}`);
  },
  async getNowPlaying(page = 1) {
    return this._fetch(`${this.BASE}/nowplaying?page=${page}`);
  },
  async getPopular(page = 1) {
    return this._fetch(`${this.BASE}/popular?page=${page}`);
  },
  async getTopRated(page = 1) {
    return this._fetch(`${this.BASE}/toprated?page=${page}`);
  },
  async getUpcoming(page = 1) {
    return this._fetch(`${this.BASE}/popular?page=${page}`);
  },
  async searchMovies(query, page = 1) {
    return this._fetch(`${this.BASE}/search?query=${encodeURIComponent(query)}&page=${page}`);
  },
  async getMovieDetails(id) {
    return this._fetch(`${this.BASE}/movie?id=${id}`);
  },
  async getTVDetails(id) {
    return this._fetch(`${this.BASE}/movie?id=${id}&type=tv`);
  },
  async discoverMovies({ genre = '', sort = 'popularity.desc', year = '', page = 1 } = {}) {
    return this._fetch(`${this.BASE}/discover?genre=${genre}&sort=${sort}&year=${year}&page=${page}`);
  },
  async getMovieTrailer(id) {
    const data = await this._fetch(`${this.BASE}/movie?id=${id}`);
    const trailers = data.videos?.results?.filter(v => v.type === 'Trailer' && v.site === 'YouTube');
    return trailers?.[0] || data.videos?.results?.[0] || null;
  },
  async getTVTrailer(id) {
    const data = await this._fetch(`${this.BASE}/movie?id=${id}&type=tv`);
    const trailers = data.videos?.results?.filter(v => v.type === 'Trailer' && v.site === 'YouTube');
    return trailers?.[0] || data.videos?.results?.[0] || null;
  },
  async getGenres() {
    return this._fetch(`${this.BASE}/trending?page=1`);
  },
  async getTrendingTV(page = 1) {
    return this._fetch(`${this.BASE}/trending?page=${page}`);
  },

  // ─── JIKAN (ANIME) ENDPOINTS ──────────────────────────────
  async getTopAnime(page = 1) {
    return this._fetch(`${this.BASE}/anime?page=${page}`);
  },
  async getSeasonalAnime() {
    return this._fetch(`${this.BASE}/anime?page=1`);
  },
  async searchAnime(query, page = 1) {
    return this._fetch(`${this.BASE}/anime?query=${encodeURIComponent(query)}&page=${page}`);
  },
  async getAnimeDetails(id) {
    return this._fetch(`${this.JIKAN_BASE}/anime/${id}/full`);
  },

  // ─── TRENDING HINTS ───────────────────────────────────────
  async getTrendingKeywords() {
    const data = await this.getTrending();
    return data.results?.slice(0, 8).map(m => m.title || m.name) || [];
  },

  // ─── NORMALIZE: Convert Jikan anime → TMDB-like shape ─────
  normalizeAnime(anime) {
    return {
      id: `anime_${anime.mal_id}`,
      _animeId: anime.mal_id,
      _type: 'anime',
      title: anime.title_english || anime.title,
      original_title: anime.title,
      overview: anime.synopsis || '',
      poster_path: null,
      _poster_url: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      backdrop_path: null,
      vote_average: anime.score || 0,
      vote_count: anime.scored_by || 0,
      release_date: anime.aired?.from || '',
      genre_ids: [],
      genres: anime.genres?.map(g => ({ id: g.mal_id, name: g.name })) || [],
      popularity: anime.popularity || 0,
      runtime: anime.duration ? parseInt(anime.duration) : null,
      episodes: anime.episodes,
      status: anime.status,
      trailer: anime.trailer?.youtube_id ? { key: anime.trailer.youtube_id } : null,
    };
  },
};

window.API = API;
