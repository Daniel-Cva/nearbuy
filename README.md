# Nearbuy: Hyper Local, Reverse E-Commerce & Founder Networking Ecosystem

**Nearbuy** is a revolutionary "Reverse E-Commerce" platform designed to flip the traditional shopping model. Instead of users browsing through endless listings, users post their specific requirements, and nearby businesses compete to provide the best value through a quoting system.

---

## 🚀 The Core Concept: Reverse E-Commerce

In a **normal E-Commerce flow**, businesses list products, and users scroll to find what they need.

In **Nearbuy**, we reverse this:

1.  **Post Requirement**: A user/buyer posts exactly what they need (product or service).
2.  **Nearby Notification**: Local businesses within a certain radius are notified of the requirement.
3.  **Competitive Quotes**: Businesses send tailored quotes/proposals to the user.
4.  **Selection & Exchange**: The user selects the best quote, and necessary data is exchanged to fulfill the job.
5.  **Completion**: The business marks the job as completed, and the user confirms the delivery.

---

## 🛠️ Technology Stack

The project is built on a modern, serverless architecture for high scalability and low latency:

-   **Frontend (UI)**: [SvelteKit](https://kit.svelte.dev/) (Static Adapter)
-   **Backend (API)**: [SvelteKit](https://kit.svelte.dev/) / Sveltilit (Cloudflare Adapter)
-   **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQL Database)
-   **Object Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (For images, avatars, etc.)
-   **Styling**: Tailwind CSS
-   **Authentication**: Cookie-based with `bcryptjs` for security
-   **Unique IDs**: ULID (Universally Unique Lexicographically Sortable Identifier)

---

## 📂 Project Structure

-   `\UI`: The frontend application, designed for a premium user experience.
-   `\api`: The core logic layer, handling requests, business matching, and security.
-   `\db`: Contains database schema and data exports:
    -   `nearbuy.sql`: Full export of the main platform database (Users, Businesses, Quotes, Reports).
    -   `pincodes`: Dedicated database for hyperlocal pincode mapping data.

---

## 🛡️ Trust & Safety

To prevent scams and maintain high quality, Nearbuy includes:

-   **Mutual Reporting**: Users can report businesses, and businesses can report users for suspicious activity.
-   **Super Admin Authority**: A centralized "Super Admin" has full authority over the platform to resolve disputes, ban fraudulent actors, and manage categories.
-   **Activity Logging**: Comprehensive logs for users, businesses, and admins to ensure transparency.

---

## 🤝 Founder Networking

Beyond commerce, Nearbuy fosters a **Founder Networking Ecosystem**, allowing business founders to connect, collaborate, and grow the local ecosystem together through a dedicated collab mode and location-based discovery.

---

## ⚙️ Development Setup

### API Setup

1.  Navigate to `/api`
2.  Run `npm install`
3.  Configure `wrangler.jsonc` with your D1 and R2 bindings.
4.  Run `npm run dev` for local development.

### UI Setup

1.  Navigate to `/UI`
2.  Run `npm install`
3.  Run `npm run dev`

---

*Created as a College Project.*
