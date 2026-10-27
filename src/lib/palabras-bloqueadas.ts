/**
 * Lista negra del Muro de los Miedos.
 *
 * Solo datos: la lógica vive en `profanidad.ts`. Para añadir o quitar una
 * palabra basta con tocar este array; el motor compila los patrones al cargar.
 *
 * Criterio editorial (importante, porque el muro es de miedos y no de insultos):
 *   · Se bloquean groserías explícitas, insultos fuertes y slurs discriminatorios.
 *   · NO se bloquean los insultos leves (idiota, estúpido, imbécil, tarado) ni
 *     las muletillas de bajo impacto: muchos miedos legítimos son justamente
 *     «que me llamen idiota» o «el pinche payaso del parque».
 *   · Los slurs se bloquean siempre, sin importar el contexto.
 *
 * Las palabras se escriben de forma natural (con acentos y ñ); el motor las
 * normaliza antes de comparar, así que `cabrón` y `cabron` son lo mismo.
 */
export const PALABRAS_BLOQUEADAS = [
  // --- Escatología y sexualidad explícita ---------------------------------
  "mierda",
  "mierdas",
  "mierdero",
  "mierderos",
  "cagada",
  "cagadas",
  "cagón",
  "cagona",
  "cagalera",
  "culo",
  "culos",
  "culito",
  "culazo",
  "culote",
  "ojete",
  "ojetes",
  "pedo",
  "pedos",
  "mojón",
  "mojones",
  "polla",
  "pollas",
  "verga",
  "vergas",
  "pija",
  "pijas",
  "pinga",
  "pingas",
  "poronga",
  "picha",
  "pichas",
  "coño",
  "coños",
  "cojones",
  "tetas",
  "tetazas",
  "mamada",
  "mamadas",
  "mamar",
  "mamón",
  "mamona",
  "mamones",
  "follar",
  "follada",
  "folladas",
  "orgía",
  "orgías",
  "masturbar",
  "masturbarse",
  "masturbación",

  // --- Insultos fuertes (España, México y general) ------------------------
  "pendejo",
  "pendeja",
  "pendejos",
  "pendejas",
  "pendejada",
  "pendejadas",
  "culero",
  "culera",
  "culeros",
  "culeras",
  "cabrón",
  "cabrona",
  "cabrones",
  "cabronas",
  "cabronazo",
  "chingar",
  "chingada",
  "chingadas",
  "chingadera",
  "chingaderas",
  "chinga",
  "chingas",
  "chingue",
  "mugroso",
  "mugrosa",
  "mugrosos",
  "mugrosas",
  "zorra",
  "zorras",
  "perra",
  "perras",
  "puta",
  "putas",
  "puto",
  "putos",
  "putear",
  "puteada",
  "puteo",
  "piruja",
  "pirujas",
  "guarra",
  "guarras",
  "golfa",
  "golfas",

  // --- Regionalismos de Latinoamérica -------------------------------------
  "culiao",
  "culiaos",
  "culiada",
  "culiadas",
  "culiado",
  "culiados",
  "conchetumadre",
  "conchetumare",
  "conchatumadre",
  "conchatumare",
  "aweonao",
  "aweona",
  "aweonaos",
  "aweonado",
  "aweonada",
  "hueón",
  "hueona",
  "hueones",
  "huevón",
  "huevona",
  "huevones",
  "huevada",
  "huevadas",
  "weón",
  "weon",
  "pelotudo",
  "pelotuda",
  "pelotudos",
  "pelotudas",
  "boludo",
  "boluda",
  "boludos",
  "boludas",
  "malparido",
  "malparida",
  "malparidos",
  "malparidas",
  "cojudo",
  "cojuda",
  "chupapija",
  "ctm",
  "ptm",
  "qlo",
  "qliao",
  "qlia",

  // --- Venezuela y Caribe ------------------------------------------------
  // Ojo con el vocabulario venezolano: mucho es «de uso diario» pero sigue
  // siendo vulgar. Se bloquea lo explícito; se dejan fuera muletillas y
  // palabras que también son cosas normales (ver nota al final del archivo).
  "pajúo",
  "pajúa",
  "pajúos",
  "pajúas",
  "güevonada",
  "güevonadas",
  "chupagüevo",
  "chupagüevos",
  "chupamela",
  "chupamelo",
  "crica",
  "cricas",
  "coñoemadre",
  "careverga",
  "carevergas",
  "carajo",
  "carajos",
  "pelabolas",

  // --- Slurs discriminatorios (se bloquean siempre) -----------------------
  "maricón",
  "maricona",
  "maricones",
  "mariconazo",
  "marica",
  "maricas",
  "marico",
  "maricos",
  "joto",
  "jotos",
  "travelo",
  "travelos",
  "trolo",
  "trola",
  "trolos",
  "bollera",
  "bolleras",
  "retrasado",
  "retrasada",
  "retrasados",
  "retrasadas",
  "mongólico",
  "mongólica",
  "mongólicos",
  "mongólicas",
  "subnormal",
  "subnormales",
  "sudaca",
  "sudacas",
  "frijolero",
  "frijoleros",
  "naco",
  "naca",
  "nacos",
  "nacas",
  "sidoso",
  "sidosa",
  "sidosos",
  "sidosas",

  // --- Compuestos --------------------------------------------------------
  "hijueputa",
  "hijueputas",
  "hijoputa",
  "hijoputas",
  "putamadre",
  "chingatumadre",
  "chingatumare",
  "comemierda",
  "comemierdas",
  "mamaverga",
  "mamagüevo",
  "mamagüevos",
  "mamahuevo",
  "mamahuevos",
  "mamaguevo",
  "mamaguevos",
] as const;

/**
 * Palabras que se dejaron FUERA a propósito.
 *
 * No se usan para filtrar: `scripts/probar-filtro.mjs` comprueba que sigan
 * pasando, para que nadie las meta en la lista negra por accidente y empiece a
 * rechazar miedos perfectamente válidos.
 */
export const MULETILLAS_PERMITIDAS = [
  "güey",
  "guey",
  "wey",
  "pinche",
  "pinches",
  "chido",
  "chida",
  "joder",
  "jodido",
  "jodida",
  "mames",
  "nojoda",
] as const;

/**
 * Palabras de doble filo: en un muro de miedos aparecen todo el tiempo con su
 * significado inocente, así que bloquearlas sería peor que el problema.
 *
 *   · bicho / sapo      → en Venezuela y Colombia son insultos, pero «me dan
 *                         miedo los bichos» es un miedo de verdad.
 *   · gonorrea          → insulto fuerte en Colombia y Venezuela, y también
 *                         una enfermedad venérea de la que uno puede tener miedo.
 *   · carajito          → en Venezuela es «niño», no un insulto.
 *   · arrecho           → en Venezuela significa «furioso», no lo que significa
 *                         en otros países.
 *
 * El test comprueba que sigan pasando. Si el evento es en Venezuela y prefieres
 * bloquear alguna, muévela a `PALABRAS_BLOQUEADAS` y quítala de aquí.
 */
export const PALABRAS_AMBIGUAS_PERMITIDAS = [
  "bicho",
  "bichos",
  "sapo",
  "sapos",
  "gonorrea",
  "carajito",
  "carajitos",
  "arrecho",
  "arrecha",
] as const;
