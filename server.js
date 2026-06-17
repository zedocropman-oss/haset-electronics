// server.js — HASET ELECTRONICS backend
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const crypto    = require('crypto');

const { getDb } = require('./db/database');
const { sendRegistrationNotification, sendCustomerConfirmation } = require('./utils/mailer');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate-limit the registration endpoint (10 submissions per 15 min per IP)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, errors: ['Too many requests. Please try again later.'] },
});

// ── Admin auth (simple token-based) ─────────────────────────────────────────
const ADMIN_TOKENS = new Set();

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const expected = process.env.ADMIN_PASSWORD || 'haset2026';
  if (password === expected) {
    const token = crypto.randomBytes(24).toString('hex');
    ADMIN_TOKENS.add(token);
    setTimeout(() => ADMIN_TOKENS.delete(token), 8 * 60 * 60 * 1000); // 8h expiry
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: 'Invalid password.' });
});

function requireAdmin(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (ADMIN_TOKENS.has(token)) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized.' });
}

// ── Validation helpers ───────────────────────────────────────────────────────
const VALID_SERVICES = [
  'Photocopying', 'Printing', 'Fax',
  'Passport applications', 'Fast photo printing', 'Computer training',
];

// ── POST /api/register — public: customer submits form ──────────────────────
app.post('/api/register', registerLimiter, async (req, res) => {
  try {
    const { name, phone, email, city, services, notes } = req.body;

    const errors = [];
    if (!name  || name.trim().length < 2)  errors.push('Full name is required.');
    if (!phone || phone.trim().length < 7)  errors.push('A valid phone number is required.');
    if (!Array.isArray(services) || !services.length)
      errors.push('At least one service must be selected.');
    const invalid = (services || []).filter(s => !VALID_SERVICES.includes(s));
    if (invalid.length) errors.push(`Unknown service(s): ${invalid.join(', ')}`);

    if (errors.length) return res.status(400).json({ success: false, errors });

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO registrations (name, phone, email, city, services, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      phone.trim(),
      (email || '').trim(),
      (city  || '').trim(),
      services.join(', '),
      (notes || '').trim(),
    );

    const reg = {
      id: result.lastInsertRowid,
      name: name.trim(), phone: phone.trim(),
      email: (email||'').trim(), city: (city||'').trim(),
      services: services.join(', '), notes: (notes||'').trim(),
    };

    // Send emails (non-blocking — don't fail the request if email fails)
    sendRegistrationNotification(reg).catch(e => console.error('[mailer]', e.message));
    sendCustomerConfirmation(reg).catch(e => console.error('[mailer]', e.message));

    return res.status(201).json({
      success: true,
      message: 'Registration received. We will contact you shortly!',
      id: reg.id,
    });
  } catch (err) {
    console.error('[POST /api/register]', err);
    return res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
  }
});

// ── GET /api/register — admin: list all registrations ───────────────────────
app.get('/api/register', requireAdmin, (req, res) => {
  try {
    const rows = getDb().prepare(
      'SELECT * FROM registrations ORDER BY created_at DESC LIMIT 500'
    ).all();
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('[GET /api/register]', err);
    return res.status(500).json({ success: false, errors: ['Server error.'] });
  }
});

// ── PATCH /api/register/:id/status — admin: change status ───────────────────
app.patch('/api/register/:id/status', requireAdmin, (req, res) => {
  const allowed = ['new', 'contacted', 'done'];
  const { status } = req.body;
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, errors: [`Status must be: ${allowed.join(', ')}`] });
  try {
    getDb().prepare('UPDATE registrations SET status = ? WHERE id = ?').run(status, req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/register/:id/status]', err);
    return res.status(500).json({ success: false, errors: ['Server error.'] });
  }
});

// ── Serve static frontend + admin panel ─────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │   HASET ELECTRONICS — Backend running            │
  │   Website : http://localhost:${PORT}                  │
  │   Admin   : http://localhost:${PORT}/admin.html        │
  │   API     : POST http://localhost:${PORT}/api/register │
  └──────────────────────────────────────────────────┘
  `);
});
