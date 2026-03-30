# 🛒 Nearbuy API

> **Reversing E-Commerce** — Customers broadcast what they need, local businesses respond.  
> Built on **SvelteKit** + **Cloudflare Workers** + **Cloudflare D1 (SQLite)** + **Cloudflare R2**.

---

## 📖 Table of Contents

- [What is Nearbuy?](#what-is-nearbuy)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Environment & Bindings](#environment--bindings)
- [Running Locally](#running-locally)
- [Deploying](#deploying)

---

## What is Nearbuy?

Nearbuy flips the traditional e-commerce model:

1. A **Customer** posts a request — "I need X near me"
2. Nearby **Businesses** see the request and reply with quotes/offers
3. The customer picks the best offer

The platform also supports a **Founder Collab** network — business founders can make themselves discoverable to other founders for partnerships and collaborations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [SvelteKit](https://kit.svelte.dev/) |
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com/) (via `adapter-cloudflare`) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge) |
| File Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) (avatars, images, media) |
| Auth | **JWT** (JSON Web Tokens) + **bcrypt** (password hashing) |
| Tooling | Wrangler CLI, Vite, Prettier |

---

## Project Structure

```
nearbuy-api/
├── src/
│   ├── hooks.server.js          # Global CORS headers for all responses
│   ├── lib/                     # Shared utilities (JWT helpers, DB wrappers, etc.)
│   └── routes/
│       ├── +server.js           # Root health or landing handler
│       └── api/
│           ├── health/          # GET /api/health — service status
│           ├── auth/
│           │   ├── user/
│           │   │   ├── register/    # POST /api/auth/user/register
│           │   │   └── login/       # POST /api/auth/user/login
│           │   ├── business/
│           │   │   ├── register/    # POST /api/auth/business/register
│           │   │   └── login/       # POST /api/auth/business/login
│           │   ├── admin/
│           │   │   └── login/       # POST /api/auth/admin/login
│           │   └── me/              # GET  /api/auth/me  (token → profile)
│           ├── users/
│           │   └── [id]/            # GET/PUT/DELETE /api/users/:id
│           └── admin/
│               └── users/           # GET /api/admin/users (admin only)
├── static/
│   └── schema.sql               # Full D1 database schema (source of truth)
├── wrangler.jsonc               # Cloudflare Worker config (D1 + R2 bindings)
└── package.json
```

---

## Authentication

### Strategy

| Concern | Solution |
|---|---|
| Password storage | `bcrypt` — passwords are hashed with a salt before storing in `*_login` tables |
| Session tokens | `JWT` — issued on login, must be sent as `Authorization: Bearer <token>` on protected routes |
| Role separation | Three separate login tables: `user_login`, `biz_login`, `sa_login` |

### Flow

```
Registration
  POST body (email / mobile / password)
       │
       ▼
  bcrypt.hash(password, saltRounds)
       │
       ▼
  INSERT INTO user_login / biz_login / sa_login
       │
       ▼
  INSERT profile row into user_data / biz_data / founder
       │
       ▼
  jwt.sign({ id, role }) → return token


Login
  POST body (email or mobile + password)
       │
       ▼
  SELECT password_hash FROM *_login WHERE email = ?
       │
       ▼
  bcrypt.compare(plain, hash)
       │
       ├─ ✅ Match → jwt.sign({ id, role }) → return token
       └─ ❌ No match → 401 Unauthorized
          (attempt logged in *_login_log)


Protected Route
  Authorization: Bearer <token>
       │
       ▼
  jwt.verify(token, JWT_SECRET)
       │
       ├─ ✅ Valid → attach { id, role } to event.locals → handler runs
       └─ ❌ Invalid / Expired → 401 Unauthorized
```

### JWT Payload shape

```json
{
  "id": 42,
  "role": "user" | "business" | "admin",
  "iat": 1710000000,
  "exp": 1710086400
}
```

### CORS

All responses include permissive CORS headers (configured in `hooks.server.js`):

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Database Schema

Schema is defined in [`static/schema.sql`](./static/schema.sql).  
The database is **Cloudflare D1** (SQLite). It is divided into 8 sections:

### Section 1 — Auth Tables *(credentials only)*

| Table | Role |
|---|---|
| `user_login` | Customer login (email / mobile / bcrypt hash) |
| `biz_login` | Business / Founder login |
| `sa_login` | Super Admin login |

### Section 2 — Profile Tables *(extended details)*

| Table | Purpose |
|---|---|
| `user_data` | Customer profile — name, address, location, avatar, theme |
| `biz_data` | Business profile — name, type (`product`/`service`/`both`), location, about, avatar, theme |
| `founder` | Founder personal profile — linked to `biz_data`, holds collab visibility settings |

> **Why are Auth and Profile separate?**  
> Credentials live in `*_login` tables; extended data lives in `*_data` / `founder`.  
> This keeps authentication lean and makes it easy to anonymise or delete profiles without breaking audit logs.

### Section 3 — Founder Collab

| Table | Purpose |
|---|---|
| `founder_collab` | Logs a collaboration event between two founders — stores `founderid1`, `founderid2`, `city`, `lat`, `long`, `timestamp`, `reason` |

A founder's discoverability is controlled by `founder.collab_status`:

| Value | Meaning |
|---|---|
| `none` | Hidden — not discoverable |
| `public` | Visible to all founders in the area |
| `private` | Invite-only |

### Section 4 — Audit Logs *(no foreign keys by design)*

| Table | Tracks |
|---|---|
| `user_activity_log` | Customer actions (search, request, etc.) |
| `biz_activity_log` | Business actions |
| `sa_activity_log` | Super Admin actions |
| `user_login_log` | Every customer login attempt (success/fail + IP) |
| `biz_login_log` | Every business login attempt |
| `sa_login_log` | Every admin login attempt |

> ⚠️ **No FK constraints on log tables.** Logs are append-only audit trails. Removing FKs means a log row is never lost if a profile is deleted or anonymised.

### Section 5 — Categories

| Table | Purpose |
|---|---|
| `categories` | Top-level product/service categories |
| `sub_categories` | Sub-categories nested under a parent |

### Section 6 — Geo Reference

| Table | Purpose |
|---|---|
| `pincodes` | Indian pincode → city / district / state / lat / long lookup |

### Section 7 — Dynamic Tables *(created at runtime)*

These tables are created **programmatically** per user/business. The schema shows the template column structure.

| Template Name | Purpose |
|---|---|
| `sub_{subcat_id}_biz_{biz_id}` | Business presence under a sub-category (used by nearby search) |
| `biz_{biz_id}_items` | Products/services listed by a business |
| `user_{user_id}_request` | Requests posted by a customer |
| `biz_{biz_id}_request` | Incoming customer requests visible to a business |
| `biz_{biz_id}_replies` | Quotes/replies sent by a business |
| `biz_{biz_id}_acceptance` | Accepted deals |

### Section 8 — Indexes

Key indexes exist on: `user_data.email`, `user_data.status`, `biz_data.district`, `biz_data.status`, `founder.biz_id`, `founder.collab_status`, `founder_collab.founderid1/2`, `pincodes.pincode`, and all log timestamp columns.

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Service health check |
| `POST` | `/api/auth/user/register` | None | Register a new customer |
| `POST` | `/api/auth/user/login` | None | Customer login → JWT |
| `POST` | `/api/auth/business/register` | None | Register a new business |
| `POST` | `/api/auth/business/login` | None | Business login → JWT |
| `POST` | `/api/auth/admin/login` | None | Super Admin login → JWT |
| `GET` | `/api/auth/me` | JWT | Get current user's profile from token |
| `GET` | `/api/users/:id` | JWT | Get a user profile by ID |
| `PUT` | `/api/users/:id` | JWT | Update a user profile |
| `DELETE` | `/api/users/:id` | JWT | Delete a user account |
| `GET` | `/api/admin/users` | JWT (admin) | List all users (admin only) |

---

## Environment & Bindings

Configured in `wrangler.jsonc`. These bindings are available in all server-side handlers via `event.platform.env`.

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 Database | Main SQLite database (`nearbuy`) |
| `nearbuy_storage` | R2 Bucket | File storage for avatars and media |

You will also need a **`JWT_SECRET`** environment variable set in Cloudflare Workers secrets:

```sh
wrangler secret put JWT_SECRET
```

---

## Running Locally

```sh
# Install dependencies
npm install

# Start local dev server (Vite)
npm run dev

# Preview production build with Wrangler (uses remote D1 & R2)
npm run build
npm run preview
```

> The `preview` script runs `wrangler dev` against the built worker, connecting to the **remote** D1 database because `"remote": true` is set in `wrangler.jsonc`.

---

## Deploying

```sh
# Build the SvelteKit app for Cloudflare
npm run build

# Deploy to Cloudflare Workers
wrangler deploy

# Apply schema to D1 (first time or after schema changes)
wrangler d1 execute nearbuy --remote --file=./static/schema.sql

# Regenerate TypeScript types from Worker bindings
npm run gen
```

---

## Schema Quick Reference (Entity Diagram)

```
user_login ──────────── user_data
                              │
biz_login  ──────────── biz_data ───────── founder ─────┐
                                               │          │
sa_login   ──────────── (sa_login)       founder_collab ─┘
                              │
                         sub_categories ← categories
                              │
                         pincodes (geo lookup)

 Dynamic per business/user:
  sub_{x}_biz_{y}   biz_{y}_items   user_{x}_request
  biz_{y}_request   biz_{y}_replies biz_{y}_acceptance
```
