# Infotact Projects Repository

Welcome to the **Infotact Projects** multi-project repository containing full-stack enterprise web applications and engineering deliverables.

---

## Repository Structure

```
/
├── README.md
│
├── FleetDash/
│   ├── frontend/
│   ├── backend/
│   └── README.md
│
└── SyncDoc/
    ├── frontend/
    ├── backend/
    └── README.md
```

---

## Projects

### FleetDash

Fleet management dashboard.
Link: `./FleetDash`

High-throughput, event-driven fleet telemetry and operations monitoring platform designed for real-time tracking, live alerts, 60 FPS HTML5 Canvas geospatial visualization, and fleet health diagnostics.

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, HTML5 Canvas 60 FPS renderer, Socket.IO client.
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO live broadcasting, JWT authentication.
- **Documentation:** Complete setup guides, architectural overview, and API specifications are in the [FleetDash README](./FleetDash/README.md).

---

### SyncDoc

Document collaboration/management application.
Link: `./SyncDoc`

High-performance, real-time collaborative document management and editing platform powered by an Abstract Syntax Tree (AST) architecture, Yjs CRDTs over WebSockets, and Puppeteer HTML/PDF export pipeline.

- **Frontend:** React 19, Vite, Yjs real-time client, block-based modular editor, workspace dashboard.
- **Backend:** Node.js, Express, TypeScript, WebSocket server, Puppeteer PDF compiler, MongoDB (Mongoose).
- **Documentation:** Complete setup guides, architectural overview, and API specifications are in the [SyncDoc README](./SyncDoc/README.md).
