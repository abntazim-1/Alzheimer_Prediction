# 🚀 Alzheimer's Detection Platform: Deployment Guide

This guide explains how to set up and manage your complete Development → Staging → Production workflow.

## 1. Hosting Setup (One-Time)

### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Connect your GitHub repository: `abntazim-1/Alzheimer_Prediction`.
3. Set the **Framework Preset** to `Next.js`.
4. Add the following **Environment Variables** in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-app.onrender.com/api`
5. Click **"Deploy"**.

### Backend (Render / Railway)
1. Go to your hosting provider and create a **"New Web Service"**.
2. Connect your GitHub repository.
3. Set the following:
   - **Language**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python backend/app.py`
4. Add **Environment Variables**:
   - `GROQ_API_KEY`: *(Your Groq API Key)*
   - `DATABASE_URL`: `sqlite:///./neuro_chat.db` (For persistence, use a persistent Disk mounting or PostgreSQL).
   - `PORT`: `8080` (Automatically set by Render, but default is 8080).
5. Click **"Create Web Service"**.

## 2. Development Workflow

### Step 1: Local Development
Work on the `dev` branch locally.
```bash
git checkout dev
# Make changes...
npm run build # Test frontend build
python backend/app.py # Test backend
```

### Step 2: Push to Staging
Push your changes to the `dev` branch on GitHub.
```bash
git add .
git commit -m "feat: updated model explanation logic"
git push origin dev
```
**CI/CD Action:** GitHub Actions will automatically run builds and tests. 

### Step 3: Production Release
If CI passes on `dev`, merge to `main` to trigger production deployment.
```bash
git checkout main
git merge dev
git push origin main
```
**CI/CD Action:** After tests pass, Vercel and Render will automatically pull the new code and update your live site.

---
## 4. Troubleshooting Production Issues (502 Bad Gateway)

If you see a **502 Bad Gateway** or a connectivity error in production:

1. **Check Backend Status**: Visit `https://your-backend-app.run.app/api/health` in your browser.
   - If it returns `{"status": "healthy"}`, the backend is UP and the problem is in the Frontend `BACKEND_URL` config.
   - If it returns 502 or Connection Refused, the backend service has crashed or failed to start.

2. **Verify Environment Variables**:
   - **`BACKEND_URL`** (Frontend): must be the FULL URL of your backend, e.g., `https://alzheimer-backend.a.run.app`. (Do NOT include a trailing slash).
   - **`DATABASE_URL`** (Backend): On Linux, ensure this does NOT point to a `C:/` drive. Use `sqlite+aiosqlite:///./neuro_chat.db` for a local file.
   - **`GROQ_API_KEY`**: Must be set for chat functionality.

3. **Check Logs**:
   - On Google Cloud, go to **Logs Explorer** to see the Python traceback if the backend is crashing. Common issues include missing dependencies or permission errors on the database file.

---
*Created by Antigravity for Abdullah Bin Noor*
