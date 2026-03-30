# Nearbuy API — Complete Endpoint Reference (DJ.md)

> **Base URL**: All routes are prefixed with `/api`  
> **Auth**: All protected routes require a valid session **cookie** (`token`) — set automatically after login.  
> The token is an HTTP-only cookie, so you don't pass it in headers manually.  
> **Content-Type**: `application/json` unless stated otherwise (e.g., file uploads use `multipart/form-data`)

---

## Legend

| Symbol      | Meaning                                         |
| ----------- | ----------------------------------------------- |
| 🌐 Public   | No login needed                                 |
| 🔐 User     | Must be logged in as a regular user             |
| 🏪 Business | Must be logged in as founder / manager / staff  |
| 👑 Admin    | Must be logged in as Super Admin                |
| 📎 FormData | Request body is `multipart/form-data`, not JSON |

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [My Profile (Me)](#2-my-profile-me)
3. [Businesses — Public](#3-businesses--public)
4. [Business — Items](#4-business--items)
5. [Business — Reviews](#5-business--reviews)
6. [Business — Staff Management](#6-business--staff-management)
7. [Reports](#7-reports)
8. [File Upload (R2)](#8-file-upload-r2)
9. [Pincode Lookup](#9-pincode-lookup)
10. [Admin — Businesses](#10-admin--businesses)
11. [Admin — Users](#11-admin--users)
12. [Admin — Founders](#12-admin--founders)
13. [Admin — Categories](#13-admin--categories)
14. [Admin — Activity Logs](#14-admin--activity-logs)

---

## 1. Authentication

### 1.1 — Register a User Account

| Method | Path                      | Auth      |
| ------ | ------------------------- | --------- |
| `POST` | `/api/auth/user/register` | 🌐 Public |

**Content-Type**: `application/json`

**Request Body:**

| Field        | Type     | Required    | Description                                                                                                                      |
| ------------ | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `firstname`  | `string` | ✅ Yes      | First name of the user                                                                                                           |
| `lastname`   | `string` | ✅ Yes      | Last name of the user                                                                                                            |
| `email`      | `string` | ✅ Yes      | Email address (used for login, must be unique)                                                                                   |
| `password`   | `string` | ✅ Yes      | Password (will be hashed before storing)                                                                                         |
| `username`   | `string` | ❌ Optional | Custom username. Auto-generated if not provided (e.g., `dj_A1B2`)                                                                |
| `mobile`     | `string` | ❌ Optional | Mobile number (must be unique if provided)                                                                                       |
| `pincode`    | `string` | ❌ Optional | Postal code of the user's location                                                                                               |
| `city`       | `string` | ❌ Optional | City name                                                                                                                        |
| `district`   | `string` | ❌ Optional | District name                                                                                                                    |
| `state`      | `string` | ❌ Optional | State name                                                                                                                       |
| `address`    | `string` | ❌ Optional | Full address                                                                                                                     |
| `lat`        | `number` | ❌ Optional | GPS latitude                                                                                                                     |
| `long`       | `number` | ❌ Optional | GPS longitude                                                                                                                    |
| `avatar_url` | `string` | ❌ Optional | URL path to profile picture (R2 path after upload)                                                                               |
| `interests`  | `array`  | ❌ Optional | **JSON Array** of category interest strings. Max 10 items. Example: `["Electronics", "Grocery"]`. These are for personalization. |

**Example Payload:**

```json
{
	"firstname": "Daniel",
	"lastname": "Jabaraj",
	"email": "dj@gmail.com",
	"password": "mypassword123",
	"mobile": "9999999999",
	"pincode": "609309",
	"city": "Sembanarkoil",
	"district": "MAYILADUTHURAI",
	"state": "TAMIL NADU",
	"interests": ["Electronics", "Home & Kitchen"]
}
```

**On Success (201):** Sets `token` cookie. Returns `{ status: "success" }`.

> Also automatically creates the user's personal request tracking table `user_<username>_request` in D1.

---

### 1.2 — Login as a User

| Method | Path                   | Auth      |
| ------ | ---------------------- | --------- |
| `POST` | `/api/auth/user/login` | 🌐 Public |

**Request Body:**

| Field      | Type     | Required                 | Description               |
| ---------- | -------- | ------------------------ | ------------------------- |
| `email`    | `string` | ❌ One of these required | Login using email         |
| `mobile`   | `string` | ❌ One of these required | Login using mobile number |
| `username` | `string` | ❌ One of these required | Login using username      |
| `password` | `string` | ✅ Yes                   | Account password          |

**Example Payload:**

```json
{
	"email": "dj@gmail.com",
	"password": "mypassword123"
}
```

**On Success (200):** Sets `token` cookie (valid 3 hours). Returns `{ login_status: "success", id: "..." }`.

---

### 1.3 — Register a Business

| Method | Path                          | Auth      |
| ------ | ----------------------------- | --------- |
| `POST` | `/api/auth/business/register` | 🌐 Public |

**Content-Type**: `multipart/form-data` 📎

**Form Fields:**

| Field            | Type     | Required    | Description                                                                         |
| ---------------- | -------- | ----------- | ----------------------------------------------------------------------------------- |
| `email`          | `string` | ✅ Yes      | Founder's email (used for login, must be unique)                                    |
| `password`       | `string` | ✅ Yes      | Founder's password                                                                  |
| `bname`          | `string` | ✅ Yes      | Name of the business                                                                |
| `founder_name`   | `string` | ✅ Yes      | Full name of the founder                                                            |
| `username`       | `string` | ❌ Optional | Business username. Auto-generated if not provided                                   |
| `mobile`         | `string` | ❌ Optional | Founder's mobile number                                                             |
| `btype`          | `string` | ❌ Optional | Business type. One of: `"product"`, `"service"`, `"both"`. Defaults to `"product"`  |
| `about`          | `string` | ❌ Optional | A short description of the business                                                 |
| `city`           | `string` | ❌ Optional | City the business is in                                                             |
| `pincode`        | `string` | ❌ Optional | Postal code                                                                         |
| `district`       | `string` | ❌ Optional | District                                                                            |
| `state`          | `string` | ❌ Optional | State                                                                               |
| `address`        | `string` | ❌ Optional | Full street address                                                                 |
| `lat`            | `number` | ❌ Optional | GPS latitude                                                                        |
| `long`           | `number` | ❌ Optional | GPS longitude                                                                       |
| `categories`     | `string` | ❌ Optional | **JSON string** (array of category strings). Example: `'["Electronics","Grocery"]'` |
| `biz_avatar`     | `File`   | ❌ Optional | Business profile picture (image file). Uploaded to R2.                              |
| `founder_avatar` | `File`   | ❌ Optional | Founder's profile picture (image file). Uploaded to R2.                             |
| `AADHAR`         | `File`   | ❌ Optional | Aadhar card for KYC verification (PDF/image). Uploaded to R2.                       |
| `PAN`            | `File`   | ❌ Optional | PAN card (PDF/image). Uploaded to R2.                                               |
| `INCOME`         | `File`   | ❌ Optional | Income proof (PDF/image). Uploaded to R2.                                           |
| `GST`            | `File`   | ❌ Optional | GST Certificate (PDF/image). Uploaded to R2.                                        |
| `OTHER`          | `File`   | ❌ Optional | Any other supporting document. Uploaded to R2.                                      |

> **Note:** Business is created with `status: "pending"`. It cannot be used until a Super Admin approves it via `/api/admin/businesses/[id]/approve`.

**On Success (201):** Sets `token` cookie. Returns `{ bizId, founderId }`.

---

### 1.4 — Login as Business (Founder/Staff)

| Method | Path                       | Auth      |
| ------ | -------------------------- | --------- |
| `POST` | `/api/auth/business/login` | 🌐 Public |

**Request Body:**

| Field      | Type     | Required                 | Description          |
| ---------- | -------- | ------------------------ | -------------------- |
| `email`    | `string` | ❌ One of these required | Login using email    |
| `mobile`   | `string` | ❌ One of these required | Login using mobile   |
| `username` | `string` | ❌ One of these required | Login using username |
| `password` | `string` | ✅ Yes                   | Account password     |

**On Success (200):** Sets `token` cookie (valid 15 mins). Returns `{ login_status: "success" }`. Business must be `active` and verified — pending/banned businesses cannot login.

---

### 1.5 — Login as Super Admin

| Method | Path                    | Auth      |
| ------ | ----------------------- | --------- |
| `POST` | `/api/auth/admin/login` | 🌐 Public |

**Request Body:**

| Field      | Type     | Required                 | Description    |
| ---------- | -------- | ------------------------ | -------------- |
| `email`    | `string` | ❌ One of these required | Admin email    |
| `mobile`   | `string` | ❌ One of these required | Admin mobile   |
| `password` | `string` | ✅ Yes                   | Admin password |

**On Success (200):** Sets `token` cookie (valid 5 hours). Returns `{ login_status: "success", user: { id, username } }`.

---

### 1.6 — Check Session

| Method | Path                     | Auth                  |
| ------ | ------------------------ | --------------------- |
| `GET`  | `/api/auth/user/session` | 🔐 Any logged-in user |

No body needed. Reads the `token` cookie and returns the decoded session.

**Response (200):**

```json
{
	"authenticated": true,
	"session": {
		"userid": "usr_...",
		"email": "dj@gmail.com",
		"username": "dj_5N49",
		"role": "user"
	}
}
```

---

### 1.7 — Logout

| Method | Path          | Auth                  |
| ------ | ------------- | --------------------- |
| `POST` | `/api/logout` | 🔐 Any logged-in user |

No body needed. Clears the `token` cookie immediately.

**Response (200):** `{ message: "Logged out successfully", action: "redirect_to_login" }`

---

## 2. My Profile (Me)

### 2.1 — Get My Profile

| Method | Path      | Auth                  |
| ------ | --------- | --------------------- |
| `GET`  | `/api/me` | 🔐 Any logged-in user |

No body needed. Automatically detects role from the session cookie and returns the correct profile.

- **User** (`role: "user"`) → returns from `user_data` table
- **Founder** (`role: "founder"`) → returns from `founder` table
- **Staff/Manager** → returns from `biz_staffs` table

---

### 2.2 — Update My Profile

| Method | Path      | Auth                  |
| ------ | --------- | --------------------- |
| `PUT`  | `/api/me` | 🔐 Any logged-in user |

**For Regular Users** (`role: "user"`):

| Field        | Type     | Description                                                                                                 |
| ------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `firstname`  | `string` | First name                                                                                                  |
| `lastname`   | `string` | Last name                                                                                                   |
| `mobile`     | `string` | Phone number                                                                                                |
| `avatar_url` | `string` | Profile picture path (R2 path)                                                                              |
| `address`    | `string` | Full address                                                                                                |
| `city`       | `string` | City                                                                                                        |
| `district`   | `string` | District                                                                                                    |
| `state`      | `string` | State                                                                                                       |
| `pincode`    | `string` | Postal code                                                                                                 |
| `theme`      | `string` | UI theme preference (`"light"` or `"dark"`)                                                                 |
| `interests`  | `array`  | **JSON Array** of category strings. Example: `["Electronics", "Grocery"]`. Replaces the existing interests. |
| `email`      | `string` | New email (updates both `user_data` and `user_login`)                                                       |
| `password`   | `string` | New password (will be hashed)                                                                               |

**For Founder/Staff** (`role: "founder"` or `"staff"`):

| Field        | Type     | Description                            |
| ------------ | -------- | -------------------------------------- |
| `name`       | `string` | Full name                              |
| `email`      | `string` | Email (updates profile and login)      |
| `mobile`     | `string` | Phone number (column is `phone` in DB) |
| `avatar_url` | `string` | Profile picture R2 path                |
| `password`   | `string` | New password (will be hashed)          |

> Only send the fields you want to update. All fields are optional.

---

### 2.3 — Get My Activity Logs

| Method | Path           | Auth                  |
| ------ | -------------- | --------------------- |
| `GET`  | `/api/me/logs` | 🔐 Any logged-in user |

**Query Parameters:**

| Param   | Description                              |
| ------- | ---------------------------------------- |
| `page`  | Page number for pagination. Default: `1` |
| `limit` | Items per page. Default: `20`            |

Returns your specific activity logs based on your role:

- **Admin**: Your admin actions from `sa_activity_log`.
- **User**: Your personal actions from `user_activity_log`.
- **Business**: Actions performed within your business from `biz_activity_log`.

**On Success (200):**

```json
{
	"message": "Activity logs fetched successfully",
	"logs": [
		{
			"nos": 1,
			"action": "Logged in",
			"timestamp": "2024-03-29 12:00:00"
		}
	],
	"pagination": {
		"total": 45,
		"page": 1,
		"limit": 20,
		"totalPages": 3
	}
}
```

---

## 3. Businesses — Public

### 3.1 — Get a Business Profile

| Method | Path                      | Auth      |
| ------ | ------------------------- | --------- |
| `GET`  | `/api/businesses/[bizId]` | 🌐 Public |

No body. Replace `[bizId]` with the business ID (e.g., `biz_01KM28...`).

**Response:** Returns the full `biz_data` row.

---

### 3.2 — Update Business Profile (Full Replace)

| Method | Path                      | Auth                  |
| ------ | ------------------------- | --------------------- |
| `PUT`  | `/api/businesses/[bizId]` | 🏪 Founder or Manager |

**Request Body** (all fields will be replaced):

| Field        | Type     | Description                                                                                                     |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| `bname`      | `string` | Business name                                                                                                   |
| `btype`      | `string` | Type: `"product"`, `"service"`, or `"both"`                                                                     |
| `about`      | `string` | Business description                                                                                            |
| `address`    | `string` | Street address                                                                                                  |
| `city`       | `string` | City                                                                                                            |
| `district`   | `string` | District                                                                                                        |
| `state`      | `string` | State                                                                                                           |
| `pincode`    | `string` | Postal code                                                                                                     |
| `avatar_url` | `string` | Business profile picture R2 path                                                                                |
| `theme`      | `string` | UI theme (`"light"` or `"dark"`)                                                                                |
| `categories` | `array`  | **JSON Array** of category strings. Example: `["Electronics", "Automotive"]`. Describe what the business sells. |

---

### 3.3 — Update Business Profile (Partial)

| Method  | Path                      | Auth                  |
| ------- | ------------------------- | --------------------- |
| `PATCH` | `/api/businesses/[bizId]` | 🏪 Founder or Manager |

Same fields as `PUT` above, but only send the fields you want to change. Unset fields remain unchanged.

---

### 3.4 — Delete Business (Founder Only)

| Method   | Path                      | Auth            |
| -------- | ------------------------- | --------------- |
| `DELETE` | `/api/businesses/[bizId]` | 🏪 Founder only |

No body. Permanently deletes the business, its login, founder profile, staff, and activity logs. Also clears the session cookie.

---

## 4. Business — Items

### 4.1 — Get Items List (Storefront)

| Method | Path                            | Auth      |
| ------ | ------------------------------- | --------- |
| `GET`  | `/api/businesses/[bizId]/items` | 🌐 Public |

**Query Parameters:**

| Param  | Description                              |
| ------ | ---------------------------------------- |
| `page` | Page number for pagination. Default: `1` |

Returns 25 items per page. Each item has: `nos`, `product_name`, `brand`, `selling_price`, and first image only (for list views).

---

### 4.2 — Add a New Item

| Method | Path                            | Auth                          |
| ------ | ------------------------------- | ----------------------------- |
| `POST` | `/api/businesses/[bizId]/items` | 🏪 Founder, Manager, or Staff |

**Request Body:**

| Field              | Type     | Required    | Description                                                                                                                                                   |
| ------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product_name`     | `string` | ✅ Yes      | Name of the product                                                                                                                                           |
| `selling_price`    | `number` | ✅ Yes      | Actual selling price in your currency                                                                                                                         |
| `brand`            | `string` | ❌ Optional | Brand name                                                                                                                                                    |
| `description`      | `string` | ❌ Optional | Product description                                                                                                                                           |
| `mrp`              | `number` | ❌ Optional | Maximum retail price (original price before discount)                                                                                                         |
| `category`         | `string` | ❌ Optional | Main category name (e.g., `"Electronics"`). Used to index the item in the global `electronics_items` table.                                                   |
| `sub_category`     | `string` | ❌ Optional | Sub-category name (e.g., `"Smartphones"`)                                                                                                                     |
| `sub_sub_category` | `string` | ❌ Optional | Deeper sub-category (e.g., `"Android Phones"`)                                                                                                                |
| `image`            | `array`  | ❌ Optional | **JSON Array** of R2 image path strings. Example: `["business/business_id_.../items/.../main.jpeg", "..."]`. These are the paths returned from `/api/upload`. |

**Example Payload:**

```json
{
	"product_name": "Samsung Galaxy S24",
	"selling_price": 74999,
	"mrp": 85000,
	"brand": "Samsung",
	"description": "Latest Samsung flagship smartphone",
	"category": "Electronics",
	"sub_category": "Smartphones",
	"sub_sub_category": "Android Phones",
	"image": ["business/business_id_biz_XYZ/items/items_itm_ABC/main.jpeg"]
}
```

---

### 4.3 — Get a Single Item Detail

| Method | Path                                     | Auth      |
| ------ | ---------------------------------------- | --------- |
| `GET`  | `/api/businesses/[bizId]/items/[itemId]` | 🌐 Public |

No body. Returns full item detail: `nos`, `product_name`, `brand`, `description`, `selling_price`, `mrp`, and `images` (parsed array).

---

### 4.4 — Update an Item (Partial)

| Method  | Path                                     | Auth                          |
| ------- | ---------------------------------------- | ----------------------------- |
| `PATCH` | `/api/businesses/[bizId]/items/[itemId]` | 🏪 Founder, Manager, or Staff |

**Request Body** (send only fields to change):

| Field              | Type     | Description                                                                |
| ------------------ | -------- | -------------------------------------------------------------------------- |
| `product_name`     | `string` | Product name                                                               |
| `brand`            | `string` | Brand name                                                                 |
| `description`      | `string` | Product description                                                        |
| `selling_price`    | `number` | Current selling price                                                      |
| `mrp`              | `number` | Original price                                                             |
| `category`         | `string` | Main category                                                              |
| `sub_category`     | `string` | Sub-category                                                               |
| `sub_sub_category` | `string` | Deeper sub-category                                                        |
| `status`           | `string` | Item availability: `"active"` or `"inactive"`                              |
| `image`            | `array`  | **JSON Array** of R2 image path strings. Replaces the existing image list. |

---

### 4.5 — Delete an Item

| Method   | Path                                     | Auth                          |
| -------- | ---------------------------------------- | ----------------------------- |
| `DELETE` | `/api/businesses/[bizId]/items/[itemId]` | 🏪 Founder, Manager, or Staff |

No body. Permanently deletes the item from the business storefront table and from the global category index table.

### 4.6 — Get Business Analytics

| Method | Path                                | Auth                    |
| ------ | ----------------------------------- | ----------------------- |
| `GET`  | `/api/businesses/[bizId]/analytics` | 🏪 Business or 👑 Admin |

No body needed. Returns a summary of performance metrics for the business.
**On Success (200):**

```json
{
	"message": "Analytics for \"Dani Business\" fetched successfully",
	"bizid": "biz_01KM...",
	"bname": "Dani Business",
	"analytics": {
		"performance": {
			"total_items": 45,
			"total_sold": 12,
			"avg_rating": 4.5,
			"total_reviews": 8
		},
		"interactions": {
			"requests_received": 150,
			"replies_sent": 120,
			"deals_accepted": 10,
			"response_rate": 80.0,
			"conversion_rate": 8.3
		},
		"recent_activity": {
			"actions_last_30_days": 25
		}
	}
}
```

---

## 5. Business — Reviews

### 5.1 — Get All Reviews for an Item

| Method | Path                                             | Auth      |
| ------ | ------------------------------------------------ | --------- |
| `GET`  | `/api/businesses/[bizId]/items/[itemId]/reviews` | 🌐 Public |

No body. Returns all reviews for the specified business (note: they belong to the business's reviews table).

---

### 5.2 — Post a Review

| Method | Path                                             | Auth         |
| ------ | ------------------------------------------------ | ------------ |
| `POST` | `/api/businesses/[bizId]/items/[itemId]/reviews` | 🔐 User only |

**Request Body:**

| Field     | Type     | Required    | Description                                                                                                             |
| --------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `rating`  | `number` | ✅ Yes      | Star rating from `1` to `5`                                                                                             |
| `comment` | `string` | ❌ Optional | Written review text                                                                                                     |
| `image`   | `array`  | ❌ Optional | **JSON Array** of R2 image path strings for review photos. Example: `["reviews/item_itm_ABC/images/review_img_1.jpeg"]` |
| `video`   | `array`  | ❌ Optional | **JSON Array** of R2 video path strings for review videos. Example: `["reviews/item_itm_ABC/videos/REVIEW_VID1.mp4"]`   |

**Example Payload:**

```json
{
	"rating": 4,
	"comment": "Great product! Fast delivery.",
	"image": ["reviews/item_itm_ABC/images/review_img_1.jpeg"]
}
```

---

### 5.3 — Delete a Review

| Method   | Path                                                        | Auth             |
| -------- | ----------------------------------------------------------- | ---------------- |
| `DELETE` | `/api/businesses/[bizId]/items/[itemId]/reviews/[reviewId]` | 🔐 Author (User) |

No body. Only the review author can delete a review.

---

## 6. Business — Staff Management

### 6.1 — Get All Staff Members

| Method | Path                            | Auth                   |
| ------ | ------------------------------- | ---------------------- |
| `GET`  | `/api/businesses/[bizId]/staff` | 🏪 Any business member |

No body. Returns the list of all staff + founder profile for the business.

---

### 6.2 — Create a Staff Account

| Method | Path                            | Auth                  |
| ------ | ------------------------------- | --------------------- |
| `POST` | `/api/businesses/[bizId]/staff` | 🏪 Founder or Manager |

**Request Body:**

| Field      | Type     | Required    | Description                                            |
| ---------- | -------- | ----------- | ------------------------------------------------------ |
| `name`     | `string` | ✅ Yes      | Full name of the staff member                          |
| `role`     | `string` | ✅ Yes      | Role: `"manager"` or `"staff"` (cannot be `"founder"`) |
| `email`    | `string` | ✅ Yes      | Email for login (must be unique across platform)       |
| `password` | `string` | ✅ Yes      | Password for their account                             |
| `mobile`   | `string` | ❌ Optional | Mobile number                                          |
| `location` | `string` | ❌ Optional | Branch or location assignment (free text)              |

**Example Payload:**

```json
{
	"name": "Ravi Kumar",
	"role": "staff",
	"email": "ravi@myshop.com",
	"password": "staffpass999",
	"mobile": "9876543210",
	"location": "Anna Nagar Branch"
}
```

---

### 6.3 — Get a Specific Staff Profile

| Method | Path                                 | Auth                   |
| ------ | ------------------------------------ | ---------------------- |
| `GET`  | `/api/businesses/[bizId]/staff/[id]` | 🏪 Any business member |

No body. Replace `[id]` with the staff member's ID. Also works if you pass the founder's ID.

---

### 6.4 — Update a Staff Profile

| Method | Path                                 | Auth                  |
| ------ | ------------------------------------ | --------------------- |
| `PUT`  | `/api/businesses/[bizId]/staff/[id]` | 🏪 Founder or Manager |

**Request Body** (send only what needs to be updated):

| Field      | Type     | Description                                                                  |
| ---------- | -------- | ---------------------------------------------------------------------------- |
| `name`     | `string` | Full name                                                                    |
| `role`     | `string` | `"manager"` or `"staff"` (cannot promote to `"founder"`)                     |
| `email`    | `string` | New email (updates both profile and login)                                   |
| `phone`    | `string` | New mobile number (maps to `phone` in `biz_staffs`, `mobile` in `biz_login`) |
| `location` | `string` | Branch location                                                              |
| `status`   | `string` | Account status                                                               |

> Managers cannot edit other managers.

---

### 6.5 — Delete a Staff Member

| Method   | Path                                 | Auth                  |
| -------- | ------------------------------------ | --------------------- |
| `DELETE` | `/api/businesses/[bizId]/staff/[id]` | 🏪 Founder or Manager |

No body. Cannot delete the founder or yourself. Managers cannot delete other managers.

---

## 7. Reports

### 7.1 — Report a Business

| Method | Path                    | Auth                  |
| ------ | ----------------------- | --------------------- |
| `POST` | `/api/reports/business` | 🔐 Any logged-in user |

**Request Body:**

| Field      | Type     | Required    | Description                                                      |
| ---------- | -------- | ----------- | ---------------------------------------------------------------- |
| `targetId` | `string` | ✅ Yes      | The `id` of the business being reported (from `biz_data`)        |
| `reason`   | `string` | ✅ Yes      | Short reason for the report (e.g., `"Fraud"`, `"Spam listings"`) |
| `details`  | `string` | ❌ Optional | Additional details or evidence description                       |

---

### 7.2 — Report a User

| Method | Path                | Auth                  |
| ------ | ------------------- | --------------------- |
| `POST` | `/api/reports/user` | 🔐 Any logged-in user |

**Request Body:**

| Field      | Type     | Required    | Description                                            |
| ---------- | -------- | ----------- | ------------------------------------------------------ |
| `targetId` | `string` | ✅ Yes      | The `id` of the user being reported (from `user_data`) |
| `reason`   | `string` | ✅ Yes      | Short reason for the report                            |
| `details`  | `string` | ❌ Optional | Additional details                                     |

---

### 7.3 — Get a Specific Business Report

| Method | Path                               | Auth                    |
| ------ | ---------------------------------- | ----------------------- |
| `GET`  | `/api/reports/business/[reportId]` | 🔐 Reporter or 👑 Admin |

No body. Returns the full report including the business name.

---

### 7.4 — Get a Specific User Report

| Method | Path                           | Auth                    |
| ------ | ------------------------------ | ----------------------- |
| `GET`  | `/api/reports/user/[reportId]` | 🔐 Reporter or 👑 Admin |

No body. Returns the report including the target user's name.

---

### 7.5 — Get All Reports (Admin)

| Method | Path           | Auth     |
| ------ | -------------- | -------- |
| `GET`  | `/api/reports` | 👑 Admin |

**Query Parameters:**

| Param    | Values                       | Description                   |
| -------- | ---------------------------- | ----------------------------- |
| `page`   | number                       | Page number. Default: `1`     |
| `limit`  | number                       | Items per page. Default: `20` |
| `status` | `open`, `resolved`, `closed` | Filter by report status       |
| `type`   | `user`, `business`           | Filter by report target type  |

---

### 7.6 — Resolve a Report (Admin)

| Method | Path                              | Auth     |
| ------ | --------------------------------- | -------- |
| `PUT`  | `/api/reports/[reportId]/resolve` | 👑 Admin |

**Request Body:**

| Field             | Type     | Required    | Description                               |
| ----------------- | -------- | ----------- | ----------------------------------------- |
| `status`          | `string` | ❌ Optional | `"resolved"` (default) or `"closed"`      |
| `resolutionNotes` | `string` | ❌ Optional | Admin notes on how the report was handled |

---

## 8. File Upload (R2)

### 8.1 — Upload File

| Method | Path          | Auth                  |
| ------ | ------------- | --------------------- |
| `POST` | `/api/upload` | 🔐 Any logged-in user |

**Content-Type**: `multipart/form-data` 📎

Uploads a file to Cloudflare R2. Returns the `path` (object key) you can then save to the database.

**Form Fields:**

| Field       | Type     | Required    | Description                                                                                |
| ----------- | -------- | ----------- | ------------------------------------------------------------------------------------------ |
| `file`      | `File`   | ✅ Yes      | The actual file to upload                                                                  |
| `type`      | `string` | ✅ Yes      | Upload type (controls folder structure). See table below.                                  |
| `userId`    | `string` | Conditional | Required when `type` is `user-profile`                                                     |
| `bizId`     | `string` | Conditional | Required when `type` is `business-profile`, `business-docs`, or `business-item`            |
| `docName`   | `string` | Conditional | Required when `type` is `business-docs`. One of: `AADHAR`, `PAN`, `INCOME`, `GST`, `OTHER` |
| `itemId`    | `string` | Conditional | Required when `type` is `business-item`, `review-image`, or `review-video`                 |
| `imageName` | `string` | ❌ Optional | Custom image name (e.g., `"front"`, `"side"`). Default: `"main"`                           |
| `num`       | `string` | Conditional | Required for `review-image` and `review-video`. The index number, e.g., `"1"`, `"2"`       |

**Upload `type` values and resulting R2 paths:**

| `type`             | Resulting R2 Path                                                     |
| ------------------ | --------------------------------------------------------------------- |
| `user-profile`     | `user/{userId}/profile/{userId}_pic.{ext}`                            |
| `business-profile` | `business/business_id_{bizId}/profile/{bizId}_pic.{ext}`              |
| `business-docs`    | `business/business_id_{bizId}/docs/{docName}.{ext}`                   |
| `business-item`    | `business/business_id_{bizId}/items/items_{itemId}/{imageName}.{ext}` |
| `review-image`     | `reviews/item{itemId}/images/review_img_{num}.{ext}`                  |
| `review-video`     | `reviews/item{itemId}/videos/REVIEW_VID{num}.{ext}`                   |

**Response (201):**

```json
{
	"message": "File uploaded instantly to R2 bucket!",
	"path": "business/business_id_.../items/.../main.jpeg",
	"size": 102400,
	"format": "image/jpeg"
}
```

> Save the returned `path` and use it as the `avatar_url`, `image`, or other field in subsequent API calls.

---

## 9. Pincode Lookup

### 9.1 — Lookup Pincode

| Method | Path                      | Auth      |
| ------ | ------------------------- | --------- |
| `GET`  | `/api/pincodes/[pincode]` | 🌐 Public |

No body. Replace `[pincode]` with a 6-digit Indian postal code (e.g., `/api/pincodes/609309`).

**Response (200):**

```json
{
	"message": "Pincode found",
	"data": [
		{
			"city": "Sembanarkoil",
			"district": "MAYILADUTHURAI",
			"state": "TAMIL NADU",
			"lat": 11.012,
			"long": 79.451
		}
	]
}
```

---

## 10. Admin — Businesses

### 10.1 — List All Businesses

| Method | Path                    | Auth     |
| ------ | ----------------------- | -------- |
| `GET`  | `/api/admin/businesses` | 👑 Admin |

**Query Parameters:** `page`, `limit`

Returns paginated list of all businesses: `id`, `bname`, `emails`, `phones`, `btype`, `city`, `state`, `IsVerified`, `status`, `created_at`.

---

### 10.2 — List Pending Businesses

| Method | Path                            | Auth     |
| ------ | ------------------------------- | -------- |
| `GET`  | `/api/admin/businesses/pending` | 👑 Admin |

**Query Parameters:** `page`, `limit`

Returns only businesses with `status = "pending"` or `IsVerified = 0`. Also includes the R2 paths of all uploaded KYC documents for easy review.

---

### 10.3 — Get Full Business Details

| Method | Path                         | Auth     |
| ------ | ---------------------------- | -------- |
| `GET`  | `/api/admin/businesses/[id]` | 👑 Admin |

No body. Returns complete `biz_data`, `founder`, and all uploaded KYC document paths from R2.

---

### 10.4 — Approve a Business

| Method | Path                                 | Auth     |
| ------ | ------------------------------------ | -------- |
| `POST` | `/api/admin/businesses/[id]/approve` | 👑 Admin |

No body. Sets business `status` to `"active"` and `IsVerified` to `1`. Also creates ALL the dynamic tables for this business:

- `biz_<username>_items`
- `biz_<username>_reviews`
- `biz_<username>_request`
- `biz_<username>_replies`
- `biz_<username>_acceptance`

---

## 11. Admin — Users

### 11.1 — List All Users

| Method | Path               | Auth     |
| ------ | ------------------ | -------- |
| `GET`  | `/api/admin/users` | 👑 Admin |

**Query Parameters:** `page`, `limit`

Returns paginated list of users: `id`, `firstname`, `lastname`, `email`, `phone`, `city`, `state`, `status`, `created_at`.

---

### 11.2 — Get a Specific User

| Method | Path                    | Auth     |
| ------ | ----------------------- | -------- |
| `GET`  | `/api/admin/users/[id]` | 👑 Admin |

No body. Returns the full `user_data` row.

---

## 12. Admin — Founders

### 12.1 — List All Founders

| Method | Path                  | Auth     |
| ------ | --------------------- | -------- |
| `GET`  | `/api/admin/founders` | 👑 Admin |

**Query Parameters:** `page`, `limit`

Returns all founders with their associated business name (`bname`).

---

### 12.2 — Get a Specific Founder

| Method | Path                       | Auth     |
| ------ | -------------------------- | -------- |
| `GET`  | `/api/admin/founders/[id]` | 👑 Admin |

No body. Returns full `founder` row + their associated business summary.

---

## 13. Admin — Categories

### 13.1 — Get All Categories (Public + Admin)

| Method | Path                    | Auth      |
| ------ | ----------------------- | --------- |
| `GET`  | `/api/admin/categories` | 🌐 Public |

**Query Parameters:**

| Param  | Values               | Description               |
| ------ | -------------------- | ------------------------- |
| `type` | `product`, `service` | Filter categories by type |

Returns a nested tree of categories and sub-categories.

---

### 13.2 — Create a Category or Sub-Category

| Method | Path                    | Auth     |
| ------ | ----------------------- | -------- |
| `POST` | `/api/admin/categories` | 👑 Admin |

**Request Body:**

| Field       | Type     | Required    | Description                                                                                                                                                       |
| ----------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cat_name`  | `string` | ✅ Yes      | Name of the category or sub-category                                                                                                                              |
| `type`      | `string` | ✅ Yes      | `"product"` or `"service"`                                                                                                                                        |
| `parent_id` | `string` | ❌ Optional | If omitted, creates a **root-level** category (level 0). If provided, creates a nested sub-category under this parent. Can be a `cat_id` or another `sub_cat_id`. |

**Example — Create Root Category:**

```json
{
	"cat_name": "Furniture",
	"type": "product"
}
```

**Example — Create Sub-Category:**

```json
{
	"cat_name": "Sofa & Couches",
	"type": "product",
	"parent_id": "cat_home"
}
```

---

### 13.3 — Update a Category / Sub-Category

| Method | Path                         | Auth     |
| ------ | ---------------------------- | -------- |
| `PUT`  | `/api/admin/categories/[id]` | 👑 Admin |

**Request Body:**

| Field      | Type     | Required    | Description                                                       |
| ---------- | -------- | ----------- | ----------------------------------------------------------------- |
| `cat_name` | `string` | ✅ Yes      | New name for the category                                         |
| `type`     | `string` | ❌ Optional | `"product"` or `"service"`. If not sent, keeps the existing type. |

> `[id]` must begin with `cat_` for root categories or `sub_` for sub-categories.

---

### 13.4 — Delete a Category / Sub-Category

| Method   | Path                         | Auth     |
| -------- | ---------------------------- | -------- |
| `DELETE` | `/api/admin/categories/[id]` | 👑 Admin |

No body. Deletes the category and all its immediate children. Use `cat_` IDs for root, `sub_` for sub-categories.

---

## 14. Admin — Activity Logs

### 14.1 — Get Activity Logs

| Method | Path                     | Auth     |
| ------ | ------------------------ | -------- |
| `GET`  | `/api/admin/logs/[type]` | 👑 Admin |

Replace `[type]` with one of:

| `type`       | Description                                              |
| ------------ | -------------------------------------------------------- |
| `users`      | Last 100 user activity entries (with user email)         |
| `businesses` | Last 100 business activity entries (with business name)  |
| `sa`         | Last 100 Super Admin activity entries (with admin email) |

No body.

---

## Database — JSON Field Reference

Several fields in the database store **JSON strings**. Here is a full breakdown:

### `biz_data.emails` — Array of email objects

```json
[
	{ "email": "contact@mybiz.com", "purpose": "primary" },
	{ "email": "support@mybiz.com", "purpose": "support" }
]
```

| Key       | Type     | Description                                           |
| --------- | -------- | ----------------------------------------------------- |
| `email`   | `string` | Email address                                         |
| `purpose` | `string` | Label for this email (e.g., `"primary"`, `"billing"`) |

---

### `biz_data.phones` — Array of phone objects

```json
[{ "phone": "9999999999", "purpose": "primary" }]
```

| Key       | Type     | Description                             |
| --------- | -------- | --------------------------------------- |
| `phone`   | `string` | Phone number                            |
| `purpose` | `string` | Label (e.g., `"primary"`, `"whatsapp"`) |

---

### `biz_data.categories` — Array of category strings

```json
["Electronics", "Home & Kitchen"]
```

Free-text category names that describe what the business deals in.

---

### `user_data.interests` — Array of interest strings

```json
["Electronics", "Grocery", "Fashion"]
```

Category names the user is interested in (used for personalization/feed).

---

### `biz_<username>_items.image` — Array of R2 path strings

```json
[
	"business/business_id_biz_ABC/items/items_itm_XYZ/main.jpeg",
	"business/business_id_biz_ABC/items/items_itm_XYZ/side.jpeg"
]
```

Each string is an R2 object key returned from `/api/upload`.

---

### `biz_<username>_reviews.image` — Array of R2 image paths

```json
["reviews/itemitm_XYZ/images/review_img_1.jpeg"]
```

---

### `biz_<username>_reviews.video` — Array of R2 video paths

```json
["reviews/itemitm_XYZ/videos/REVIEW_VID1.mp4"]
```

---

### `messages.payload` — Message payload object

```json
{
	"type": "text",
	"content": "Hey, how are you?",
	"is_read": false
}
```

| Key       | Type      | Description                                                                     |
| --------- | --------- | ------------------------------------------------------------------------------- |
| `type`    | `string`  | Message type. Currently: `"text"`. Can be extended to `"image"`, `"file"`, etc. |
| `content` | `string`  | The actual message text                                                         |
| `is_read` | `boolean` | Whether the receiver has read the message. `false` = unread, `true` = read.     |

---

### `user_<username>_request.sub_categories` — Array of sub-category strings

```json
["Smartphones", "Android Phones"]
```

The user can specify narrower sub-categories for their request.

---

## Status Values Reference

### `user_data.status`

| Value      | Meaning                   |
| ---------- | ------------------------- |
| `active`   | Normal active user        |
| `inactive` | User suspended themselves |
| `banned`   | Banned by admin           |

### `biz_data.status`

| Value      | Meaning                                   |
| ---------- | ----------------------------------------- |
| `pending`  | Newly registered, awaiting admin approval |
| `active`   | Verified and live                         |
| `inactive` | Temporarily disabled                      |
| `banned`   | Permanently banned by admin               |

### `user_<username>_request.status`

| Value         | Meaning                                                   |
| ------------- | --------------------------------------------------------- |
| `open`        | Default. Request is live and waiting for business replies |
| `closed`      | Cancelled by the user                                     |
| `accepted`    | User has accepted a business's quote/offer                |
| `b_completed` | Business marks the job/service as done                    |
| `completed`   | User confirms and closes the request as fully completed   |

### `reports.status`

| Value      | Meaning                        |
| ---------- | ------------------------------ |
| `open`     | New report, not yet reviewed   |
| `resolved` | Admin reviewed and took action |
| `closed`   | Admin dismissed the report     |

### `biz_<username>_items.status`

| Value      | Meaning               |
| ---------- | --------------------- |
| `active`   | Visible to customers  |
| `inactive` | Hidden from customers |
