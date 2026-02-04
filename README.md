# Name It Game 🎮

A cross-platform multiplayer game where players compete to name People, Animals, Places, and Things starting with a selected letter.

## Features

- ✅ Cross-platform support (Web, Android, iOS via web browser)
- ✅ Real-time multiplayer gameplay
- ✅ Room creation and joining with unique codes
- ✅ Letter selection (A-Z) with tracking of used letters
- ✅ 35-second round timer
- ✅ Scoring system:
  - 5 points for unique correct answers
  - 2 points for shared answers
  - 0 points for wrong/invalid answers
- ✅ Real-time scoreboard
- ✅ Clean, mobile-friendly UI

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express + Socket.io
- **Real-time**: WebSocket connections via Socket.io

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```
   The server will run on `http://localhost:3001`

2. **Start the frontend development server:**
   ```bash
   cd client
   npm run dev
   ```
   The client will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

## How to Play

1. **Create or Join a Room:**
   - Create a new room or join using a room code
   - Enter your name

2. **Wait for Players:**
   - At least 2 players are needed to start
   - Share the room code with friends

3. **Start the Game:**
   - Host can start the game when ready
   - Players take turns selecting letters (A-Z)

4. **Play Rounds:**
   - Each round, a letter is selected
   - You have 35 seconds to name:
     - A Person
     - An Animal
     - A Place
     - A Thing
   - All starting with the selected letter

5. **Review & Score:**
   - After each round, see everyone's answers
   - Points are awarded automatically:
     - ✅ 5 points: Unique correct answer
     - 🔄 2 points: Shared correct answer
     - ❌ 0 points: Wrong or invalid answer

6. **Win:**
   - Game continues until all letters are used
   - Player with highest score wins!

## Deployment

### Backend Deployment (Railway or Render)

The backend needs to be deployed to a service that supports WebSockets (Socket.io). Recommended options:

#### Option 1: Railway (Recommended - Free tier available)

1. Go to [Railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and set the root directory to `server`
4. Railway will automatically detect Node.js and deploy
5. Copy the deployment URL (e.g., `https://your-app.railway.app`)

#### Option 2: Render

1. Go to [Render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Set:
   - **Name**: `name-it-game-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click "Create Web Service"
6. Copy the service URL (e.g., `https://your-app.onrender.com`)

### Frontend Deployment (Vercel)

1. Go to [Vercel.com](https://vercel.com) and sign up
2. Click "Add New Project" → Import your GitHub repository
3. Set:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
4. Add Environment Variable:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: Your backend URL from Railway/Render (e.g., `https://your-app.railway.app`)
5. Click "Deploy"
6. Your app will be live at `https://your-app.vercel.app`

### Environment Variables

**Backend** (set in Railway/Render dashboard):
- `PORT` - Automatically set by hosting platform
- `NODE_ENV` - Set to `production`

**Frontend** (set in Vercel dashboard):
- `VITE_BACKEND_URL` - Your backend server URL (e.g., `https://your-backend.railway.app`)

### Local Development

1. Create `client/.env.local`:
   ```
   VITE_BACKEND_URL=http://localhost:3001
   ```

2. Start backend: `cd server && npm start`
3. Start frontend: `cd client && npm run dev`

## Building for Production

### Frontend
```bash
cd client
npm run build
```
The built files will be in `client/dist`

## Mobile Support

The game is fully responsive and works on mobile browsers. For native mobile apps, you can:
- Use Capacitor to wrap the web app for iOS/Android
- Or deploy as a Progressive Web App (PWA)

## Project Structure

```
.
├── server/
│   ├── server.js          # Backend server with Socket.io
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

## License

MIT
