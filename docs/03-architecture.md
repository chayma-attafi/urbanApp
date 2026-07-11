# Architecture

## Vue logique

```text
Navigateur/PWA
  -> React Router pages protegees
  -> API client fetch credentials include
  -> FastAPI /api/*
  -> SQLAlchemy
  -> PostgreSQL (Supabase)
```

## Backend

- `app/main.py` : creation API, CORS, securite, routers.
- `app/core` : configuration, JWT, hash, middlewares.
- `app/models` : tables SQLAlchemy.
- `app/schemas` : contrats Pydantic.
- `app/routers` : endpoints fonctionnels.

## Frontend

- `src/context/AuthContext.tsx` : etat auth global.
- `src/components/ProtectedRoute.tsx` : protection des pages.
- `src/pages` : pages principales MVP.
- `src/lib/api.ts` : appels backend centralises.

