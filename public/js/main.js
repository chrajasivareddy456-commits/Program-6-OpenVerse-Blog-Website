/* ==========================================================================
   OpenVerse — main.js
   Shared utilities loaded on every page: navbar, footer, toasts, bookmarks,
   demo auth, reveal-on-scroll, particles, and small helpers.
   ========================================================================== */

const OV = (() => {
  const API_BASE = '/api';

  // OpenVerse is a single-owner demo/portfolio site: every story published
  // through the Write page belongs to this fixed author, so there is never
  // an "author picker" and "My Profile" always resolves to the same person.
  const CURRENT_USER = {
    id: 'auth-11',
    slug: 'ch-raja-siva-reddy',
    name: 'Ch Raja Siva Reddy'
  };

  /* ---------------------------- fetch wrapper ---------------------------- */
  async function api(path, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      let data;
      try {
        data = await res.json();
      } catch {
        data = { success: false, message: 'Unexpected server response' };
      }
      if (!res.ok && !data.hasOwnProperty('success')) {
        data = { success: false, message: `Request failed (${res.status})` };
      }
      return data;
    } catch (err) {
      console.error('API error:', err);
      return { success: false, message: 'Could not reach the server. Please check your connection.' };
    }
  }

  /* ---------------------------- toasts ---------------------------- */
  function ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  const ICONS = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#34d399" opacity=".15"/><path d="M8 12.5l2.5 2.5L16 9" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#f87171" opacity=".15"/><path d="M12 8v5M12 16h.01" stroke="#f87171" stroke-width="2" stroke-linecap="round"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#a855f7" opacity=".15"/><path d="M12 8h.01M12 11v5" stroke="#a855f7" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  function toast(message, type = 'info', duration = 3800) {
    const container = ensureToastContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${ICONS[type] || ICONS.info}<p>${message}</p><button class="close" aria-label="Dismiss">✕</button>`;
    container.appendChild(el);
    const remove = () => {
      el.style.transition = 'opacity .25s ease, transform .25s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector('.close').addEventListener('click', remove);
    setTimeout(remove, duration);
  }

  /* ---------------------------- confirm modal ---------------------------- */
  function confirmModal({ title = 'Are you sure?', message = '', confirmText = 'Confirm', danger = true } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="glass modal-box">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-action="cancel">Cancel</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm" style="${danger ? '' : ''}">${confirmText}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));

      const close = (result) => {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 250);
        resolve(result);
      };
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });
      overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
    });
  }

  /* ---------------------------- bookmarks (localStorage) ---------------------------- */
  const BOOKMARK_KEY = 'openverse_bookmarks';
  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];
    } catch {
      return [];
    }
  }
  function isBookmarked(id) {
    return getBookmarks().includes(id);
  }
  function toggleBookmark(id) {
    let list = getBookmarks();
    let added;
    if (list.includes(id)) {
      list = list.filter((x) => x !== id);
      added = false;
    } else {
      list.push(id);
      added = true;
    }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
    return added;
  }

  /* ---------------------------- demo auth (localStorage only) ---------------------------- */
  const SESSION_KEY = 'openverse_demo_session';
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* ---------------------------- date / text helpers ---------------------------- */
  function formatDate(iso) {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  }
  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso.slice(0, 10));
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }
  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }
  function qs(name, fallback = null) {
    return new URLSearchParams(window.location.search).get(name) ?? fallback;
  }

  /* ---------------------------- share helpers ---------------------------- */
  async function shareArticle(title, url) {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      await copyLink(url);
    }
  }
  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard', 'success');
    } catch {
      toast('Could not copy link', 'error');
    }
  }

  /* ---------------------------- reveal on scroll ---------------------------- */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------- animated counters ---------------------------- */
  function animateCounters(selector = '[data-counter]') {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const run = (el) => {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      if (reduced) {
        el.textContent = target + suffix;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------- particles ---------------------------- */
  function initParticles(containerId, count = 18) {
    const container = document.getElementById(containerId);
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 3 + 1.5;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDuration = `${Math.random() * 10 + 10}s`;
      p.style.animationDelay = `${Math.random() * -20}s`;
      p.style.opacity = String(Math.random() * 0.4 + 0.2);
      container.appendChild(p);
    }
  }

  /* ---------------------------- logo (inline SVG) ---------------------------- */
  const LOGO_SVG = `
    <svg class="logo-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ovGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stop-color="#a855f7"/>
          <stop offset="1" stop-color="#3b82f6"/>
        </linearGradient>
      </defs>
      <path d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z" stroke="url(#ovGrad)" stroke-width="2" fill="rgba(139,92,246,0.12)"/>
      <path d="M20 12 C25 12 28 16 28 20 C28 24 25 28 20 28 C15 28 12 24 12 20 C12 16 15 12 20 12Z" fill="url(#ovGrad)"/>
      <circle cx="20" cy="20" r="3.2" fill="#06060d"/>
    </svg>`;

  /* ---------------------------- navbar ---------------------------- */
  function renderNavbar(active = '') {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    const session = getSession();
    const links = [
      ['home', '/', 'Home'],
      ['explore', '/explore', 'Explore'],
      ['categories', '/categories', 'Categories'],
      ['authors', '/authors', 'Authors'],
      ['about', '/about', 'About'],
      ['contact', '/contact', 'Contact']
    ];
    const linkHtml = links
      .map(([key, href, label]) => `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`)
      .join('');

    root.innerHTML = `
      <nav class="navbar" id="navbar">
        <div class="container navbar-inner">
          <a href="/" class="logo">${LOGO_SVG}<span>Open<span class="logo-text-o">Verse</span></span></a>
          <div class="nav-links">${linkHtml}</div>
          <div class="nav-actions">
            <button class="btn-icon" id="searchToggle" aria-label="Search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m21 21-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
            <a href="/write" class="btn btn-primary btn-sm" id="writeBtnNav"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="margin-right:2px"><path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Write</a>
            <a href="${session ? `/author?id=${CURRENT_USER.id}` : '/signin'}" class="btn btn-ghost btn-sm" id="authNavBtn">${session ? 'My Profile' : 'Sign In'}</a>
            <button class="btn-icon nav-toggle" id="mobileToggle" aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
          </div>
        </div>
      </nav>
      <div class="mobile-menu" id="mobileMenu">
        <button class="btn-icon mobile-menu-close" id="mobileClose" aria-label="Close menu">✕</button>
        ${links.map(([key, href, label]) => `<a href="${href}">${label}</a>`).join('')}
        <a href="/write" class="btn btn-primary">Write a Story</a>
        ${session ? `<a href="/author?id=${CURRENT_USER.id}" class="btn btn-ghost">My Profile</a>` : ''}
        <a href="/saved" class="btn btn-ghost">Saved Stories</a>
        ${
          session
            ? `<button type="button" class="btn btn-ghost" id="mobileLogoutBtn">Log Out (${escapeHtml(session.name.split(' ')[0])})</button>`
            : `<a href="/signin" class="btn btn-ghost">Sign In</a>`
        }
      </div>
      <div class="modal-overlay" id="searchOverlay">
        <div class="glass modal-box" style="max-width:560px;text-align:left">
          <h3 style="margin-bottom:1rem">Search OpenVerse</h3>
          <div class="search-bar" style="margin-bottom:0">
            <span class="icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m21 21-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            <input type="text" id="navSearchInput" placeholder="Search stories, authors, topics..." autocomplete="off">
          </div>
        </div>
      </div>
    `;

    const nav = document.getElementById('navbar');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const mobileMenu = document.getElementById('mobileMenu');
    document.getElementById('mobileToggle').addEventListener('click', () => mobileMenu.classList.add('open'));
    document.getElementById('mobileClose').addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        clearSession();
        toast('Logged out', 'success');
        setTimeout(() => (window.location.href = '/'), 500);
      });
    }

    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('navSearchInput');
    document.getElementById('searchToggle').addEventListener('click', () => {
      searchOverlay.classList.add('open');
      setTimeout(() => searchInput.focus(), 200);
    });
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) searchOverlay.classList.remove('open');
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        window.location.href = `/explore?q=${encodeURIComponent(searchInput.value.trim())}`;
      }
      if (e.key === 'Escape') searchOverlay.classList.remove('open');
    });
  }

  /* ---------------------------- footer ---------------------------- */
  function renderFooter() {
    const root = document.getElementById('footer-root');
    if (!root) return;
    const year = new Date().getFullYear();
    root.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a href="/" class="logo">${LOGO_SVG}<span>Open<span class="logo-text-o">Verse</span></span></a>
              <p>A community-driven publishing platform where every voice has a verse. Read, write, and discover ideas worth your time.</p>
              <div class="social-row">
                <a href="#" class="btn-icon" aria-label="Twitter"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
                <a href="#" class="btn-icon" aria-label="Instagram"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
                <a href="#" class="btn-icon" aria-label="LinkedIn"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2 3.77-2 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.02-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97V21H9z"/></svg></a>
              </div>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><a href="/explore">All Stories</a></li>
                <li><a href="/explore?filter=trending">Trending</a></li>
                <li><a href="/categories">Categories</a></li>
                <li><a href="/authors">Authors</a></li>
              </ul>
            </div>
            <div>
              <h4>For Writers</h4>
              <ul>
                <li><a href="/write">Start Writing</a></li>
                <li><a href="/signup">Create Account</a></li>
                <li><a href="/saved">Saved Stories</a></li>
                <li><a href="/about">Our Mission</a></li>
              </ul>
            </div>
            <div>
              <h4>Resources</h4>
              <ul>
                <li><a href="/about">About OpenVerse</a></li>
                <li><a href="/contact">Contact Us</a></li>
                <li><a href="#" data-legal="privacy">Privacy Policy</a></li>
                <li><a href="#" data-legal="terms">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:hello@openverse.app">hello@openverse.app</a></li>
                <li><a href="/contact">Send a message</a></li>
                <li style="color:var(--text-muted)">Remote-first, worldwide</li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} OpenVerse. All rights reserved.</span>
            <span>Where Every Voice Has a Verse.</span>
          </div>
        </div>
      </footer>
    `;
    root.querySelectorAll('[data-legal]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const kind = a.dataset.legal;
        confirmModal({
          title: kind === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
          message:
            kind === 'privacy'
              ? 'OpenVerse is a demo project. No personal data is sold or shared. Contact form and comment data are stored locally in JSON files for demonstration purposes only.'
              : 'OpenVerse is a student/demo project for learning Node.js and Express.js. Content is provided as-is for educational and portfolio purposes.',
          confirmText: 'Got it',
          danger: false
        });
      });
    });
  }

  /* ---------------------------- images: local paths + fallback ---------------------------- */
  const FALLBACK_COVER = '/assets/images/ui/fallback-cover.svg';
  const FALLBACK_AVATAR = '/assets/images/ui/fallback-avatar.svg';

  function authorAvatarPath(slug) {
    return slug ? `/assets/images/authors/${slug}.svg` : FALLBACK_AVATAR;
  }

  // Global, event-delegated fallback: if ANY <img> on the site fails to load
  // (broken URL, offline CDN, bad user-submitted cover image, etc.) swap it
  // for a themed local placeholder instead of the browser's broken-image icon.
  function initImageFallback() {
    document.addEventListener(
      'error',
      (e) => {
        const el = e.target;
        if (!el || el.tagName !== 'IMG' || el.dataset.fallbackApplied) return;
        el.dataset.fallbackApplied = 'true';
        el.src = el.classList.contains('avatar') ? FALLBACK_AVATAR : FALLBACK_COVER;
        el.classList.add('img-fallback');
      },
      true // capture phase — 'error' events on <img> don't bubble
    );
  }
  initImageFallback();

  /* ---------------------------- card renderers ---------------------------- */
  function postCardHTML(post) {
    const bookmarked = isBookmarked(post.id);
    return `
      <article class="post-card reveal">
        <div class="post-thumb">
          <a href="/article?id=${post.id}"><img src="${post.image}" alt="Cover image for ${escapeHtml(post.title)}" loading="lazy"></a>
          <span class="post-category">${escapeHtml(post.category)}</span>
          <button class="post-bookmark-btn ${bookmarked ? 'active' : ''}" data-bookmark="${post.id}" aria-label="Bookmark this story" aria-pressed="${bookmarked}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${bookmarked ? 'currentColor' : 'none'}"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="post-body">
          <div class="post-meta-top"><span>${formatDate(post.date)}</span><span>${post.readingTime} min read</span></div>
          <h3 class="post-title"><a href="/article?id=${post.id}">${escapeHtml(post.title)}</a></h3>
          <p class="post-desc">${escapeHtml(post.excerpt)}</p>
          <div class="post-footer">
            <a href="/author?id=${post.authorId || ''}" class="post-author">
              <img class="avatar avatar-sm" src="${authorAvatarPath(post.authorSlug)}" alt="${escapeHtml(post.author)}" loading="lazy">
              ${escapeHtml(post.author)}
            </a>
          </div>
        </div>
      </article>`;
  }

  function categoryCardHTML(cat) {
    return `
      <a href="/category?slug=${cat.slug}" class="category-card reveal" style="background-image:linear-gradient(180deg, rgba(6,6,13,.6), rgba(6,6,13,.88)), url('/assets/images/categories/${cat.slug}.svg');background-size:cover;background-position:center;">
        <div class="category-icon">${cat.icon}</div>
        <h3>${escapeHtml(cat.name)}</h3>
        <div class="count">${cat.postCount || 0} stories</div>
      </a>`;
  }

  function authorCardHTML(author) {
    return `
      <div class="author-card reveal">
        <img class="avatar" src="${author.avatar}" alt="${escapeHtml(author.name)}">
        <h3>${escapeHtml(author.name)}</h3>
        <p class="bio">${escapeHtml(author.bio)}</p>
        <div class="author-stats">
          <div><b>${author.articleCount}</b>Articles</div>
          <div><b>${author.followers}</b>Followers</div>
        </div>
        <a href="/author?id=${author.id}" class="btn btn-ghost btn-sm btn-block">View Profile</a>
      </div>`;
  }

  function wireBookmarkButtons(container = document) {
    container.querySelectorAll('[data-bookmark]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.bookmark;
        const added = toggleBookmark(id);
        btn.classList.toggle('active', added);
        btn.setAttribute('aria-pressed', String(added));
        btn.classList.add('bookmark-pop');
        setTimeout(() => btn.classList.remove('bookmark-pop'), 400);
        toast(added ? 'Saved to your library' : 'Removed from saved stories', 'success', 2200);
      });
    });
  }

  return {
    api, toast, confirmModal,
    CURRENT_USER,
    authorAvatarPath, FALLBACK_COVER, FALLBACK_AVATAR,
    postCardHTML, categoryCardHTML, authorCardHTML, wireBookmarkButtons,
    getBookmarks, isBookmarked, toggleBookmark,
    getSession, setSession, clearSession,
    formatDate, timeAgo, escapeHtml, debounce, qs,
    shareArticle, copyLink,
    initScrollReveal, animateCounters, initParticles,
    renderNavbar, renderFooter, LOGO_SVG
  };
})();
