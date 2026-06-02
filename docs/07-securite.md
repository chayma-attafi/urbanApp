# Securite

## Mesures MVP implementees

- JWT signe cote backend.
- `JWT_SECRET_KEY` obligatoire dans `.env`.
- Cookie `HttpOnly`, `SameSite=Lax`, option `Secure` configurable.
- CORS limite aux origines declarees.
- Rate limit memoire sur les requetes.
- Headers de securite : frame deny, nosniff, referrer policy, permissions policy, CSP minimale.
- Hash des mots de passe via `passlib` avec Argon2/Bcrypt.
- Upload avatar limite au profil connecte ; stockage local MVP dans `backend/static/avatars`.

## Limites connues

- Le rate limit memoire ne suffit pas en multi-instance Render.
- Pas encore de CSRF token dedie.
- Pas encore de rotation/blacklist JWT.
- Pas encore de gestion RBAC.
