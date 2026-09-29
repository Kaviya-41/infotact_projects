# FleetDash Backend

Node.js + Express API server for the FleetDash fleet telemetry dashboard.

## Quick Start

```bash
cd backend
npm install
npm run dev
```

The server starts on **http://localhost:5050** by default.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with file-watching (auto-restart on changes) |
| `npm start` | Production start |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health-check endpoint |

## Project Structure

```
backend/
├── src/
│   ├── server.js          # Express app bootstrap & listen
│   ├── config/            # Environment & DB configuration (future)
│   ├── controllers/       # Route handler logic
│   ├── middleware/         # Express middleware (error handling, auth, etc.)
│   ├── models/            # Mongoose schemas (future)
│   ├── routes/            # Express route definitions
│   └── utils/             # Shared helpers & utilities
├── .env.example           # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5050` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_SECRET` | JWT signing secret | — |
| `REDIS_URL` | Redis connection URL | — |
