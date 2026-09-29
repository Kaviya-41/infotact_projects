# FleetDash — High-Throughput Event-Driven Fleet Telemetry Dashboard

> **Project 1** · Full-Stack Event-Driven Real-Time Telemetry Platform · Frontend & Backend

---

## 🌟 Project Overview

**FleetDash** is an enterprise-grade, high-throughput, event-driven fleet telemetry and operations monitoring platform. It is engineered to deliver sub-second telemetry ingestion, 60 FPS real-time GPS asset visualization, dynamic alert triage, and operational analytics for mission-critical logistics and transportation fleets.

Built with a high-performance modern full-stack architecture featuring a **React 19 + TypeScript + Vite** frontend and an **Express + Node.js + MongoDB + Socket.IO** backend, FleetDash offers seamless live tracking, health diagnostics, route progression, and interactive command consoles.

---

## ✨ Features

- **⚡ Real-Time Telemetry Streaming:** Instantaneous bidirectional data updates powered by WebSockets (Socket.IO) transmitting vehicle coordinates, speeds, fuel/battery levels, and engine statuses.
- **🗺️ High-Performance 60 FPS Canvas Map:** Custom HTML5 Canvas rendering engine for smooth geospatial vehicle movement, route trails, vehicle heading markers, and interactive hover HUDs.
- **🚨 Intelligent Alert Monitoring & Triage:** Automatic event-driven alerting for speed violations, battery drop anomalies, geofence breaches, and mechanical faults with severity classification (`critical`, `warning`, `info`).
- **📊 Operational Analytics & KPI Metrics:** Real-time calculation of fleet uptime, active trips, fuel economy, average speed, and vehicle health distributions.
- **🔐 Secure Authentication & Access Control:** Stateless JSON Web Token (JWT) authentication, salted bcrypt password hashing, and role-based route guard protection.
- **🎛️ Live Fleet Control Drawer & Vehicle HUD:** Detailed telemetry inspection drawers displaying live gauges, engine diagnostics, trip history, and driver metadata for any selected vehicle.
- **🧪 Built-in Simulation Engine:** Real-time coordinate simulation service producing realistic GPS paths, speed changes, and dynamic events for development and demonstration.

---

## 🛠️ Technologies Used

### Frontend
- **Framework & Language:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool & Bundler:** [Vite 8](https://vitejs.dev/) with Fast HMR
- **Styling & Design System:** Vanilla CSS Design Tokens + [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Motion:** [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Networking & Real-Time:** [Axios](https://axios-http.com/), [Socket.IO Client](https://socket.io/)
- **Geospatial & Visual Engine:** Custom HTML5 Canvas 60 FPS renderer

### Backend
- **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+)
- **Server Framework:** [Express 4.x](https://expressjs.com/)
- **Real-Time Communication:** [Socket.IO](https://socket.io/) WebSocket Server
- **Security & Middleware:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`
- **Telemetry Simulator:** Event-driven background route simulation worker

### Database
- **Database Engine:** [MongoDB](https://www.mongodb.com/) (Document-oriented NoSQL database)
- **Object Data Modeling (ODM):** [Mongoose 8.x](https://mongoosejs.com/)
- **Key Schemas:** `User`, `Vehicle`, `Alert`, `Trip`, `Settings`

---

## 🏗 System Architecture & Directory Structure

```
FleetDash/
├── frontend/                               # Client Application (React + Vite)
│   ├── public/                             # Static assets, SVG icons, and favicons
│   ├── src/
│   │   ├── api/                            # Axios API services (Auth, Dashboard, Alerts, Vehicles, Trips)
│   │   ├── assets/                         # Visual assets, branding logos, and illustrations
│   │   ├── components/                     # Reusable UI components & Canvas renderers
│   │   │   ├── canvas/                     # High-performance 60 FPS Canvas map & gauges
│   │   │   ├── dashboard/                  # KPI cards, HUD, vehicle drawers, telemetry cards
│   │   │   ├── layout/                     # Sidebar navigation and dashboard shell
│   │   │   ├── ui/                         # Glassmorphic cards, status badges, and feedback
│   │   │   └── widgets/                    # Telemetry panels, fuel efficiency, route summaries
│   │   ├── context/                        # Global state (AuthContext, ThemeContext)
│   │   ├── hooks/                          # Custom React hooks (Socket telemetry, Canvas renderer, Vehicles)
│   │   ├── pages/                          # Views (Dashboard, Live Map, Vehicles, Alerts, Reports, Settings, Auth)
│   │   ├── styles/                         # Design system, CSS variables, glassmorphic styling
│   │   └── types/                          # TypeScript type definitions and interfaces
│   ├── index.html                          # Entry HTML shell with SEO optimization
│   ├── package.json                        # Frontend dependencies and scripts
│   ├── tsconfig.json                       # TypeScript compiler configurations
│   └── vite.config.ts                      # Vite build and plugin setup
│
└── backend/                                # Server Application (Node.js + Express)
    ├── src/
    │   ├── config/                         # Database connection and environment config
    │   ├── controllers/                    # Route controllers (Auth, Dashboard, Vehicles, Alerts, Trips)
    │   ├── middleware/                     # JWT authentication, error handling, 404 middleware
    │   ├── models/                         # Mongoose schemas (User, Vehicle, Alert, Trip, Settings)
    │   ├── routes/                         # REST API endpoint definitions
    │   ├── scripts/                        # Database seeder scripts (seedFleetData.js)
    │   ├── services/                       # Live telemetry simulation and WebSocket broadcaster
    │   └── server.js                       # Express bootstrap, HTTP & Socket.IO server
    ├── .env.example                        # Environment variable configuration template
    └── package.json                        # Backend dependencies and scripts
```

---

## 🖥️ Main Dashboard Functionality

1. **Executive Fleet Statistics:**
   - Active Vehicles, In-Transit Trips, System Alerts, and Overall Fleet Health Index.
2. **Live Geospatial Telemetry Radar:**
   - Interactive canvas visualizer showing vehicle locations, dynamic heading rotations, route traces, and click-to-focus inspection.
3. **Vehicle Status & Telemetry HUD:**
   - Instant drawer toggle displaying live speed gauge, odometer, battery/fuel charge status, tire pressure, and engine temperature.
4. **Real-Time Alert Feed:**
   - Prioritized notifications for critical threshold breaches, system anomalies, and safety flags with acknowledge/dismiss actions.
5. **Trip Manifest & Route Tracking:**
   - Origin-to-destination progression indicators, estimated arrival times (ETA), and driver profiles.

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

---

## 🚀 How to Run Locally

### 1. Backend Setup

```bash
cd FleetDash/backend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Ensure your `.env` configuration is set:
```env
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/fleetdash
JWT_SECRET=your_jwt_secret_key_here
```

Seed initial fleet data and launch the backend:
```bash
# Seed initial vehicle and telemetry dataset
npm run seed:fleet

# Start the backend server with hot-reload
npm run dev
```

*The backend server starts on `http://localhost:5050`.*

---

### 2. Frontend Setup

In a new terminal window:

```bash
cd FleetDash/frontend

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```

*The frontend application is now accessible at `http://localhost:5173`.*

---

## 📸 Screenshots

| View | Description |
|:-----|:------------|
| **Executive Overview** | Real-time KPI summaries, fleet status distribution, and vehicle telemetry cards. |
| **Interactive Canvas Radar** | 60 FPS HTML5 canvas rendering moving vehicles, trails, and geospatial HUD markers. |
| **Vehicle Telemetry Drawer** | Deep-dive telemetry with live speedometer gauge, engine metrics, and trip logs. |
| **Alert Management** | Categorized alert feed with severity filters and instant acknowledgment. |

*(Screenshots can be placed in `FleetDash/frontend/src/assets/` and linked here).*

---

## 🔮 Future Improvements

- [ ] **Geofencing Engine:** Automated polygon boundary setup with instant push notifications on boundary exit/entry.
- [ ] **Predictive Maintenance AI:** Machine learning model to forecast component wear and battery degradation based on historical telemetry.
- [ ] **Native Mobile App:** React Native mobile dashboard for field supervisors and drivers.
- [ ] **Multi-Tenant Organizations:** Support for distinct fleet managers, depots, and vehicle groups with fine-grained RBAC.
- [ ] **Export & Compliance Reports:** Automated PDF/CSV export of emissions, driver hours, and safety audits.

---

## 📝 License

This project is licensed under the ISC License.
