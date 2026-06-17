# HASET ELECTRONICS — Backend

A Node.js + Express backend for the HASET ELECTRONICS website.

## What it does

| Feature | Details |
|---|---|
| 📋 Registration API | Accepts form submissions and stores them in SQLite |
| 📧 Email notifications | Sends you an email on every new registration (via Gmail) |
| 📬 Customer confirmation | Sends a confirmation email to the customer (if they gave one) |
| 🔒 Admin panel | Password-protected page at `/admin.html` to view & manage all registrations |
| 🛡 Rate limiting | Max 10 form submissions per IP per 15 minutes |

---

## Quick start (5 minutes)

### 1. Install Node.js
Download from https://nodejs.org (v18 or newer recommended).

### 2. Install dependencies
```bash
cd haset-backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Then open `.env` and fill in:

```
SMTP_USER=zedocropman@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    ← Gmail App Password (see below)
ADMIN_PASSWORD=choose_a_strong_password
```

#### How to get a Gmail App Password
1. Go to your Google Account → Security
2. Enable **2-Step Verification** if not already on
3. Search for **App passwords**
4. Create one for "Mail" → "Other (HASET backend)"
5. Copy the 16-character password into `SMTP_PASS`

### 4. Start the server
```bash
npm start
```

The server starts on **http://localhost:3000**

---

## Pages & endpoints

| URL | Description |
|---|---|
| `http://localhost:3000/` | Customer-facing website |
| `http://localhost:3000/admin.html` | Admin panel (password protected) |
| `POST /api/register` | Submit registration (used by the form) |
| `GET /api/register` | List registrations (admin only) |
| `PATCH /api/register/:id/status` | Update status (admin only) |
| `POST /api/admin/login` | Get admin token |

---

## Deploying to the internet

### Option A — Railway (free, easiest)
1. Create account at https://railway.app
2. New project → "Deploy from GitHub repo"
3. Add environment variables in the Railway dashboard
4. Done — Railway gives you a public URL

### Option B — Render
1. Create account at https://render.com
2. New Web Service → connect your GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables

### Option C — VPS (DigitalOcean, Hetzner, etc.)
```bash
# On your server:
git clone <your-repo>
cd haset-backend
npm install
cp .env.example .env   # edit with your values
npm install -g pm2
pm2 start server.js --name haset
pm2 save
```

---

## Database

Registrations are saved in `haset_registrations.db` (SQLite file).
No separate database server needed — it just works.

To back it up, simply copy the `.db` file.

---

## File structure

```
haset-backend/
├── server.js              ← main server (start here)
├── package.json
├── .env.example           ← copy to .env and fill in
├── db/
│   └── database.js        ← SQLite setup
├── utils/
│   └── mailer.js          ← email sending
└── public/
    ├── index.html          ← customer website
    └── admin.html          ← admin panel
```
