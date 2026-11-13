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

En la raíz del proyecto (`.env`):

```env
VITE_SUPABASE_URL=https://wjiwjugsvzqrnkswjneb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu_anon_key
DATABASE_URL=postgresql+psycopg://postgres....
```

La anon key: Supabase → Project Settings → API → `anon` `public`.
