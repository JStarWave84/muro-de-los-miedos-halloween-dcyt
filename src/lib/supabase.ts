import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/**
 * true cuando las dos variables de entorno están definidas.
 * Lo usamos para degradar con un mensaje amable en vez de romper el muro
 * entero si alguien despliega sin configurar el .env.
 */
export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Cliente único de Supabase. Sirve tanto en el servidor (Astro SSR) como en las
 * islas Vue: las credenciales son públicas por diseño y RLS limita el acceso.
 */
export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
