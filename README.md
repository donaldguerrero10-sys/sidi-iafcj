# SIDI IAFCJ — Sistema Integral de Discipulado Inteligente
## Guía de instalación paso a paso

---

## REQUISITOS (todos gratuitos)
- Cuenta en **github.com**
- Cuenta en **supabase.com**
- Cuenta en **vercel.com**
- Node.js 18+ instalado en tu computadora

---

## PASO 1 — Supabase: crear proyecto

1. Entra a supabase.com → "New project"
2. Ponle nombre: `sidi-iafcj`
3. Pon una contraseña de base de datos (guárdala)
4. Región: `South America (São Paulo)` — más cercana a México
5. Espera ~2 minutos a que termine

---

## PASO 2 — Supabase: ejecutar el schema

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Clic en "New query"
3. Pega todo el contenido de `supabase/schema.sql`
4. Clic en "Run" (▶)
5. Repite con `supabase/seed.sql`

---

## PASO 3 — Supabase: crear bucket de archivos

1. Ve a **Storage** en el menú lateral
2. "New bucket" → nombre: `sidi-recursos`
3. Marca "Public bucket" ✓
4. Guardar

---

## PASO 4 — Supabase: crear primer usuario (Obispo Presidente)

1. Ve a **Authentication → Users → Invite user**
2. Pon el correo del Obispo Presidente
3. Copia el UUID que aparece en la lista
4. Ve a SQL Editor y ejecuta:

```sql
insert into public.user_profiles (id, org_id, org_unit_id, full_name, rank)
values (
  'PEGA-EL-UUID-AQUÍ',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Nombre del Obispo Presidente',
  0
);
```

---

## PASO 5 — Supabase: obtener las keys

1. Ve a **Settings → API**
2. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

---

## PASO 6 — Configurar el proyecto localmente

```bash
# 1. Entra a la carpeta del proyecto
cd sidi-iafcj

# 2. Instala dependencias
npm install

# 3. Crea el archivo de variables de entorno
cp .env.local.example .env.local
# Abre .env.local y pega las keys de Supabase

# 4. Corre en modo desarrollo
npm run dev
# Abre http://localhost:3000
```

---

## PASO 7 — Deploy a Vercel (URL pública)

```bash
# 1. Sube el proyecto a GitHub
git init
git add .
git commit -m "SIDI v1"
git remote add origin https://github.com/TU-USUARIO/sidi-iafcj.git
git push -u origin main
```

2. Entra a vercel.com → "New project" → importa tu repo
3. En "Environment Variables" agrega las 3 keys de Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Clic en "Deploy"
5. En ~2 minutos tienes tu URL: `sidi-iafcj.vercel.app`

---

## FLUJO NORMAL DE USO

1. **Obispo Presidente** entra con su cuenta
2. Va a **Usuarios** → crea cuenta del Pastor con su correo
3. **Pastor** recibe el correo, pone contraseña, entra
4. Pastor crea cuentas de supervisores
5. Supervisores crean cuentas de líderes de célula
6. **Líder de Célula** entra cada semana y llena su reporte
7. Obispo ve en tiempo real el estado de todas las células

---

## ESTRUCTURA DEL PROYECTO

```
sidi-iafcj/
├── app/
│   ├── login/              ← Pantalla de login
│   ├── (dashboard)/
│   │   ├── page.tsx        ← Dashboard principal
│   │   ├── celulas/        ← Lista de células con filtros
│   │   ├── reportes/       ← Reportes semanales
│   │   ├── recursos/       ← Biblioteca + subida de archivos
│   │   └── usuarios/       ← Crear y ver usuarios
│   └── api/create-user/    ← Endpoint para crear usuarios
├── components/             ← Componentes reutilizables
├── lib/supabase/           ← Clientes de Supabase
├── types/                  ← Tipos TypeScript
├── supabase/
│   ├── schema.sql          ← Toda la estructura de la BD
│   └── seed.sql            ← Datos iniciales IFCJ
└── public/logo.png         ← Logo de la iglesia
```

---

## PRÓXIMAS FASES (después del piloto)

- [ ] Notificaciones WhatsApp cuando célula no reporta
- [ ] Proyecciones de crecimiento a 2-3 años
- [ ] Gamificación (insignias, racha de reportes)
- [ ] App móvil nativa (iOS y Android)
- [ ] IA predictiva con histórico de 12+ meses
- [ ] Multi-organización (otros distritos, otras iglesias)
