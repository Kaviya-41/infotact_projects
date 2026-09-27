# AI Career & Learning Copilot

> **Project 1** · Full-Stack Event-Driven Web Platform · Frontend & Backend

---

## 🌟 Overview

**AI Career & Learning Copilot** is a high-throughput, event-driven web application designed to deliver real-time data streaming, dynamic telemetry visualization, intelligent monitoring, and responsive analytics.

Built with a modern full-stack architecture featuring a **React 19 + TypeScript + Vite** frontend and an **Express + Node.js + MongoDB + Socket.IO** backend, the platform enables real-time tracking, live alerts, and interactive control panels.

---

## 🏗 System Architecture

```
Project-1-AI-Career-Learning-Copilot/
├── frontend/                               # Client Application (React + Vite)
│   ├── public/                             # Static assets and icons
│   ├── src/
│   │   ├── api/                            # Axios API services (Auth, Dashboard, Alerts, Vehicles)
│   │   ├── assets/                         # Graphic assets and logos
│   │   ├── components/                     # Reusable UI components & Canvas renderers
│   │   │   ├── canvas/                     # High-performance 60fps HTML5 Canvas renderers
│   │   │   ├── dashboard/                  # KPI cards, HUD, telemetry panels, drawers
│   │   │   ├── layout/                     # Sidebar navigation and dashboard shell
│   │   │   └── ui/                         # Glassmorphic cards, badges, and feedback
│   │   ├── context/                        # React context (AuthContext, ThemeContext)
│   │   ├── hooks/                          # Custom hooks (Socket telemetry, Canvas renderer)
│   │   ├── pages/                          # Application pages (Dashboard, Live Map, Alerts, Vehicles, Auth)
│   │   ├── styles/                         # Design system, CSS variables & animations
│   │   └── types/                          # TypeScript interface and type declarations
│   ├── index.html                          # Entry HTML shell with SEO meta tags
│   ├── package.json                        # Frontend dependencies and scripts
│   ├── tsconfig.json                       # TypeScript compiler configurations
│   └── vite.config.ts                      # Vite build and plugin setup
│
└── backend/                                # Server Application (Node.js + Express)
    ├── src/
    │   ├── config/                         # Database and environment configurations
    │   ├── controllers/                    # Route controller handlers
    │   ├── middleware/                     # JWT authentication, error handling & 404
    │   ├── models/                         # Mongoose schemas (User, Vehicle, Alert, Trip, Settings)
    │   ├── routes/                         # Express REST API routes
    │   ├── scripts/                        # Database seeder scripts
    │   ├── services/                       # Live telemetry simulation and Socket.IO broadcaster
    │   └── server.js                       # Express bootstrap, HTTP & WebSocket server
    ├── .env.example                        # Template for environment variables
    └── package.json                        # Backend dependencies and scripts
```

---

## ⚡ Tech Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Bundler & Tooling:** Vite, Oxlint
- **Styling:** Tailwind CSS v4 + Vanilla CSS Custom Properties (Dark Theme / Glassmorphism)
- **Icons & Animations:** Lucide React, Framer Motion
- **Networking:** Axios, Socket.IO Client
- **Rendering:** Custom HTML5 Canvas engine for 60fps telemetry mapping

### Backend
- **Runtime:** Node.js
- **Web Framework:** Express 4.x
- **Database:** MongoDB via Mongoose ODM
- **Real-Time Communication:** Socket.IO
- **Security & Auth:** JSON Web Tokens (JWT), bcryptjs password hashing, CORS
- **Simulation:** Real-time physics & GPS route simulator engine

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)

---

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Ensure `.env` contains valid credentials:
```env
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/fleetdash
JWT_SECRET=your_jwt_secret_key_here
```

Seed initial data and start the backend development server:
```bash
# Optional: Seed sample dataset
npm run seed:fleet

# Start the server with hot-reload
npm run dev
```

The backend server will run on **http://localhost:5050**.

---

### 2. Frontend Setup

In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| `GET` | `/api/health` | Service health status | No |
| `POST` | `/api/auth/register` | User registration | No |
| `POST` | `/api/auth/login` | User login & JWT issuance | No |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Yes |
| `GET` | `/api/dashboard/stats` | KPI summary statistics | Yes |
| `GET` | `/api/vehicles` | List vehicles & coordinates | Yes |
| `GET` | `/api/alerts` | System alerts & severity flags | Yes |
| `GET` | `/api/trips` | Trip logs & route statuses | Yes |

---

## 🎨 Key Features

1. **Real-Time WebSocket Updates:** Bi-directional Socket.IO integration broadcasting live telemetry coordinates, velocity updates, and critical system events.
2. **60 FPS Canvas Map Renderer:** Custom canvas rendering loop featuring smooth vehicle trails, status markers, and interactive hover tooltips.
3. **Enterprise Security:** JWT-based stateless authentication, bcrypt hashed credentials, and route guard middleware.
4. **Resilient Data Seeder:** Built-in seed script generating realistic coordinate paths, trip histories, and operational health metrics.
5. **Modern Glassmorphic UI:** Curated dark theme palette (`#0a0d14` base) with micro-animations and responsive layouts.

---

## 📝 License
This project is licensed under the ISC License.
