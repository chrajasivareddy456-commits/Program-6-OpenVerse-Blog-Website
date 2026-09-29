const { readJSON, writeJSON } = require('../utils/fileStorage');

const POSTS_FILE = 'posts.json';
const CATEGORIES_FILE = 'categories.json';
const AUTHORS_FILE = 'authors.json';
const COMMENTS_FILE = 'comments.json';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function estimateReadingTime(content) {
  const text = Array.isArray(content) ? content.join(' ') : String(content || '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function nextId(posts) {
  let max = 0;
  posts.forEach((p) => {
    const n = parseInt(String(p.id).replace('post-', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return `post-${String(max + 1).padStart(3, '0')}`;
}

// GET /api/posts  (supports ?category=, ?trending=, ?featured=, ?sort=, ?limit=, ?page=)
exports.getAllPosts = async (req, res, next) => {
  try {
    let posts = await readJSON(POSTS_FILE, []);
    const { category, trending, featured, author, authorId, sort, limit, page, tag } = req.query;
    // `authorId` is accepted as a clearer alias for `author` (e.g. GET /api/posts?authorId=auth-11)
    const authorFilter = authorId || author;

    if (category && category !== 'all') {
      posts = posts.filter((p) => p.categorySlug === category || slugify(p.category) === category);
    }
    if (tag) {
      posts = posts.filter((p) => (p.tags || []).some((t) => slugify(t) === slugify(tag)));
    }
    if (trending === 'true') posts = posts.filter((p) => p.trending);
    if (featured === 'true') posts = posts.filter((p) => p.featured);
    if (authorFilter) posts = posts.filter((p) => p.authorId === authorFilter || p.authorSlug === authorFilter);

    switch (sort) {
      case 'oldest':
        posts = posts.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'popular':
        posts = posts.slice().sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'most-read':
        posts = posts.slice().sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'latest':
      default:
        posts = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }

    const total = posts.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || total || 12);
    const start = (pageNum - 1) * limitNum;
    const paginated = posts.slice(start, start + limitNum);

    res.json({
      success: true,
      count: paginated.length,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      data: paginated
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/search?q=keyword
exports.searchPosts = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const posts = await readJSON(POSTS_FILE, []);
    if (!q) {
      return res.json({ success: true, query: q, count: 0, data: [] });
    }
    const results = posts.filter((p) => {
      const haystack = [
        p.title,
        p.excerpt,
        Array.isArray(p.content) ? p.content.join(' ') : p.content,
        p.author,
        p.category,
        (p.tags || []).join(' ')
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    res.json({ success: true, query: q, count: results.length, data: results });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id  (also matches by slug for pretty URLs)
exports.getPostById = async (req, res, next) => {
  try {
    const posts = await readJSON(POSTS_FILE, []);
    const post = posts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    // increment views (best-effort, not critical if it fails)
    post.views = (post.views || 0) + 1;
    await writeJSON(POSTS_FILE, posts);
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts
exports.createPost = async (req, res, next) => {
  try {
    const body = req.body || {};
    const required = ['title', 'category', 'author', 'content'];
    const missing = required.filter((f) => !body[f] || (Array.isArray(body[f]) && body[f].length === 0));
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    const posts = await readJSON(POSTS_FILE, []);
    const categories = await readJSON(CATEGORIES_FILE, []);
    const authors = await readJSON(AUTHORS_FILE, []);

    const categoryMatch = categories.find(
      (c) => c.slug === slugify(body.category) || c.name.toLowerCase() === String(body.category).toLowerCase()
    );
    const authorMatch = authors.find(
      (a) => a.name.toLowerCase() === String(body.author).toLowerCase() || a.slug === slugify(body.author)
    );

    const content = Array.isArray(body.content)
      ? body.content
      : String(body.content).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

    const id = await nextId(posts);
    const now = new Date().toISOString().slice(0, 10);

    const newPost = {
      id,
      slug: `${slugify(body.title)}-${id.split('-')[1]}`,
      title: body.title,
      subtitle: body.subtitle || '',
      excerpt: body.excerpt || (content[0] ? content[0].slice(0, 160) : ''),
      content,
      category: categoryMatch ? categoryMatch.name : body.category,
      categorySlug: categoryMatch ? categoryMatch.slug : slugify(body.category),
      author: authorMatch ? authorMatch.name : body.author,
      authorId: authorMatch ? authorMatch.id : null,
      authorSlug: authorMatch ? authorMatch.slug : slugify(body.author),
      image: body.image || '/assets/images/ui/fallback-cover.svg',
      date: now,
      updatedDate: now,
      readingTime: body.readingTime ? parseInt(body.readingTime, 10) : estimateReadingTime(content),
      views: 0,
      likes: 0,
      tags: Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      featured: Boolean(body.featured),
      trending: Boolean(body.trending),
      status: body.status === 'draft' ? 'draft' : 'published'
    };

    posts.unshift(newPost);
    await writeJSON(POSTS_FILE, posts);

    if (categoryMatch) {
      categoryMatch.postCount = (categoryMatch.postCount || 0) + 1;
      await writeJSON(CATEGORIES_FILE, categories);
    }
    if (authorMatch) {
      authorMatch.articleCount = (authorMatch.articleCount || 0) + 1;
      await writeJSON(AUTHORS_FILE, authors);
    }

    res.status(201).json({ success: true, message: 'Post created successfully', data: newPost });
  } catch (err) {
    next(err);
  }
};

// PUT /api/posts/:id
exports.updatePost = async (req, res, next) => {
  try {
    const posts = await readJSON(POSTS_FILE, []);
    const idx = posts.findIndex((p) => p.id === req.params.id || p.slug === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const body = req.body || {};
    const categories = await readJSON(CATEGORIES_FILE, []);
    const authors = await readJSON(AUTHORS_FILE, []);
    const existing = posts[idx];

    const content = body.content
      ? Array.isArray(body.content)
        ? body.content
        : String(body.content).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
      : existing.content;

    const categoryMatch = body.category
      ? categories.find(
          (c) => c.slug === slugify(body.category) || c.name.toLowerCase() === String(body.category).toLowerCase()
        )
      : null;
    const authorMatch = body.author
      ? authors.find(
          (a) => a.name.toLowerCase() === String(body.author).toLowerCase() || a.slug === slugify(body.author)
        )
      : null;

    const updated = {
      ...existing,
      title: body.title ?? existing.title,
      subtitle: body.subtitle ?? existing.subtitle,
      excerpt: body.excerpt ?? existing.excerpt,
      content,
      category: categoryMatch ? categoryMatch.name : body.category ?? existing.category,
      categorySlug: categoryMatch ? categoryMatch.slug : body.category ? slugify(body.category) : existing.categorySlug,
      author: authorMatch ? authorMatch.name : body.author ?? existing.author,
      authorId: authorMatch ? authorMatch.id : existing.authorId,
      authorSlug: authorMatch ? authorMatch.slug : body.author ? slugify(body.author) : existing.authorSlug,
      image: body.image ?? existing.image,
      readingTime: body.readingTime ? parseInt(body.readingTime, 10) : estimateReadingTime(content),
      tags: body.tags
        ? Array.isArray(body.tags)
          ? body.tags
          : String(body.tags).split(',').map((t) => t.trim()).filter(Boolean)
        : existing.tags,
      featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
      trending: body.trending !== undefined ? Boolean(body.trending) : existing.trending,
      status: body.status ?? existing.status ?? 'published',
      updatedDate: new Date().toISOString().slice(0, 10)
    };

    posts[idx] = updated;
    await writeJSON(POSTS_FILE, posts);
    res.json({ success: true, message: 'Post updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const posts = await readJSON(POSTS_FILE, []);
    const idx = posts.findIndex((p) => p.id === req.params.id || p.slug === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const [removed] = posts.splice(idx, 1);
    await writeJSON(POSTS_FILE, posts);

    const categories = await readJSON(CATEGORIES_FILE, []);
    const cat = categories.find((c) => c.slug === removed.categorySlug);
    if (cat && cat.postCount > 0) {
      cat.postCount -= 1;
      await writeJSON(CATEGORIES_FILE, categories);
    }
    const authors = await readJSON(AUTHORS_FILE, []);
    const author = authors.find((a) => a.id === removed.authorId);
    if (author && author.articleCount > 0) {
      author.articleCount -= 1;
      await writeJSON(AUTHORS_FILE, authors);
    }

    // clean up comments belonging to the deleted post
    const comments = await readJSON(COMMENTS_FILE, []);
    const remainingComments = comments.filter((c) => c.postId !== removed.id);
    if (remainingComments.length !== comments.length) {
      await writeJSON(COMMENTS_FILE, remainingComments);
    }

    res.json({ success: true, message: 'Post deleted successfully', data: removed });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id/related
exports.getRelatedPosts = async (req, res, next) => {
  try {
    const posts = await readJSON(POSTS_FILE, []);
    const post = posts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const related = posts
      .filter((p) => p.id !== post.id && (p.categorySlug === post.categorySlug || p.tags.some((t) => post.tags.includes(t))))
      .slice(0, 4);
    res.json({ success: true, data: related });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:id/like
exports.likePost = async (req, res, next) => {
  try {
    const posts = await readJSON(POSTS_FILE, []);
    const post = posts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.likes = (post.likes || 0) + 1;
    await writeJSON(POSTS_FILE, posts);
    res.json({ success: true, message: 'Post liked', data: { id: post.id, likes: post.likes } });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:id/unlike
exports.unlikePost = async (req, res, next) => {
  try {
    const posts = await readJSON(POSTS_FILE, []);
    const post = posts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.likes = Math.max(0, (post.likes || 0) - 1);
    await writeJSON(POSTS_FILE, posts);
    res.json({ success: true, message: 'Like removed', data: { id: post.id, likes: post.likes } });
  } catch (err) {
    next(err);
  }
};

exports.slugify = slugify;
