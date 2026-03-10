# Castelli Kitchen

> **Reduce food waste, one recipe at a time.**

Castelli Kitchen is a full-stack web application that helps households manage their pantry, track ingredient, and discover recipes that use ingredients before they go bad.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)

---

## Overview

Castelli Kitchen combines pantry management with smart recipe discovery. Users log the ingredients they have at home — including quantities and expiry dates — and the app automatically suggests recipes from **TheMealDB** API based on what is about to expire. A daily background job monitors expiry dates and creates in-app notifications before items go bad.

---

## Features

| Feature | Description |
|---|---|
| **Ingredient Tracking** | Add, edit, and delete pantry ingredients with batch-level quantity and expiry date tracking |
| **Expiry Monitoring** | Colour-coded expiry status (expired, <3 days, <7 days, ok) with days-remaining calculations |
| **Smart Suggestions** | Automatic recipe suggestions for ingredients expiring within 3 days |
| **Recipe Discovery** | Search and filter thousands of recipes via TheMealDB API |
| **Saved Recipes** | Save external recipes or create fully custom ones |
| **Favourites** | Toggle favourite status on any recipes |
| **Notifications** | Real-time in-app notifications for ingredient events and recipe actions |
| **Google OAuth** | Sign in with Google in addition to local email/password |
| **Profile Management** | Update profile info, upload avatar,  or delete account |

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB via Mongoose v9 |
| Authentication | JWT (7-day expiry) + Passport.js Google OAuth 2.0 |
| File Storage | Firebase Storage (firebase-admin) |
| Scheduling | node-cron |
| File Upload | Multer (memory storage, 5 MB limit) |
| Password Hashing | bcrypt |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Routing | TanStack Router (file-based, auto code-splitting) |
| Server State | TanStack React Query v5 |
| HTTP Client | Axios |
| UI Library | Mantine v8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Date Utilities | dayjs |

---

## Project Structure

```
CastelliKitchen/
├── backend/
│   └── src/
│       ├── app.js                  # Express app setup, middleware, routes
│       ├── server.js               # HTTP server entry point
│       ├── config/
│       │   ├── db.js               # MongoDB connection
│       │   ├── firebase.js         # Firebase Admin SDK init
│       │   └── passport.js         # Google OAuth strategy
│       ├── controllers/            # Route handler logic
│       ├── middleware/
│       │   ├── auth.js             # JWT verification middleware
│       │   └── upload.js           # Multer file upload middleware
│       ├── models/                 # Mongoose schemas
│       ├── routes/                 # Express routers
│       ├── jobs/
│       │   ├── scheduler.js        # node-cron job registration
│       │   └── checkExpiringIngredients.js
│       └── utils/
│           ├── fileUpload.js       # Firebase Storage helpers
│           └── notificationHelper.js
│
├── frontend/
│   └── src/
│       ├── main.tsx                # App entry — Router, QueryClient, Mantine
│       ├── api/                    # Axios API service modules
│       ├── components/             # Shared UI components
│       ├── hooks/                  # React Query custom hooks
│       ├── lib/
│       │   └── api.ts              # Axios instance + JWT interceptor
│       ├── pages/                  # Page-level React components
│       ├── routes/                 # TanStack Router route files
│       └── types/                  # TypeScript type definitions
│
├── package.json                    # Root workspace scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm (or npm)
- A running MongoDB instance or Atlas connection string
- A Firebase project with Storage enabled and a service account key
- Google OAuth 2.0 credentials (Client ID + Secret)
- SMTP email account for sending password reset emails (Gmail with an App Password)

### 1. Clone the repository

```bash
git clone https://github.com/mjquitain/CastelliKitchen.git
cd CastelliKitchen
```

### 2. Backend setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env

# Place your Firebase service account file
cp /path/to/serviceAccountKey.json ./serviceAccountKey.json

npm run dev
```

### 3. Frontend setup

```bash
cd frontend
pnpm install

pnpm dev
```

Open [http://localhost:3000] in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/castellikitchen` |
| `JWT_SECRET` | Secret key for signing JWTs | `supersecretkey` |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name | `my-project.appspot.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:5000/api/v1/auth/google/callback` |
| `FRONTEND_URL` | Frontend base URL for OAuth redirect | `http://localhost:3000` |
| `PORT` | API server port (default: 5000) | `5000` |

> **Note:** `serviceAccountKey.json` must be present in the `backend/` directory. Do not commit this file to version control.

### Frontend

The API base URL is configured in [frontend/src/lib/api.ts](frontend/src/lib/api.ts):

```ts
baseURL: 'http://localhost:5000/api/v1'
```

---

