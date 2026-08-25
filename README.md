# Tours Operadores — La Fortuna

Aplicación interna para gestionar los tours de los operadores locales de La Fortuna (Costa Rica).

## Funcionalidades

- **Buscador** de tours con filtros (zona, categoría, precio, duración, horario, incluye, operador).
- **Detalle** de tour con tarifas rack/netas, resumen copiable y contacto por WhatsApp.
- **Comparador** de hasta 3 tours lado a lado.
- **Administración**: operadores, tarifarios y KPIs de frescura.
- **Carga de catálogo** de operadores desde un Excel (una hoja por operador), con revisión editable antes de guardar.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS (shadcn/ui) · Hono · tRPC · Drizzle ORM · PostgreSQL (Supabase).

## Desarrollo

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env` y define las variables de entorno.

## Base de datos

PostgreSQL vía Supabase. Migraciones con Drizzle:

```bash
npm run db:generate
npm run db:push
```
