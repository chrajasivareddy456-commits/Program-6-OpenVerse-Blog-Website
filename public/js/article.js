document.addEventListener('DOMContentLoaded', async () => {
  OV.renderNavbar('explore');
  OV.renderFooter();

  const id = OV.qs('id');
  if (!id) {
    renderNotFound();
    return;
  }

  const res = await OV.api(`/posts/${id}`);
  if (!res.success) {
    renderNotFound(res.message);
    return;
  }

  const post = res.data;
  renderArticle(post);
  loadComments(post.id);
  loadRelated(post.id);
  wireCommentForm(post.id);
});

function renderNotFound(message = 'This story may have been removed or the link is incorrect.') {
  document.getElementById('articleRoot').innerHTML = `
    <div class="section-tight"><div class="container">
      <div class="error-state">
        <div class="icon">📄</div>
        <h3>Story not found</h3>
        <p>${OV.escapeHtml(message)}</p>
        <a href="/explore" class="btn btn-primary" style="margin-top:1rem">Back to Explore</a>
      </div>
    </div></div>`;
}

function renderArticle(post) {
  document.title = `${post.title} — OpenVerse`;
  const bookmarked = OV.isBookmarked(post.id);
  const url = window.location.href;

  const bodyHtml = post.content
    .map((para, i) => {
      // Turn every 3rd non-trivial paragraph into a visual highlight/pull-quote for reading rhythm
      if (i === 1 && post.content.length > 3) {
        return `<blockquote class="pull-quote">${OV.escapeHtml(para.split('. ')[0])}.</blockquote><p>${OV.escapeHtml(para)}</p>`;
      }
      if (i === Math.floor(post.content.length / 2) && post.content.length > 4) {
        return `<div class="highlight-box">${OV.escapeHtml(para)}</div>`;
      }
      return `<p>${OV.escapeHtml(para)}</p>`;
    })
    .join('\n');

  document.getElementById('articleRoot').innerHTML = `
    <section class="article-hero">
      <div class="container">
        <div class="breadcrumb">
          <a href="/">Home</a> / <a href="/explore">Explore</a> / <a href="/category?slug=${post.categorySlug}">${OV.escapeHtml(post.category)}</a>
        </div>
        <div class="article-head reveal in-view">
          <span class="pill">${OV.escapeHtml(post.category)}</span>
          <h1 style="margin-top:1rem">${OV.escapeHtml(post.title)}</h1>
          <p class="article-subtitle">${OV.escapeHtml(post.subtitle || '')}</p>
          <div class="article-meta-row">
            <a href="/author?id=${post.authorId}" class="article-author">
              <img class="avatar" src="${OV.authorAvatarPath(post.authorSlug)}" alt="${OV.escapeHtml(post.author)}" loading="lazy">
              <span>
                <span class="name" style="display:block">${OV.escapeHtml(post.author)}</span>
                <span class="meta">Published ${OV.formatDate(post.date)}${post.updatedDate !== post.date ? ' · Updated ' + OV.formatDate(post.updatedDate) : ''}</span>
              </span>
            </a>
            <span class="meta">${post.readingTime} min read</span>
            <span class="meta">${post.views.toLocaleString()} views</span>
          </div>
          <div class="article-actions">
            <button class="btn-icon" id="likeBtn" aria-label="Like this story">❤️</button>
            <button class="btn-icon ${bookmarked ? 'active' : ''}" id="bookmarkBtn" data-bookmark="${post.id}" aria-label="Bookmark this story" aria-pressed="${bookmarked}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${bookmarked ? 'currentColor' : 'none'}"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn-icon" id="shareBtn" aria-label="Share this story">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8.3 10.7 15.7 6.6M8.3 13.3l7.4 4.1" stroke="currentColor" stroke-width="1.8"/></svg>
            </button>
            <button class="btn-icon" id="copyBtn" aria-label="Copy link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12a3 3 0 0 0 4.24.24l3-3a3 3 0 0 0-4.24-4.24l-1.5 1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15 12a3 3 0 0 0-4.24-.24l-3 3a3 3 0 0 0 4.24 4.24l1.5-1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="article-cover reveal in-view"><img src="${post.image}" alt="${OV.escapeHtml(post.title)}"></div>
      </div>
    </section>

    <section class="section-tight">
      <div class="container">
        <div class="article-layout">
          <aside class="article-share-rail">
            <button class="btn-icon" id="likeBtn2" aria-label="Like">❤️ <span id="likeCount" style="margin-left:.4rem;font-size:.8rem">${post.likes}</span></button>
            <button class="btn-icon ${bookmarked ? 'active' : ''}" data-bookmark="${post.id}" aria-label="Bookmark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${bookmarked ? 'currentColor' : 'none'}"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn-icon" id="shareBtn2" aria-label="Share">↗</button>
          </aside>
          <div>
            <div class="article-body">${bodyHtml}</div>
            <div class="tag-row">${post.tags.map((t) => `<a href="/explore?q=${encodeURIComponent(t)}" class="tag">#${OV.escapeHtml(t)}</a>`).join('')}</div>

            <div class="author-box" id="authorBox"></div>

            <a href="/explore" class="link-arrow">← Back to Explore</a>

            <hr class="divider">
            <h2 style="margin-bottom:1.5rem">Related Stories</h2>
            <div class="related-grid stagger" id="relatedGrid">
              <div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>
            </div>

            <div class="comments-section" id="commentsSection">
              <h2 style="margin-bottom:1.5rem" id="commentsHeading">Comments</h2>
              <form class="comment-form glass" style="padding:1.5rem" id="commentForm">
                <div class="comment-form-row">
                  <div class="form-group" style="margin:0">
                    <label for="commentName">Your name</label>
                    <input type="text" id="commentName" placeholder="Jane Doe" required minlength="2">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label for="commentEmail">Email (not published)</label>
                    <input type="email" id="commentEmail" placeholder="jane@example.com">
                  </div>
                </div>
                <div class="form-group" style="margin:0">
                  <label for="commentMessage">Comment</label>
                  <textarea id="commentMessage" rows="3" placeholder="Share your thoughts..." required minlength="2"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="align-self:flex-end">Post Comment</button>
              </form>
              <div class="comment-list" id="commentList" style="margin-top:2rem"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  loadAuthorBox(post);
  OV.wireBookmarkButtons(document);
  wireLikeButtons(post);
  document.getElementById('shareBtn').addEventListener('click', () => OV.shareArticle(post.title, url));
  document.getElementById('shareBtn2').addEventListener('click', () => OV.shareArticle(post.title, url));
  document.getElementById('copyBtn').addEventListener('click', (e) => {
    OV.copyLink(url);
    e.currentTarget.classList.add('copy-check-anim');
    setTimeout(() => e.currentTarget.classList.remove('copy-check-anim'), 400);
  });
}

const LIKES_KEY = 'openverse_liked_posts';
function getLikedPosts() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY)) || [];
  } catch {
    return [];
  }
}
function setLikedPosts(list) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(list));
}

function wireLikeButtons(post) {
  const likeBtn = document.getElementById('likeBtn');
  const likeBtn2 = document.getElementById('likeBtn2');
  const countEl = document.getElementById('likeCount');

  let liked = getLikedPosts().includes(post.id);
  let likes = post.likes;
  let busy = false;

  function paint() {
    likeBtn.classList.toggle('active', liked);
    likeBtn.setAttribute('aria-pressed', String(liked));
    likeBtn2.classList.toggle('active', liked);
    likeBtn2.setAttribute('aria-pressed', String(liked));
    likeBtn2.style.color = liked ? '#f472b6' : '';
    countEl.textContent = String(likes);
  }
  paint();

  async function toggleLike() {
    // Prevent this browser from repeatedly incrementing the count by
    // spam-clicking — each visitor can only like a story once (tracked in
    // localStorage), and clicking again un-likes it.
    if (busy) return;
    busy = true;
    const wasLiked = liked;
    const endpoint = wasLiked ? 'unlike' : 'like';

    // optimistic UI update
    liked = !wasLiked;
    likes += liked ? 1 : -1;
    likeBtn.classList.add('bookmark-pop');
    paint();

    const res = await OV.api(`/posts/${post.id}/${endpoint}`, { method: 'POST' });
    busy = false;
    setTimeout(() => likeBtn.classList.remove('bookmark-pop'), 400);

    if (!res.success) {
      // roll back on failure
      liked = wasLiked;
      likes += liked ? 1 : -1;
      paint();
      OV.toast(res.message || 'Could not update like', 'error');
      return;
    }

    likes = res.data.likes;
    paint();
    const stored = getLikedPosts();
    if (liked && !stored.includes(post.id)) setLikedPosts([...stored, post.id]);
    if (!liked) setLikedPosts(stored.filter((id) => id !== post.id));
    OV.toast(liked ? 'You liked this story' : 'Like removed', 'success', 1800);
  }

  likeBtn.addEventListener('click', toggleLike);
  likeBtn2.addEventListener('click', toggleLike);
}

async function loadAuthorBox(post) {
  const box = document.getElementById('authorBox');
  if (!post.authorId) {
    box.style.display = 'none';
    return;
  }
  const res = await OV.api(`/authors/${post.authorId}`);
  if (!res.success) return;
  const author = res.data;
  box.innerHTML = `
    <img class="avatar" src="${author.avatar}" alt="${OV.escapeHtml(author.name)}">
    <div>
      <h4>${OV.escapeHtml(author.name)}</h4>
      <p>${OV.escapeHtml(author.bio)}</p>
      <a href="/author?id=${author.id}" class="btn btn-ghost btn-sm">View Profile</a>
    </div>`;
}

async function loadRelated(postId) {
  const grid = document.getElementById('relatedGrid');
  const res = await OV.api(`/posts/${postId}/related`);
  if (!res.success || !res.data.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;color:var(--text-faint)">No related stories yet.</p>`;
    return;
  }
  grid.innerHTML = res.data.map(OV.postCardHTML).join('');
  OV.wireBookmarkButtons(grid);
  OV.initScrollReveal();
}

async function loadComments(postId) {
  const list = document.getElementById('commentList');
  const res = await OV.api(`/posts/${postId}/comments`);
  if (!res.success) {
    list.innerHTML = `<p style="color:var(--text-faint)">Could not load comments.</p>`;
    return;
  }
  document.getElementById('commentsHeading').textContent = `Comments (${res.count})`;
  if (!res.data.length) {
    list.innerHTML = `<p style="color:var(--text-faint)">Be the first to share your thoughts on this story.</p>`;
    return;
  }
  list.innerHTML = res.data
    .map(
      (c) => `
      <div class="comment-item">
        <div class="comment-item-head">
          <span class="name">${OV.escapeHtml(c.name)}</span>
          <span class="time">${OV.timeAgo(c.createdAt)}</span>
        </div>
        <p>${OV.escapeHtml(c.message)}</p>
      </div>`
    )
    .join('');
}

function wireCommentForm(postId) {
  const form = document.getElementById('commentForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('commentName').value.trim();
    const message = document.getElementById('commentMessage').value.trim();
    if (name.length < 2 || message.length < 2) {
      OV.toast('Please fill in your name and comment.', 'error');
      return;
    }
    const btn = form.querySelector('button');
    const original = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
    const res = await OV.api('/comments', { method: 'POST', body: JSON.stringify({ postId, name, message }) });
    btn.textContent = original;
    btn.disabled = false;
    if (res.success) {
      OV.toast('Comment posted', 'success');
      form.reset();
      loadComments(postId);
    } else {
      OV.toast(res.message || 'Could not post comment', 'error');
    }
  });
}
