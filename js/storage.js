// ============================================================
// CINEVERSE — storage.js
// Watchlist, favorites, history via localStorage
// ============================================================

const Storage = {
  WATCHLIST_KEY: 'cv_watchlist',
  FAVORITES_KEY: 'cv_favorites',
  HISTORY_KEY:   'cv_history',
  PREFS_KEY:     'cv_prefs',

  // ─── GENERIC ─────────────────────────────────────────────
  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  _set(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn('Storage full:', e); }
  },

  // ─── WATCHLIST ────────────────────────────────────────────
  getWatchlist() { return this._get(this.WATCHLIST_KEY); },

  addToWatchlist(movie) {
    const list = this.getWatchlist();
    if (!list.find(m => m.id === movie.id)) {
      list.unshift(movie);
      this._set(this.WATCHLIST_KEY, list);
      this._updateBadge();
      return true;
    }
    return false;
  },

  removeFromWatchlist(id) {
    const list = this.getWatchlist().filter(m => m.id !== id);
    this._set(this.WATCHLIST_KEY, list);
    this._updateBadge();
  },

  isInWatchlist(id) {
    return this.getWatchlist().some(m => m.id === id);
  },

  toggleWatchlist(movie) {
    if (this.isInWatchlist(movie.id)) {
      this.removeFromWatchlist(movie.id);
      return false;
    } else {
      this.addToWatchlist(movie);
      return true;
    }
  },

  // ─── FAVORITES ────────────────────────────────────────────
  getFavorites() { return this._get(this.FAVORITES_KEY); },

  toggleFavorite(movie) {
    const list = this.getFavorites();
    const idx = list.findIndex(m => m.id === movie.id);
    if (idx > -1) {
      list.splice(idx, 1);
      this._set(this.FAVORITES_KEY, list);
      return false;
    } else {
      list.unshift(movie);
      this._set(this.FAVORITES_KEY, list);
      return true;
    }
  },

  isFavorite(id) {
    return this.getFavorites().some(m => m.id === id);
  },

  // ─── HISTORY ──────────────────────────────────────────────
  getHistory() { return this._get(this.HISTORY_KEY); },

  addToHistory(query) {
    if (!query?.trim()) return;
    let history = this.getHistory().filter(h => h !== query);
    history.unshift(query);
    history = history.slice(0, 10);
    this._set(this.HISTORY_KEY, history);
  },

  clearHistory() { this._set(this.HISTORY_KEY, []); },

  // ─── BADGE UPDATE ─────────────────────────────────────────
  _updateBadge() {
    const badge = document.getElementById('watchlistBadge');
    if (!badge) return;
    const count = this.getWatchlist().length;
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  },

  // Initialize badge on load
  init() { this._updateBadge(); }
};

window.Storage = Storage;
