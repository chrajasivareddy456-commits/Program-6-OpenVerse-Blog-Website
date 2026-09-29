const { readJSON, writeJSON } = require('../utils/fileStorage');

const COMMENTS_FILE = 'comments.json';
const POSTS_FILE = 'posts.json';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// GET /api/posts/:id/comments
exports.getCommentsForPost = async (req, res, next) => {
  try {
    const posts = await readJSON(POSTS_FILE, []);
    const post = posts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comments = await readJSON(COMMENTS_FILE, []);
    const postComments = comments
      .filter((c) => c.postId === post.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: postComments.length, data: postComments });
  } catch (err) {
    next(err);
  }
};

// POST /api/comments
exports.createComment = async (req, res, next) => {
  try {
    const { postId, name, message } = req.body || {};
    if (!postId || !name || !message) {
      return res.status(400).json({ success: false, message: 'postId, name and message are required' });
    }
    if (String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name is too short' });
    }
    if (String(message).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Comment message is too short' });
    }

    const posts = await readJSON(POSTS_FILE, []);
    const post = posts.find((p) => p.id === postId || p.slug === postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comments = await readJSON(COMMENTS_FILE, []);
    const newComment = {
      id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      postId: post.id,
      name: escapeHtml(String(name).trim()).slice(0, 80),
      message: escapeHtml(String(message).trim()).slice(0, 1000),
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    await writeJSON(COMMENTS_FILE, comments);
    res.status(201).json({ success: true, message: 'Comment posted', data: newComment });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    const comments = await readJSON(COMMENTS_FILE, []);
    const idx = comments.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Comment not found' });
    const [removed] = comments.splice(idx, 1);
    await writeJSON(COMMENTS_FILE, comments);
    res.json({ success: true, message: 'Comment deleted', data: removed });
  } catch (err) {
    next(err);
  }
};
