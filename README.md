# Prior Authorization System

End-to-end Prior Authorization decision-support system with a multi-agent AI pipeline, MCP Tool Registry, and PostgreSQL backend.

Original wireframe: https://www.figma.com/design/5qn3BZ9VfJ2eoa06sytSY0/Prior-Authorization-Wireframe

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js (ESM) with JWT authentication
- **Database**: PostgreSQL 16 (6 tables, 400+ seed rows)
- **AI Pipeline**: 4 agents + 6 MCP tools + 9-step processing pipeline

## Prerequisites

- Node.js 18+
- PostgreSQL 16+
- npm

## Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server && npm install && cd ..

# 3. Create database
createdb prior_auth_db

# 4. Run schema + seed data (15 members, 75 claims, 15 policies, 15 PA requests)
node server/db/setup.js

# 5. Create .env.local for frontend API URL
echo "VITE_API_BASE_URL=http://localhost:3001/api/v1" > .env.local
```

## Running

```bash
# Start backend (port 3001)
node server/index.js

# Start frontend (port 5173) — in a new terminal
npm run dev
```

## Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Medical Director |
| nurse | nurse123 | Clinical Reviewer |
| analyst | analyst123 | Claims Analyst |

## Verification

```bash
# Health check
curl http://localhost:3001/api/v1/health

# List MCP tools
curl http://localhost:3001/api/v1/mcp/tools

# List PA requests
curl http://localhost:3001/api/v1/requests
```

## Database Reset

```bash
node server/db/setup.js --reset
```

## Architecture

See [DESIGN.md](DESIGN.md) for full architecture documentation covering database schema, MCP tool registry, agent pipeline, API routes, and frontend integration.
