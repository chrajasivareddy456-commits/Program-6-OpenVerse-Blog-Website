document.addEventListener('DOMContentLoaded', async () => {
  OV.renderNavbar('categories');
  OV.renderFooter();

  const grid = document.getElementById('categoriesGrid');
  const res = await OV.api('/categories');

  if (!res.success || !res.data.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🗂️</div><h3>No categories available</h3></div>`;
    return;
  }

  grid.innerHTML = res.data
    .map(
      (cat) => `
      <a href="/category?slug=${cat.slug}" class="category-card reveal" style="text-align:left;background-image:linear-gradient(180deg, rgba(6,6,13,.6), rgba(6,6,13,.9)), url('/assets/images/categories/${cat.slug}.svg');background-size:cover;background-position:center;">
        <div class="category-icon">${cat.icon}</div>
        <h3>${OV.escapeHtml(cat.name)}</h3>
        <p>${OV.escapeHtml(cat.description)}</p>
        <div class="count" style="margin-top:.6rem">${cat.postCount || 0} stories</div>
      </a>`
    )
    .join('');

  OV.initScrollReveal();
});
