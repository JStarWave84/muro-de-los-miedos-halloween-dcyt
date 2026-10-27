import { PALABRAS_BLOQUEADAS } from "./palabras-bloqueadas.ts";

/**
 * Detector de groserías para el muro.
 *
 * Se ejecuta en el navegador (filtro del formulario), así que no puede depender
 * de nada que no sea Vanilla TS. El texto original NUNCA se modifica: solo se
 * normaliza una copia para compararla.
 *
 * Aviso de alcance: al vivir en el cliente, esto frena a quien escribe en la
 * web, no a quien llame a la API de Supabase directamente. La barrera real
 * sería replicar esta misma lista en un trigger de Postgres.
 */

/** Vocales acentuadas → vocal base. La ñ se queda como ñ (si no, «año» ≠ «ano»). */
const ACENTOS: Record<string, string> = {
  á: "a", à: "a", ä: "a", â: "a", ã: "a", å: "a",
  é: "e", è: "e", ë: "e", ê: "e",
  í: "i", ì: "i", ï: "i", î: "i",
  ó: "o", ò: "o", ö: "o", ô: "o", õ: "o",
  ú: "u", ù: "u", ü: "u", û: "u",
  ý: "y", ÿ: "y",
};

/**
 * Leet / homóglifos: NO se aplican al texto. Si se aplicaran, `¡Vete al
 * carajo!` se convertiría en `carajoi` (porque `!` → `i`) y la palabra se
 * colaría. Se usan al construir cada patrón: la letra puede ser ella misma o
 * cualquiera de sus homóglifos.
 */
const VARIANTES: Record<string, string> = {
  a: "a4@",
  b: "b8",
  e: "e3€",
  g: "g69",
  i: "i1!|",
  l: "l1|",
  o: "o0",
  s: "s5$",
  t: "t7",
  y: "y¥",
};

/** Caracteres de formato invisibles (zero-width space, soft hyphen…). */
const INVISIBLES = /\p{Cf}/u;

/**
 * Prepara el texto para comparar: NFKC (colapsa homóglifos de ancho completo),
 * minúsculas, fuera invisibles y acentos. No toca el texto mostrado.
 */
export function normalizar(texto: string): string {
  let salida = "";

  for (const caracter of texto.normalize("NFKC").toLowerCase()) {
    if (INVISIBLES.test(caracter)) continue;
    salida += ACENTOS[caracter] ?? caracter;
  }

  return salida;
}

function escapar(caracter: string): string {
  return caracter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Un patrón por palabra: permite letras repetidas (`mieeerda`) y sus variantes
 * leet (`m1erda`, `put@`), y exige fronteras de palabra. La frontera es lo que
 * evita los falsos positivos clásicos: `computadora`, `disputa` y `reputación`
 * contienen «puta»; `vehículo` y `artículo` contienen «culo».
 *
 * Sin lookbehind a propósito: `(?:^|[^\p{L}\p{N}])` funciona en cualquier
 * navegador, no solo en los que soportan `(?<=…)`.
 */
function patronDe(palabra: string): RegExp {
  const cuerpo = [...normalizar(palabra)].map(claseDe).join("");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${cuerpo}(?![\\p{L}\\p{N}])`, "u");
}

/** Clase de un carácter: la letra repetida o cualquiera de sus homóglifos. */
function claseDe(caracter: string): string {
  const variantes = VARIANTES[caracter];
  if (!variantes) return `${escapar(caracter)}+`;

  return `[${[...variantes].map(escapar).join("")}]+`;
}

const PATRONES: RegExp[] = [
  // Se deduplica por la forma normalizada para que «weón» y «weon» (o
  // «pajúo» y «pajuo») no compilen dos veces el mismo patrón.
  ...new Set<string>(PALABRAS_BLOQUEADAS.map(normalizar)),
].map(patronDe);

/** Secuencias de letras sueltas separadas por signos: «m i e r d a». */
const SECUENCIA_SUELTA = /(?:\p{L}[\s._*·•-]){2,}\p{L}/gu;

function coincide(texto: string): boolean {
  return PATRONES.some((patron) => patron.test(texto));
}

/**
 * ¿El texto trae alguna palabra de la lista negra?
 *
 * Dos pasadas: la estricta (palabra completa, tolerante a repeticiones, leet y
 * acentos) y una segunda solo para letras separadas por signos. La segunda no
 * compacta el texto entero a propósito: eso haría que «come puta» se leyera
 * como «comeputa» y generaría falsos positivos en cadena.
 */
export function contieneGroseria(texto: string): boolean {
  const normalizado = normalizar(texto);

  if (coincide(normalizado)) return true;

  for (const [secuencia] of normalizado.matchAll(SECUENCIA_SUELTA)) {
    if (coincide(secuencia.replace(/[^\p{L}]/gu, ""))) return true;
  }

  return false;
}
