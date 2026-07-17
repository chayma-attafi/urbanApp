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

## Email de confirmation de compte

Flux implementé :
- Inscription → token UUID genere, stocke dans `users.verification_token`, email HTML envoye via SMTP.
- Clic sur le lien `/verify?token=xxx` → `is_verified` passe a `true`, token efface.
- Connexion bloquee avec HTTP 403 si `is_verified = false`.

Variables `.env` requises :

| Variable        | Valeur exemple            | Description                          |
|-----------------|---------------------------|--------------------------------------|
| `SMTP_HOST`     | `smtp.gmail.com`          | Serveur SMTP                         |
| `SMTP_PORT`     | `587`                     | Port STARTTLS                        |
| `SMTP_USER`     | `votre@email.com`         | Expediteur                           |
| `SMTP_PASSWORD` | `xxxx xxxx xxxx xxxx`     | App Password (pas le mot de passe Gmail) |
| `FRONTEND_URL`  | `http://localhost:5173`   | Base du lien dans l'email            |

Si `SMTP_PASSWORD` est vide, l'envoi echoue silencieusement — l'inscription reussit mais aucun email n'est envoye.

## Limites connues

- Le rate limit memoire ne suffit pas en multi-instance Render.
- Pas encore de CSRF token dedie.
- Pas encore de rotation/blacklist JWT.
- Pas encore de gestion RBAC.
- Pas de delai d'expiration du token de verification (valable indefiniment jusqu'a utilisation).
