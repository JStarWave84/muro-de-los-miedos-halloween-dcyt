/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase, p. ej. https://xxxxx.supabase.co */
  readonly PUBLIC_SUPABASE_URL: string;
  /** Anon key pública de Supabase (segura de exponer: RLS manda). */
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
