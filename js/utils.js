// ============================================================
// CINEVERSE — utils.js
// Helper functions
// ============================================================

const Utils = {

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Throttle
  throttle(fn, limit = 100) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Format date: "Sep 15, 2024"
  formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch { return dateStr; }
  },

  // Year only
  getYear(dateStr) {
    if (!dateStr) return '';
    return dateStr.split('-')[0];
  },

  // Format runtime: 148 → "2h 28m"
  formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  },

  // Format money: 1500000000 → "$1.5B"
  formatMoney(num) {
    if (!num || num === 0) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
    return `$${num.toLocaleString()}`;
  },

  // Clamp rating color
  getRatingColor(rating) {
    if (rating >= 8) return '#4be89a';
    if (rating >= 6.5) return '#e8b84b';
    if (rating >= 5) return '#e88f4b';
    return '#e84b4b';
  },

  // Get rating stroke for ring
  getRatingStroke(rating, radius = 20) {
    const circumference = 2 * Math.PI * radius;
    const pct = rating / 10;
    return {
      circumference,
      offset: circumference * (1 - pct)
    };
  },

  // Truncate text
  truncate(str, len = 150) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
  },

  // Generate star rating HTML
  starsHTML(rating) {
    const full = Math.floor(rating / 2);
    const half = rating % 2 >= 1 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  },

  // Image placeholder for broken images
  imgFallback(el) {
    el.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='185' height='278' viewBox='0 0 185 278'%3E%3Crect fill='%23111118' width='185' height='278'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%235a5760'%3E🎬%3C/text%3E%3C/svg%3E";
  },

  // Smooth scroll row
  scrollRow(rowEl, direction) {
    const scrollAmount = 600;
    rowEl.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  },

  // Show toast notification
  toast(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  // Progress bar
  _progress: null,
  showProgress() {
    if (!this._progress) {
      this._progress = document.createElement('div');
      this._progress.className = 'progress-bar';
      document.body.prepend(this._progress);
    }
    this._progress.style.width = '0%';
    this._progress.style.opacity = '1';
    setTimeout(() => {
      if (this._progress) this._progress.style.width = '70%';
    }, 50);
  },
  hideProgress() {
    if (!this._progress) return;
    this._progress.style.width = '100%';
    setTimeout(() => {
      if (this._progress) {
        this._progress.style.opacity = '0';
        setTimeout(() => { this._progress.style.width = '0%'; }, 400);
      }
    }, 300);
  },

  // Animate number counting up
  animateCount(el, target, duration = 1000) {
    const start = performance.now();
    const update = (time) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },

  // Intersection observer for lazy load
  observeCards(container) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    container.querySelectorAll('.grid-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = `opacity 0.5s ${i * 0.04}s ease, transform 0.5s ${i * 0.04}s ease`;
      observer.observe(card);
    });
  }
};

window.Utils = Utils;
