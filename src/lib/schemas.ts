import { z } from "zod";
import { contieneGroseria, normalizar } from "./profanidad.ts";

export const CONTENIDO_MAX = 280;
export const CONTENIDO_MIN = 3;
export const ALIAS_MAX = 24;
export const ALIAS_POR_DEFECTO = "Anónimo";

/** Todo miedo empieza así: el muro se lee como una sola voz. */
export const PREFIJO_MIEDO = "Tengo miedo de";

const PREFIJO_NORMALIZADO = normalizar(PREFIJO_MIEDO);

/**
 * ¿El texto arranca con «Tengo miedo de…»? No distingue mayúsculas ni acentos,
 * y acepta «Tengo miedo del sótano» porque también empieza por el prefijo.
 */
export function empiezaConMiedo(texto: string): boolean {
  return normalizar(texto).startsWith(PREFIJO_NORMALIZADO);
}

/** Lo que queda después del prefijo, o "" si el texto ni siquiera lo tiene. */
function restoTrasPrefijo(texto: string): string {
  const normalizado = normalizar(texto);

  return normalizado.startsWith(PREFIJO_NORMALIZADO)
    ? normalizado.slice(PREFIJO_NORMALIZADO.length).trim()
    : "";
}

/** Quita caracteres de control y normaliza espacios sin cargarse los saltos de línea. */
function limpiar(texto: string): string {
  return texto
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Contrato único de un miedo: lo valida el formulario (isla Vue) y es la forma
 * que espera el insert en Supabase. La base de datos repite estas reglas con
 * CHECK constraints, porque el cliente nunca es de fiar.
 */
export const miedoSchema = z.object({
  contenido: z
    .string()
    .transform(limpiar)
    .refine((texto) => texto.length >= CONTENIDO_MIN, {
      message: "Escribe al menos unas palabras. Un miedo de una letra no asusta a nadie 🕯️",
    })
    .refine((texto) => texto.length <= CONTENIDO_MAX, {
      message: `Tu miedo pasa de ${CONTENIDO_MAX} caracteres. Recórtalo un poco.`,
    })
    .refine(empiezaConMiedo, {
      message: `Empieza tu miedo con «${PREFIJO_MIEDO}…». Así todos los papelitos se leen igual 🕯️`,
    })
    .refine((texto) => restoTrasPrefijo(texto).length >= CONTENIDO_MIN, {
      message: `Cuéntanos qué te da miedo después de «${PREFIJO_MIEDO}…».`,
    })
    // Después de las longitudes: un texto largo y soez debe seguir diciendo
    // «pasa de 280», que es lo que el usuario puede arreglar primero.
    .refine((texto) => !contieneGroseria(texto), {
      message: "Ese miedo trae palabras que no caben en este muro. Reescríbelo con otras 🕯️",
    }),
  autor_alias: z
    .string()
    .transform((texto) => limpiar(texto).replace(/\n+/g, " "))
    .refine((texto) => texto.length <= ALIAS_MAX, {
      message: `El alias no puede pasar de ${ALIAS_MAX} caracteres.`,
    })
    .transform((texto) => (texto.length > 0 ? texto : ALIAS_POR_DEFECTO)),
});

export type EntradaMiedo = z.infer<typeof miedoSchema>;
