// @ts-check
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";

// El muro se sirve renderizado desde el servidor (SSR) para que cualquiera vea
// los miedos recién colgados incluso sin JavaScript.
// Astro 7 eliminó `output: 'hybrid'`: ahora `static` + `prerender = false` por
// página hace lo mismo. Aquí vamos con `server` porque todo el sitio es dinámico.
export default defineConfig({
  output: "server",
  adapter: netlify({
    // No usamos Edge Functions ni la Image CDN de Netlify. Desactivarlas en dev
    // evita que `astro dev` intente levantar el emulador local de Deno.
    devFeatures: { edgeFunctions: false, images: false, environmentVariables: false },
  }),
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
});
