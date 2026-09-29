document.addEventListener('DOMContentLoaded', () => {
  OV.renderNavbar('explore');
  OV.renderFooter();

  const state = {
    query: OV.qs('q', ''),
    filter: OV.qs('filter', 'all'),
    sort: OV.qs('sort', 'latest'),
    page: 1,
    limit: 9,
    total: 0
  };

  const grid = document.getElementById('exploreGrid');
  const input = document.getElementById('exploreSearch');
  const sortSelect = document.getElementById('sortSelect');
  const chips = document.querySelectorAll('.chip[data-filter]');
  const resultsCount = document.getElementById('resultsCount');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const heading = document.getElementById('exploreHeading');

  input.value = state.query;
  sortSelect.value = state.sort;
  chips.forEach((c) => c.classList.toggle('active', c.dataset.filter === state.filter));

  const FILTER_TO_CATEGORY = {
    technology: 'technology', ai: 'artificial-intelligence', programming: 'programming',
    science: 'science', lifestyle: 'lifestyle', travel: 'travel', business: 'business', education: 'education'
  };

  async function fetchAndRender(reset = true) {
    if (reset) {
      state.page = 1;
      grid.innerHTML = `<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>`;
    }

    let res;
    if (state.query) {
      res = await OV.api(`/posts/search?q=${encodeURIComponent(state.query)}`);
      if (res.success) {
        res.data = sortLocally(res.data, state.sort);
        res.total = res.data.length;
      }
      heading.textContent = `Search results for "${state.query}"`;
    } else {
      const params = new URLSearchParams();
      if (state.filter === 'trending') params.set('trending', 'true');
      else if (state.filter === 'popular') params.set('sort', 'popular');
      else if (state.filter !== 'all' && state.filter !== 'latest' && FILTER_TO_CATEGORY[state.filter]) {
        params.set('category', FILTER_TO_CATEGORY[state.filter]);
      }
      if (state.filter !== 'popular') params.set('sort', state.sort);
      params.set('page', state.page);
      params.set('limit', state.limit);
      res = await OV.api(`/posts?${params.toString()}`);
      heading.textContent = 'Explore Stories';
    }

    if (!res.success) {
      grid.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><h3>Something went wrong</h3><p>${OV.escapeHtml(res.message)}</p></div>`;
      loadMoreBtn.style.display = 'none';
      resultsCount.textContent = '';
      return;
    }

    state.total = res.total ?? res.count ?? res.data.length;
    resultsCount.textContent = `${state.total} ${state.total === 1 ? 'story' : 'stories'} found`;

    if (!res.data.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="icon">🔍</div>
          <h3>No stories found.</h3>
          <p>Try another search term, or explore a category below.</p>
          <div class="filters-row" style="margin-top:1.5rem">
            <a href="/category?slug=technology" class="chip">Technology</a>
            <a href="/category?slug=lifestyle" class="chip">Lifestyle</a>
            <a href="/category?slug=science" class="chip">Science</a>
          </div>
        </div>`;
      loadMoreBtn.style.display = 'none';
      return;
    }

    const html = res.data.map(OV.postCardHTML).join('');
    if (reset) grid.innerHTML = html;
    else grid.insertAdjacentHTML('beforeend', html);
    OV.wireBookmarkButtons(grid);
    OV.initScrollReveal();

    const shown = state.query ? state.total : state.page * state.limit;
    loadMoreBtn.style.display = !state.query && shown < state.total ? 'inline-flex' : 'none';
  }

  function sortLocally(data, sort) {
    const copy = data.slice();
    switch (sort) {
      case 'oldest': return copy.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'popular': return copy.sort((a, b) => b.likes - a.likes);
      case 'most-read': return copy.sort((a, b) => b.views - a.views);
      default: return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  const debouncedSearch = OV.debounce(() => {
    state.query = input.value.trim();
    updateUrl();
    fetchAndRender(true);
  }, 400);

  input.addEventListener('input', debouncedSearch);

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.filter = chip.dataset.filter;
      state.query = '';
      input.value = '';
      updateUrl();
      fetchAndRender(true);
    });
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    updateUrl();
    fetchAndRender(true);
  });

  loadMoreBtn.addEventListener('click', () => {
    state.page += 1;
    fetchAndRender(false);
  });

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.filter !== 'all') params.set('filter', state.filter);
    if (state.sort !== 'latest') params.set('sort', state.sort);
    const qstring = params.toString();
    history.replaceState(null, '', qstring ? `?${qstring}` : window.location.pathname);
  }

  fetchAndRender(true);
});
