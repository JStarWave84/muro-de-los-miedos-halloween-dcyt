<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";
import TarjetaMiedo from "./TarjetaMiedo.vue";
import {
  MIEDOS_POR_PAGINA,
  listarMiedos,
  miedosNuevosDesde,
  type Miedo,
} from "../lib/miedos";
import { limpiarColgados, miedosColgados } from "../store/miedos";

const props = withDefaults(
  defineProps<{
    iniciales: Miedo[];
    totalInicial: number;
    errorInicial?: boolean;
  }>(),
  { errorInicial: false },
);

const SEGUNDOS_REFRESCO = 30;

const miedos = ref<Miedo[]>([...props.iniciales]);
const total = ref(props.totalInicial);
const cargandoMas = ref(false);
const recargando = ref(false);
const autoRefresco = ref(true);
const error = ref<string | null>(
  props.errorInicial ? "No pudimos leer el muro. Dale a reintentar 🕯️" : null,
);

/** Reloj compartido: un único intervalo para todas las tarjetas. */
const ahora = ref(Date.now());
provide("ahora", ahora);

/** Ids colgados durante esta visita (para el puntito naranja). */
const nuevosIds = ref<string[]>([]);
const cantidad = computed(() => total.value);
const hayMas = computed(() => miedos.value.length < total.value);

let intervalo: ReturnType<typeof setInterval> | undefined;
let desuscribir: (() => void) | undefined;

function ordenar(a: Miedo, b: Miedo): number {
  const diferencia = new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime();
  return diferencia !== 0 ? diferencia : Number(b.id) - Number(a.id);
}

/** Añade al principio lo que aún no esté en pantalla. Devuelve cuántos entraron. */
function fusionar(lista: Miedo[], marcarComoNuevos = true): number {
  const vistos = new Set(miedos.value.map((m) => String(m.id)));
  const entrantes = lista.filter((m) => !vistos.has(String(m.id)));
  if (entrantes.length === 0) return 0;

  miedos.value = [...entrantes, ...miedos.value].sort(ordenar);
  if (marcarComoNuevos) {
    nuevosIds.value = [...nuevosIds.value, ...entrantes.map((m) => String(m.id))];
  }
  return entrantes.length;
}

function idMaximo(): number {
  return miedos.value.reduce((maximo, m) => Math.max(maximo, Number(m.id)), 0);
}

async function cargarMas(): Promise<void> {
  if (cargandoMas.value || !hayMas.value) return;

  cargandoMas.value = true;
  error.value = null;

  try {
    const { miedos: pagina, total: totalServidor } = await listarMiedos({
      desde: miedos.value.length,
      limite: MIEDOS_POR_PAGINA,
    });

    // Los que llegan al cargar más son antiguos: no llevan el punto de "nuevo".
    fusionar(pagina, false);
    total.value = totalServidor;
  } catch (fallo) {
    console.error("[muro] no se pudieron traer más miedos:", fallo);
    error.value = "No pudimos traer más miedos. Dale a reintentar 🕯️";
  } finally {
    cargandoMas.value = false;
  }
}

async function recargar(): Promise<void> {
  if (recargando.value) return;

  recargando.value = true;
  error.value = null;

  try {
    const limite = Math.max(MIEDOS_POR_PAGINA, miedos.value.length);
    const { miedos: pagina, total: totalServidor } = await listarMiedos({ limite });

    miedos.value = pagina;
    total.value = totalServidor;
    nuevosIds.value = [];
    limpiarColgados();
  } catch (fallo) {
    console.error("[muro] no se pudo recargar el muro:", fallo);
    error.value = "El muro no responde. Dale a reintentar 🎃";
  } finally {
    recargando.value = false;
  }
}

/** Trae solo lo colgado después del último id que tenemos. */
async function buscarNuevos(): Promise<void> {
  if (document.visibilityState === "hidden") return;

  const maximo = idMaximo();
  if (maximo === 0) return;

  try {
    const nuevos = await miedosNuevosDesde(maximo);
    const agregados = fusionar(nuevos);
    if (agregados > 0) total.value += agregados;
  } catch {
    /* el auto-refresh es best-effort: si falla, no molestamos al usuario */
  }
}

function alternarAuto(): void {
  autoRefresco.value = !autoRefresco.value;
  if (autoRefresco.value) void buscarNuevos();
}

function alCambiarVisibilidad(): void {
  if (document.visibilityState === "visible" && autoRefresco.value) {
    ahora.value = Date.now();
    void buscarNuevos();
  }
}

onMounted(() => {
  // Si el formulario colgó un miedo antes de que esta isla hidratara, el atom
  // ya lo tiene: subscribe dispara al instante con el valor actual.
  desuscribir = miedosColgados.subscribe((lista) => {
    const agregados = fusionar(lista);
    if (agregados > 0) total.value += agregados;
  });

  intervalo = setInterval(() => {
    ahora.value = Date.now();
    if (autoRefresco.value) void buscarNuevos();
  }, SEGUNDOS_REFRESCO * 1000);

  document.addEventListener("visibilitychange", alCambiarVisibilidad);
});

onBeforeUnmount(() => {
  if (intervalo) clearInterval(intervalo);
  desuscribir?.();
  document.removeEventListener("visibilitychange", alCambiarVisibilidad);
});
</script>

<template>
  <section id="muro" class="relative mx-auto max-w-6xl px-5 pt-20 pb-4 sm:px-8">
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-hueso/10 pb-4">
      <div>
        <p class="etiqueta">El muro</p>
        <h2 class="mt-1 font-display text-4xl text-hueso sm:text-5xl">Miedos colgados</h2>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-hueso/55">
          Lo más reciente, arriba. Todo escrito por gente que estuvo aquí esta noche.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="font-mono text-[0.7rem] text-humo tabular-nums">
          {{ cantidad }} en total
        </span>

        <button
          type="button"
          class="inline-flex items-center gap-2 border border-hueso/15 px-3 py-2 font-mono text-[0.62rem] tracking-[0.16em] uppercase text-hueso/70 transition hover:border-calabaza/60 hover:text-hueso"
          :aria-pressed="autoRefresco"
          @click="alternarAuto"
        >
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="autoRefresco ? 'bg-toxico motion-safe:animate-latir' : 'bg-hueso/30'"
            aria-hidden="true"
          ></span>
          {{ autoRefresco ? "en vivo" : "en pausa" }}
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 border border-hueso/15 px-3 py-2 font-mono text-[0.62rem] tracking-[0.16em] uppercase text-hueso/70 transition hover:border-calabaza/60 hover:text-hueso disabled:opacity-50"
          :disabled="recargando"
          @click="recargar"
        >
          <span
            v-if="recargando"
            class="h-3 w-3 rounded-full border-2 border-hueso/25 border-t-calabaza motion-safe:animate-girar"
            aria-hidden="true"
          ></span>
          {{ recargando ? "recargando" : "recargar muro" }}
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="mt-5 flex flex-wrap items-center justify-between gap-3 border border-calabaza/30 bg-calabaza/5 px-4 py-3"
      role="alert"
    >
      <p class="font-mono text-[0.72rem] text-calabaza-claro">{{ error }}</p>
      <button
        type="button"
        class="border border-calabaza/40 px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.16em] uppercase text-calabaza-claro transition hover:bg-calabaza hover:text-carbon"
        @click="recargar"
      >
        Reintentar
      </button>
    </div>

    <!-- Estado vacío -->
    <div v-if="miedos.length === 0 && !error" class="mt-12">
      <div
        class="nota papel mx-auto max-w-lg px-7 py-10 text-center sm:px-10"
        style="--rot: -1.1deg"
      >
        <span class="cinta" aria-hidden="true" />
        <p class="font-display text-[2rem] leading-none text-tinta">El muro está vacío</p>
        <p class="mt-3 font-nota text-lg text-tinta-suave">
          ¿Te atreves a ser el primero? 👻
        </p>
        <a href="#cuelga" class="boton-vela mt-7 no-underline">
          <span class="llama" aria-hidden="true"></span>
          <span>Colgar el primer miedo</span>
        </a>
      </div>
    </div>

    <!-- Muro -->
    <div
      v-else-if="miedos.length > 0"
      class="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <TarjetaMiedo
        v-for="(miedo, indice) in miedos"
        :key="miedo.id"
        :miedo="miedo"
        :indice="indice"
        :nueva="nuevosIds.includes(String(miedo.id))"
      />

      <template v-if="cargandoMas">
        <div
          v-for="n in 4"
          :key="`hueso-${n}`"
          class="papel h-40 opacity-40 motion-safe:animate-pulse"
          aria-hidden="true"
        ></div>
      </template>
    </div>

    <div v-if="miedos.length > 0" class="mt-12 flex flex-col items-center gap-4">
      <button
        v-if="hayMas"
        type="button"
        class="inline-flex items-center gap-2 border border-hueso/20 px-5 py-3 font-mono text-[0.66rem] tracking-[0.18em] uppercase text-hueso/80 transition hover:border-calabaza hover:text-calabaza disabled:opacity-50"
        :disabled="cargandoMas"
        @click="cargarMas"
      >
        <span
          v-if="cargandoMas"
          class="h-3 w-3 rounded-full border-2 border-hueso/25 border-t-calabaza motion-safe:animate-girar"
          aria-hidden="true"
        ></span>
        {{ cargandoMas ? "Despegando papelitos..." : `Traer más miedos (${total - miedos.length})` }}
      </button>

      <p v-else class="etiqueta text-hueso/30">
        Eso es todo lo que el muro se atreve a mostrar.
      </p>

      <p class="max-w-sm text-center text-xs leading-relaxed text-hueso/30">
        ¿Ves algo que no debería estar aquí? Avisa a la organización del evento.
      </p>
    </div>
  </section>
</template>
