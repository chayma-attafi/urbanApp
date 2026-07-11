# Guide Supabase — Configuration complète (débutant)

Ce guide explique pas à pas comment créer un projet Supabase, récupérer
l'URL de connexion, configurer le backend et vérifier que tout fonctionne.

---

## Étape 1 — Créer un compte et un projet Supabase

1. Aller sur **supabase.com** → cliquer **Start your project** → créer un compte (GitHub recommandé)
2. Une fois connecté, cliquer **New project**
3. Remplir :
   - **Name** : `urbanflow` (ou autre nom libre)
   - **Database Password** : choisir un mot de passe **alphanumérique simple** (ex: `UrbanFlow2025`) — éviter les caractères spéciaux (`@`, `#`, `$`, `/`, `:`) car ils cassent les URLs
   - **Region** : choisir la plus proche (ex: `EU West` ou `EU North`)
4. Cliquer **Create new project** — attendre ~2 minutes que le projet se mette en place

> Copier le mot de passe quelque part, il ne sera plus affiché ensuite.

---

## Étape 2 — Récupérer l'URL de connexion

### 2.1 Ouvrir le panneau de connexion
1. Dans le dashboard du projet, cliquer sur le bouton **"Connect"** (barre du haut, à droite)
2. Une modale s'ouvre : **"Connect to your project"**

### 2.2 Choisir le bon mode selon ton système

| Ton système | Mode à utiliser | Pourquoi |
|-------------|-----------------|----------|
| **macOS** | Session pooler | La connexion directe est IPv6 uniquement — échoue sur la plupart des Mac |
| **Windows** | Direct connection | IPv6 fonctionne généralement sous Windows |

### 2.3 Copier l'URL (macOS — Session pooler)
1. Cliquer l'onglet **"Direct"**
2. Chercher le sélecteur de **mode** → choisir **"Session pooler"**
3. L'URL affichée ressemble à :
   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
   ```
4. **Copier cette URL exacte** (ne pas la retaper à la main)

### 2.4 Copier l'URL (Windows — Direct connection)
1. Cliquer l'onglet **"Direct"**
2. Laisser le mode sur **"Direct connection"**
3. L'URL ressemble à :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```
4. **Copier cette URL exacte**

---

## Étape 3 — Configurer le fichier `.env`

Ouvrir `backend/.env` et remplacer la ligne `DATABASE_URL=` :

```env
DATABASE_URL=postgresql+psycopg2://[coller l'URL copiée ici en remplaçant postgresql:// par postgresql+psycopg2://]
```

> **Important :** changer `postgresql://` en `postgresql+psycopg2://` — c'est le driver Python utilisé par le backend.

> **Important :** remplacer `[YOUR-PASSWORD]` par le vrai mot de passe choisi à l'étape 1.

### Exemple final (macOS, Session pooler)
```env
DATABASE_URL=postgresql+psycopg2://postgres.abcdefghijklmnop:UrbanFlow2025@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

### Exemple final (Windows, Direct)
```env
DATABASE_URL=postgresql+psycopg2://postgres:UrbanFlow2025@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## Étape 4 — Lancer le backend

```bash
cd backend
source venv/bin/activate        # macOS/Linux
# ou : venv\Scripts\activate    # Windows

uvicorn app.main:app --reload
```

Si la connexion réussit, tu verras :
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [...] using WatchFiles
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

SQLAlchemy crée automatiquement les tables `users` et `profiles` dans Supabase au premier démarrage.

---

## Étape 5 — Vérifier les tables dans Supabase

### 5.1 Table Editor (voir les données)
1. Dashboard Supabase → sidebar gauche → **Table Editor**
2. Sélectionner le schéma **"public"** (dropdown en haut à gauche — ne pas confondre avec "auth")
3. Tu vois les tables `users` et `profiles`
4. Cliquer sur une table pour voir ses colonnes et ses lignes (données insérées)

### 5.2 Schema Visualizer (voir la structure et les relations)
1. Dashboard → sidebar gauche → **Database** → **Schema Visualizer**
2. Affiche un diagramme ERD avec :
   - Table `users` : `id`, `email`, `hashed_password`, `is_active`, `created_at`, `updated_at`
   - Table `profiles` : `id`, `user_id` (FK → users.id), `first_name`, `last_name`, `email`, `phone`, `avatar_url`, `mobility_preference`, `city`, timestamps
   - Ligne de relation entre `profiles.user_id` et `users.id` (one-to-one, cascade delete)

### 5.3 SQL Editor (requêtes manuelles)
1. Dashboard → **SQL Editor**
2. Exemple pour voir tous les utilisateurs :
   ```sql
   SELECT * FROM users;
   SELECT * FROM profiles;
   ```

---

## Étape 6 — Mot de passe oublié ou à réinitialiser

1. Dashboard → **Project Settings** (icône engrenage) → **Database**
2. Section **Database password** → cliquer **Reset database password**
3. Choisir un nouveau mot de passe simple (alphanumérique uniquement)
4. Mettre à jour `DATABASE_URL` dans `backend/.env` avec le nouveau mot de passe
5. Redémarrer `uvicorn`

---

## Erreurs fréquentes et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `could not translate host name "db.xxx.supabase.co"` | IPv6 uniquement — Mac sans IPv6 | Passer en **Session pooler** (Étape 2.3) |
| `tenant/user postgres.xxx not found` | Mauvais nœud pooler ou URL tapée manuellement | Copier l'URL **exacte** depuis le dashboard (Étape 2.3) |
| `FATAL: password authentication failed` | Mauvais mot de passe dans DATABASE_URL | Vérifier/réinitialiser (Étape 6) |
| `tables n'apparaissent pas dans Supabase` | Mauvais schéma sélectionné | Choisir schéma **"public"** dans Table Editor (pas "auth") |
| `character spécial dans le mot de passe` | `@`, `#`, `:` cassent l'URL | Réinitialiser avec un mot de passe alphanumérique simple |
