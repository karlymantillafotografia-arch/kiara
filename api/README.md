# DB / migraciones (solo local)

FastAPI + SQLAlchemy quedan **solo para gestionar el esquema** con Alembic.
El front en Vercel habla **directo** con Supabase (PostgREST) vía `@supabase/supabase-js`.

## Migraciones

```bash
cd api
.\.venv\Scripts\activate
alembic revision --autogenerate -m "descripcion"
alembic upgrade head
```

## Front

Supabase URL/key y el dominio `https://kiara-phi.vercel.app/` van quemados en `src/env.js`.
No hace falta configurar env vars en Vercel para el front.

Para migraciones locales sí hace falta `DATABASE_URL` en `.env` (ver `.env.example`).
