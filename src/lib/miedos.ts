import { supabase } from "./supabase";

/** Una fila de `public.miedos`, tal como la devuelve la API de Supabase. */
export type Miedo = {
  id: number;
  contenido: string;
  autor_alias: string;
  creado_en: string;
};

export const MIEDOS_POR_PAGINA = 24;

const TABLA = "miedos";
const COLUMNAS = "id, contenido, autor_alias, creado_en";

function cliente() {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en tu .env",
    );
  }
  return supabase;
}

/** Primera página del muro: los más recientes primero. */
export async function listarMiedos({
  desde = 0,
  limite = MIEDOS_POR_PAGINA,
}: { desde?: number; limite?: number } = {}): Promise<{
  miedos: Miedo[];
  total: number;
}> {
  const { data, error, count } = await cliente()
    .from(TABLA)
    .select(COLUMNAS, { count: "exact" })
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false })
    .range(desde, desde + limite - 1);

  if (error) throw error;

  return { miedos: (data ?? []) as Miedo[], total: count ?? 0 };
}

/** Miedos colgados después de `id` (para el auto-refresh sin recargar). */
export async function miedosNuevosDesde(id: number, limite = 30): Promise<Miedo[]> {
  const { data, error } = await cliente()
    .from(TABLA)
    .select(COLUMNAS)
    .gt("id", id)
    .order("id", { ascending: false })
    .limit(limite);

  if (error) throw error;

  return (data ?? []) as Miedo[];
}

/** Cuelga un miedo nuevo y devuelve la fila creada. */
export async function crearMiedo(entrada: {
  contenido: string;
  autor_alias: string;
}): Promise<Miedo> {
  const { data, error } = await cliente()
    .from(TABLA)
    .insert(entrada)
    .select(COLUMNAS)
    .single();

  if (error) throw error;

  return data as Miedo;
}
