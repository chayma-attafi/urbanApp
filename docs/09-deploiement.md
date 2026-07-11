# Deploiement

## Frontend Vercel

- Root directory : `frontend`
- Build command : `npm run build`
- Output directory : `dist`
- Variable : `VITE_API_URL=https://<render-backend>/api`

## Backend Render

- Root directory : `backend`
- Build command : `pip install -r requirements.txt`
- Start command : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Variables obligatoires :
  - `JWT_SECRET_KEY`
  - `DATABASE_HOST`
  - `DATABASE_PORT`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`
  - `DATABASE_NAME`
  - `ALLOWED_ORIGINS`
  - `COOKIE_SECURE=true`

## Base de donnees

La base PostgreSQL est hebergee sur Supabase (plan gratuit) et accessible via `DATABASE_URL`, independamment de l'hebergeur du backend (Render).

