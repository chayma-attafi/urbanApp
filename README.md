# Urban Mobility PWA

Application web/PWA de cadrage Titre 6 CDSD : front React/TypeScript/Vite, backend FastAPI, base PostgreSQL (Supabase), authentification JWT par cookie HttpOnly, routes protegees et documentation projet.

## Structure

```text
urbanApp/
  backend/   API FastAPI, auth, profil, transport, routing, demo
  frontend/  PWA React TypeScript Vite
  data/      scripts SQL et donnees projet
  docs/      cadrage, architecture, backlog, APIs, securite
```

## Demarrage rapide

Backend :

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# remplacer JWT_SECRET_KEY par une vraie valeur, par exemple :
# openssl rand -hex 32 : lance cette locally
uvicorn app.main:app --reload
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```

Supabase : creer un projet sur supabase.com, copier la chaine de connexion (Project Settings > Database > Connection string) dans `DATABASE_URL` du fichier `.env` du backend, puis lancer le backend pour que les tables se creent automatiquement.

## Email de confirmation (SMTP)

L'inscription envoie un email de verification avant d'autoriser la connexion.
Configuration dans `backend/.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx   # App Password Gmail (16 caracteres)
```

Generer un App Password Gmail :
1. Activer la verification en deux etapes sur myaccount.google.com
2. Aller sur myaccount.google.com/apppasswords
3. Creer un mot de passe pour l'application "UrbanFlow"
4. Coller les 16 caracteres generes dans `SMTP_PASSWORD`

Si `SMTP_PASSWORD` est vide, l'email est ignore silencieusement (l'inscription reussit quand meme).

Documentation detaillee : voir `docs/`.

