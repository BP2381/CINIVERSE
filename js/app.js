// ============================================================
// CINEVERSE — app.js
// Main application controller
// ============================================================

const App = {
  // ─── STATE ────────────────────────────────────────────────
  _heroMovies: [],
  _heroIndex: 0,
  _heroTimer: null,
  _currentModalData: null,
  _currentSection: 'home',
  _currentGenre: 'all',
  _currentSort: 'popularity.desc',
  _currentYear: '',
  _currentPage: 1,
  _searchTimeout: null,
  _recognition: null,

  // ─── INIT ─────────────────────────────────────────────────
  async init() {
    Storage.init();
    this.bindNavbar();
    this.bindSearch();
    this.bindModals();
    this.bindFilters();
    this.bindWatchlist();
    this.bindRowArrows();
    this.bindScroll();
    this.bindHeroControls();

    // Load all sections in parallel
    await Promise.all([
      this.loadHero(),
      this.loadTrending(),
      this.loadNowPlaying(),
      this.loadAnime(),
      this.loadTopRated(),
    ]);
  },

  // ─── NAVBAR ───────────────────────────────────────────────
  bindNavbar() {
    // Sticky scroll effect
    window.addEventListener('scroll', Utils.throttle(() => {
      const nav = document.getElementById('navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
      // Back to top
      const btt = document.getElementById('backToTop');
      if (btt) btt.classList.toggle('visible', window.scrollY > 400);
    }, 80));

    // Nav links → sections
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.navigateSection(section);
        // Close mobile nav
        const mobileNav = document.getElementById('mobileNav');
        const hamburger = document.getElementById('hamburger');
        if (mobileNav) { mobileNav.classList.remove('open'); }
        if (hamburger) { hamburger.classList.remove('open'); }
      });
    });

    // Hamburger
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
      });
    }

    // Back to top
    const btt = document.getElementById('backToTop');
    if (btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  },

  // ─── NAVIGATE SECTION ─────────────────────────────────────
  async navigateSection(section) {
    this._currentSection = section;
    this._currentPage = 1;
    this._currentGenre = 'all';

    // Update active nav link
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.section === section);
    });

    const homeSections = ['trendingSection','nowPlayingSection','animeSection','topRatedSection'];
    const gridSection = document.getElementById('gridSection');

    if (section === 'home' || !section) {
      homeSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
      });
      if (gridSection) gridSection.style.display = 'none';
      return;
    }

    // Show grid, hide rows
    homeSections.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    if (gridSection) gridSection.style.display = '';

    const tag = document.getElementById('gridTag');
    const title = document.getElementById('gridTitle');

    const configs = {
      'movies':    { tag: '🎬', title: 'All Movies' },
      'anime':     { tag: '⛩️', title: 'Anime' },
      'trending':  { tag: '🔥', title: 'Trending' },
      'top-rated': { tag: '⭐', title: 'Top Rated' },
      'now-playing':{ tag: '🎭', title: 'Now Playing' },
    };
    const cfg = configs[section] || { tag: '🎬', title: 'Movies' };
    if (tag) tag.textContent = cfg.tag;
    if (title) title.textContent = cfg.title;

    await this.loadGridSection(section, 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async loadGridSection(section, page = 1) {
    this._currentPage = page;
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    UI.skeletons(grid, 12);
    try {
      let data;
      if (section === 'anime') {
        const res = await API.getTopAnime(page);
        const movies = (res.data || []).map(a => API.normalizeAnime(a));
        UI.renderGrid(movies, 'moviesGrid');
        UI.renderPagination(page, res.pagination?.last_visible_page || 10,
          `(p) => App.loadGridSection('anime', p)`);
        document.getElementById('resultCount').textContent = `${res.data?.length || 0} results`;
        return;
      }
      if (section === 'trending')   data = await API.getTrending(page);
      else if (section === 'top-rated') data = await API.getTopRated(page);
      else if (section === 'now-playing') data = await API.getNowPlaying(page);
      else data = await API.discoverMovies({ genre: this._currentGenre, sort: this._currentSort, year: this._currentYear, page });

      UI.renderGrid(data.results || [], 'moviesGrid');
      UI.renderPagination(page, data.total_pages || 1,
        `(p) => App.loadGridSection('${section}', p)`);
      const count = document.getElementById('resultCount');
      if (count) count.textContent = `${data.total_results?.toLocaleString() || 0} results`;
    } catch(e) {
      console.error(e);
      if (grid) grid.innerHTML = `<div class="no-results"><div class="no-results-icon">⚠️</div><p class="no-results-title">Failed to load</p><p class="no-results-sub">Check your connection and try again</p></div>`;
    }
  },

  // ─── HERO ─────────────────────────────────────────────────
  async loadHero() {
    try {
      const data = await API.getTrending();
      this._heroMovies = (data.results || []).filter(m => m.backdrop_path).slice(0, 8);
      if (!this._heroMovies.length) return;
      this._heroIndex = 0;
      UI.updateHero(this._heroMovies[0]);
      UI.renderHeroDots(this._heroMovies.length, 0);
      this.startHeroAutoplay();
    } catch(e) { console.warn('Hero load failed', e); }
  },

  startHeroAutoplay() {
    clearInterval(this._heroTimer);
    this._heroTimer = setInterval(() => this.heroNext(), 6000);
  },

  heroNext() {
    this._heroIndex = (this._heroIndex + 1) % this._heroMovies.length;
    UI.updateHero(this._heroMovies[this._heroIndex]);
    UI.updateHeroDots(this._heroIndex);
    this.startHeroAutoplay();
  },

  heroPrev() {
    this._heroIndex = (this._heroIndex - 1 + this._heroMovies.length) % this._heroMovies.length;
    UI.updateHero(this._heroMovies[this._heroIndex]);
    UI.updateHeroDots(this._heroIndex);
    this.startHeroAutoplay();
  },

  heroGoTo(idx) {
    this._heroIndex = idx;
    UI.updateHero(this._heroMovies[idx]);
    UI.updateHeroDots(idx);
    this.startHeroAutoplay();
  },

  bindHeroControls() {
    document.getElementById('heroPrev')?.addEventListener('click', () => this.heroPrev());
    document.getElementById('heroNext')?.addEventListener('click', () => this.heroNext());
  },

  // ─── CONTENT ROWS ─────────────────────────────────────────
  async loadTrending() {
    const row = document.getElementById('trendingRow');
    if (row) UI.skeletons(row, 8);
    try {
      const data = await API.getTrending();
      UI.renderRow(data.results?.slice(0, 15) || [], 'trendingRow');
    } catch(e) { console.warn('Trending failed', e); }
  },

  async loadNowPlaying() {
    const row = document.getElementById('nowPlayingRow');
    if (row) UI.skeletons(row, 8);
    try {
      const data = await API.getNowPlaying();
      UI.renderRow(data.results?.slice(0, 15) || [], 'nowPlayingRow');
    } catch(e) { console.warn('Now Playing failed', e); }
  },

  async loadAnime() {
    const row = document.getElementById('animeRow');
    if (row) UI.skeletons(row, 8);
    try {
      const data = await API.getTopAnime();
      const normalized = (data.data || []).map(a => API.normalizeAnime(a)).slice(0, 15);
      UI.renderRow(normalized, 'animeRow');
    } catch(e) { console.warn('Anime failed', e); }
  },

  async loadTopRated() {
    const row = document.getElementById('topRatedRow');
    if (row) UI.skeletons(row, 8);
    try {
      const data = await API.getTopRated();
      UI.renderRow(data.results?.slice(0, 15) || [], 'topRatedRow');
    } catch(e) { console.warn('Top Rated failed', e); }
  },

  // ─── SEARCH ───────────────────────────────────────────────
  bindSearch() {
    const toggle = document.getElementById('searchToggle');
    const overlay = document.getElementById('searchOverlay');
    const closeBtn = document.getElementById('searchClose');
    const input = document.getElementById('searchInput');

    toggle?.addEventListener('click', () => this.openSearch());
    closeBtn?.addEventListener('click', () => this.closeSearch());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeSearch();
    });

    // Load hints
    API.getTrendingKeywords().then(hints => UI.renderHints(hints)).catch(() => {});

    // Debounced search
    input?.addEventListener('input', Utils.debounce(async (e) => {
      const q = e.target.value.trim();
      const hints = document.getElementById('searchHints');
      const results = document.getElementById('searchResults');
      if (q.length < 2) {
        if (results) results.innerHTML = '';
        if (hints) hints.style.display = '';
        return;
      }
      if (hints) hints.style.display = 'none';
      if (results) results.innerHTML = '<div class="spinner"></div>';

      try {
        // Search both movies and anime in parallel
        const [tmdbRes, animeRes] = await Promise.allSettled([
          API.searchMovies(q),
          API.searchAnime(q),
        ]);

        let combined = [];
        if (tmdbRes.status === 'fulfilled') {
          combined = (tmdbRes.value.results || []).filter(m =>
            (m.media_type === 'movie' || m.media_type === 'tv') && m.poster_path
          ).slice(0, 8);
        }
        if (animeRes.status === 'fulfilled') {
          const animeResults = (animeRes.value.data || []).slice(0, 4).map(a => API.normalizeAnime(a));
          combined = [...combined, ...animeResults];
        }
        Storage.addToHistory(q);
        UI.renderSearchResults(combined);
      } catch(e) {
        if (results) results.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px">Search failed</div>';
      }
    }, 350));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        this.openSearch();
      }
      if (e.key === 'Escape') {
        this.closeSearch();
        this.closeModal();
      }
    });

    // Voice search
    this.initVoiceSearch();
  },

  openSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if (overlay) overlay.classList.add('open');
    setTimeout(() => input?.focus(), 200);
    document.body.style.overflow = 'hidden';
  },

  closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if (overlay) overlay.classList.remove('open');
    if (input) { input.value = ''; }
    const hints = document.getElementById('searchHints');
    const results = document.getElementById('searchResults');
    if (hints) hints.style.display = '';
    if (results) results.innerHTML = '';
    document.body.style.overflow = '';
  },

  searchFromHint(query) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = query;
      input.dispatchEvent(new Event('input'));
    }
  },

  initVoiceSearch() {
    const btn = document.getElementById('voiceBtn');
    if (!btn) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { btn.style.display = 'none'; return; }

    this._recognition = new SpeechRecognition();
    this._recognition.lang = 'en-US';
    this._recognition.continuous = false;

    btn.addEventListener('click', () => {
      btn.classList.add('listening');
      this._recognition.start();
    });
    this._recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const input = document.getElementById('searchInput');
      if (input) {
        input.value = transcript;
        input.dispatchEvent(new Event('input'));
      }
      btn.classList.remove('listening');
    };
    this._recognition.onerror = () => btn.classList.remove('listening');
    this._recognition.onend = () => btn.classList.remove('listening');
  },

  // ─── MODAL ────────────────────────────────────────────────
  bindModals() {
    document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') this.closeModal();
    });

    // Tab switching
    document.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (App._currentModalData) {
          UI.renderModalTab(tab.dataset.tab, App._currentModalData.data, App._currentModalData.type);
        }
      });
    });

    // Trailer close
    document.getElementById('trailerClose')?.addEventListener('click', () => this.closeTrailer());
    document.getElementById('trailerOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'trailerOverlay') this.closeTrailer();
    });
  },

  async openModal(id, type = 'movie') {
    UI.openModal();
    const content = document.getElementById('modalTabContent');
    if (content) content.innerHTML = '<div class="spinner"></div>';

    try {
      let data;
      if (type === 'anime') {
        const animeId = String(id).replace('anime_', '');
        const res = await API.getAnimeDetails(animeId);
        data = res.data;
        UI.populateModal(data, 'anime');
      } else if (type === 'tv') {
        data = await API.getTVDetails(id);
        UI.populateModal(data, 'tv');
      } else {
        data = await API.getMovieDetails(id);
        UI.populateModal(data, 'movie');
      }
    } catch(e) {
      console.error('Modal load error', e);
      if (content) content.innerHTML = '<div class="tab-loading" style="color:var(--red-accent)">Failed to load details</div>';
    }
  },

  closeModal() {
    UI.closeModal();
    // Pause trailer if open
    this.closeTrailer();
  },

  openDetailsPage(id, type = 'movie') {
    window.location.href = `pages/details.html?id=${id}&type=${type}`;
  },

  openTrailer(key) {
    const overlay = document.getElementById('trailerOverlay');
    const frame = document.getElementById('trailerFrame');
    if (!overlay || !frame) return;
    frame.innerHTML = `<iframe src="https://www.youtube.com/embed/${key}?autoplay=1&rel=0" allowfullscreen allow="autoplay"></iframe>`;
    overlay.classList.add('open');
  },

  closeTrailer() {
    const overlay = document.getElementById('trailerOverlay');
    const frame = document.getElementById('trailerFrame');
    if (overlay) overlay.classList.remove('open');
    if (frame) frame.innerHTML = '';
  },

  // ─── FILTERS ──────────────────────────────────────────────
  bindFilters() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this._currentGenre = chip.dataset.genre;
        this._currentPage = 1;

        if (this._currentSection === 'home') {
          this.navigateSection('movies');
        } else {
          this.loadGridSection(this._currentSection, 1);
        }
      });
    });

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      this._currentSort = e.target.value;
      this._currentPage = 1;
      if (this._currentSection === 'home') this.navigateSection('movies');
      else this.loadGridSection(this._currentSection, 1);
    });

    document.getElementById('yearSelect')?.addEventListener('change', (e) => {
      this._currentYear = e.target.value;
      this._currentPage = 1;
      if (this._currentSection === 'home') this.navigateSection('movies');
      else this.loadGridSection(this._currentSection, 1);
    });

    // "See All" links
    document.querySelectorAll('.see-all').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateSection(link.dataset.section);
      });
    });
  },

  // ─── WATCHLIST ────────────────────────────────────────────
  bindWatchlist() {
    const btn = document.getElementById('watchlistBtn');
    const panel = document.getElementById('watchlistPanel');
    const overlay = document.getElementById('panelOverlay');
    const closeBtn = document.getElementById('panelClose');

    btn?.addEventListener('click', () => {
      UI.renderWatchlistPanel();
      panel?.classList.add('open');
      overlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    const closePanel = () => {
      panel?.classList.remove('open');
      overlay?.classList.remove('open');
      document.body.style.overflow = '';
    };
    closeBtn?.addEventListener('click', closePanel);
    overlay?.addEventListener('click', closePanel);
  },

  // Called from card HTML inline
  toggleWatchlist(btn, movieJsonStr) {
    try {
      const movie = JSON.parse(movieJsonStr);
      const added = Storage.toggleWatchlist(movie);
      btn.textContent = added ? '✓ Saved' : '+ Save';
      btn.classList.toggle('saved', added);
      Utils.toast(added ? '✓ Added to watchlist' : 'Removed from watchlist', added ? 'success' : 'default');
      this.renderWatchlistPanel();
    } catch(e) { console.error(e); }
  },

  toggleWatchlistFromGrid(btn, movieId) {
    // Find movie in cache — just toggle by ID with minimal data
    const cards = document.querySelectorAll(`[data-id="${movieId}"]`);
    let movie = { id: movieId };
    // Try to get info from DOM
    const card = cards[0];
    if (card) {
      movie.title = card.querySelector('.card-title')?.textContent || '';
      const img = card.querySelector('img');
      if (img) movie._poster_url = img.src;
    }
    const added = Storage.toggleWatchlist(movie);
    btn.textContent = added ? '✓' : '+';
    btn.classList.toggle('saved', added);
    Utils.toast(added ? '✓ Added to watchlist' : 'Removed', added ? 'success' : 'default');
  },

  toggleWatchlistHero(movie, btn) {
    const added = Storage.toggleWatchlist(movie);
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${added ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      ${added ? 'In Watchlist' : 'Add to Watchlist'}
    `;
    Utils.toast(added ? '✓ Added to watchlist' : 'Removed from watchlist', added ? 'success' : 'default');
    this.renderWatchlistPanel();
  },

  removeFromWatchlist(id, btn) {
    Storage.removeFromWatchlist(id);
    const item = btn.closest('.watchlist-item');
    if (item) {
      item.style.transform = 'translateX(100%)';
      item.style.opacity = '0';
      item.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        item.remove();
        const list = Storage.getWatchlist();
        if (!list.length) UI.renderWatchlistPanel();
      }, 300);
    }
    Utils.toast('Removed from watchlist', 'default');
  },

  renderWatchlistPanel() {
    UI.renderWatchlistPanel();
  },

  // ─── ROW ARROWS ───────────────────────────────────────────
  bindRowArrows() {
    document.querySelectorAll('.row-arrow').forEach(arrow => {
      arrow.addEventListener('click', () => {
        const rowId = arrow.dataset.row;
        const rowMap = {
          trending: 'trendingRow',
          nowplaying: 'nowPlayingRow',
          anime: 'animeRow',
          toprated: 'topRatedRow',
        };
        const rowEl = document.getElementById(rowMap[rowId]);
        const dir = arrow.classList.contains('row-arrow--left') ? -1 : 1;
        if (rowEl) Utils.scrollRow(rowEl, dir);
      });
    });
  },

  // ─── SCROLL EFFECTS ───────────────────────────────────────
  bindScroll() {
    window.addEventListener('scroll', Utils.throttle(() => {
      // Parallax hero
      const hero = document.querySelector('.hero-bg');
      if (hero) {
        const scrolled = window.scrollY;
        hero.style.transform = `scale(1.05) translateY(${scrolled * 0.2}px)`;
      }
    }, 16));
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
