const { readJSON } = require('../utils/fileStorage');

const AUTHORS_FILE = 'authors.json';
const POSTS_FILE = 'posts.json';

exports.getAllAuthors = async (req, res, next) => {
  try {
    const authors = await readJSON(AUTHORS_FILE, []);
    res.json({ success: true, count: authors.length, data: authors });
  } catch (err) {
    next(err);
  }
};

exports.getAuthorById = async (req, res, next) => {
  try {
    const authors = await readJSON(AUTHORS_FILE, []);
    const author = authors.find((a) => a.id === req.params.id || a.slug === req.params.id);
    if (!author) {
      return res.status(404).json({ success: false, message: 'Author not found' });
    }
    const posts = await readJSON(POSTS_FILE, []);
    const articles = posts.filter((p) => p.authorId === author.id);
    res.json({ success: true, data: { ...author, posts: articles } });
  } catch (err) {
    next(err);
  }
};
