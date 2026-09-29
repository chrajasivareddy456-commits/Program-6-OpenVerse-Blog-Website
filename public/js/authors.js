document.addEventListener('DOMContentLoaded', async () => {
  OV.renderNavbar('authors');
  OV.renderFooter();

  const grid = document.getElementById('authorsGrid');
  const res = await OV.api('/authors');

  if (!res.success || !res.data.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🖋️</div><h3>No authors yet</h3></div>`;
    return;
  }

  const authors = res.data.slice().sort((a, b) => b.articleCount - a.articleCount);
  grid.innerHTML = authors.map(OV.authorCardHTML).join('');
  OV.initScrollReveal();
});
