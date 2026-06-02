# Urban Mobility PWA

Application web/PWA de cadrage Titre 6 CDSD : front React/TypeScript/Vite, backend FastAPI, base MySQL XAMPP, authentification JWT par cookie HttpOnly, routes protegees et documentation projet.

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

XAMPP/MySQL : demarrer MySQL, puis creer la base `urban_app` ou laisser le backend tenter de la creer au lancement.

Documentation detaillee : voir `docs/`.

