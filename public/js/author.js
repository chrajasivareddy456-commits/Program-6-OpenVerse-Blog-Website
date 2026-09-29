document.addEventListener('DOMContentLoaded', () => {
  OV.renderNavbar('authors');
  OV.renderFooter();
  loadProfile();
});

async function loadProfile() {
  const id = OV.qs('id');
  const head = document.getElementById('authorHead');
  const heading = document.getElementById('storiesHeading');

  if (!id) {
    head.innerHTML = `<h1>Author not found</h1>`;
    return;
  }

  const res = await OV.api(`/authors/${id}`);
  if (!res.success) {
    head.innerHTML = `<h1>Author not found</h1><p>${OV.escapeHtml(res.message)}</p>`;
    return;
  }

  const author = res.data;
  const isOwner = author.id === OV.CURRENT_USER.id;
  document.title = `${author.name} — OpenVerse`;

  let followingCount = null;
  if (isOwner) {
    const allAuthorsRes = await OV.api('/authors');
    if (allAuthorsRes.success) {
      followingCount = allAuthorsRes.data.filter(
        (a) => a.id !== author.id && localStorage.getItem(`openverse_follow_${a.id}`) === '1'
      ).length;
    }
  }

  renderHead(author, isOwner, followingCount);

  if (isOwner) {
    heading.textContent = 'My Stories';
    renderMyStories(author);
  } else {
    heading.textContent = 'Stories';
    renderReadOnlyStories(author);
  }
}

function renderHead(author, isOwner, followingCount) {
  const head = document.getElementById('authorHead');
  const followKey = `openverse_follow_${author.id}`;
  const isFollowing = localStorage.getItem(followKey) === '1';
  const session = OV.getSession();

  head.innerHTML = `
    <img class="avatar" src="${author.avatar}" alt="${OV.escapeHtml(author.name)}" style="width:110px;height:110px;margin:0 auto 1.2rem;border:3px solid rgba(139,92,246,.4)">
    <h1>${OV.escapeHtml(author.name)}</h1>
    <p style="max-width:560px;margin:0 auto 1rem">${OV.escapeHtml(author.bio)}</p>
    <div class="filters-row" style="justify-content:center;margin-bottom:1.4rem">
      ${author.expertise.map((e) => `<span class="chip">${OV.escapeHtml(e)}</span>`).join('')}
    </div>
    <div class="author-stats" style="margin-bottom:1.6rem">
      <div><b id="storyCountStat">${author.articleCount}</b>Stories</div>
      <div><b>${author.followers.toLocaleString()}</b>Followers</div>
      ${isOwner ? `<div><b>${followingCount ?? 0}</b>Following</div>` : ''}
    </div>
    ${
      isOwner
        ? `<div style="display:flex;flex-direction:column;align-items:center;gap:.7rem">
             <span class="pill">✦ This is your public profile</span>
             ${
               session
                 ? `<button type="button" class="btn btn-ghost btn-sm" id="profileLogoutBtn">Log Out</button>`
                 : `<a href="/signin" class="btn btn-ghost btn-sm">Sign In as ${OV.escapeHtml(OV.CURRENT_USER.name)}</a>`
             }
           </div>`
        : `<button class="btn ${isFollowing ? 'btn-ghost' : 'btn-primary'}" id="followBtn">${isFollowing ? 'Following' : 'Follow'}</button>`
    }
    <div class="social-row" style="justify-content:center;margin-top:1.2rem">
      <a href="${author.social.twitter}" target="_blank" rel="noopener" class="btn-icon">𝕏</a>
      <a href="${author.social.linkedin}" target="_blank" rel="noopener" class="btn-icon">in</a>
      <a href="${author.social.website}" target="_blank" rel="noopener" class="btn-icon">🌐</a>
    </div>
  `;

  if (isOwner && session) {
    document.getElementById('profileLogoutBtn').addEventListener('click', () => {
      OV.clearSession();
      OV.toast('Logged out', 'success');
      setTimeout(() => window.location.reload(), 500);
    });
  }

  if (!isOwner) {
    document.getElementById('followBtn').addEventListener('click', (e) => {
      const nowFollowing = localStorage.getItem(followKey) !== '1';
      localStorage.setItem(followKey, nowFollowing ? '1' : '0');
      e.target.textContent = nowFollowing ? 'Following' : 'Follow';
      e.target.classList.toggle('btn-primary', !nowFollowing);
      e.target.classList.toggle('btn-ghost', nowFollowing);
      OV.toast(nowFollowing ? `You're now following ${author.name}` : `Unfollowed ${author.name}`, 'success', 2200);
    });
  }
}

/* ---------------------------- Read-only view (sample authors) ---------------------------- */
function renderReadOnlyStories(author) {
  const grid = document.getElementById('authorPostsGrid');
  if (!author.posts.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">📝</div><h3>No published stories yet</h3></div>`;
    return;
  }
  grid.innerHTML = author.posts
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(OV.postCardHTML)
    .join('');
  OV.wireBookmarkButtons(grid);
  OV.initScrollReveal();
}

/* ---------------------------- My Stories (owner: auth-11 only) ---------------------------- */
function renderMyStories(author) {
  const grid = document.getElementById('authorPostsGrid');

  if (!author.posts.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">✍️</div>
        <h3>You haven't published any stories yet.</h3>
        <p>Everything you publish through the Write page will show up here, ready to edit or delete.</p>
        <a href="/write" class="btn btn-primary" style="margin-top:1rem">Write Your First Story</a>
      </div>`;
    return;
  }

  const posts = author.posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = posts.map(myStoryCardHTML).join('');
  OV.initScrollReveal();
  wireMyStoriesActions(grid);
}

function myStoryCardHTML(post) {
  return `
    <article class="post-card reveal" data-story-card="${post.id}">
      <div class="post-thumb">
        <a href="/article?id=${post.id}"><img src="${post.image}" alt="Cover image for ${OV.escapeHtml(post.title)}" loading="lazy"></a>
        <span class="post-category">${OV.escapeHtml(post.category)}</span>
        ${post.status === 'draft' ? '<span class="post-category" style="left:auto;right:12px;background:rgba(250,204,21,.18);border-color:rgba(250,204,21,.4);color:#facc15">Draft</span>' : ''}
      </div>
      <div class="post-body">
        <div class="post-meta-top"><span>${OV.formatDate(post.date)}</span><span>${post.readingTime} min read</span></div>
        <h3 class="post-title"><a href="/article?id=${post.id}">${OV.escapeHtml(post.title)}</a></h3>
        <p class="post-desc">${OV.escapeHtml(post.excerpt)}</p>
        <div class="post-footer" style="justify-content:flex-start;gap:.6rem;flex-wrap:wrap">
          <a href="/article?id=${post.id}" class="btn btn-ghost btn-sm">Read</a>
          <a href="/write?id=${post.id}" class="btn btn-ghost btn-sm">Edit</a>
          <button type="button" class="btn btn-danger btn-sm" data-delete-story="${post.id}" data-story-title="${OV.escapeHtml(post.title)}">Delete</button>
        </div>
      </div>
    </article>`;
}

function wireMyStoriesActions(grid) {
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete-story]');
    if (!btn) return;

    const postId = btn.dataset.deleteStory;
    const title = btn.dataset.storyTitle || 'this story';

    const confirmed = await OV.confirmModal({
      title: 'Delete this story?',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete Story'
    });
    if (!confirmed) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const res = await OV.api(`/posts/${postId}`, { method: 'DELETE' });

    if (!res.success) {
      btn.disabled = false;
      btn.textContent = 'Delete';
      OV.toast(res.message || 'Could not delete story', 'error');
      return;
    }

    OV.toast('Story deleted', 'success');
    const card = grid.querySelector(`[data-story-card="${postId}"]`);
    if (card) {
      card.style.transition = 'opacity .3s ease, transform .3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(.96)';
      setTimeout(() => {
        card.remove();
        // Reload the whole profile so the empty state and story count
        // (both driven by the server) reflect reality with zero drift.
        if (!grid.children.length) loadProfile();
        else updateStoryCountStat(-1);
      }, 280);
    }
  });
}

function updateStoryCountStat(delta) {
  const el = document.getElementById('storyCountStat');
  if (!el) return;
  el.textContent = String(Math.max(0, parseInt(el.textContent, 10) + delta));
}
