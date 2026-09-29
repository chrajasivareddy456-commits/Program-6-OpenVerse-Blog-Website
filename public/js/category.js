document.addEventListener('DOMContentLoaded', async () => {
  OV.renderNavbar('categories');
  OV.renderFooter();

  const slug = OV.qs('slug');
  const head = document.getElementById('categoryHead');
  const grid = document.getElementById('categoryGrid');

  if (!slug) {
    head.innerHTML = `<h1>Category not found</h1><p>No category was specified.</p>`;
    return;
  }

  const res = await OV.api(`/categories/${slug}`);
  if (!res.success) {
    head.innerHTML = `<h1>Category not found</h1><p>${OV.escapeHtml(res.message)}</p>`;
    document.getElementById('backLink').style.display = 'inline-flex';
    return;
  }

  const cat = res.data;
  document.title = `${cat.name} — OpenVerse`;
  head.innerHTML = `
    <img src="/assets/images/categories/${cat.slug}.svg" alt="${OV.escapeHtml(cat.name)} category cover art" style="width:120px;height:78px;object-fit:cover;border-radius:12px;margin:0 auto 1.2rem;border:1px solid var(--border-strong)">
    <div class="category-icon" style="margin:0 auto 1rem">${cat.icon}</div>
    <h1>${OV.escapeHtml(cat.name)}</h1>
    <p>${OV.escapeHtml(cat.description)}</p>
    <span class="pill" style="margin:1rem auto 0">${cat.posts.length} ${cat.posts.length === 1 ? 'story' : 'stories'}</span>
  `;

  if (!cat.posts.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">📭</div><h3>No stories in this category yet</h3><p>Be the first to write one.</p><a href="/write" class="btn btn-primary" style="margin-top:1rem">Start Writing</a></div>`;
    return;
  }

  grid.innerHTML = cat.posts
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(OV.postCardHTML)
    .join('');
  OV.wireBookmarkButtons(grid);
  OV.initScrollReveal();
});
