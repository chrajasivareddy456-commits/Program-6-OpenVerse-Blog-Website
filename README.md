# OpenVerse — A Blog Management Application

> **Where Every Voice Has a Verse.**

OpenVerse is a full-stack blog management platform built to demonstrate **Node.js** and **Express.js** fundamentals with a premium, dark, futuristic UI. It's a complete publishing experience: discover stories, read them, write your own, bookmark favorites, comment, and manage content through a full REST API backed by JSON files — no database required.

---

## ✨ Features

- **My Profile / My Stories** — OpenVerse is set up as a single-owner portfolio: **Ch Raja Siva Reddy** (`auth-11`) is the site's fixed author identity. The Write page never asks you to pick an author — every story you publish is automatically attributed to you. Your author profile (`/author?id=auth-11`, linked from the navbar as **My Profile**) shows a **My Stories** management view with Read / Edit / Delete on each of your own stories, while every other author's profile stays a normal read-only showcase. Sample authors keep their 25 demo articles untouched.
- **Discover & Read** — Browse trending, latest, and featured stories with a distraction-free reading experience.
- **Search & Filter** — Full-text search across titles, excerpts, content, authors, categories and tags. Filter by category, trending, or sort by latest/oldest/popular/most-read.
- **Categories & Authors** — Dedicated pages for all 14 categories and 10 sample authors, each with their own article feed and locally generated cover art / avatars.
- **Write / Edit / Delete** — Full CRUD article management with client-side validation, auto-calculated reading time, and confirmation before deletion.
- **Likes** — A real `POST /api/posts/:id/like` / `unlike` API persists like counts to `posts.json`, with `localStorage` preventing the same browser from repeatedly inflating the count.
- **Bookmarks** — Save stories to read later, stored in `localStorage` — no login required.
- **Comments** — Leave a comment on any story; comments persist to a JSON file.
- **Newsletter & Contact** — Working newsletter subscription and contact form, both persisted to JSON.
- **Demo Authentication** — Real sign up / sign in backed by `POST /api/auth/*` and `data/users.json`, with salted + hashed passwords (never returned in API responses). Includes a seeded demo account for Ch Raja Siva Reddy — see [Demo Account](#-demo-account) below. Still not production-grade auth (no sessions/JWT) — see note below.
- **Fully Responsive** — Custom layouts for desktop, tablet, and mobile, including a slide-in mobile navigation menu.
- **Animated & Accessible** — Scroll reveals, animated counters, glowing hover states, toast notifications, and full `prefers-reduced-motion` support.
- **100% Local Images with Graceful Fallback** — Every cover image and avatar is a locally generated SVG (see [Images](#-images) below); any image that still fails to load anywhere on the site is swapped for a themed placeholder instead of a broken-image icon.

---

## 👑 My Profile & My Stories (Ownership Model)

OpenVerse ships configured as **one person's** publishing site rather than a generic multi-user demo:

- `data/authors.json` includes an 11th author, **Ch Raja Siva Reddy** (`auth-11`) — the site owner. The other 10 authors are fictional sample writers whose 25 seeded articles exist purely to populate the demo (Explore, Categories, trending, etc.).
- `public/js/main.js` defines a single `OV.CURRENT_USER` constant (`{ id: 'auth-11', slug: 'ch-raja-siva-reddy', name: 'Ch Raja Siva Reddy' }`) that both the Write page and the navbar's **My Profile** link use.
- **Write page:** there is no author dropdown. Creating a new story always attributes it to `OV.CURRENT_USER`; editing an existing story always preserves and displays that story's real, original author (read-only) so a story can never be accidentally reassigned to someone else.
- **My Profile** (`/author?id=auth-11`): the same `author.html`/`author.js` used for every author profile detects when the profile belongs to `OV.CURRENT_USER` and switches into a **My Stories** management view — each of your stories gets **Read / Edit / Delete** buttons, an empty state ("You haven't published any stories yet." + **Write Your First Story**), and a live story count. Visiting any other author's profile shows the normal read-only story grid with no management controls.
- **Saved vs. My Stories:** these are intentionally separate concepts. **Saved** (`/saved`) is your personal bookmark list (any author's stories, stored in `localStorage`). **My Stories** is what you've actually published as `auth-11` (stored server-side in `posts.json`). The navbar's **My Profile** button was previously pointing at Saved, which conflated the two — it now correctly opens your author profile, with Saved Stories reachable from the mobile menu and footer.
- Deleting a story from My Stories calls the same `DELETE /api/posts/:id` used everywhere else in the app; the author's story count and the post grid both update immediately without a full page reload.

---

## 🛠 Technology Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Backend    | Node.js, Express.js                  |
| Data       | JSON files via `fs.promises`         |
| Security   | Helmet, input validation, HTML escaping |

No React, no Vue, no Angular, no MongoDB/MySQL/PostgreSQL/Firebase — by design.

---

## 📁 Project Structure

```
OpenVerse/
├── public/                  # Static frontend served by Express
│   ├── index.html, explore.html, categories.html, category.html,
│   │   article.html, write.html, authors.html, author.html,
│   │   saved.html, about.html, contact.html, signin.html, signup.html
│   ├── css/
│   │   ├── style.css        # Design system + components
│   │   ├── animations.css   # Keyframes + prefers-reduced-motion
│   │   └── responsive.css   # Breakpoints
│   ├── js/
│   │   ├── main.js          # Shared navbar/footer/toasts/bookmarks/auth helpers
│   │   ├── home.js, explore.js, categories.js, category.js,
│   │   │   article.js, write.js, authors.js, author.js,
│   │   │   saved.js, contact.js, auth.js
│   └── assets/images/       # hero / articles / authors / categories / ui (local SVGs)
├── data/                     # JSON "database"
│   ├── posts.json, authors.json, categories.json,
│   │   comments.json, contacts.json, subscribers.json, users.json
├── routes/                   # Express routers
├── controllers/               # Route handler logic
├── utils/fileStorage.js      # Safe JSON read/write (atomic writes)
├── scripts/
│   ├── generate_data.py      # One-time seed data generator (reference only)
│   └── generate_images.py    # Generates local SVG images + wires them into data/*.json
├── server.js                  # App entry point
├── package.json
└── README.md
```

---

## 🔌 How It Works

- **Express** serves the static frontend from `public/` and exposes a REST API under `/api`.
- The frontend never touches the file system directly — every page uses `fetch()` to call the API and renders the JSON response into the DOM.
- **Data persistence** uses `fs.promises` with atomic writes (write to a temp file, then rename) so a crash mid-write can't corrupt a data file.
- **Bookmarks** and the **demo session** live entirely in the browser's `localStorage`, since there's no database or real user accounts.
- **IDs** are generated sequentially for posts (`post-001`, `post-002`, ...) and comments use a timestamp-based ID.

---

## 📡 API Documentation

All responses follow `{ success: boolean, message?, data?, ... }`.

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List posts. Query: `category`, `trending`, `featured`, `author` or `authorId`, `tag`, `sort` (`latest`\|`oldest`\|`popular`\|`most-read`), `page`, `limit` |
| GET | `/api/posts/search?q=keyword` | Full-text search |
| GET | `/api/posts/:id` | Get a single post by id or slug (increments views) |
| GET | `/api/posts/:id/related` | Related posts (same category/tags) |
| GET | `/api/posts/:id/comments` | Comments for a post |
| POST | `/api/posts` | Create a post. Required: `title`, `category`, `author`, `content` |
| PUT | `/api/posts/:id` | Update a post |
| DELETE | `/api/posts/:id` | Delete a post (also removes its comments) |
| POST | `/api/posts/:id/like` | Increment a post's like count by 1 |
| POST | `/api/posts/:id/unlike` | Decrement a post's like count by 1 (floor 0) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:slug` | Category detail + its posts |

### Authors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/authors` | List all authors |
| GET | `/api/authors/:id` | Author detail + their posts |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/comments` | Create a comment. Body: `postId`, `name`, `message` |
| DELETE | `/api/comments/:id` | Delete a comment |

### Contact & Newsletter
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form. Body: `name`, `email`, `subject`, `message` |
| POST | `/api/newsletter` | Subscribe. Body: `email` |

### Auth (demo)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create a demo account. Body: `name`, `email`, `password` (min 6 chars). Password is hashed before storage. |
| POST | `/api/auth/login` | Log in. Body: `email`, `password`. Returns the user without password fields. |

### Misc
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

All errors return a consistent shape, e.g. `{ "success": false, "message": "Post not found" }`, with correct HTTP status codes (400, 404, 500).

> **Note on likes:** liking/unliking has no user accounts to key off of, so double-counting is prevented client-side — `public/js/article.js` keeps a list of liked post IDs in `localStorage` and only allows one `like` per browser per post (clicking again calls `/unlike`). This is a pragmatic choice for a database-free demo, not a substitute for server-side rate limiting in a real product.

---

## 🖼 Images

Every image in OpenVerse — hero background, article covers, category covers, and author avatars — is a **locally generated SVG file** under `public/assets/images/`. There is no dependency on an external photo CDN.

| Folder | Contents |
|--------|----------|
| `hero/` | Starfield/glow background layer behind the 3D book hero |
| `articles/` | One unique, category-colored cover per article (`post-001.svg`, ...) |
| `categories/` | One branded cover per category, used on category cards |
| `authors/` | One initials-based avatar per author |
| `ui/` | `fallback-cover.svg` and `fallback-avatar.svg` — shown automatically if any image fails to load |

These are generated by `scripts/generate_images.py`, which also writes the resulting paths into `data/posts.json` (`image`) and `data/authors.json` (`avatar`). Regenerate everything with:

```bash
python3 scripts/generate_data.py
python3 scripts/generate_images.py
```

**Fallback handling:** `public/js/main.js` attaches one delegated `error` listener for every `<img>` on the site. If an image ever fails to load — a corrupted file, a user-submitted cover URL on the Write page, anything — it's swapped for a themed OpenVerse placeholder instead of the browser's broken-image icon, so the layout never breaks.

Why SVG instead of downloaded photography: this project is built and tested in a sandboxed environment without general internet access, so real licensed photos can't be fetched. Hand-generated SVGs are a legitimate local-asset strategy here — real files that ship with the repo, render crisply at any size, and match the OpenVerse palette exactly, rather than placeholder URLs that could go stale or 404. Swapping in real photography later just means replacing files in `public/assets/images/` (or pointing the `image`/`avatar` fields at your own URLs) — no frontend code changes required.

---

## 💾 Data Storage

Everything lives in `data/*.json`, read and written with `fs.promises` through `utils/fileStorage.js`, which:
- Creates a file with a default value if it doesn't exist yet.
- Throws a clear error (instead of crashing) if a file contains invalid JSON.
- Writes atomically (temp file + rename) to avoid partial/corrupted writes.

---

## 🚀 Installation & Running Locally

**Requirements:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# — or, for auto-restart on file changes during development —
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Available Scripts
```json
"start": "node server.js"
"dev":   "nodemon server.js"
```

---

## 🗺 Available Routes (Frontend Pages)

| Route | Page |
|-------|------|
| `/` | Home |
| `/explore` | Explore & search stories |
| `/categories` | All categories |
| `/category?slug=technology` | Single category |
| `/article?id=post-001` | Article detail |
| `/write` | Create a new story |
| `/write?id=post-001` | Edit an existing story |
| `/authors` | All authors |
| `/author?id=auth-01` | Single author profile |
| `/saved` | Bookmarked stories |
| `/about` | About OpenVerse |
| `/contact` | Contact form |
| `/signin` / `/signup` | Demo authentication |

---

## 🔑 Demo Account

Use this account to sign in and immediately explore **My Profile → My Stories** (edit/delete your own stories):

```
Email:    raja@openverse.com
Password: Raja@123
```

This logs you in as **Ch Raja Siva Reddy** (`auth-11`), the site's author identity. Their profile at `/author?id=auth-11` starts with the 3 seeded demo articles below (minus any you've deleted while testing — see [My Profile & My Stories](#-my-profile--my-stories-ownership-model)).

On the Sign In page, a **"Fill Demo Credentials"** button fills these in for you automatically.

---

## 🔐 A Note on Authentication

Sign In / Sign Up are **real but intentionally minimal** — good enough to demonstrate the flow honestly, not production-grade:

- `POST /api/auth/signup` and `POST /api/auth/login` are backed by `data/users.json` and implemented in `controllers/authController.js`.
- Passwords are **never stored or returned in plaintext**. Each password is hashed with Node's built-in `crypto.scryptSync` using a random 16-byte salt per user; login re-hashes the submitted password with the stored salt and compares with `crypto.timingSafeEqual`. Only `passwordSalt`/`passwordHash` are persisted — API responses always strip those fields (see `sanitizeUser()`), so a request/response log can never leak a password.
- What's missing on purpose, because it's out of scope for a JSON-file student project: no session tokens/JWT/cookies (the browser just remembers who's signed in via `localStorage`, cleared on Logout), no HTTPS enforcement, no rate limiting or account lockout, no password reset flow.
- Signing in doesn't change **which** author is "yours" — `OV.CURRENT_USER` in `public/js/main.js` is fixed to `auth-11`, since OpenVerse is set up as a single-owner portfolio site (see below). Signing in as the demo account is what lets the navbar show **My Profile**/**Log Out** instead of **Sign In**, and is required by this task's demo flow, but Write/My Stories were already scoped to `auth-11` regardless of session state.

Do not treat this as a template for production auth.

---

## 🎨 Design System

- **Palette:** deep navy/black background, purple/violet gradients, electric blue accents, soft white text.
- **Components:** glassmorphism panels, gradient borders, glow effects, 3D CSS-transform hero visual, floating particles.
- **Typography:** Space Grotesk (headings) + Inter (body), loaded from Google Fonts.
- **Motion:** IntersectionObserver-driven scroll reveals, animated counters, and hover micro-interactions — all respecting `prefers-reduced-motion`.

---

## 🔮 Future Improvements

- Real database (PostgreSQL/MongoDB) and hashed-password authentication with sessions/JWT.
- Image upload instead of URL-only cover images.
- Rich text / Markdown editor for the Write page.
- Pagination cursors instead of offset-based paging for large datasets.
- Server-side rendering for SEO.
- Role-based access control for editing/deleting other users' posts.

---

## 👤 Author

Built as a demonstration Node.js/Express.js project — **OpenVerse**.
