// ============================================================
// CINEVERSE — api.js
// All API calls: TMDB (movies) + Jikan (anime)
// ============================================================

const API = {
  // ─── CONFIG ───────────────────────────────────────────────
  // Detect environment — local vs Netlify deployed
  BASE: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/.netlify/functions'
    : '/api',

  TMDB_IMG:  'https://image.tmdb.org/t/p',
  JIKAN_BASE: 'https://api.jikan.moe/v4',
  CACHE:      new Map(),
  CACHE_TTL:  5 * 60 * 1000,

  // ─── TMDB ENDPOINTS (now proxied through Netlify functions) ─
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
    const url = `${this.JIKAN_BASE}/anime/${id}/full`;
    return this._fetch(url);
  },

  // ─── TRENDING HINTS ───────────────────────────────────────
  async getTrendingKeywords() {
    const data = await this.getTrending();
    return data.results?.slice(0, 8).map(m => m.title || m.name) || [];
  },

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

  // ─── TMDB ENDPOINTS ───────────────────────────────────────
  async getTrending(page = 1) {
    const url = `${this.TMDB_BASE}/trending/movie/week?api_key=${this.TMDB_KEY}&page=${page}`;
    return this._fetch(url);
  },

  async getNowPlaying(page = 1) {
    const url = `${this.TMDB_BASE}/movie/now_playing?api_key=${this.TMDB_KEY}&page=${page}`;
    return this._fetch(url);
  },

  async getPopular(page = 1) {
    const url = `${this.TMDB_BASE}/movie/popular?api_key=${this.TMDB_KEY}&page=${page}`;
    return this._fetch(url);
  },

  async getTopRated(page = 1) {
    const url = `${this.TMDB_BASE}/movie/top_rated?api_key=${this.TMDB_KEY}&page=${page}`;
    return this._fetch(url);
  },

  async getUpcoming(page = 1) {
    const url = `${this.TMDB_BASE}/movie/upcoming?api_key=${this.TMDB_KEY}&page=${page}`;
    return this._fetch(url);
  },

  async searchMovies(query, page = 1) {
    const q = encodeURIComponent(query);
    const url = `${this.TMDB_BASE}/search/multi?api_key=${this.TMDB_KEY}&query=${q}&page=${page}`;
    return this._fetch(url);
  },

  async getMovieDetails(id) {
    const url = `${this.TMDB_BASE}/movie/${id}?api_key=${this.TMDB_KEY}&append_to_response=credits,videos,similar,recommendations`;
    return this._fetch(url);
  },

  async getTVDetails(id) {
    const url = `${this.TMDB_BASE}/tv/${id}?api_key=${this.TMDB_KEY}&append_to_response=credits,videos,similar`;
    return this._fetch(url);
  },

  async discoverMovies({ genre = '', sort = 'popularity.desc', year = '', page = 1 } = {}) {
    let url = `${this.TMDB_BASE}/discover/movie?api_key=${this.TMDB_KEY}&sort_by=${sort}&page=${page}&vote_count.gte=50`;
    if (genre && genre !== 'all') url += `&with_genres=${genre}`;
    if (year) url += `&primary_release_year=${year}`;
    return this._fetch(url);
  },

  async getMovieTrailer(id) {
    const url = `${this.TMDB_BASE}/movie/${id}/videos?api_key=${this.TMDB_KEY}`;
    const data = await this._fetch(url);
    const trailers = data.results?.filter(v => v.type === 'Trailer' && v.site === 'YouTube');
    return trailers?.[0] || data.results?.[0] || null;
  },

  async getTVTrailer(id) {
    const url = `${this.TMDB_BASE}/tv/${id}/videos?api_key=${this.TMDB_KEY}`;
    const data = await this._fetch(url);
    const trailers = data.results?.filter(v => v.type === 'Trailer' && v.site === 'YouTube');
    return trailers?.[0] || data.results?.[0] || null;
  },

  async getGenres() {
    const url = `${this.TMDB_BASE}/genre/movie/list?api_key=${this.TMDB_KEY}`;
    return this._fetch(url);
  },

  // Trending TV for hero variety
  async getTrendingTV(page = 1) {
    const url = `${this.TMDB_BASE}/trending/tv/week?api_key=${this.TMDB_KEY}&page=${page}`;
    return this._fetch(url);
  },

  // ─── JIKAN (ANIME) ENDPOINTS ──────────────────────────────
  async getTopAnime(page = 1) {
    const url = `${this.JIKAN_BASE}/top/anime?page=${page}&limit=20`;
    return this._fetch(url);
  },

  async getSeasonalAnime() {
    const url = `${this.JIKAN_BASE}/seasons/now?limit=20`;
    return this._fetch(url);
  },

  async searchAnime(query, page = 1) {
    const q = encodeURIComponent(query);
    const url = `${this.JIKAN_BASE}/anime?q=${q}&page=${page}&limit=12`;
    return this._fetch(url);
  },

  async getAnimeDetails(id) {
    const url = `${this.JIKAN_BASE}/anime/${id}/full`;
    return this._fetch(url);
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

  // ─── TRENDING HINTS ───────────────────────────────────────
  async getTrendingKeywords() {
    // Use trending movies to build hints
    const data = await this.getTrending();
    return data.results?.slice(0, 8).map(m => m.title || m.name) || [];
  },
};

window.API = API;
