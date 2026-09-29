const { readJSON } = require('../utils/fileStorage');

const CATEGORIES_FILE = 'categories.json';
const POSTS_FILE = 'posts.json';

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await readJSON(CATEGORIES_FILE, []);
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const categories = await readJSON(CATEGORIES_FILE, []);
    const category = categories.find((c) => c.slug === req.params.slug);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const posts = await readJSON(POSTS_FILE, []);
    const articles = posts.filter((p) => p.categorySlug === category.slug);
    res.json({ success: true, data: { ...category, posts: articles } });
  } catch (err) {
    next(err);
  }
};
