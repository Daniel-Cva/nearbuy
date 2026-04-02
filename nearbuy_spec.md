# NearBuy Platform Specification & Technical Architecture

NearBuy is a hyperlocal bidding and RFQ (Request for Quotation) marketplace connecting users with nearby providers. This document maps the entire project structure as of April 2026.

## 1. Project Navigation

### 🛠️ Backend (api/src/routes/api)
| Module | Endpoint Path | Functionality |
| :--- | :--- | :--- |
| **Auth** | `/auth/register-user`, `/auth/register-biz`, `/logout` | Identity management |
| **Identity** | `/me` | Current session & role info |
| **Catalog** | `/categories` | Global taxonomy (GET: public, POST: admin) |
| **Inventory** | `/items`, `/items/[id]` | Public listings & management |
| **Requests** | `/requests`, `/requests/[id]` | RFQ posting & tracking |
| **Bidding** | `/acceptances`, `/quotes` | Transaction lifecycle |
| **Communication**| `/conversations`, `/messages`| Hyperlocal chat system |
| **Reviews** | `/reviews`, `/items/[id]/reviews` | Feedback & quality control |
| **Admin** | `/admin/businesses`, `/admin/users` | Platform governance |
| **Utilities** | `/pincodes`, `/upload` | Geo-data & R2 media storage |

### 🎨 Frontend (UI/src/routes)
| Path | Target Audience | Primary API Hooks |
| :--- | :--- | :--- |
| `/` | Public | `/api/items` (Explore) |
| `/user/register` | Users | `/api/categories` (Interests), `/api/auth/register-user` |
| `/provider/register`| Businesses | `/api/categories`, `/api/auth/register-biz` |
| `/provider/inventory`| Businesses | `/api/items` (GET, POST, DELETE) |
| `/provider/inventory/[id]/edit`| Businesses | `/api/items/[id]` (PATCH), `/api/categories` |
| `/user/item/[id]` | Public | `/api/items/[id]`, `/api/reviews` |
| `/admin/dashboard` | Super Admin | `/api/me`, `/api/admin/businesses` |

---

## 2. Platform Core Flows

### A. The Catalog & Discovery Flow
1.  **Catalog (GET):** The platform fetches the official taxonomy from `/api/categories`.
2.  **Discovery:** Users search `/api/items` filtered by category and geo-location.
3.  **Interaction:** Snappy carousel navigation in `/user/item/[id]` uses `$derived.by` for performance.

### B. The Transaction Flow (RFQ)
1.  **Requirement:** User posts to `/api/requests`.
2.  **Quotations:** Nearby businesses respond via `/api/quotes`.
3.  **Acceptance:** User accepts a quote via `/api/acceptances`, creating a locked transaction.
4.  **Completion:** User completes a review via `/api/reviews` linked to the `acceptance_id`.

---

## 3. Implementation Checklist & Best Practices

-   **Data Consistency:** All UI components MUST use the `unroll` helper to handle JSON-encoded fields (images/specs) for migration compatibility.
-   **Security:** JWT verification is performed via `api/src/hooks.server.js`. Public routes (e.g. `/api/categories` GET) are explicitly whitelisted.
-   **Storage:** Images are uploaded to Cloudflare R2 via `/api/upload` and retrieved using `toDisplayUrl()` helper.

## 4. Maintenance Commands

- **Build API:** `cd api && npm run build`
- **Deploy/Dev API:** `npx wrangler dev --remote --port 8787`
- **Dev UI:** `cd UI && npm run dev -- --host --port 5173`
- **Apply DB Changes:** Modify `db/db.sql` and apply to Cloudflare D1.
