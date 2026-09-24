# Diario

Diario personal hecho con Next.js. Tiene usuarios, notas por dia, un calendario
que se pinta segun el animo, y la misma API la consume la app de Flutter.

## Correrlo

```bash
cp .env.example .env
npm install
npm run dev
```

Queda en http://localhost:3000. La base es SQLite y se crea sola en `data/diario.db`.
Cambiar `AUTH_SECRET` en el `.env` antes de subirlo a algun lado.

## Endpoints

```
POST   /api/auth/register   { name, email, password }
POST   /api/auth/login      { email, password }
POST   /api/auth/logout
GET    /api/me
GET    /api/entries?month=2026-09     resumen por dia (calendario)
GET    /api/entries?day=2026-09-19    notas del dia
POST   /api/entries         { day, content, mood }
PATCH  /api/entries/:id     { content, mood }
DELETE /api/entries/:id
```

En la web el token va en cookie. Flutter guarda el `token` del login y lo manda
como `Authorization: Bearer <token>`.

## Falta

`lib/analyze.ts` todavia devuelve null. Cuando devuelva `{ mood, comment }` se
guarda en `ai_mood` / `ai_comment` y el calendario usa ese animo (ver el COALESCE
en `app/api/entries/route.ts`).
