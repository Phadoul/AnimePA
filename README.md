# AnimePA 🎌

Tracker privado de anime para dos personas.

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend / DB**: Supabase (PostgreSQL + Auth)
- **Deploy**: Vercel

---

## Setup local en 5 pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) → New project
2. En **SQL Editor** pega y ejecuta el contenido de `supabase/schema.sql`

### 3. Crear los 2 usuarios (sin registro público)
En Supabase Dashboard → **Authentication → Users → Invite user**  
Crea las cuentas de Pedro y Asencio manualmente.  
Luego en **Authentication → Settings** desactiva **"Enable email confirmations"** si quieres acceso inmediato, y en **"Sign-ups"** desactiva el registro público.

### 4. Configurar variables de entorno
```bash
cp .env.example .env.local
```
Rellena con tus valores de **Supabase → Settings → API**:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 5. Arrancar en local
```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173)

---

## Deploy en Vercel (gratis)

1. Sube el proyecto a GitHub (sin `.env.local`)
2. Ve a [vercel.com](https://vercel.com) → Import Git Repository
3. En **Environment Variables** añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. Deploy → obtienes una URL tipo `animepa.vercel.app`

---

## Seguridad
- Las contraseñas viven en Supabase Auth (encriptadas), **nunca en el código**
- Row Level Security activo: cada usuario solo puede editar su propio progreso
- Nadie puede registrarse sin que vosotros lo creéis desde el dashboard
