const { readJSON, writeJSON } = require('../utils/fileStorage');

const CONTACTS_FILE = 'contacts.json';
const SUBSCRIBERS_FILE = 'subscribers.json';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};
    const errors = {};
    if (!name || String(name).trim().length < 2) errors.name = 'Please enter your name';
    if (!email || !EMAIL_RE.test(String(email).trim())) errors.email = 'Please enter a valid email';
    if (!subject || String(subject).trim().length < 2) errors.subject = 'Please enter a subject';
    if (!message || String(message).trim().length < 10) errors.message = 'Message should be at least 10 characters';

    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Please fix the errors below', errors });
    }

    const contacts = await readJSON(CONTACTS_FILE, []);
    const entry = {
      id: `contact-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString()
    };
    contacts.push(entry);
    await writeJSON(CONTACTS_FILE, contacts);

    res.status(201).json({ success: true, message: 'Your message has been sent. We will get back to you soon.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/newsletter
exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    const subscribers = await readJSON(SUBSCRIBERS_FILE, []);
    const normalized = String(email).trim().toLowerCase();
    if (subscribers.some((s) => s.email.toLowerCase() === normalized)) {
      return res.status(200).json({ success: true, message: "You're already subscribed. Thanks for being with us!" });
    }
    subscribers.push({ email: String(email).trim(), subscribedAt: new Date().toISOString() });
    await writeJSON(SUBSCRIBERS_FILE, subscribers);
    res.status(201).json({ success: true, message: 'Subscribed! Welcome to the OpenVerse newsletter.' });
  } catch (err) {
    next(err);
  }
};
