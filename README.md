# 🎃 El Muro de los Miedos

Muro digital para la fiesta de Halloween de **UCLADCyT**: cualquiera entra, lee
los miedos de los demás y cuelga el suyo. Sin registro, sin login, sin datos
personales.

El muro se renderiza en el servidor (SSR), así que se puede leer incluso con
JavaScript desactivado. La única isla interactiva obligatoria es el formulario.

---

## Stack

| Pieza      | Qué se usa                                            |
| ---------- | ----------------------------------------------------- |
| Framework  | Astro 7 (`output: "server"` + SSR)                     |
| Islas      | Vue 3 (`<script setup>`) vía `@astrojs/vue`            |
| Estilos    | Tailwind CSS 4 a través de `@tailwindcss/vite`         |
| Validación | Zod 4 (mismo esquema en el formulario y en los tipos)   |
| Datos      | Supabase (`@supabase/supabase-js`, RLS + rol `anon`)   |
| Estado     | Nano Stores (comparte estado entre islas)              |
| Deploy     | Netlify (`@astrojs/netlify`)                           |

Sin React, sin Preact, sin Svelte, sin Solid.

---

## Puesta en marcha

### Requisitos

- Node **≥ 22.23.4** (ver `engines` en `package.json`)
- pnpm 10+ (el repo usa `pnpm-lock.yaml`)
- Supabase CLI (opcional, solo para aplicar migraciones)

### 1. Instalar dependencias

```bash
pnpm install
```

> pnpm bloquea los scripts de instalación por seguridad. El repo ya incluye
> `pnpm-workspace.yaml` con `allowBuilds: { esbuild: true }`, así que no debería
> pedirte nada. Si aparece `ERR_PNPM_IGNORED_BUILDS`, ejecuta `pnpm approve-builds`.

### 2. Variables de entorno

```bash
cp .env.example .env
```

Rellena con los datos de **Supabase → Project Settings → API**:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # la anon / publishable key
```

Son variables **públicas** a propósito: viajan al navegador. La seguridad la
pone RLS. **Nunca** pongas la `service_role` key aquí.

### 3. Base de datos

La migración ya está en el repo:

```
supabase/migrations/20261026201500_muro_de_los_miedos.sql
```

Con la CLI linkeada al proyecto:

```bash
supabase link --project-ref <tu-project-ref>   # si aún no lo está
supabase db push
```

O pega el contenido del `.sql` en el **SQL Editor** del dashboard.

#### Si prefieres el SQL a mano

```sql
create table if not exists public.miedos (
  id bigint generated always as identity primary key,
  contenido text not null,
  autor_alias text not null default 'Anónimo',
  creado_en timestamptz not null default now(),
  constraint miedos_contenido_util check (char_length(btrim(contenido)) between 3 and 280),
  constraint miedos_alias_corto check (char_length(autor_alias) between 1 and 24)
);

create index if not exists miedos_creado_en_idx on public.miedos (creado_en desc, id desc);

alter table public.miedos enable row level security;
alter table public.miedos force row level security;

create policy "miedos_lectura_publica" on public.miedos
  for select to anon, authenticated using (true);

create policy "miedos_insercion_publica" on public.miedos
  for insert to anon, authenticated with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert on table public.miedos to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
```

Sin políticas de `UPDATE` ni `DELETE`: con RLS activo esas operaciones quedan
denegadas para `anon` aunque alguien tenga el permiso a nivel de tabla.

### 4. Desarrollo

```bash
pnpm dev        # http://localhost:4321
pnpm build      # genera el SSR para Netlify
pnpm preview    # previsualiza el build
```

---

## Estructura del proyecto

```
.
├── astro.config.mjs            # output: "server" + adapter Netlify + Vue + Tailwind
├── netlify.toml                # build, Node 22 y cabeceras de seguridad
├── pnpm-workspace.yaml         # allowBuilds para esbuild
├── .env.example                # plantilla de variables públicas
├── supabase/
│   └── migrations/
│       └── 20261026201500_muro_de_los_miedos.sql
├── public/
│   ├── favicon.svg
│   └── favicon.ico
├── scripts/
│   └── probar-filtro.mjs       # pruebas del filtro (sin dependencias)
└── src/
    ├── env.d.ts                # tipado de import.meta.env
    ├── styles/
    │   └── global.css          # tokens (@theme), papel, cinta, botón vela, grano
    ├── lib/
    │   ├── supabase.ts         # cliente único (sirve en servidor y en islas)
    │   ├── miedos.ts           # listar / nuevos desde id / insertar
    │   ├── schemas.ts          # esquema Zod + saneado del texto
    │   ├── profanidad.ts       # motor del filtro (normaliza y compara)
    │   ├── palabras-bloqueadas.ts # lista negra + muletillas permitidas
    │   ├── fecha.ts            # "hace 5 min", folios, fechas cortas
    │   ├── rotacion.ts         # inclinación estable por papelito (-3°..+3°)
    │   └── sonido.ts           # click tenebroso sintetizado (Web Audio)
    ├── store/
    │   └── miedos.ts           # Nano Store: miedos colgados en esta visita
    ├── layouts/
    │   └── Layout.astro        # <head>, fuentes, fondo, skip link
    ├── pages/
    │   └── index.astro         # SSR: trae el muro y lo pasa a las islas
    └── components/
        ├── Hero.astro          # estático (+ datos reales del muro)
        ├── FondoHalloween.astro# estático: cielo, murciélagos, telaraña, calabazas
        ├── Footer.astro        # estático
        ├── TarjetaMiedo.vue    # isla hija: papelito con cinta
        ├── FormMiedo.vue       # ISLA (client:load): formulario + validación + submit
        ├── MuroMiedos.vue      # ISLA (client:idle): grid, recargar, cargar más, auto-refresh
        └── BotonSonido.vue     # ISLA (client:idle): mute persistente
```

### Por qué cada cosa es `.astro` o `.vue`

| Archivo                    | Tipo  | Motivo                                                        |
| -------------------------- | ----- | ------------------------------------------------------------- |
| `Hero.astro`               | Astro | Cero estado. Recibe datos ya resueltos en el servidor.        |
| `FondoHalloween.astro`     | Astro | SVG + CSS. Nada de JS.                                        |
| `Footer.astro`             | Astro | Estático.                                                     |
| `FormMiedo.vue`            | Vue   | Estado real: textarea, contador, validación, spinner, éxito.  |
| `TarjetaMiedo.vue`         | Vue   | Se renderiza dentro de la isla del muro (necesita reactividad).|
| `MuroMiedos.vue`           | Vue   | Auto-refresh, paginación, "recargar", prepend sin refrescar.   |
| `BotonSonido.vue`          | Vue   | Toggle con persistencia en `localStorage`.                    |

El muro es SSR: Astro pinta las tarjetas iniciales en el HTML y la isla
`MuroMiedos` se hidrata cuando el navegador está libre (`client:idle`). Si el
usuario nunca interactúa, igual ve el muro completo.

---

## Cómo funciona el flujo "publicar y que aparezca arriba"

1. `FormMiedo` valida con Zod (prefijo «Tengo miedo de…», longitudes, groserías)
   y hace `insert` en Supabase con la anon key.
2. Supabase devuelve la fila creada (`.select().single()`).
3. El formulario la publica en el Nano Store `miedosColgados`.
4. `MuroMiedos` está suscrito al store y la fusiona arriba del grid, sin recargar.
5. `reproducirClickTenebroso()` suena (si el usuario no lo ha silenciado).
6. Cada 30 s, y solo con la pestaña visible, el muro pregunta por `id > último`
   para traer lo que hayan colgado otras personas.

Detalles de robustez:

- **Deduplicación por id** al fusionar, para no duplicar si el auto-refresh y el
  store traen la misma fila.
- **Reloj compartido** (`provide/inject`): un solo intervalo actualiza los
  "hace 5 min" de todas las tarjetas.
- **Fechas sin desajustes de hidratación**: el servidor pinta la fecha corta y el
  cliente la sustituye por la relativa al montar.
- **Sin JS**: el muro inicial sigue visible porque viene del SSR.

---

## Diseño

**Paleta** (tokens en `src/styles/global.css`):

| Token            | Hex       | Uso                                  |
| ---------------- | --------- | ------------------------------------ |
| `carbon`         | `#0a0a0a` | Fondo                                |
| `calabaza`       | `#ff6b1a` | Acento, llama, foco                  |
| `embrujado`      | `#6b21a8` | Luz morada, aliases                  |
| `toxico`         | `#84cc16` | Estado "en vivo", éxito              |
| `hueso`          | `#f5f0e1` | Texto y papel                        |
| `tinta`          | `#17120f` | Texto sobre papel                    |

**Tipografía**: Creepster (cartel), Inter Variable (interfaz), Crimson Text
(lo escrito en el papelito), mono del sistema (folios y etiquetas).

**La idea**: todo es papel pegado a una pared en una habitación a oscuras. Las
tarjetas llevan cinta adhesiva, una inclinación estable (derivada del `id`, así
no bailan entre renders) y un folio de recibo. El hero incluye una ficha de
estado con datos reales (papeles colgados, último miedo, estado).

**Animaciones**: murciélagos que cruzan de vez en cuando, calabazas flotando,
grano de película, llama temblando en el botón, entrada fade+scale de tarjetas.
Todas respetan `prefers-reduced-motion`.

**Cursor**: vela dibujada en SVG como `cursor` CSS, solo en `pointer: fine`. Para
quitarlo, borra el bloque `@media (pointer: fine)` en `global.css`.

**Sonido**: no hay archivos de audio. El "click" se sintetiza con Web Audio
(golpe grave + crujido de papel filtrado). El botón flotante de la esquina
silencia y recuerda la preferencia.

---

## Accesibilidad

- Contraste alto (texto hueso sobre carbón; tinta sobre papel).
- Skip link al formulario, `lang="es"`, labels reales y `aria-describedby` en el
  contador de caracteres.
- Mensajes de éxito/error con `role="status"` / `role="alert"`.
- Foco visible en todo el sitio (`:focus-visible` naranja; morado sobre papel).
- Decoración entera con `aria-hidden`.
- `prefers-reduced-motion` desactiva murciélagos, flotación y enderezado de notas.

---

## Despliegue en Netlify

1. Sube el repo a GitHub/GitLab.
2. En Netlify: **Add new site → Import an existing project**.
3. Build command `pnpm build`, publish directory `dist` (ya está en
   `netlify.toml`, no hace falta tocar nada).
4. En **Site configuration → Environment variables**, añade:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

El adapter genera la función SSR y el `_redirects` automáticamente. Cada visita
lee el muro fresco de Supabase.

> Si despliegas en otro sitio (Vercel, Cloudflare) cambia el adapter en
> `astro.config.mjs` por el correspondiente; el resto del código no se toca.

---

## Scripts

| Comando         | Qué hace                                |
| --------------- | --------------------------------------- |
| `pnpm dev`      | Servidor de desarrollo en `:4321`       |
| `pnpm build`    | Build SSR para Netlify                  |
| `pnpm preview`  | Sirve el build localmente               |
| `pnpm astro …`  | CLI de Astro (`astro check`, `astro add`) |
| `pnpm probar:filtro` | Prueba el filtro de groserías y las reglas de envío del formulario |

---

## Mantenimiento del evento

**Borrar los miedos de prueba** (o limpiar entre ediciones del evento):

```sql
truncate table public.miedos restart identity;
```

**Borrar un miedo concreto** (solo desde el dashboard o con `service_role`;
`anon` no tiene permiso, a propósito):

```sql
delete from public.miedos where id = 42;
```

**Moderación**: no hay panel. Si alguien escribe algo ofensivo, bórralo desde el
SQL Editor del dashboard. Si el evento es grande, considera añadir un rate limit
por IP en una Edge Function o un edge middleware de Netlify.

**Filtro de groserías**: el formulario rechaza groserías explícitas, insultos
fuertes y slurs antes de insertar (ver `src/lib/profanidad.ts` y
`src/lib/palabras-bloqueadas.ts`). Cubre español general, México, Venezuela y
Caribe, Argentina, Chile y Colombia. Las palabras de doble filo que sí son
miedos legítimos (`bicho`, `sapo`, `gonorrea`, `arrecho`, `carajito`) están en
`PALABRAS_AMBIGUAS_PERMITIDAS`, y las muletillas (`güey`, `pinche`, `nojoda`)
en `MULETILLAS_PERMITIDAS`. Para añadir o quitar palabras, edita el array y
ejecuta `pnpm probar:filtro`. Ojo: al vivir en el cliente, protege a quien usa
la web pero **no** a quien llame a la API de Supabase directamente; para eso
habría que replicar la misma lista en un trigger de Postgres.

---

## Troubleshooting

**`ERR_PNPM_IGNORED_BUILDS` al instalar** → `pnpm approve-builds` y elige `esbuild`.

**`PSSecurityException` en PowerShell** (no puede ejecutar `pnpm.ps1`):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
# o usa pnpm.cmd
```

**El muro sale vacío y la consola avisa de variables de entorno** → falta el
`.env` o no reiniciaste el dev server.

**`os error 32` al instalar en Windows** → un antivirus/indexador tiene bloqueado
`node_modules`. Borra `node_modules` y reinstala; si persiste, excluye la carpeta
en Defender.

**Supabase responde 401 al insertar** → las políticas RLS o los `grant` no se
aplicaron. Vuelve a correr la migración y comprueba en **Authentication → Policies**
que existen las dos políticas de `miedos`.
