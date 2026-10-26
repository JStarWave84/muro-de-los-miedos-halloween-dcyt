import { z } from "zod";

export const CONTENIDO_MAX = 280;
export const CONTENIDO_MIN = 3;
export const ALIAS_MAX = 24;
export const ALIAS_POR_DEFECTO = "Anónimo";

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
