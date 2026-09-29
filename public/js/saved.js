document.addEventListener('DOMContentLoaded', async () => {
  OV.renderNavbar('');
  OV.renderFooter();

  const grid = document.getElementById('savedGrid');
  const ids = OV.getBookmarks();

  if (!ids.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🔖</div>
        <h3>No saved stories yet</h3>
        <p>Tap the bookmark icon on any story to save it here for later.</p>
        <a href="/explore" class="btn btn-primary" style="margin-top:1rem">Explore Stories</a>
      </div>`;
    return;
  }

  const res = await OV.api('/posts?limit=100');
  if (!res.success) {
    grid.innerHTML = `<div class="error-state"><h3>Could not load your saved stories</h3></div>`;
    return;
  }

  const saved = res.data.filter((p) => ids.includes(p.id));
  if (!saved.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🔖</div><h3>No saved stories yet</h3></div>`;
    return;
  }

  grid.innerHTML = saved.map(OV.postCardHTML).join('');
  OV.wireBookmarkButtons(grid);
  OV.initScrollReveal();

  // Re-render the empty state live if the user unbookmarks the last item without reloading
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-bookmark]');
    if (!btn) return;
    setTimeout(() => {
      if (!OV.getBookmarks().length) {
        document.dispatchEvent(new Event('DOMContentLoaded'));
      }
    }, 50);
  });
});
