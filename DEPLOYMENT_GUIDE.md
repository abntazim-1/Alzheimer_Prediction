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

### Backend (Render)
1. Go to [Render](https://render.com) and click **"New"** → **"Web Service"**.
2. Connect your GitHub repository.
3. Set the following:
   - **Language**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python backend/app.py` (Wait: Ensure you use a production server like `gunicorn` or `uvicorn` in the start command if necessary, e.g., `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`)
4. Add **Environment Variables**:
   - `DATABASE_URL`: `sqlite:///./neuro_chat.db` (For persistence, use Render's "Disks" or a PostgreSQL service).
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

## 3. Failure & Rollback
- **Safety First**: If a push to `main` fails the CI/CD tests, the deployment process will **stop**. Your existing live version will continue to run without interruption.
- **Manual Rollback**: If you ever need to go back, go to the Vercel/Render dashboard and select "Redeploy" on a previous successful build.

---
*Created by Antigravity for Abdullah Bin Noor*
