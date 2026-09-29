const express = require('express');
const path = require('path');
const helmet = require('helmet');

const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authorRoutes = require('./routes/authorRoutes');
const commentRoutes = require('./routes/commentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Security & core middleware ----------
app.use(
  helmet({
    contentSecurityPolicy: false, // keep simple for a student project serving inline scripts/fonts from CDNs
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic request logging (helpful when learning what routes are being hit)
app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.originalUrl}`);
  next();
});

// ---------- Static frontend ----------
app.use(express.static(path.join(__dirname, 'public')));

// ---------- REST API ----------
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', contactRoutes); // exposes /api/contact and /api/newsletter
app.use('/api/auth', authRoutes);

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OpenVerse API is running', timestamp: new Date().toISOString() });
});

// ---------- Clean URLs for static pages ----------
const pageRoutes = [
  'explore', 'categories', 'category', 'article', 'write',
  'authors', 'author', 'saved', 'about', 'contact', 'signin', 'signup'
];
pageRoutes.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
  });
});

// ---------- 404 handler for unknown API routes ----------
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found` });
});

// ---------- Fallback: unknown non-API routes go to the 404 page (if present) or home ----------
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------- Centralized error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Something went wrong on our end. Please try again.' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n  OpenVerse server running at http://localhost:${PORT}\n`);
});

module.exports = app;
