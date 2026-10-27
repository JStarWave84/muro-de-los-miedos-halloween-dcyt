/**
 * Pruebas del formulario: filtro de groserías y reglas de envío.
 *
 * Sin dependencias: Node 22.18+ ejecuta TypeScript directamente, así que basta
 * con `node scripts/probar-filtro.mjs` (o `pnpm probar:filtro`).
 */
import { contieneGroseria } from "../src/lib/profanidad.ts";
import {
  MULETILLAS_PERMITIDAS,
  PALABRAS_AMBIGUAS_PERMITIDAS,
  PALABRAS_BLOQUEADAS,
} from "../src/lib/palabras-bloqueadas.ts";
import { miedoSchema } from "../src/lib/schemas.ts";

const fallos = [];

function debePasar(texto, motivo) {
  if (contieneGroseria(texto)) {
    fallos.push(`FALSO POSITIVO · ${motivo}\n    «${texto}» fue rechazado`);
  }
}

function debeFallar(texto, motivo) {
  if (!contieneGroseria(texto)) {
    fallos.push(`FALSO NEGATIVO · ${motivo}\n    «${texto}» se coló`);
  }
}

function debeEnviarse(contenido, motivo) {
  const resultado = miedoSchema.safeParse({ contenido, autor_alias: "" });

  if (!resultado.success) {
    const mensaje = resultado.error.issues[0]?.message ?? "sin mensaje";
    fallos.push(`NO SE ENVIÓ · ${motivo}\n    «${contenido}» → ${mensaje}`);
  }
}

function debeRechazarse(contenido, motivo) {
  if (miedoSchema.safeParse({ contenido, autor_alias: "" }).success) {
    fallos.push(`SE ENVIÓ · ${motivo}\n    «${contenido}» debería rechazarse`);
  }
}

// ---------------------------------------------------------------------------
// 1. Miedos legítimos que NO deben bloquearse (falsos positivos clásicos)
// ---------------------------------------------------------------------------
debePasar("Que la computadora se apague en pleno examen.", "«computadora» contiene puta");
debePasar("La disputa por la reputación de mi familia.", "«disputa» y «reputación» contienen puta");
debePasar("Que me atropelle un vehículo en la avenida.", "«vehículo» contiene culo");
debePasar("Ese artículo del periódico sobre el cementerio.", "«artículo» contiene culo");
debePasar("Un cálculo difícil en el pizarrón.", "«cálculo» contiene culo");
debePasar("Cumplir un año más sin hablarle.", "«año» no es «ano»");
debePasar("La cúpula de la iglesia vieja.", "«cúpula»");
debePasar("Mi mamá me espera en casa.", "«mamá» no es «mamar»");
debePasar("Compré una pera en el mercado.", "«pera» no es «perra»");
debePasar("El pinche payaso del parque.", "muletilla de bajo impacto");
debePasar("Que me diga güey delante de todos.", "muletilla de bajo impacto");
debePasar("Los bichos del jardín.", "«bicho» es insulto en Venezuela, pero también un miedo real");
debePasar("Un sapo en el patio.", "«sapo» es insulto en Venezuela, pero también un miedo real");
debePasar("Me da miedo contagiarme de gonorrea.", "enfermedad, no solo insulto");
debePasar("Los carajitos del barrio.", "«carajito» es «niño» en Venezuela");
debePasar("Estoy arrecho con la situación.", "«arrecho» es «furioso» en Venezuela");
debePasar("Mi hermana pequeña y sus muñecas.", "texto normal");
debePasar("¡Qué miedo da el sótano!", "signos de exclamación no rompen la detección");
debePasar("La oscuridad del pasillo después de las diez.", "texto normal");

// ---------------------------------------------------------------------------
// 2. Evasiones que SÍ deben bloquearse
// ---------------------------------------------------------------------------
debeFallar("mierda", "palabra directa");
debeFallar("¡mierda!", "signos de exclamación alrededor");
debeFallar("¡coño!", "exclamación antes y después");
debeFallar("MIEERDA", "mayúsculas y letras repetidas");
debeFallar("m1erda", "leet 1 → i");
debeFallar("miérda", "acento");
debeFallar("put@", "leet @ → a");
debeFallar("m i e r d a", "letras separadas por espacios");
debeFallar("m.i.e.r.d.a", "letras separadas por puntos");
debeFallar("mie\u200Brda", "zero-width space");
debeFallar("ＭＩＥＲＤＡ", "ancho completo (NFKC)");
debeFallar("hijueputa", "compuesto sin «puta» aislada");
debeFallar("culiao", "regionalismo chileno");
debeFallar("no mames, qué pendejada", "grosería dentro de una frase");
debeFallar("Tengo miedo de que me digan maricón.", "slur en contexto");

// --- Venezuela -------------------------------------------------------------
debeFallar("pajúo", "insulto venezolano");
debeFallar("Qué güevonada hiciste.", "venezolano, con diéresis");
debeFallar("chupagüevo", "venezolano");
debeFallar("Esa crica no me la sé.", "venezolano, vulgar");
debeFallar("coñoemadre", "venezolano, sin espacios");
debeFallar("¡Coño e' tu madre!", "venezolano, con apóstrofo");
debeFallar("careverga", "venezolano/colombiano");
debeFallar("¡Vete al carajo!", "venezolano/general");
debeFallar("Ese pelabolas no entiende.", "clasismo venezolano");

// ---------------------------------------------------------------------------
// 3. Toda la lista se detecta sola (detecta erratas al añadir palabras)
// ---------------------------------------------------------------------------
for (const palabra of PALABRAS_BLOQUEADAS) {
  debeFallar(`Tengo miedo de ${palabra} en el pasillo.`, `entrada de la lista: «${palabra}»`);
}

// ---------------------------------------------------------------------------
// 4. Las muletillas y las palabras ambiguas permitidas siguen pasando
// ---------------------------------------------------------------------------
for (const palabra of MULETILLAS_PERMITIDAS) {
  debePasar(`Aquí no bloqueamos ${palabra}, es una muletilla.`, `permitida: «${palabra}»`);
}

for (const palabra of PALABRAS_AMBIGUAS_PERMITIDAS) {
  debePasar(`Aquí no bloqueamos ${palabra}, tiene doble significado.`, `ambigua: «${palabra}»`);
}

// ---------------------------------------------------------------------------
// 5. El prefijo obligatorio «Tengo miedo de…» (reglas de envío)
// ---------------------------------------------------------------------------
debeEnviarse("Tengo miedo de que la computadora se apague.", "prefijo correcto");
debeEnviarse("tengo miedo de la oscuridad.", "sin mayúscula inicial");
debeEnviarse("TENGO MIEDO DE QUE SE CAIGA EL TECHO.", "en mayúsculas");
debeEnviarse("Tengo miedo del sótano.", "«del» también arranca con el prefijo");
debeEnviarse("  Tengo miedo de los payasos.  ", "con espacios alrededor");
debeRechazarse("El payaso me da miedo.", "sin prefijo");
debeRechazarse("Me da miedo la oscuridad.", "sin prefijo");
debeRechazarse("Tengo miedo de", "prefijo sin contenido después");
debeRechazarse("Tengo miedo de x", "contenido demasiado corto");

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------
if (fallos.length > 0) {
  console.error(`✗ ${fallos.length} problema(s) en el formulario:\n`);
  for (const fallo of fallos) console.error(`  · ${fallo}\n`);
  process.exit(1);
}

const total =
  PALABRAS_BLOQUEADAS.length + MULETILLAS_PERMITIDAS.length + PALABRAS_AMBIGUAS_PERMITIDAS.length;
console.log(
  `✓ Formulario OK · filtro (${total} palabras) y prefijo obligatorio, sin evasiones ni falsos positivos`,
);
