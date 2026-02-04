# Quick Start Guide

## Local Development

1. **Clone and install:**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

2. **Start backend** (Terminal 1):
   ```bash
   cd server
   npm start
   ```

3. **Start frontend** (Terminal 2):
   ```bash
   cd client
   npm run dev
   ```

4. **Open browser:** `http://localhost:3000`

## Deploy to Production

### Backend (Railway - 5 minutes)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. New Project → Deploy from GitHub repo
3. Select your repo → Set root directory to `server`
4. Copy the deployment URL (e.g., `https://your-app.railway.app`)

### Frontend (Vercel - 3 minutes)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Add New Project → Import your repo
3. Set root directory to `client`
4. Add Environment Variable:
   - Name: `VITE_BACKEND_URL`
   - Value: Your Railway URL from above
5. Deploy!

Your game is now live! Share the Vercel URL with friends to play together.

## Environment Variables

**Backend** (Railway/Render):
- `PORT` - Auto-set by platform
- `CORS_ORIGINS` - Optional: comma-separated list (e.g., `https://your-app.vercel.app`)

**Frontend** (Vercel):
- `VITE_BACKEND_URL` - Your backend URL (required)

## Testing Multi-Device

1. Open your Vercel URL on your computer
2. Open the same URL on your phone (or another device)
3. Create a room on one device
4. Join with the room code on the other device
5. Play!

## Troubleshooting

**Can't connect?**
- Check `VITE_BACKEND_URL` is set correctly in Vercel
- Verify backend URL is accessible (try opening it in browser)

**CORS errors?**
- Backend allows all origins by default
- If needed, set `CORS_ORIGINS` in backend environment variables

**WebSocket issues?**
- Railway: Works out of the box ✅
- Render: Works, but free tier has 15-min timeout
