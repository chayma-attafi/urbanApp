# APIs

## Auth

- `POST /api/auth/register` : cree un utilisateur et pose le cookie JWT.
- `POST /api/auth/login` : connecte un utilisateur.
- `POST /api/auth/logout` : supprime le cookie.
- `GET /api/auth/me` : retourne l'utilisateur courant.

## Profile

- `GET /api/profile/me` : profil connecte.
- `PUT /api/profile/me` : mise a jour profil, y compris `avatar_url` en base64 sauvegarde ensuite dans `/static/avatars`.

## Transport

- `GET /api/transport/modes` : liste demo des modes.
- `GET /api/transport/nearby` : arrets proches, route protegee.

## Routing

- `GET /api/routing/estimate?origin=A&destination=B` : estimation demo, route protegee.

## Demo

- `GET /api/demo/dashboard` : indicateurs dashboard.
