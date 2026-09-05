# Despliegue en GitHub Pages + Supabase

La app ahora es **100 % estática**: el frontend se publica en GitHub Pages y habla
directo con Supabase (Auth + PostgREST + Storage). Ya no hay backend Node.

## Arquitectura

```
Navegador (React) ──▶ GitHub Pages (estático)
        │
        ├── Supabase Auth      (login email + contraseña)
        ├── Supabase PostgREST (tours, operadores, tarifas, horarios)
        └── Supabase Storage   (logos y pólizas)
```

## Paso 1 — Supabase Auth

1. Abre tu proyecto en **Supabase Dashboard → Authentication → Providers → Email**.
2. Confirma que **Email** esté habilitado.
3. Desactiva **"Confirm email"** (para que el login funcione de inmediato).
4. Ve a **Authentication → Users → Add user → Create new user**:
   - Email: el correo con el que entrará la recepción.
   - Password: la contraseña.
   - Marca **Auto Confirm User**.

## Paso 2 — Seguridad (RLS) y Storage

1. En **Supabase Dashboard → SQL Editor → New query**.
2. Pega y ejecuta el contenido de `supabase-setup.sql` (activa RLS en las tablas
   y crea los buckets `logos` y `polizas`).

## Paso 3 — URL y anon key

1. Ve a **Supabase Dashboard → Settings → API**.
2. Copia:
   - **Project URL** (ej. `https://ssmnjrofhkfaklbftdbl.supabase.co`)
   - **anon public** key (empieza con `eyJ...`)

## Paso 4 — Secrets en GitHub

1. En tu repo **GitHub → Settings → Secrets and variables → Actions → New repository secret**.
2. Crea estos dos secrets:
   - `VITE_SUPABASE_URL` → la Project URL.
   - `VITE_SUPABASE_ANON_KEY` → la anon public key.

## Paso 5 — Activar GitHub Pages

1. En **GitHub → Settings → Pages**.
2. En **Source**, elige **GitHub Actions**.
3. Haz un `git push` a `main`. El workflow `.github/workflows/deploy.yml`
   compila y publica en Pages automáticamente.

Tu sitio quedará en `https://<usuario>.github.io/tours-operadores/`
(o en tu dominio personalizado si configuras uno).

## Notas

- **Login**: ahora se entra con **email + contraseña** (Supabase Auth), ya no con
  el usuario de la vieja tabla `usuarios`.
- **Datos existentes**: los tours/operadores que ya están en Supabase se conservan.
  Solo revisa los logos/pólizas que antes apuntaban a `/uploads/...`: esos archivos
  deben subirse de nuevo (ahora van a Storage).
- **Tabla `usuarios` vieja**: quedó en desuso; puedes borrarla si no la necesitas.
