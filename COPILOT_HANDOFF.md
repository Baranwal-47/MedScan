# COPILOT_HANDOFF

Generated: 2026-03-18
Workspace root: d:/Docs/Computer/PR Proj_AS/MedScan

This handoff is designed for a fresh Copilot session with no prior context. It captures architecture, route ownership, completed changes, unresolved risks, and exact next actions.

## 1. Project Architecture (current state)

### 1.1 Workspaces

1. mongodb_backend (port 5000)
- Stack: Express + Mongoose + JWT auth + Nodemailer.
- Purpose: Primary API for medicines, auth, cart, orders, notifications.
- Entry: mongodb_backend/src/server.js.
- Base API prefix: /api.

2. PrescriptionManagement (port 3000)
- Stack: React + TypeScript + Wouter + TanStack Query + Axios + Vite.
- Purpose: Web client and UI flows (auth, store, cart, checkout, payment simulation, orders, admin dashboard, notifications, OCR-assisted scan pages/components).
- Routing entry: PrescriptionManagement/client/src/App.tsx.
- API client roots:
  - Fetch wrapper: PrescriptionManagement/client/src/lib/queryClient.ts
  - Axios services: PrescriptionManagement/client/src/services/*.ts

3. scraping_backend
- Stack: Node + Puppeteer + MongoDB native driver.
- Purpose: Scrapes medicine catalog data and writes to MongoDB.
- Entry: scraping_backend/node-scraper/scraper.js.

### 1.2 Frontend to backend communication

- Canonical API env: VITE_API_URL in PrescriptionManagement/.env.
- Normalization pattern used across client code:
  - Read VITE_API_URL with fallback http://localhost:5000
  - Trim trailing slash
  - If value does not end with /api, append /api
- Implemented in:
  - PrescriptionManagement/client/src/lib/queryClient.ts:3-4
  - PrescriptionManagement/client/src/context/AuthContext.tsx:33-34
  - PrescriptionManagement/client/src/services/api.ts:4-5
  - PrescriptionManagement/client/src/services/cartApi.ts:4-5
  - PrescriptionManagement/client/src/services/orderApi.ts:4-5
  - PrescriptionManagement/client/src/services/notificationApi.ts:4-5
  - PrescriptionManagement/client/src/pages/scan-prescription.tsx:33-34
  - PrescriptionManagement/client/src/components/prescription/scan-modal.tsx:21-22

### 1.3 Auth pattern

- Backend auth:
  - JWT signed with JWT_SECRET.
  - Auth middleware reads Authorization header Bearer token and loads user.
  - Files:
    - mongodb_backend/src/routes/auth.js:11 (token generation)
    - mongodb_backend/src/middleware/authMiddleware.js:12 (verify)

- Frontend auth:
  - Token stored in localStorage under key token.
  - Axios interceptors add Authorization: Bearer <token>.
  - AuthContext uses fetch for auth endpoints and includes Bearer token for profile requests.
  - Files:
    - PrescriptionManagement/client/src/context/AuthContext.tsx
    - PrescriptionManagement/client/src/services/cartApi.ts
    - PrescriptionManagement/client/src/services/orderApi.ts
    - PrescriptionManagement/client/src/services/notificationApi.ts

## 2. Complete Route Map

### 2.1 Frontend routes (Wouter)
Source: PrescriptionManagement/client/src/App.tsx

Public routes:
- /login -> LoginPage
- /signup -> SignUpPage
- /forgot-password -> ForgotPasswordPage
- /reset/:token -> ResetPasswordPage
- / -> StorePage
- /medicine/:id -> MedicineDetailPage
- /scan -> scan-prescription page
- /scan-prescription -> scan-prescription page
- /prescriptions/:id -> prescription-detail page
- /profile -> ProfilePage (currently not wrapped by ProtectedRoute)

Protected routes:
- /cart -> CartPage (ProtectedRoute)
- /checkout -> CheckoutPage (ProtectedRoute)
- /payment/:orderId -> PaymentPage (ProtectedRoute)
- /my-orders -> MyOrdersPage (ProtectedRoute)
- /notifications -> NotificationsPage (ProtectedRoute)
- /my-medicines -> MyMedicinesPage (ProtectedRoute)

Admin route:
- /admin/dashboard -> AdminDashboardPage (AdminRoute)

Fallback:
- * -> not-found page

### 2.2 Backend API routes by owner file

Server mount table:
Source: mongodb_backend/src/server.js
- /api/health -> inline health handler in server.js
- /api/auth -> mongodb_backend/src/routes/auth.js
- /api/medicines -> mongodb_backend/src/routes/medicines.js
- /api/cart -> mongodb_backend/src/routes/cart.js
- /api/orders -> mongodb_backend/src/routes/orders.js
- /api/notifications -> mongodb_backend/src/routes/notification.js

Auth endpoints (mongodb_backend/src/routes/auth.js)
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset/:token
- GET /api/auth/profile (auth required)
- PUT /api/auth/profile (auth required)

Medicine endpoints (mongodb_backend/src/routes/medicines.js)
- GET /api/medicines/stats
- GET /api/medicines/search
- GET /api/medicines/my (auth required)
- GET /api/medicines/my-delivered (auth required)
- GET /api/medicines/history/:medicineId (auth required)
- GET /api/medicines
- GET /api/medicines/:id

Cart endpoints (mongodb_backend/src/routes/cart.js)
- GET /api/cart (auth required)
- POST /api/cart/add (auth required)
- PUT /api/cart/update (auth required)
- DELETE /api/cart/remove/:medicineId (auth required)
- DELETE /api/cart/clear (auth required)

Order endpoints (mongodb_backend/src/routes/orders.js)
- POST /api/orders/create (auth required)
- GET /api/orders/my-orders (auth required)
- GET /api/orders/my-medicines (auth required)
- GET /api/orders/admin/all (auth required, admin-only)
- PUT /api/orders/admin/:orderId/status (auth required, admin-only)
- GET /api/orders/:orderId (auth required, owner-or-admin)
- GET /api/orders/medicine-history/:medicineId (auth required)

Notification endpoints (mongodb_backend/src/routes/notification.js)
- GET /api/notifications (auth required)
- PUT /api/notifications/:notificationId/read (auth required)
- PUT /api/notifications/mark-all-read (auth required)
- GET /api/notifications/unread-count (auth required)
- DELETE /api/notifications/:notificationId (auth required)

### 2.3 Admin-only endpoint list

- GET /api/orders/admin/all
- PUT /api/orders/admin/:orderId/status

Admin enforcement:
- mongodb_backend/src/routes/orders.js:8-13 requireAdmin middleware
- mongodb_backend/src/routes/orders.js:211 admin list route guard
- mongodb_backend/src/routes/orders.js:245 admin status update route guard

## 3. Everything Fixed This Session (with file paths and line numbers where possible)

Grouped by category. Line numbers are current where still applicable; deleted files have no current line reference.

### 3.1 Dependency cleanup

- Removed deprecated crypto npm package from backend (Node built-in crypto is used in auth route).
  - mongodb_backend/package.json

- Pruned unused legacy dependencies from frontend workspace package manifest (Drizzle, DeepSeek/OpenAI-related, session/passport/ws-related, extra type packages) and removed db:push script.
  - PrescriptionManagement/package.json

- Added axios as direct dependency after service-layer checks/build exposed missing module.
  - PrescriptionManagement/package.json

- Added scraper run script.
  - scraping_backend/node-scraper/package.json

### 3.2 Dead page/route removal and structural cleanup

- Removed obsolete pages/routes and route references from App and navigation during cleanup passes.
  - Deleted: PrescriptionManagement/client/src/pages/orders.tsx
  - Deleted: PrescriptionManagement/client/src/pages/medications.tsx
  - Deleted: PrescriptionManagement/client/src/pages/reminders.tsx
  - Deleted: PrescriptionManagement/client/src/pages/OrdersPage.tsx
  - Deleted: PrescriptionManagement/client/src/pages/dashboard.tsx
  - Updated: PrescriptionManagement/client/src/App.tsx
  - Updated: PrescriptionManagement/client/src/components/layout/mobile-navigation.tsx

- Retired obsolete TS backend artifacts in PrescriptionManagement server layer.
  - Deleted: PrescriptionManagement/server/routes.ts
  - Deleted: PrescriptionManagement/server/storage.ts
  - Deleted: PrescriptionManagement/shared/schema.ts
  - Deleted: PrescriptionManagement/drizzle.config.ts
  - Updated: PrescriptionManagement/server/index.ts

- Removed obsolete files verified as unreferenced.
  - Deleted: PrescriptionManagement/server/ocr-space.ts
  - Deleted: PrescriptionManagement/structure.md

### 3.3 API base URL normalization

- Unified VITE_API_URL normalization logic to avoid duplicate /api or missing /api.
  - PrescriptionManagement/client/src/lib/queryClient.ts:3-4
  - PrescriptionManagement/client/src/context/AuthContext.tsx:33-34
  - PrescriptionManagement/client/src/services/api.ts:4-5
  - PrescriptionManagement/client/src/services/cartApi.ts:4-5
  - PrescriptionManagement/client/src/services/orderApi.ts:4-5
  - PrescriptionManagement/client/src/services/notificationApi.ts:4-5

### 3.4 Hardcoded localhost removal

- Replaced hardcoded localhost call in MyMedicines page with service-based call.
  - PrescriptionManagement/client/src/pages/MyMedicinesPage.tsx

- Replaced hardcoded localhost medicine search in scan-prescription page with normalized API base.
  - PrescriptionManagement/client/src/pages/scan-prescription.tsx

- scan-modal now uses normalized API base for medicine search.
  - PrescriptionManagement/client/src/components/prescription/scan-modal.tsx:21-22

### 3.5 Broken endpoint fixes

- orderApi corrected to clean GET for my-medicines (removed redundant per-call headers/method override).
  - PrescriptionManagement/client/src/services/orderApi.ts

- scan-prescription page moved from nonexistent /api/scan-prescription to OCR + /api/medicines/search flow.
  - PrescriptionManagement/client/src/pages/scan-prescription.tsx

- pharmacy selector endpoint mapping:
  - /api/orders -> /api/orders/create
  - Removed nonexistent /api/order-items call; replaced with explicit console.warn and cart-derived behavior note.
  - PrescriptionManagement/client/src/components/pharmacy/pharmacy-selector.tsx:98 warning text

- medication detail modal endpoint mapping:
  - /api/orders -> /api/orders/create
  - PrescriptionManagement/client/src/components/medication/medication-detail-modal.tsx

- scan-modal endpoint mapping:
  - Removed nonexistent /api/scan-prescription call.
  - Implemented OCR text extraction + /api/medicines/search mutation path.
  - PrescriptionManagement/client/src/components/prescription/scan-modal.tsx

### 3.6 Security hardening

- Added role field on user model.
  - mongodb_backend/src/models/User.js:8

- Added role to login response payload.
  - mongodb_backend/src/routes/auth.js:63

- Added requireAdmin middleware and applied to admin order routes.
  - mongodb_backend/src/routes/orders.js:8-13
  - mongodb_backend/src/routes/orders.js:211
  - mongodb_backend/src/routes/orders.js:245

### 3.7 TypeScript/config fixes

- Fixed Vite server typing in PrescriptionManagement server wrapper.
  - PrescriptionManagement/server/vite.ts (allowedHosts literal typing)

- Removed stale shared references from TS and Vite config after shared removal.
  - PrescriptionManagement/tsconfig.json
  - PrescriptionManagement/vite.config.ts

- Updated axios interceptor typings to align with axios v1 internal config types.
  - PrescriptionManagement/client/src/services/cartApi.ts
  - PrescriptionManagement/client/src/services/orderApi.ts

### 3.8 Data/config alignment fixes

- Mongo database alignment to prescription-medicine across backend and scraper.
  - mongodb_backend/.env
  - mongodb_backend/src/config/database.js
  - mongodb_backend/src/scripts/addPrescriptionField.js
  - scraping_backend/node-scraper/.env
  - scraping_backend/node-scraper/scraper.js

## 4. Current Known Issues (unresolved)

1. Cart-state dependency risk for new /api/orders/create mappings
- pharmacy-selector and medication-detail-modal now call /api/orders/create.
- Backend create route builds order strictly from authenticated cart contents.
- If cart is empty, API returns Cart is empty and these UI flows fail.
- Files:
  - PrescriptionManagement/client/src/components/pharmacy/pharmacy-selector.tsx
  - PrescriptionManagement/client/src/components/medication/medication-detail-modal.tsx
  - Backend contract: mongodb_backend/src/routes/orders.js:30-109

2. AdminRoute still checks user name, not role
- Current guard blocks unless user.name equals Utkarsh.
- This bypasses newly added role model semantics and should be replaced with user.role === admin.
- File: PrescriptionManagement/client/src/components/AdminRoute.tsx:8

3. Profile route is not wrapped by ProtectedRoute in App
- /profile route currently mounted directly.
- It may bounce based on API response but should be protected in router definition for consistency.
- File: PrescriptionManagement/client/src/App.tsx

4. scan-modal upload button handler is odd
- Button onClick currently toggles manual mode or references handleFileInputChange function object instead of opening file input directly.
- Existing UI remains intact per requirement, but this is fragile behavior.
- File: PrescriptionManagement/client/src/components/prescription/scan-modal.tsx

5. Payment flow is simulated, not gateway-backed
- PaymentPage uses random success/failure simulation and no actual provider transaction.
- File: PrescriptionManagement/client/src/pages/PaymentPage.tsx

6. Sensitive values are present in env files in repository workspace
- DB and email credentials are currently present in local env files.
- Recommend immediate rotation before production use.

## 5. Phase 2 Status

### Task 1 - Role field

Already done:
- role field added to User schema.
  - mongodb_backend/src/models/User.js:8
- role returned in login response.
  - mongodb_backend/src/routes/auth.js:63
- admin guard added on order admin endpoints.
  - mongodb_backend/src/routes/orders.js:8-13, 211, 245

Still needed:
- Create and run setAdmin.js seed/update script to promote intended admin account(s).
  - Suggested file: mongodb_backend/src/scripts/setAdmin.js
- Verify and fix frontend admin route gate to use role.
  - Current file to update: PrescriptionManagement/client/src/components/AdminRoute.tsx
  - Target behavior: block unless user.role === admin

### Task 2 - Razorpay

Status:
- Not started.

Backend entry point:
- mongodb_backend/src/routes/orders.js

Frontend entry points:
- PrescriptionManagement/client/src/pages/CheckoutPage.tsx
- PrescriptionManagement/client/src/pages/PaymentPage.tsx
- PrescriptionManagement/client/src/services/orderApi.ts

Required API client additions in orderApi.ts:
- createRazorpayOrder(orderId or payload)
- verifyRazorpayPayment(payment verification payload)

Expected backend additions in orders.js (Phase 2):
- POST /api/orders/razorpay/create-order
- POST /api/orders/razorpay/verify

## 6. Key File Registry

- mongodb_backend/src/server.js - Express app bootstrap, middleware stack, route mounts, /api/health, port binding.
- mongodb_backend/src/models/User.js - User schema, password hashing, password match method, role field now exists.
- mongodb_backend/src/routes/auth.js - Registration, login, forgot/reset password, profile get/update, JWT issuance.
- mongodb_backend/src/routes/orders.js - Order creation from cart, user orders/medicine history, admin list/update with requireAdmin guard.
- mongodb_backend/src/routes/medicines.js - Public medicine listing/details/search/stats plus authenticated delivered medicine/history endpoints.
- mongodb_backend/src/routes/cart.js - Authenticated cart CRUD and cart total recalculation.
- PrescriptionManagement/client/src/App.tsx - Frontend route table and provider composition.
- PrescriptionManagement/client/src/context/AuthContext.tsx - Auth state lifecycle, token storage, auth/profile API calls.
- PrescriptionManagement/client/src/context/CartContext.tsx - Cart state/actions wired to cart API service.
- PrescriptionManagement/client/src/lib/queryClient.ts - Fetch wrapper and URL resolver based on VITE_API_URL.
- PrescriptionManagement/client/src/services/orderApi.ts - Axios order service for create/get/list/admin/status/my-medicines/history.
- PrescriptionManagement/client/src/pages/StorePage.tsx - Primary medicine catalog page (home route).
- PrescriptionManagement/client/src/pages/CheckoutPage.tsx - Shipping/payment-method capture and order creation trigger.
- PrescriptionManagement/client/src/pages/PaymentPage.tsx - Current simulated payment UX and order completion redirect.
- PrescriptionManagement/client/src/pages/MyOrdersPage.tsx - User order history and status display.
- PrescriptionManagement/client/src/pages/AdminDashboardPage.tsx - Admin order list/filter/stats/status transitions.
- PrescriptionManagement/client/src/components/AdminRoute.tsx - Current admin route gate (name-based, must be role-based).

## 7. Environment Variables Required

### mongodb_backend/.env
Required for backend startup and core features:
- MONGO_URI
- MONGO_DB_NAME
- PORT
- FRONTEND_URL
- NODE_ENV
- JWT_SECRET
- EMAIL_HOST
- EMAIL_PORT
- EMAIL_USER
- EMAIL_PASS

Present in env and currently optional in active runtime path:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Razorpay placeholders for Phase 2 (add/keep in backend env):
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

### PrescriptionManagement/.env
Required for frontend/dev host behavior:
- VITE_API_URL
- PORT

Used by OCR-assisted UI features:
- OCR_API_KEY

Optional dev/runtime flags read by Vite config:
- NODE_ENV
- REPL_ID

### scraping_backend/node-scraper/.env
Required for scraper:
- MONGO_URI
- MONGO_DB_NAME

## 8. Next Session Start Instructions

1. Read this file first
- COPILOT_HANDOFF.md at project root.

2. Read these files before touching anything
- mongodb_backend/src/server.js
- mongodb_backend/src/models/User.js
- mongodb_backend/src/routes/auth.js
- mongodb_backend/src/routes/orders.js
- mongodb_backend/src/routes/medicines.js
- mongodb_backend/src/routes/cart.js
- PrescriptionManagement/client/src/App.tsx
- PrescriptionManagement/client/src/components/AdminRoute.tsx
- PrescriptionManagement/client/src/context/AuthContext.tsx
- PrescriptionManagement/client/src/lib/queryClient.ts
- PrescriptionManagement/client/src/services/orderApi.ts
- PrescriptionManagement/client/src/pages/CheckoutPage.tsx
- PrescriptionManagement/client/src/pages/PaymentPage.tsx
- PrescriptionManagement/client/src/components/pharmacy/pharmacy-selector.tsx
- PrescriptionManagement/client/src/components/medication/medication-detail-modal.tsx
- PrescriptionManagement/client/src/components/prescription/scan-modal.tsx

3. First task to execute
- Implement setAdmin.js script to set role=admin for the intended account(s).
- Suggested script location: mongodb_backend/src/scripts/setAdmin.js
- Validate by logging in and verifying admin endpoints:
  - GET /api/orders/admin/all
  - PUT /api/orders/admin/:orderId/status

4. Then execute Razorpay integration in order
- Step 1: Backend
  - Add Razorpay SDK wiring in mongodb_backend.
  - Add routes in orders.js:
    - POST /api/orders/razorpay/create-order
    - POST /api/orders/razorpay/verify
  - Ensure verification updates order payment state and order status progression.

- Step 2: API service layer
  - Add to PrescriptionManagement/client/src/services/orderApi.ts:
    - createRazorpayOrder(...)
    - verifyRazorpayPayment(...)

- Step 3: Checkout integration
  - In CheckoutPage.tsx, switch from direct createOrder-only flow to gateway order creation and payment initiation.

- Step 4: Payment integration
  - In PaymentPage.tsx, replace simulation with Razorpay checkout + verification callback path.

- Step 5: Admin and user validation
  - Verify successful payment appears correctly in:
    - MyOrdersPage
    - AdminDashboardPage
  - Verify failed/aborted payments are handled and surfaced cleanly.

- Step 6: Regression checks
  - Run frontend type check and build.
  - Smoke test login, cart, checkout, payment, and admin status update.

End of handoff.

## 9. Quick Verification Checklist (appendix)

Use this checklist before writing new code in the next session. It is designed to detect contract drift quickly.

### 9.1 Environment and startup

1. Confirm env files exist and variables are set:
- mongodb_backend/.env
- PrescriptionManagement/.env
- scraping_backend/node-scraper/.env

2. Start backend:
- `cd mongodb_backend`
- `npm install`
- `npm run dev`

3. Start frontend:
- `cd PrescriptionManagement`
- `npm install`
- `npm run dev`

4. Optional scraper sanity:
- `cd scraping_backend/node-scraper`
- `npm install`
- `npm run start`

5. Confirm health endpoint:
- GET http://localhost:5000/api/health
- Expected: `{ success: true, message: "Server is running" }`

### 9.2 Build and type gates

1. Frontend type check:
- In PrescriptionManagement: `npm run check`

2. Frontend production build:
- In PrescriptionManagement: `npm run build`

3. Backend syntax check (quick guard):
- In mongodb_backend:
  - `node --check src/routes/orders.js`
  - `node --check src/routes/auth.js`
  - `node --check src/models/User.js`

### 9.3 Auth and role validation

1. Register and login normal user
- POST /api/auth/register
- POST /api/auth/login
- Confirm response includes `user.role`.

2. Profile access
- GET /api/auth/profile with Bearer token
- Expected 200 with user payload.

3. Admin role gate
- Before role promotion:
  - GET /api/orders/admin/all should return 403.
- After running setAdmin.js:
  - GET /api/orders/admin/all should return 200 for admin user.
  - PUT /api/orders/admin/:orderId/status should return 200 for admin user.

### 9.4 Core user flow validation

1. Store
- Open `/` and verify medicine list loads from /api/medicines.

2. Cart
- Add item from store.
- Verify `/api/cart/add` and cart badge updates.

3. Checkout
- Go to `/checkout` and submit shipping + payment method.
- Verify order creation uses `/api/orders/create`.

4. Payment page
- Open `/payment/:orderId`.
- Note: current flow is simulated (non-Razorpay) until Phase 2 integration.

5. Orders and notifications
- Open `/my-orders`, `/my-medicines`, `/notifications`.
- Verify data loads without 404/401 loops.

### 9.5 Endpoint contract spot-checks (manual)

Confirm these calls map to existing backend endpoints:

- Frontend service calls:
  - /orders/create
  - /orders/my-orders
  - /orders/:orderId
  - /orders/admin/all
  - /orders/admin/:orderId/status
  - /orders/my-medicines
  - /orders/medicine-history/:medicineId

- Must NOT be used (nonexistent in backend):
  - /api/orders (direct create path)
  - /api/order-items
  - /api/scan-prescription

### 9.6 Known-risk checks

1. Cart dependency on create-order
- pharmacy-selector and medication-detail-modal now use /api/orders/create.
- If cart is empty, API returns `Cart is empty`.
- Validate by testing both with and without cart contents.

2. AdminRoute implementation mismatch
- Current frontend admin gate still checks `user.name`.
- Must be updated to `user.role === 'admin'` during Task 1.

3. Profile route protection
- `/profile` is mounted without ProtectedRoute in App.tsx.
- Confirm behavior and decide if router-level guard should be added.

### 9.7 Done criteria before Phase 2 coding

Proceed only if all are true:
- Backend running on 5000 and health endpoint returns success.
- Frontend running on 3000 and can load store/cart/checkout/orders pages.
- `npm run check` and `npm run build` pass in PrescriptionManagement.
- Admin endpoints verified with admin role account.
- No lingering calls to nonexistent endpoints listed above.