# LivePulse — Live Audience Engagement App

A real-time audience engagement platform similar to Slido. Hosts create sessions with live Q&A and polls; participants join via a code and interact in real time.

## Features

- **Host Dashboard**: Create sessions with unique join codes, manage Q&A, create polls (multiple choice, word cloud, rating scale), see live results
- **Participant View**: Join via session code, submit & upvote questions, respond to polls
- **Real-time Updates**: Socket.io for instant updates across all connected clients
- **Mobile-friendly**: Responsive UI built with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Database | Supabase (PostgreSQL) |
| Deployment | Railway |

---

## Supabase Setup (Required)

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**, give it a name (e.g. `livepulse`), choose a region, set a DB password
3. Wait ~2 minutes for the project to provision

### Step 2 — Run the database schema

1. In your Supabase dashboard, go to **SQL Editor → New Query**
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Click **Run** — all tables will be created

### Step 3 — Get your API credentials

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (under *Project API keys*, click reveal) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ The `service_role` key has full DB access. Never expose it in client-side code or commit it to git.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm
- A Supabase project (see above)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/live-audience-app.git
cd live-audience-app

# 2. Create your server environment file
cp server/.env.example server/.env
# Edit server/.env and fill in your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# 3. Install all dependencies
npm run install:all

# 4. Start the backend (in one terminal)
npm run dev:server

# 5. Start the frontend (in another terminal)
npm run dev:client
```

The client runs at **http://localhost:5173** and the server at **http://localhost:3001**.

### Environment Variables

Create `server/.env` (copy from `server/.env.example`):

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## Deploying to Railway

### Step 1 — Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/live-audience-app.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `live-audience-app` repository
4. Railway auto-detects the `railway.json` config and builds the app

### Step 3 — Set Environment Variables on Railway

In the Railway project settings → **Variables**, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` (Railway sets this automatically) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

### Step 4 — Access Your App

Railway provides a public URL like `https://live-audience-app.up.railway.app`. Share it with your audience!

> **Note on persistence**: All data lives in your Supabase PostgreSQL database, so it persists across Railway redeploys automatically.

---

## Project Structure

```
live-audience-app/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── host/        # Host dashboard components
│       │   ├── participant/ # Participant view components
│       │   └── shared/      # Shared UI components
│       ├── context/         # Socket.io context
│       └── pages/           # Route pages
├── server/                  # Express backend
│   ├── db/                  # SQLite database
│   ├── routes/              # REST API routes
│   └── socket/              # Socket.io event handlers
├── railway.json             # Railway deployment config
├── Dockerfile               # Docker deployment config
└── README.md
```

---

## How It Works

### For Hosts
1. Go to the app and click **Host a Session**
2. Enter your name and session title
3. Share the **6-character join code** with your audience
4. Create polls, see live Q&A as it arrives, and close polls when done

### For Participants
1. Go to the app and click **Join a Session**
2. Enter the join code and your name
3. Submit questions, upvote others' questions, respond to polls

---

## License

MIT
