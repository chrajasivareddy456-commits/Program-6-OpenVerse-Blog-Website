document.addEventListener('DOMContentLoaded', async () => {
  OV.renderNavbar('home');
  OV.renderFooter();
  OV.initParticles('heroParticles', 22);
  OV.animateCounters();

  await Promise.all([loadTrending(), loadFeatured(), loadLatest(), loadCategories(), loadAuthors()]);
  OV.initScrollReveal();
  wireNewsletter();
});

async function loadTrending() {
  const grid = document.getElementById('trendingGrid');
  const res = await OV.api('/posts?trending=true&limit=4&sort=latest');
  if (!res.success || !res.data.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><h3>No trending stories yet</h3><p>Check back soon.</p></div>`;
    return;
  }
  grid.innerHTML = res.data.map(OV.postCardHTML).join('');
  OV.wireBookmarkButtons(grid);
}

async function loadFeatured() {
  const wrap = document.getElementById('featuredWrap');
  const res = await OV.api('/posts?featured=true&limit=1');
  if (!res.success || !res.data.length) {
    wrap.innerHTML = '';
    return;
  }
  const post = res.data[0];
  wrap.innerHTML = `
    <div class="featured-story reveal">
      <div class="ft-media"><img src="${post.image}" alt="${OV.escapeHtml(post.title)}" loading="lazy"></div>
      <div class="ft-content">
        <span class="pill">Featured Story</span>
        <h3 style="margin-top:1rem">${OV.escapeHtml(post.title)}</h3>
        <p>${OV.escapeHtml(post.excerpt)}</p>
        <div class="post-footer" style="border:none;padding-top:.5rem">
          <a href="/author?id=${post.authorId}" class="post-author">
            <img class="avatar avatar-sm" src="${OV.authorAvatarPath(post.authorSlug)}" alt="${OV.escapeHtml(post.author)}" loading="lazy">
            ${OV.escapeHtml(post.author)}
          </a>
          <span class="post-reading">${post.readingTime} min read</span>
        </div>
        <a href="/article?id=${post.id}" class="btn btn-primary" style="margin-top:1.5rem;width:fit-content">Read Full Story</a>
      </div>
    </div>`;
}

async function loadLatest() {
  const grid = document.getElementById('latestGrid');
  const res = await OV.api('/posts?limit=8&sort=latest');
  if (!res.success || !res.data.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">📝</div><h3>No stories published yet</h3></div>`;
    return;
  }
  grid.innerHTML = res.data.map(OV.postCardHTML).join('');
  OV.wireBookmarkButtons(grid);
}

async function loadCategories() {
  const grid = document.getElementById('categoryGrid');
  const res = await OV.api('/categories');
  if (!res.success) return;
  grid.innerHTML = res.data.slice(0, 10).map(OV.categoryCardHTML).join('');
}

async function loadAuthors() {
  const grid = document.getElementById('authorGrid');
  const res = await OV.api('/authors');
  if (!res.success) return;
  const top = res.data.slice().sort((a, b) => b.articleCount - a.articleCount).slice(0, 4);
  grid.innerHTML = top.map(OV.authorCardHTML).join('');
}

function wireNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
    const res = await OV.api('/newsletter', { method: 'POST', body: JSON.stringify({ email: input.value }) });
    btn.innerHTML = original;
    btn.disabled = false;
    OV.toast(res.message, res.success ? 'success' : 'error');
    if (res.success) form.reset();
  });
}
