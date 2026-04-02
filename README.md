# Nearbuy: Hyper Local, Reverse E-Commerce & Founder Networking Ecosystem

**Nearbuy** is a revolutionary "Reverse E-Commerce" platform designed to flip the traditional shopping model. Instead of users browsing through endless listings, users post their specific requirements, and nearby businesses compete to provide the best value through a quoting system.

---

## 🚀 The Core Concept: Reverse E-Commerce

In a **normal E-Commerce flow**, businesses list products, and users scroll to find what they need.

In **Nearbuy**, we reverse this:

1.  **Post Requirement**: A user/buyer posts exactly what they need (product or service) with location data.
2.  **Nearby Notification**: Local businesses within the radius instantly see the requirement on their feed.
3.  **Competitive Quotes**: Businesses send tailored quotes/proposals (price, product info) to the user.
4.  **Selection & Exchange**: The user selects the best quote. Once accepted, internal logic exchanges mobile, name, and email for both parties to process the job.
5.  **Completion & Review**: The business marks the job as done, the user confirms it, and finally, the user reviews the business (text, images, videos).

---

## 🏗️ Technology Stack & Project Structure

-   **Frontend (UI)**: SvelteKit (Static Adapter) with Tailwind CSS.
-   **Backend (API)**: SvelteKit (Cloudflare Adapter) executing edge functions.
-   **Database**: Cloudflare D1 (Serverless SQLite).
-   **Storage**: Cloudflare R2 (Object Storage for images/videos).
-   **Authentication**: Secure, server-side HTTP-Only Cookies evaluating JWTs via `hooks.server.js`.

### Directories
-   `\UI`: The frontend SvelteKit application.
-   `\api`: The core business logic, routing, and remote DB handlers.
-   `\db`: Database schemas, specifically `new.sql` containing the **Centralized Static Architecture** and `nearbuy_export.sql` containing the D1 backups.

---

## 🗺️ Unified Workflows

### 1. The Buyer Flow (User)
- Registers & Logs in (`/api/auth/user/...`).
- Scrolls nearby generic items (`GET /api/items`).
- Posts a specific requirement (`POST /api/requests`).
- Waits to receive multiple quotes (`GET /api/requests/[id]/quotes`).
- Accepts a winning quote (`POST /api/requests/[req_id]/accept`).
- Connects with the business using the unlocked contact data (`GET /api/acceptances/[id]`).
- Optionally chats via Universal Messaging (`POST /api/conversations`).
- Confirms the job is completed (`PATCH /api/acceptances/[id]/status`).
- Submits multimedia reviews (`POST /api/acceptances/[id]/reviews`).

### 2. The Seller Flow (Business)
- Registers & Logs in (`/api/auth/business/...`).
- Waits for Super Admin approval (status transitions from `pending` to `active`).
- Maintains a product catalog (`POST /api/items`, `PATCH /api/items/[id]`).
- Browses the live local requirement feed (`GET /api/businesses/[bizId]/feed`).
- Sends competitive bids/pitches (`POST /api/requests/[req_id]/quotes`).
- Once accepted by the user, services the job (`GET /api/businesses/[bizId]/jobs`).
- Marks the job as fulfilled (`PATCH /api/acceptances/[id]/status` -> `b_completed`).

### 3. Universal Messaging Flow
Instead of siloed user-to-business logic, messaging is strictly Universal Entity-to-Entity. A User can message a User, a Business can message a Business, or User-to-Business.
- Initiated via `POST /api/conversations` using `participant1_id` and `participant2_id`.
- Handled safely on `GET /api/conversations` checking the JWT.

---

## 🔌 API Reference & Endpoints

> **Authentication Note**: All protected endpoints require an `HttpOnly` cookie containing a valid JWT. The server checks this token inside `event.locals.user` automatically via SvelteKit Hooks. No manual token mapping is needed by the frontend.
> **Security Note**: Every endpoint enforces strict ownership validation. You cannot edit, delete, or fetch records that belong to another UID. Device IP is tracked on all login attempts.

### Authentication & Auth Logging
- \`POST /api/auth/user/login\` - Logs user in. Requires: \`email/mobile/username\`, \`password\`. Returns JWT in cookie. Captures \`CF-Connecting-IP\`.
- \`POST /api/auth/business/login\` - Logs business in. Same exact flow, but validates \`biz_data\` status.
- \`POST /api/auth/admin/login\` - Admin login.

### Items (Catalog)
- \`GET /api/items\` *(Public)* - Retrieves public feed of items alongside business profiles for users to scroll.
- \`POST /api/items\` *(Business Only)* - Adds product. Payload: \`{ product_name, selling_price, description?, brand?, mrp?, image? }\`.
- \`PATCH /api/items/[id]\` *(Business Only)* - Edits product.
- \`DELETE /api/items/[id]\` *(Business Only)* - Removes product securely.

### Requests (Requirements)
- \`POST /api/requests\` *(User Only)* - Post a requirement. Payload: \`{ description, category, sub_categories, lat, lng, city, address, pincode }\`
- \`GET /api/businesses/[business_id]/feed\` *(Business Only)* - Fetches open local requests for the business to quote on.
- \`PATCH /api/requests/[id]/status\` *(Owner Only)* - Manually alters request status.

### Quotes (Bidding)
- \`POST /api/requests/[request_id]/quotes\` *(Business Only)* - Business bids on a requirement. Payload: \`{ product_info (JSON details/price layout) }\`.
- \`GET /api/requests/[request_id]/quotes\` *(User Only)* - User reviews all bids from local businesses.

### Acceptances (Jobs & Contacts)
- \`POST /api/requests/[request_id]/accept\` *(User Only)* - Finalizes job. Payload: \`{ quote_id }\`. Auto-updates request and quote statuses to \`accepted\`.
- \`GET /api/acceptances/[id]\` *(Participants Only)* - **The Contact Exchange**. Returns the fully unmasked \`phone\`, \`email\`, \`firstname/bname\`, and \`address\` for the buyer and seller strictly to process the order.
- \`GET /api/users/[user_id]/orders\` *(User Only)* - View all accepted orders.
- \`GET /api/businesses/[business_id]/jobs\` *(Business Only)* - View all accepted jobs.
- \`PATCH /api/acceptances/[id]/status\` - Updates step status. Business pushes \`b_completed\`. User pushes \`completed\`.

### Universal Messaging
- \`POST /api/conversations\` - Sparks a new thread. Payload: \`{ other_id, request_id? }\`.
- \`GET /api/conversations\` - Gets user's or business's inbox.
- \`POST /api/messages\` - Send payload. Payload: \`{ conversation_id, payload (JSON containing text/images) }\`
- \`GET /api/conversations/[conversation_id]/messages\` - Returns chronological messages.

### Reviews & Reports
- \`POST /api/acceptances/[id]/reviews\` *(User Only)* - Leaves review. Payload: \`{ rating, review_text, review_video_url, image_url }\`.
- \`POST /api/reports\` *(All Users)* - Flag another entity. Payload: \`{ type, targetId, reason, details }\`.
- \`PATCH /api/reports/[reportId]\` *(Admin Only)* - Resolve or close system reports.
- \`GET /api/admin/reports\` *(Admin Only)* - View all cross-platform reports.
