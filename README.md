# MedScan — AI-Powered Medicine Delivery & Prescription Management Platform

> A full-stack medicine e-commerce platform with AI-assisted prescription scanning, real-time order tracking, automated medicine reminders, and integrated payment processing built for the Indian healthcare market.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [USPs](#unique-selling-points)

---

## Overview

MedScan is a production-grade medicine delivery platform that solves a real problem in Indian healthcare — the friction between a patient receiving a prescription and actually getting their medicines. 

The platform combines a scraped catalogue of **3,028 real medicines** from 1mg.com, AI-powered **handwritten prescription OCR** using TrOCR/Donut transformer models, **automated medicine reminders**, and a full e-commerce pipeline with Stripe payment processing.

Patients can scan a handwritten prescription, have medicines auto-identified and added to cart, pay securely, and track their order — all in one flow. Medicines not available in the catalogue redirect directly to Tata 1mg for fulfilment, ensuring zero dead ends for the patient.

---

## Key Features

### 🔬 AI Prescription Scanner
- Handwritten prescription OCR using **TrOCR** (Microsoft) and **Donut** transformer models — handles real doctor handwriting, not just printed text
- Falls back to **Tesseract.js** for client-side processing when server OCR is unavailable
- Extracted medicine names matched against the 3,028-medicine catalogue using fuzzy search
- Medicines found in catalogue → auto-added to cart
- Medicines not found → redirect to **Tata 1mg** product search page
- Prescription image stored securely on **Cloudinary**
- Prescription linked to order for pharmacist review

### 💊 Medicine Catalogue
- **3,028 medicines** scraped from 1mg.com using Puppeteer with full metadata:
  - Name, composition, manufacturer, price
  - Uses, side effects, dosage instructions
  - Prescription requirement flag (Rx)
  - Product images
- Full-text search with fuzzy matching
- Filter by category, price range, prescription requirement
- Pagination with infinite scroll support

### 🛒 E-Commerce Pipeline
- Cart management with quantity controls and real-time total calculation
- Checkout with full Indian address format support
- **Stripe payment integration** with Elements card form (test + live mode)
- Cash on Delivery (COD) support
- Order confirmation with estimated delivery dates
- Prescription-required medicines routed to pharmacist approval queue before dispatch

### 📋 Prescription & OTP Approval Flow
- Orders containing Rx medicines enter `pending_approval` status
- Pharmacist/admin reviews prescription image on admin dashboard
- One-time approval triggers order to `confirmed` status
- Patient notified via in-app notification on approval
- Doctor name and license number captured at checkout for compliance

### 🔔 Medicine Reminders & Notifications
- Automated reminder system for ordered medicines
- Configurable reminder schedules: morning / afternoon / night / custom
- In-app notification centre with unread count badge
- Notifications triggered on:
  - Order confirmed
  - Order shipped
  - Out for delivery
  - Order delivered
  - Prescription approved/rejected
  - Medicine reminder alerts
- Mark as read / mark all read / delete functionality

### 👤 User Management
- JWT-based authentication with secure token refresh
- Registration, login, forgot password, reset password via email
- Profile management with **Cloudinary** avatar upload
- Order history with full medicine purchase timeline
- My Medicines — full history of all delivered medicines across orders
- Medicine-level purchase history for tracking chronic medication usage

### 🛡️ Admin Dashboard
- Role-based access control (`user` / `admin`)
- Full order management: view, filter by status, update status
- Order status pipeline: `pending_approval → confirmed → shipped → out_for_delivery → delivered → cancelled`
- Prescription review queue
- Medicine catalogue management
- User management

### 🔐 Security
- JWT authentication with Bearer token pattern
- Route-level admin guard with role verification
- Rate limiting on auth endpoints
- Helmet.js security headers
- CORS configuration
- Payment signature verification (Stripe webhook pattern)
- Prescription data handled as sensitive — stored on Cloudinary, not in DB blobs

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Wouter | Lightweight client-side routing |
| TanStack Query (React Query) | Server state management, caching |
| Axios | HTTP client with interceptors |
| Tailwind CSS | Utility-first styling |
| shadcn/ui + Radix UI | Accessible component library |
| Framer Motion | Animations |
| @stripe/react-stripe-js | Stripe Elements card form |
| @stripe/stripe-js | Stripe.js loader |
| Tesseract.js | Client-side OCR fallback |
| Lucide React | Icon library |
| Vite | Build tool and dev server |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Mongoose + MongoDB Atlas | Database and ODM |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Stripe Node SDK | Payment processing |
| Nodemailer | Transactional email (password reset, notifications) |
| Multer | File upload handling |
| Cloudinary | Prescription image and avatar storage |
| Helmet | Security headers |
| express-rate-limit | Auth route rate limiting |
| crypto (built-in) | Payment signature verification |

### AI / OCR
| Technology | Purpose |
|---|---|
| TrOCR (Microsoft) | Transformer-based handwritten text recognition |
| Donut (Naver) | Document understanding for structured prescriptions |
| Tesseract.js | Client-side OCR fallback |
| Fuzzy search | Medicine name matching from OCR output |

### Scraping
| Technology | Purpose |
|---|---|
| Puppeteer | Headless Chrome for 1mg.com scraping |
| MongoDB Native Driver | Direct DB writes during scrape |

### Infrastructure
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (prescription-medicine cluster) |
| Cloudinary | Media storage (prescriptions, avatars) |
| Stripe | Payment processing (test + live) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                        │
│         React + TypeScript + TanStack Query             │
│                  Port 3000                              │
└─────────────────────┬───────────────────────────────────┘
                      │ VITE_API_URL (all API calls)
                      │ Bearer JWT token
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  mongodb_backend                         │
│              Node.js + Express                          │
│                  Port 5000                              │
│                                                         │
│  /api/auth          /api/medicines    /api/cart         │
│  /api/orders        /api/notifications                  │
│  /api/prescriptions /api/reminders                      │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────┐
│  MongoDB Atlas   │   │         External Services        │
│                  │   │                                  │
│  - Users         │   │  Stripe API (payments)           │
│  - Medicines     │   │  Cloudinary (images)             │
│  - Orders        │   │  Nodemailer / SMTP (email)       │
│  - Cart          │   │  TrOCR / Donut (OCR)             │
│  - Notifications │   │  Tata 1mg (redirect fallback)    │
│  - Prescriptions │   └──────────────────────────────────┘
│  - Reminders     │
└──────────────────┘

┌─────────────────────────────────────────────────────────┐
│              scraping_backend (offline tool)             │
│         Puppeteer → 1mg.com → MongoDB Atlas             │
│              3,028 medicines seeded                     │
└─────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Stripe account (test keys)
- Cloudinary account (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/medscan.git
cd medscan

# Install backend dependencies
cd mongodb_backend
npm install

# Install frontend dependencies
cd ../PrescriptionManagement
npm install
```

### Running the app

```bash
# Terminal 1 — Backend
cd mongodb_backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd PrescriptionManagement
npm run dev
# Runs on http://localhost:3000
```

### Seeding Medicine Data

```bash
# Run scraper (only needed once)
cd scraping_backend/node-scraper
npm install
npm start
# Scrapes 1mg.com and seeds 3,028 medicines into MongoDB
```

### Creating Admin Account

```bash
# After registering your account via the app:
cd mongodb_backend
# Edit scripts/setAdmin.js — set TARGET_EMAIL to your email
node src/scripts/setAdmin.js
# Your account now has role: "admin"
```

---

## Environment Variables

### `mongodb_backend/.env`

```env
# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
MONGO_DB_NAME=prescription-medicine
PORT=5000

# Auth
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000

# Email (password reset, notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### `PrescriptionManagement/.env`

```env
VITE_API_URL=http://localhost:5000
PORT=3000
```

### `scraping_backend/node-scraper/.env`

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
MONGO_DB_NAME=prescription-medicine
```

---

## API Reference

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset/:token
GET    /api/auth/profile          (auth required)
PUT    /api/auth/profile          (auth required)
```

### Medicines
```
GET    /api/medicines
GET    /api/medicines/search
GET    /api/medicines/stats
GET    /api/medicines/:id
GET    /api/medicines/my          (auth required)
GET    /api/medicines/my-delivered (auth required)
GET    /api/medicines/history/:id  (auth required)
```

### Cart
```
GET    /api/cart                  (auth required)
POST   /api/cart/add              (auth required)
PUT    /api/cart/update           (auth required)
DELETE /api/cart/remove/:id       (auth required)
DELETE /api/cart/clear            (auth required)
```

### Orders
```
POST   /api/orders/create                    (auth required)
GET    /api/orders/my-orders                 (auth required)
GET    /api/orders/my-medicines              (auth required)
GET    /api/orders/:orderId                  (auth required)
GET    /api/orders/medicine-history/:id      (auth required)
POST   /api/orders/stripe/create-payment-intent (auth required)
POST   /api/orders/stripe/verify             (auth required)
GET    /api/orders/admin/all                 (admin only)
PUT    /api/orders/admin/:orderId/status     (admin only)
```

### Notifications
```
GET    /api/notifications                    (auth required)
GET    /api/notifications/unread-count       (auth required)
PUT    /api/notifications/:id/read           (auth required)
PUT    /api/notifications/mark-all-read      (auth required)
DELETE /api/notifications/:id                (auth required)
```

### Prescriptions
```
POST   /api/prescriptions/scan               (auth required)
GET    /api/prescriptions/:id                (auth required)
```

---

## Project Structure

```
MedScan/
├── mongodb_backend/               # Express API server
│   ├── src/
│   │   ├── models/                # Mongoose schemas
│   │   │   ├── User.js            # role: user|admin
│   │   │   ├── Medicine.js        # 3028 scraped medicines
│   │   │   ├── Order.js           # Full order lifecycle
│   │   │   ├── Cart.js
│   │   │   ├── Notification.js
│   │   │   └── Prescription.js
│   │   ├── routes/                # Express routers
│   │   │   ├── auth.js
│   │   │   ├── medicines.js
│   │   │   ├── orders.js          # Stripe endpoints here
│   │   │   ├── cart.js
│   │   │   ├── notification.js
│   │   │   └── prescriptions.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # JWT verification
│   │   │   ├── auth.js            # Rate limiting
│   │   │   └── errorHandler.js
│   │   ├── config/
│   │   │   ├── database.js        # MongoDB Atlas connection
│   │   │   ├── cloudinary.js      # Cloudinary config
│   │   │   └── email.js           # Nodemailer config
│   │   ├── scripts/
│   │   │   └── setAdmin.js        # One-time admin promotion
│   │   └── server.js              # App entry point
│   └── package.json
│
├── PrescriptionManagement/        # React frontend
│   ├── client/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── layout/        # Header, mobile nav
│   │       │   ├── medication/    # Medicine cards, modals
│   │       │   ├── orders/        # Order tracker
│   │       │   ├── pharmacy/      # Pharmacy selector
│   │       │   ├── prescription/  # Scan modal, card
│   │       │   ├── ui/            # shadcn components
│   │       │   ├── AdminRoute.tsx # role === admin guard
│   │       │   └── ProtectedRoute.tsx
│   │       ├── context/
│   │       │   ├── AuthContext.tsx # JWT + user state
│   │       │   └── CartContext.tsx
│   │       ├── pages/
│   │       │   ├── StorePage.tsx       # Medicine catalogue
│   │       │   ├── CartPage.tsx
│   │       │   ├── CheckoutPage.tsx    # Stripe initiation
│   │       │   ├── PaymentPage.tsx     # Stripe Elements form
│   │       │   ├── MyOrdersPage.tsx
│   │       │   ├── AdminDashboardPage.tsx
│   │       │   ├── scan-prescription.tsx # OCR flow
│   │       │   └── ...
│   │       ├── services/
│   │       │   ├── api.ts
│   │       │   ├── orderApi.ts    # Stripe functions here
│   │       │   ├── cartApi.ts
│   │       │   └── notificationApi.ts
│   │       └── lib/
│   │           ├── queryClient.ts # VITE_API_URL resolver
│   │           └── tesseract.ts   # Client OCR fallback
│   └── server/
│       ├── index.ts               # Thin Express host
│       └── vite.ts                # Dev/prod serving
│
└── scraping_backend/
    └── node-scraper/
        └── scraper.js             # Puppeteer 1mg scraper
```

---

## Unique Selling Points

### 1. Real Medicine Data — Not Dummy Content
3,028 medicines scraped from 1mg.com with real names, compositions, manufacturers, pricing, and medical metadata. This is actual inventory data, not placeholder content.

### 2. Handwritten Prescription OCR
Most medicine platforms require manual search. MedScan uses **TrOCR** and **Donut** transformer models to read actual doctor handwriting from prescription photos — the hardest OCR problem in healthcare. Tesseract.js provides a client-side fallback for printed prescriptions.

### 3. Zero Dead Ends
If a prescribed medicine isn't in the MedScan catalogue, the patient is automatically redirected to **Tata 1mg** with the medicine name pre-filled in the search. No patient ever hits a wall.

### 4. Full Rx Compliance Flow
Prescription-required medicines don't just get flagged — they enter a real pharmacist approval queue. Orders are held at `pending_approval`, the pharmacist reviews the uploaded prescription on the admin dashboard, and approval triggers automatic order progression and patient notification.

### 5. Medicine History Intelligence
The platform tracks every medicine a patient has ever ordered and delivered — not just orders. Patients can see per-medicine purchase history, useful for chronic medication management and reorder timing.

### 6. Indian Payment Stack
Built specifically for India — UPI, RuPay, and card support via Stripe, plus Cash on Delivery. Payment amounts in INR with paise-level precision.

---

## Development Phases

| Phase | Focus | Status |
|---|---|---|
| Phase 1 | Architecture cleanup, unified API routing, auth, medicine catalogue, cart | ✅ Complete |
| Phase 2 | Role-based admin, Stripe payment integration, order confirmation pipeline | ✅ Complete |
| Phase 3 | TrOCR/Donut server-side OCR, prescription storage, Cloudinary integration, notification triggers, order tracker real-time | ✅ Complete |
| Phase 4 | Medicine reminders, Tata 1mg redirect fallback, profile avatar upload, reorder flow, mobile UX polish | ✅ Complete |

---
