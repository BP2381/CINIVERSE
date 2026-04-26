// ============================================================
// CINEVERSE — ui.js
// All DOM rendering: cards, modals, tabs, watchlist panel
// ============================================================

const UI = {

  // ─── SKELETON LOADERS ─────────────────────────────────────
  skeletons(container, count = 8) {
    container.innerHTML = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-poster"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line w-80"></div>
          <div class="skeleton skeleton-line w-50"></div>
        </div>
      </div>
    `).join('');
  },

  // ─── MOVIE CARD (horizontal row) ──────────────────────────
  movieCard(movie, animDelay = 0) {
    const isAnime = movie._type === 'anime';
    const poster = isAnime
      ? (movie._poster_url || '')
      : (API.poster(movie.poster_path) || '');
    const title = movie.title || movie.name || 'Unknown';
    const year = Utils.getYear(movie.release_date || movie.first_air_date);
    const rating = (movie.vote_average || 0).toFixed(1);
    const inWatchlist = Storage.isInWatchlist(movie.id);
    const typeLabel = isAnime ? 'anime' : (movie.media_type === 'tv' ? 'tv' : 'movie');

    return `
      <div class="movie-card" data-id="${movie.id}" data-type="${movie._type || movie.media_type || 'movie'}"
           style="animation-delay:${animDelay}ms" onclick="App.openModal('${movie.id}', '${typeLabel}')">
        <div class="card-poster">
          <img src="${poster}" alt="${title}" loading="lazy" onerror="Utils.imgFallback(this)" />
          <div class="card-rating">
            <span class="star-icon">★</span> ${rating}
          </div>
          <div class="card-type-badge ${typeLabel}">${typeLabel.toUpperCase()}</div>
          <div class="card-overlay">
            <div class="card-overlay-title">${title}</div>
            <div class="card-overlay-meta">${year ? year : ''} ${year && rating ? '·' : ''} ★ ${rating}</div>
            <div class="card-overlay-actions">
              <button class="card-action-btn info" onclick="event.stopPropagation(); App.openModal('${movie.id}', '${typeLabel}')">Info</button>
              <button class="card-action-btn bookmark ${inWatchlist ? 'saved' : ''}"
                onclick="event.stopPropagation(); App.toggleWatchlist(this, ${JSON.stringify(JSON.stringify(movie)).replace(/'/g,"&#39;")})">
                ${inWatchlist ? '✓ Saved' : '+ Save'}
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          <div class="card-meta">
            <span>${year || 'TBA'}</span>
            <span class="card-meta-dot">●</span>
            <span style="color: ${Utils.getRatingColor(parseFloat(rating))}">★ ${rating}</span>
          </div>
        </div>
      </div>
    `;
  },

  // ─── GRID CARD (larger, for grid view) ────────────────────
  gridCard(movie, animDelay = 0) {
    const isAnime = movie._type === 'anime';
    const poster = isAnime
      ? (movie._poster_url || '')
      : (API.poster(movie.poster_path) || '');
    const title = movie.title || movie.name || 'Unknown';
    const year = Utils.getYear(movie.release_date || movie.first_air_date);
    const rating = (movie.vote_average || 0).toFixed(1);
    const typeLabel = isAnime ? 'anime' : (movie.media_type === 'tv' ? 'tv' : 'movie');
    const ratingColor = Utils.getRatingColor(parseFloat(rating));

    return `
      <div class="grid-card" data-id="${movie.id}"
           style="animation-delay:${animDelay}ms"
           onclick="App.openModal('${movie.id}', '${typeLabel}')">
        <div class="card-poster">
          <img src="${poster}" alt="${title}" loading="lazy" onerror="Utils.imgFallback(this)" />
          <div class="card-rating">
            <span class="star-icon">★</span> ${rating}
          </div>
          <div class="card-type-badge ${typeLabel}">${typeLabel.toUpperCase()}</div>
          <div class="card-overlay">
            <div class="card-overlay-title">${title}</div>
            <div class="card-overlay-meta">${year || ''}</div>
            <div class="card-overlay-actions">
              <button class="card-action-btn info" onclick="event.stopPropagation(); App.openModal('${movie.id}', '${typeLabel}')">View</button>
              <button class="card-action-btn bookmark ${Storage.isInWatchlist(movie.id) ? 'saved' : ''}"
                onclick="event.stopPropagation(); App.toggleWatchlistFromGrid(this, '${movie.id}')">
                ${Storage.isInWatchlist(movie.id) ? '✓' : '+'}
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          <div class="card-meta">
            <span>${year || 'TBA'}</span>
            <span class="card-meta-dot">●</span>
            <span style="color: ${ratingColor}">★ ${rating}</span>
          </div>
        </div>
      </div>
    `;
  },

  // ─── RENDER ROW ───────────────────────────────────────────
  renderRow(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!movies?.length) {
      container.innerHTML = '<div class="no-results"><div class="no-results-icon">🎬</div><p class="no-results-title">No results found</p></div>';
      return;
    }
    container.innerHTML = movies.map((m, i) => this.movieCard(m, i * 40)).join('');
  },

  // ─── RENDER GRID ──────────────────────────────────────────
  renderGrid(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!movies?.length) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <p class="no-results-title">Nothing Found</p>
          <p class="no-results-sub">Try different filters or search terms</p>
        </div>`;
      return;
    }
    container.innerHTML = movies.map((m, i) => this.gridCard(m, i * 30)).join('');
    Utils.observeCards(container);
  },

  // ─── HERO SLIDE ───────────────────────────────────────────
  updateHero(movie) {
    const isAnime = movie._type === 'anime';
    const title = movie.title || movie.name || '';
    const overview = movie.overview || '';
    const rating = (movie.vote_average || 0).toFixed(1);
    const year = Utils.getYear(movie.release_date || movie.first_air_date);
    const backdrop = isAnime ? movie._poster_url : API.backdrop(movie.backdrop_path);

    // Crossfade bg
    const bg = document.getElementById('heroBg');
    if (bg) {
      bg.classList.add('fading');
      setTimeout(() => {
        bg.style.backgroundImage = backdrop ? `url(${backdrop})` : 'none';
        bg.classList.remove('fading');
      }, 300);
    }

    const setHTML = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setText('heroTitle', title);
    setText('heroOverview', Utils.truncate(overview, 200));

    setHTML('heroMeta', `
      <span class="hero-meta-item rating">★ ${rating}</span>
      ${year ? `<span class="hero-meta-item">📅 ${year}</span>` : ''}
      ${movie.runtime ? `<span class="hero-meta-item">⏱ ${Utils.formatRuntime(movie.runtime)}</span>` : ''}
      ${isAnime ? '<span class="hero-meta-item">⛩️ Anime</span>' : '<span class="hero-meta-item">🎬 Movie</span>'}
    `);

    // Animate content in
    const content = document.querySelector('.hero-content');
    if (content) {
      content.classList.remove('visible');
      setTimeout(() => content.classList.add('visible'), 100);
    }

    // Bind buttons
    const detailBtn = document.getElementById('heroDetailsBtn');
    if (detailBtn) {
      detailBtn.onclick = () => App.openModal(movie.id, isAnime ? 'anime' : 'movie');
    }
    const wlBtn = document.getElementById('heroWatchlistBtn');
    if (wlBtn) {
      const saved = Storage.isInWatchlist(movie.id);
      wlBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        ${saved ? 'In Watchlist' : 'Add to Watchlist'}
      `;
      wlBtn.onclick = () => App.toggleWatchlistHero(movie, wlBtn);
    }
  },

  // ─── HERO DOTS ────────────────────────────────────────────
  renderHeroDots(count, activeIdx) {
    const dots = document.getElementById('heroDots');
    if (!dots) return;
    dots.innerHTML = Array.from({ length: count }, (_, i) => `
      <div class="hero-dot ${i === activeIdx ? 'active' : ''}" data-idx="${i}" onclick="App.heroGoTo(${i})"></div>
    `).join('');
  },

  updateHeroDots(activeIdx) {
    document.querySelectorAll('.hero-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIdx);
    });
  },

  // ─── SEARCH RESULTS ───────────────────────────────────────
  renderSearchResults(movies) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    if (!movies?.length) {
      container.innerHTML = `
        <div class="no-results" style="grid-column:1/-1; padding: 40px 0;">
          <div class="no-results-icon">🔍</div>
          <p class="no-results-sub">No results found</p>
        </div>`;
      return;
    }
    container.innerHTML = movies.slice(0, 12).map((m, i) => {
      const isAnime = m._type === 'anime';
      const poster = isAnime ? m._poster_url : API.poster(m.poster_path, 'w185');
      const title = m.title || m.name || '';
      const year = Utils.getYear(m.release_date || m.first_air_date);
      const rating = (m.vote_average || 0).toFixed(1);
      const type = isAnime ? 'anime' : (m.media_type || 'movie');
      return `
        <div class="search-card" style="animation-delay:${i * 30}ms"
             onclick="App.closeSearch(); App.openModal('${m.id}', '${type}')">
          <div class="search-card-poster">
            <img src="${poster || ''}" alt="${title}" loading="lazy" onerror="Utils.imgFallback(this)" />
          </div>
          <div class="search-card-body">
            <div class="search-card-title">${title}</div>
            <div class="search-card-meta">${year || ''} ${year && rating ? '·' : ''} ${rating > 0 ? '★ ' + rating : ''}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ─── HINTS ────────────────────────────────────────────────
  renderHints(hints) {
    const el = document.getElementById('hintsList');
    if (!el) return;
    el.innerHTML = hints.map(h => `
      <div class="hint-chip" onclick="App.searchFromHint('${h.replace(/'/g, "&#39;")}')">
        ${h}
      </div>
    `).join('');
  },

  // ─── MODAL ────────────────────────────────────────────────
  openModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  populateModal(data, type) {
    const isAnime = type === 'anime';
    const title = data.title || data.name || '';
    const rating = (data.vote_average || data.score || 0).toFixed(1);
    const year = Utils.getYear(data.release_date || data.first_air_date || data.aired?.from);
    const runtime = isAnime ? null : data.runtime;
    const genres = data.genres || [];
    const overview = data.overview || data.synopsis || '';
    const posterUrl = isAnime ? (data.images?.jpg?.large_image_url || '') : API.poster(data.poster_path, 'w342') || '';
    const backdropUrl = isAnime ? (data.images?.jpg?.large_image_url || '') : API.backdrop(data.backdrop_path) || '';

    // Hero bg
    const heroBg = document.getElementById('modalHeroBg');
    if (heroBg) heroBg.style.backgroundImage = `url(${backdropUrl})`;

    // Poster
    const posterEl = document.getElementById('modalPoster');
    if (posterEl) {
      posterEl.src = posterUrl;
      posterEl.alt = title;
      posterEl.onerror = () => Utils.imgFallback(posterEl);
    }

    // Badges
    const badgesEl = document.getElementById('modalBadges');
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span class="modal-badge badge-rating">★ ${rating}</span>
        ${genres.slice(0, 3).map(g => `<span class="modal-badge badge-genre">${g.name}</span>`).join('')}
      `;
    }

    // Title
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = title;

    // Meta
    const metaEl = document.getElementById('modalMeta');
    if (metaEl) {
      metaEl.innerHTML = [
        year ? `<span class="modal-meta-item">📅 ${year}</span>` : '',
        runtime ? `<span class="modal-meta-item">⏱ ${Utils.formatRuntime(runtime)}</span>` : '',
        data.vote_count ? `<span class="modal-meta-item">🗳️ ${data.vote_count?.toLocaleString()} votes</span>` : '',
        data.status ? `<span class="modal-meta-item">● ${data.status}</span>` : '',
        isAnime && data.episodes ? `<span class="modal-meta-item">📺 ${data.episodes} eps</span>` : '',
        !isAnime && data.budget ? `<span class="modal-meta-item">💰 ${Utils.formatMoney(data.budget)}</span>` : '',
        !isAnime && data.revenue ? `<span class="modal-meta-item">📈 ${Utils.formatMoney(data.revenue)}</span>` : '',
      ].filter(Boolean).join('');
    }

    // Overview
    const overviewEl = document.getElementById('modalOverview');
    if (overviewEl) overviewEl.textContent = overview;

    // Watchlist btn
    const wlBtn = document.getElementById('modalWatchlistBtn');
    const movieStub = {
      id: isAnime ? `anime_${data.mal_id}` : data.id,
      _animeId: data.mal_id,
      _type: isAnime ? 'anime' : 'movie',
      title, poster_path: data.poster_path,
      _poster_url: posterUrl,
      vote_average: data.vote_average || data.score,
      release_date: data.release_date || data.aired?.from,
    };
    if (wlBtn) {
      const saved = Storage.isInWatchlist(movieStub.id);
      wlBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        ${saved ? 'In Watchlist' : 'Watchlist'}
      `;
      wlBtn.onclick = () => {
        const added = Storage.toggleWatchlist(movieStub);
        wlBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${added ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          ${added ? 'In Watchlist' : 'Watchlist'}
        `;
        Utils.toast(added ? '✓ Added to watchlist' : 'Removed from watchlist', added ? 'success' : 'default');
        App.renderWatchlistPanel();
      };
    }

    // Fav btn
    const favBtn = document.getElementById('modalFavBtn');
    if (favBtn) {
      const faved = Storage.isFavorite(movieStub.id);
      favBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${faved ? 'currentColor' : 'none'}" stroke="${faved ? 'var(--accent)' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        ${faved ? 'Favorited' : 'Favorite'}
      `;
      favBtn.onclick = () => {
        const added = Storage.toggleFavorite(movieStub);
        favBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${added ? 'currentColor' : 'none'}" stroke="${added ? 'var(--accent)' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${added ? 'Favorited' : 'Favorite'}
        `;
        Utils.toast(added ? '❤️ Added to favorites' : 'Removed from favorites', added ? 'success' : 'default');
      };
    }

    // Trailer btn
    const trailerBtn = document.getElementById('modalTrailerBtn');
    if (trailerBtn) {
      trailerBtn.onclick = async () => {
        let key = null;
        if (isAnime && data.trailer?.youtube_id) {
          key = data.trailer.youtube_id;
        } else if (!isAnime) {
          const videos = data.videos?.results || [];
          const t = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos[0];
          key = t?.key;
          if (!key) {
            const fetched = await API.getMovieTrailer(data.id);
            key = fetched?.key;
          }
        }
        if (key) App.openTrailer(key);
        else Utils.toast('No trailer available', 'error');
      };
    }

    // Reset tabs
    const tabContent = document.getElementById('modalTabContent');
    if (tabContent) tabContent.innerHTML = '<div class="tab-loading"><div class="spinner"></div></div>';
    document.querySelectorAll('.modal-tab').forEach(t => {
      t.classList.remove('active');
      if (t.dataset.tab === 'cast') t.classList.add('active');
    });

    // Store current data for tab switching
    App._currentModalData = { data, type };
    this.renderModalTab('cast', data, type);
  },

  renderModalTab(tab, data, type) {
    const isAnime = type === 'anime';
    const tabContent = document.getElementById('modalTabContent');
    if (!tabContent) return;

    if (tab === 'cast') {
      const cast = isAnime
        ? [] // Jikan full has characters separately
        : (data.credits?.cast || []).slice(0, 20);

      if (!cast.length) {
        tabContent.innerHTML = `<p style="color:var(--text-muted); font-size:0.88rem; padding:20px 0;">No cast info available.</p>`;
        return;
      }
      tabContent.innerHTML = `
        <div class="cast-grid">
          ${cast.map(c => {
            const img = c.profile_path ? API.poster(c.profile_path, 'w185') : '';
            return `
              <div class="cast-card">
                <div class="cast-avatar">
                  <img src="${img}" alt="${c.name}" loading="lazy"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23111118%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2230%22%3E👤%3C/text%3E%3C/svg%3E'" />
                </div>
                <div class="cast-name">${c.name}</div>
                <div class="cast-character">${c.character || ''}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (tab === 'similar') {
      const similar = isAnime ? [] : (data.similar?.results || data.recommendations?.results || []).slice(0, 10);
      if (!similar.length) {
        tabContent.innerHTML = `<p style="color:var(--text-muted); font-size:0.88rem; padding:20px 0;">No similar content available.</p>`;
        return;
      }
      tabContent.innerHTML = `
        <div class="similar-row">
          ${similar.map(m => {
            const poster = API.poster(m.poster_path, 'w185');
            const title = m.title || m.name;
            const year = Utils.getYear(m.release_date || m.first_air_date);
            return `
              <div class="movie-card" style="flex-shrink:0;width:150px;" onclick="App.openModal('${m.id}', 'movie')">
                <div class="card-poster">
                  <img src="${poster || ''}" alt="${title}" loading="lazy" onerror="Utils.imgFallback(this)" />
                  <div class="card-rating"><span class="star-icon">★</span> ${(m.vote_average || 0).toFixed(1)}</div>
                </div>
                <div class="card-body">
                  <div class="card-title">${title}</div>
                  <div class="card-meta">${year || ''}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (tab === 'details') {
      const items = isAnime ? [
        { label: 'Type', value: data.type || 'Anime' },
        { label: 'Episodes', value: data.episodes || 'N/A' },
        { label: 'Status', value: data.status || 'N/A' },
        { label: 'Source', value: data.source || 'N/A' },
        { label: 'Score', value: `${data.score || 'N/A'} / 10` },
        { label: 'Scored By', value: data.scored_by?.toLocaleString() || 'N/A' },
        { label: 'Rank', value: data.rank ? `#${data.rank}` : 'N/A' },
        { label: 'Popularity', value: data.popularity ? `#${data.popularity}` : 'N/A' },
        { label: 'Season', value: data.season ? `${data.season} ${data.year}` : 'N/A' },
        { label: 'Studios', value: data.studios?.map(s => s.name).join(', ') || 'N/A' },
        { label: 'Themes', value: data.themes?.map(t => t.name).join(', ') || 'N/A' },
        { label: 'Rating', value: data.rating || 'N/A' },
      ] : [
        { label: 'Status', value: data.status || 'N/A' },
        { label: 'Runtime', value: Utils.formatRuntime(data.runtime) },
        { label: 'Language', value: (data.original_language || '').toUpperCase() },
        { label: 'Budget', value: Utils.formatMoney(data.budget) },
        { label: 'Revenue', value: Utils.formatMoney(data.revenue) },
        { label: 'Rating', value: `${(data.vote_average || 0).toFixed(1)} / 10` },
        { label: 'Votes', value: (data.vote_count || 0).toLocaleString() },
        { label: 'Popularity', value: Math.round(data.popularity || 0).toLocaleString() },
        { label: 'Release', value: Utils.formatDate(data.release_date) },
        { label: 'Production', value: data.production_companies?.slice(0, 2).map(c => c.name).join(', ') || 'N/A' },
        { label: 'Country', value: data.production_countries?.map(c => c.iso_3166_1).join(', ') || 'N/A' },
        { label: 'TMDB ID', value: data.id || 'N/A' },
      ];
      tabContent.innerHTML = `
        <div class="details-grid">
          ${items.map(item => `
            <div class="detail-item">
              <div class="detail-label">${item.label}</div>
              <div class="detail-value">${item.value}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  // ─── WATCHLIST PANEL ──────────────────────────────────────
  renderWatchlistPanel() {
    const content = document.getElementById('watchlistContent');
    if (!content) return;
    const list = Storage.getWatchlist();

    if (!list.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎬</div>
          <p>Your watchlist is empty</p>
          <span>Add movies to keep track of what you want to watch</span>
        </div>`;
      return;
    }

    content.innerHTML = list.map(movie => {
      const isAnime = movie._type === 'anime';
      const poster = isAnime ? movie._poster_url : API.poster(movie.poster_path, 'w185');
      const title = movie.title || movie.name || 'Unknown';
      const year = Utils.getYear(movie.release_date);
      const rating = (movie.vote_average || 0).toFixed(1);
      const typeLabel = isAnime ? 'anime' : 'movie';

      return `
        <div class="watchlist-item" onclick="App.openModal('${movie.id}', '${typeLabel}')">
          <img class="watchlist-thumb" src="${poster || ''}" alt="${title}" onerror="Utils.imgFallback(this)" />
          <div class="watchlist-info">
            <div class="watchlist-title">${title}</div>
            <div class="watchlist-meta">${year || ''} ${rating > 0 ? '· ★ ' + rating : ''}</div>
          </div>
          <button class="watchlist-remove" title="Remove" onclick="event.stopPropagation(); App.removeFromWatchlist('${movie.id}', this)">✕</button>
        </div>
      `;
    }).join('');
  },

  // ─── PAGINATION ───────────────────────────────────────────
  renderPagination(currentPage, totalPages, onClick) {
    const container = document.getElementById('pagination');
    if (!container) return;
    const maxPages = Math.min(totalPages, 20);
    if (maxPages <= 1) { container.innerHTML = ''; return; }

    let pages = [];
    if (maxPages <= 7) {
      pages = Array.from({ length: maxPages }, (_, i) => i + 1);
    } else {
      pages = [1, 2];
      if (currentPage > 4) pages.push('...');
      const around = [currentPage - 1, currentPage, currentPage + 1].filter(p => p > 2 && p < maxPages - 1);
      pages.push(...around);
      if (currentPage < maxPages - 3) pages.push('...');
      pages.push(maxPages - 1, maxPages);
      pages = [...new Set(pages)];
    }

    container.innerHTML = `
      <button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="(${onClick})(${currentPage - 1})">‹</button>
      ${pages.map(p => p === '...'
        ? `<span class="page-btn" style="pointer-events:none;opacity:0.4">…</span>`
        : `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="(${onClick})(${p})">${p}</button>`
      ).join('')}
      <button class="page-btn" ${currentPage >= maxPages ? 'disabled' : ''} onclick="(${onClick})(${currentPage + 1})">›</button>
    `;
  },
};

window.UI = UI;
