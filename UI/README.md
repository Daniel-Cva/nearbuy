# NearBuy 🛍️

> **Hyper-Local, Reverse E-Commerce & Founder Networking Ecosystem**

---

## 📋 Abstract

In an era dominated by e-commerce giants like Amazon and Flipkart, traditional retailers in regions like India—particularly those hindered by limited internet knowledge and adaptation to the modern digital world—face existential threats, with many businesses struggling to reach local consumers amid fierce online competition.

**NearBuy** addresses that gap by empowering business owners with a hyper-local, user-friendly ecosystem that seamlessly connects them to nearby buyers through three intuitive flows:

1. Posting requirements to receive and accept provider quotes
2. Browsing or searching filtered products from local retailers to confirm orders
3. Completing jobs with post-service reviews to build trust and ratings

Providers benefit from structured roles—**Founder** (with unique collaboration features for sharing live locations in public/private modes during travel on buses, trains, or flights, turning downtime into valuable networking), **Admin** (for team management), and **Employees** (for product handling and order fulfillment)—ensuring efficient operations while boosting successful job counts on profiles.

Overseeing it all is the **Platform Authority (System/Super Admin)**, a top-tier role with full system access for verifying businesses, monitoring illegal activities, resolving disputes, managing data/security, and configuring platform-wide settings, maintaining a safe, legal hierarchy above users, founders, admins, and employees.

---

## ✨ Core Features & Solutions

| #   | Feature                                  | Description                                                                                                                                                                                                 |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Targets Struggling Local Shops**       | Empowers traditional retailers in India—hit hard by Amazon/Flipkart dominance and limited digital skills—with hyper-local visibility to nearby buyers craving quick, trusted deals over distant deliveries. |
| 2   | **Reverses E-Commerce Flow—Users First** | Flips the script on seller spam; users post needs or confirm product interest first, triggering targeted quotes/notifications from nearby providers only—no endless promotions, pure user control.          |
| 3   | **Exclusive Founder Collab Feature**     | Business owners share live locations by public/private modes during bus/train/flight commutes, turning travel downtime into real-time networking with nearby founders for partnerships, tips, and deals.    |
| 4   | **Subscription-Based Advertisements**    | Super Admin creates and manages subscription plans. Providers advertise based on kilometer range and type (In-app, Push, WhatsApp). Users see ads as "Nearby Offers" for free.                              |

---

## 🔄 User Workflows

Users can interact with the platform in three distinct ways:

### Flow 1: Post Requirement (Service & Custom Needs)

> **Best for:** Plumbing, Electricians, Custom Orders

```text
Post Requirement
  → User clicks "Post Requirement"
  → Select Category → Add Description/Photos → Submit

Provider Response
  → System notifies nearby providers
  → If Service: Providers click "Show Interest"
  → If Product: Providers send "Price Quotes"

Selection
  → User views list of Interested Providers or Quotes
  → User compares Profiles/Ratings → Clicks "Accept Provider"

Connection
  → User and Provider receive each other's contact info
  → Chat/Call to finalize time and location

Completion & Review
  → Provider marks work done
  → User receives "Job Completed?" prompt → Clicks "Confirm"
  → User leaves Star Rating & Text Review
```

---

### Flow 2: Browse Nearby (Window Shopping)

> **Best for:** Local Retail Discovery, Food, Immediate Availability

```text
Discovery
  → User opens Home Page → Feeds show "Products/Services Nearby"
  → User scrolls through local inventory images

Inspection
  → Click Product/Service Image → View Details (Price, Shop Location, Specs)

Order Initiation
  → User clicks "I am Interested" (Confirm Order)

Connection
  → Provider notified of interest → Accepts
  → Contact details exchanged for pickup or delivery arrangement

Completion & Review
  → Transaction occurs (offline or online payment)
  → Provider marks complete → User confirms
  → User reviews the Product/Provider
```

---

### Flow 3: Search & Filter (Specific Intent)

> **Best for:** Finding specific items, Comparison shopping

```text
Search
  → User types query (e.g., "iphone 15", "red sneakers")

Filter
  → User applies filters: Distance (<5km), Price (Low to High), Rating (4+ Stars)

Selection
  → User selects a product from filtered list → Views Details

Order Initiation
  → User clicks "I am Interested"

Connection
  → Provider notified → Data exchanged

Completion & Review
  → Provider fulfills order → Marks complete
  → User confirms → User submits Rating & Review
```

---

## 👥 Role Structure & Hierarchy

```text
┌─────────────────────────────────────────────────────┐
│              Platform Authority (Super Admin)         │
│  - Verify businesses, monitor activity, resolve       │
│    disputes, manage subscriptions & platform settings │
└─────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
        [Founder]      [Admin]      [Employee]
```

### 🏢 Provider Role Hierarchy & Capabilities

#### Role: Admin (The Manager)

- **Account Creation**: First registered account; acts as the primary system manager.
- **Founder Setup**: Responsible for providing Founder details and creating the Founder account.
- **Team Management**: Invites, creates, and deletes Employees.
- **Operations**: Full authority over product/service management and order handling.

#### Role: Founder (The Owner)

- **Account Origin**: Account is created and details provided by the Admin.
- **Authority**: Inherits all permissions for products, services, and orders.
- **Special Feature**: Exclusively holds the **Live Location Sharing (Collab)** feature.
  - Toggles Public/Private modes to network with other founders during travel.

#### Role: Employee (The Operator)

- **Execution**: Handles product/service listings, responds to quotes, and completes jobs.
- **Tracking**: Each successful job increases the business profile's total job count.

> **Note:** Some small shops may have a single person acting as Founder, Admin, and Employee simultaneously.

---

### 🔐 Authentication & Onboarding Flow

```text
Step 1: Initial user signs up → becomes Admin
Step 2: Admin creates the Founder Account (providing personal & business details)
Step 3: Admin invites or creates Employee Accounts
Step 4: Admin submits business verification docs for the whole entity
Step 5: Super Admin reviews and approves/rejects the business
```

---

## 📄 Application Pages

### 🔒 Common / Authentication

| Page            | Route              | Description                                              |
| --------------- | ------------------ | -------------------------------------------------------- |
| Login           | `/login`           | Unified or role-selected login page                      |
| Forgot Password | `/forgot-password` | Request password reset                                   |
| OTP Verify      | `/verify-otp`      | Verify OTP for account recovery or 2FA                   |
| Reset Password  | `/reset-password`  | Set a new password                                       |
| Settings        | `/settings`        | Global settings including Theme toggle (Dark/Light mode) |

---

### 🛡️ Super Admin

| Page              | Route                          | Description                                                 |
| ----------------- | ------------------------------ | ----------------------------------------------------------- |
| Admin Login       | `/admin/login`                 | Dedicated secured login with separate credentials           |
| Dashboard         | `/admin/dashboard`             | Analytics graphs with filtering options                     |
| Business Requests | `/admin/business-requests`     | List of pending business onboardings                        |
| Inspect Business  | `/admin/inspect-business/[id]` | Detailed view of a business application/profile             |
| Onboard Business  | `/admin/onboard`               | Logic/Modal to Approve or Reject businesses                 |
| Logs / History    | `/admin/logs`                  | Detailed logs of Business, User, and Super Admin activities |
| Advertisements    | `/admin/advertisements`        | View and monitor active advertisements                      |
| Subscriptions     | `/admin/subscriptions`         | Create, edit, manage, delete subscription/ad plans          |

---

### 🏪 Business Provider

#### Onboarding & Authentication

| Page              | Route                | Description                                                                           |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------- |
| Register          | `/provider/register` | Form: Business Name, Category (Product/Service), Documents, Founder Details, Location |
| Onboarding Status | `/provider/status`   | View approval status notification from Super Admin                                    |

#### Founder Area

| Page                 | Route                       | Description                                                               |
| -------------------- | --------------------------- | ------------------------------------------------------------------------- |
| Founder Profile      | `/provider/founder/profile` | Unique profile with Public/Private visibility settings                    |
| Collaboration Search | `/provider/collab`          | Map view showing nearby live founders (100m radius) with category filters |
| Staff Management     | `/provider/staff`           | Manage Admin/Employee credentials (Create/Delete/Update)                  |

#### Business Administration

| Page               | Route                 | Description                                                        |
| ------------------ | --------------------- | ------------------------------------------------------------------ |
| Business Page      | `/provider/business`  | Main landing page for organization staff                           |
| Business Dashboard | `/provider/dashboard` | Graphs and analytics (Sales, User Requirements)                    |
| Push Advertisement | `/provider/advertise` | Setup paid ads based on km range and type (In-app, Push, WhatsApp) |

#### Product / Service Management

| Page                   | Route                      | Description                                      |
| ---------------------- | -------------------------- | ------------------------------------------------ |
| List Products/Services | `/provider/inventory`      | Grid/List view of all items                      |
| Add Product/Service    | `/provider/inventory/add`  | Form: Name, Desc, Amount (Product), Stock, Image |
| Inspect Item           | `/provider/inventory/[id]` | Detailed view of stock, orders, and reviews      |

#### User Requirements Interaction

| Page                | Route                         | Description                                                       |
| ------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Requirement List    | `/provider/requirements`      | Stream of notified user requirements                              |
| Requirement Details | `/provider/requirements/[id]` | Inspect details to "Quote" (Product) or show "Interest" (Service) |
| Create Quote        | `/provider/quote/[reqId]`     | Form to send price or confirmation                                |

---

### 👤 User (Consumer)

#### Authentication

| Page     | Route            | Description                                                 |
| -------- | ---------------- | ----------------------------------------------------------- |
| Register | `/user/register` | Create account with Name, Email, Phone, Location, Interests |

#### Discovery

| Page         | Route             | Description                                                                     |
| ------------ | ----------------- | ------------------------------------------------------------------------------- |
| Home Page    | `/user/home`      | Main feed with switch button for **Products** vs **Services** (List + Map view) |
| Inspect Item | `/user/item/[id]` | View details and "I'm Interested" interaction                                   |
| Search Page  | `/user/search`    | Advanced filters: Category, Price, Distance, Rating                             |

#### Requirements Flow

| Page               | Route                    | Description                                                                   |
| ------------------ | ------------------------ | ----------------------------------------------------------------------------- |
| Create Requirement | `/user/post-requirement` | Form: Name, Description, Location (Map & Text), Attachments (no budget field) |
| Provider Match     | `/user/match-results`    | After posting, show nearby providers immediately                              |
| Quotes / Interest  | `/user/quotes`           | List of providers who accepted/quoted the requirement                         |

#### Interaction & Completion

| Page             | Route                 | Description                                               |
| ---------------- | --------------------- | --------------------------------------------------------- |
| Messaging Portal | `/user/messages/[id]` | Chat interface to exchange contact info                   |
| Order Status     | `/user/order-status`  | View for Provider marking "Completed" and User confirming |
| Review           | `/user/review/[id]`   | Star rating and review submission form                    |

---

## 🔧 Business Type Execution

### Product-Based

- Focus on inventory updates, price quotes, and delivery confirmation.
- Employees create/edit/delete products, send quotes, handle order notifications, and mark jobs complete.

### Service-Based

- Focus on service descriptions, responding to "Interest" pings, and task completion.
- Employees create/manage/delete services, respond to user requirements, and mark jobs complete.
- Users can: search services → show interest → exchange contact data → complete job → review service.
- Users can: browse nearby services on home page → show interest → complete job → review service.
- Users can: post requirements → provider shows interest → user selects → complete job → review.

---

## 🧱 Tech Stack

| Layer        | Technology                                                                              |
| ------------ | --------------------------------------------------------------------------------------- |
| Framework    | [SvelteKit](https://kit.svelte.dev/)                                                    |
| Language     | JavaScript (No TypeScript)                                                              |
| UI / Styling | [Tailwind CSS v4](https://tailwindcss.com/)                                             |
| Database     | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge)             |
| Storage      | [Cloudflare R2](https://developers.cloudflare.com/r2/) (Object Storage for images/docs) |
| Build Tool   | [Vite](https://vitejs.dev/)                                                             |
| Adapter      | `@sveltejs/adapter-auto`                                                                |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Install Dependencies

```sh
npm install
```

### Run Development Server

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Build for Production

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```

### Code Formatting

```sh
# Check formatting
npm run lint

# Auto-format
npm run format
```

---

## 📁 Project Structure

```text
ui/
├── src/
│   ├── app.html              # HTML shell
│   ├── lib/                  # Shared components & utilities
│   └── routes/               # SvelteKit file-based routing
│       ├── +layout.svelte    # Global layout
│       ├── +page.svelte      # Root page
│       ├── login/
│       ├── admin/
│       │   ├── login/
│       │   ├── dashboard/
│       │   ├── business-requests/
│       │   ├── inspect-business/[id]/
│       │   ├── logs/
│       │   ├── advertisements/
│       │   └── subscriptions/
│       ├── provider/
│       │   ├── register/
│       │   ├── status/
│       │   ├── founder/profile/
│       │   ├── collab/
│       │   ├── staff/
│       │   ├── business/
│       │   ├── dashboard/
│       │   ├── advertise/
│       │   ├── inventory/
│       │   │   ├── add/
│       │   │   └── [id]/
│       │   ├── requirements/
│       │   │   └── [id]/
│       │   └── quote/[reqId]/
│       └── user/
│           ├── register/
│           ├── home/
│           ├── item/[id]/
│           ├── search/
│           ├── post-requirement/
│           ├── match-results/
│           ├── quotes/
│           ├── messages/[id]/
│           ├── order-status/
│           └── review/[id]/
├── static/                   # Static assets (images, icons, fonts)
├── svelte.config.js
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔐 Super Admin Capabilities

- ✅ Verify and onboard business accounts
- 🚫 Block or remove scam/illegal profiles
- ⚖️ Resolve disputes between users and business teams
- 📊 Full platform analytics and activity logs
- 📦 Manage subscription plans for advertisements
- ⚙️ Configure platform-wide settings and security policies

---

## 🤝 Founder Collaboration Feature

The **Collab** feature is exclusive to the Founder role and enables real-time networking with nearby founders:

- **Live Location Sharing**: Toggle Public or Private mode
- **Travel Networking**: Connect with founders on the same bus, train, or flight (100m radius)
- **Use Cases**: Discover partnership opportunities, share business tips, negotiate supplier deals — all during commute time
- **Privacy Controls**: Private mode hides identity; Public mode broadcasts to nearby founders

---

## 📢 Advertisement System

- Super Admin creates, edits, manages, and deletes **subscription plans**.
- Providers purchase a plan and can run ads within a specified **kilometer radius**.
- Ad types: **In-app banners**, **Push notifications**, **WhatsApp promotions**.
- Users see all nearby ads as **"Nearby Offers"** — completely free to browse.

---

_Built with ❤️ to revitalize local commerce and empower Indian small businesses._

---