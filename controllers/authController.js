const crypto = require('crypto');
const { readJSON, writeJSON } = require('../utils/fileStorage');

const USERS_FILE = 'users.json';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password hashing uses Node's built-in crypto.scrypt (no extra dependency
 * needed for a demo project). Each password gets its own random salt; the
 * plaintext password is never stored or logged, and API responses never
 * include passwordHash/passwordSalt (see sanitizeUser below).
 */
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sanitizeUser(user) {
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, passwordSalt, ...safe } = user;
  return safe;
}

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter your name' });
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password should be at least 6 characters' });
    }

    const users = await readJSON(USERS_FILE, []);
    const normalizedEmail = String(email).trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const { salt, hash } = hashPassword(String(password));
    const newUser = {
      id: `user-${Date.now()}`,
      authorId: null, // generic demo signups aren't tied to an author profile
      name: String(name).trim(),
      email: String(email).trim(),
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeJSON(USERS_FILE, users);

    res.status(201).json({ success: true, message: 'Account created successfully', data: sanitizeUser(newUser) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const users = await readJSON(USERS_FILE, []);
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user || !verifyPassword(String(password), user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({ success: true, message: 'Signed in successfully', data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};
