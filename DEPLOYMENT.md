# Deployment Guide

This guide will help you deploy the Name It Game to production so users can play from different devices.

## Architecture

- **Frontend**: Deploy to Vercel (free, easy setup)
- **Backend**: Deploy to Railway or Render (both support WebSockets/Socket.io)

## Step-by-Step Deployment

### 1. Deploy Backend Server

#### Using Railway (Recommended)

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **Create Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose your repository
4. **Configure**:
   - Set root directory to `server`
   - Railway will auto-detect Node.js
5. **Deploy**: Railway will automatically deploy
6. **Get URL**: Copy your service URL (e.g., `https://name-it-game-production.up.railway.app`)

#### Using Render (Alternative)

1. **Sign up**: Go to [render.com](https://render.com) and sign up
2. **New Web Service**: Click "New +" → "Web Service"
3. **Connect Repository**: Link your GitHub repository
4. **Configure**:
   - **Name**: `name-it-game-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Deploy**: Click "Create Web Service"
6. **Get URL**: Copy your service URL (e.g., `https://name-it-game.onrender.com`)

### 2. Deploy Frontend to Vercel

1. **Sign up**: Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. **Import Project**: Click "Add New Project" → Import your GitHub repository
3. **Configure Project**:
   - **Root Directory**: Set to `client`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
4. **Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - **Name**: `VITE_BACKEND_URL`
     - **Value**: Your backend URL from step 1 (e.g., `https://name-it-game-production.up.railway.app`)
   - Make sure to add it for all environments (Production, Preview, Development)
5. **Deploy**: Click "Deploy"
6. **Get URL**: Your app will be live at `https://your-project.vercel.app`

### 3. Update Backend CORS (if needed)

If you encounter CORS errors, update the backend CORS settings:

1. In `server/server.js`, find the CORS configuration
2. Update the `origin` to include your Vercel URL:
   ```javascript
   cors: {
     origin: [
       "https://your-project.vercel.app",
       "http://localhost:3000"
     ],
     methods: ["GET", "POST"]
   }
   ```
3. Redeploy the backend

### 4. Test Your Deployment

1. Open your Vercel URL in a browser
2. Create a room
3. Open the same URL on a different device/browser
4. Join the room using the room code
5. Test the game flow

## Troubleshooting

### Connection Issues

- **Check Environment Variables**: Make sure `VITE_BACKEND_URL` is set correctly in Vercel
- **Check Backend URL**: Ensure your backend URL is accessible (try opening it in a browser)
- **Check CORS**: Verify CORS settings allow your Vercel domain

### WebSocket Issues

- **Railway**: WebSockets work out of the box
- **Render**: WebSockets work, but there's a 15-minute inactivity timeout on free tier
- **Vercel**: Frontend only, WebSockets handled by backend

### Build Errors

- **Vite Build**: Make sure all dependencies are in `package.json`
- **Missing Files**: Ensure all files are committed to Git
- **Environment Variables**: Check that `VITE_` prefix is used for client-side variables

## Custom Domain (Optional)

### Vercel Custom Domain

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Backend Custom Domain

- **Railway**: Add custom domain in project settings
- **Render**: Add custom domain in service settings

## Monitoring

- **Vercel**: Check deployment logs in Vercel dashboard
- **Railway**: Check logs in Railway dashboard
- **Render**: Check logs in Render dashboard

## Cost

- **Vercel**: Free tier includes generous limits
- **Railway**: Free tier available ($5 credit/month)
- **Render**: Free tier available (with limitations)

All services offer free tiers suitable for small to medium traffic.
