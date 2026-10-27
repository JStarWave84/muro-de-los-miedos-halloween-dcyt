<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { crearMiedo } from "../lib/miedos";
import { contieneGroseria } from "../lib/profanidad";
import {
  ALIAS_MAX,
  ALIAS_POR_DEFECTO,
  CONTENIDO_MAX,
  empiezaConMiedo,
  miedoSchema,
  PREFIJO_MIEDO,
} from "../lib/schemas";
import { reproducirClickTenebroso } from "../lib/sonido";
import { colgarEnElMuro } from "../store/miedos";

const contenido = ref("");
const alias = ref("");
const trampa = ref(""); // honeypot anti-bots: si llega relleno, ignoramos el envío
const enviando = ref(false);
const exito = ref<string | null>(null);
const errorEnvio = ref<string | null>(null);
const errorCampo = ref<string | null>(null);
const areaRef = ref<HTMLTextAreaElement | null>(null);

let temporizadorExito: ReturnType<typeof setTimeout> | undefined;

const caracteres = computed(() => contenido.value.length);
const restantes = computed(() => CONTENIDO_MAX - caracteres.value);
const excedido = computed(() => caracteres.value > CONTENIDO_MAX);
const hayGroseria = computed(() => contieneGroseria(contenido.value));
const faltaPrefijo = computed(
  () => contenido.value.trim().length > 0 && !empiezaConMiedo(contenido.value),
);

const colorContador = computed(() => {
  if (excedido.value) return "text-red-700";
  if (restantes.value <= 40) return "text-[#b45309]";
  return "text-tinta-suave/60";
});

const puedeEnviar = computed(
  () => !enviando.value && contenido.value.trim().length > 0 && !excedido.value,
);

function mostrarExito(mensaje: string) {
  exito.value = mensaje;
  clearTimeout(temporizadorExito);
  temporizadorExito = setTimeout(() => {
    exito.value = null;
  }, 7000);
}

async function enviar() {
  if (enviando.value) return;

  errorEnvio.value = null;
  errorCampo.value = null;
  exito.value = null;

  // Bot: fingimos éxito para no darle pistas.
  if (trampa.value.trim().length > 0) {
    mostrarExito("Tu miedo ha sido colgado en el muro... 🕸️");
    return;
  }

  const resultado = miedoSchema.safeParse({
    contenido: contenido.value,
    autor_alias: alias.value,
  });

  if (!resultado.success) {
    errorCampo.value = resultado.error.issues[0]?.message ?? "Revisa lo que escribiste.";
    areaRef.value?.focus();
    return;
  }

  enviando.value = true;

  try {
    const miedo = await crearMiedo(resultado.data);
    colgarEnElMuro(miedo);
    reproducirClickTenebroso();

    contenido.value = "";
    mostrarExito("Tu miedo ha sido colgado en el muro... 🕸️");
    areaRef.value?.focus();
  } catch (fallo) {
    console.error("[muro] no se pudo colgar el miedo:", fallo);
    errorEnvio.value = "El muro se comió tu miedo, intenta de nuevo 🎃";
  } finally {
    enviando.value = false;
  }
}

function alPulsarTecla(evento: KeyboardEvent) {
  if ((evento.ctrlKey || evento.metaKey) && evento.key === "Enter") {
    evento.preventDefault();
    void enviar();
  }
}

onBeforeUnmount(() => clearTimeout(temporizadorExito));
</script>

<template>
  <div class="nota papel px-5 pt-7 pb-7 sm:px-8 sm:pt-9 sm:pb-8" style="--rot: -0.7deg">
    <span class="cinta" aria-hidden="true" />

    <div class="flex items-baseline justify-between gap-4">
      <p class="etiqueta text-tinta-suave/70">Formulario 01 · sin registro</p>
      <p class="font-mono text-[0.65rem] tracking-widest text-tinta-suave/45">MÁX. 280</p>
    </div>

    <h2 class="mt-2 font-display text-[2rem] leading-none text-tinta sm:text-[2.6rem]">
      Cuelga tu miedo
    </h2>
    <p class="mt-2 max-w-lg font-nota text-[1.05rem] leading-snug text-tinta-suave">
      Escríbelo como se lo contarías a alguien de confianza. Nadie sabrá que es
      tuyo, salvo que firmes.
    </p>

    <form class="mt-6" novalidate @submit.prevent="enviar">
      <div>
        <label for="contenido" class="etiqueta text-tinta-suave/70">¿Qué te da miedo?</label>
        <textarea
          id="contenido"
          ref="areaRef"
          v-model="contenido"
          :maxlength="CONTENIDO_MAX"
          rows="3"
          name="contenido"
          placeholder="Tengo miedo de..."
          class="mt-2 w-full resize-none border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-nota text-[1.15rem] leading-snug text-tinta transition-colors placeholder:text-tinta/30 focus:border-embrujado"
          :aria-invalid="Boolean(errorCampo)"
          aria-describedby="contador-contenido"
          @keydown="alPulsarTecla"
        ></textarea>
      </div>

      <p
        v-if="faltaPrefijo && !errorCampo"
        class="mt-1 border-l-2 border-[#b45309] pl-3 font-mono text-[0.65rem] leading-relaxed text-[#7c2d12]"
        aria-live="polite"
      >
        Empieza con «{{ PREFIJO_MIEDO }}…»
      </p>

      <div class="mt-2 flex items-center justify-between gap-3">
        <p class="font-mono text-[0.65rem] text-tinta-suave/45">
          <span class="hidden sm:inline">Ctrl + Enter para colgar</span>
        </p>
        <p
          id="contador-contenido"
          class="font-mono text-[0.7rem] tabular-nums"
          :class="colorContador"
          aria-live="polite"
        >
          {{ caracteres }} / {{ CONTENIDO_MAX }}
        </p>
      </div>

      <p
        v-if="hayGroseria && !errorCampo"
        class="mt-1 border-l-2 border-[#b45309] pl-3 font-mono text-[0.65rem] leading-relaxed text-[#7c2d12]"
        aria-live="polite"
      >
        Hay una palabra que no cabe en este muro 🕯️
      </p>

      <div class="mt-5">
        <label for="alias" class="etiqueta text-tinta-suave/70">
          Firma tu miedo <span class="lowercase tracking-normal">(opcional)</span>
        </label>
        <input
          id="alias"
          v-model="alias"
          type="text"
          name="alias"
          :maxlength="ALIAS_MAX"
          autocomplete="off"
          :placeholder="ALIAS_POR_DEFECTO"
          class="mt-2 w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-nota text-[1.05rem] text-tinta transition-colors placeholder:text-tinta/30 focus:border-embrujado"
        />
        <p class="mt-1 font-mono text-[0.65rem] text-tinta-suave/45">
          Si lo dejas vacío se guarda como «{{ ALIAS_POR_DEFECTO }}».
        </p>
      </div>

      <!-- honeypot -->
      <div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label for="sitio-web">No rellenar este campo</label>
        <input id="sitio-web" v-model="trampa" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button type="submit" class="boton-vela" :disabled="enviando || !puedeEnviar">
          <span v-if="enviando" class="h-3.5 w-3.5 rounded-full border-2 border-hueso/25 border-t-calabaza motion-safe:animate-girar" aria-hidden="true"></span>
          <span v-else class="llama" aria-hidden="true"></span>
          <span>{{ enviando ? "Colgando..." : "Colgar mi miedo en el muro" }}</span>
        </button>
        <p class="font-mono text-[0.65rem] leading-relaxed text-tinta-suave/55">
          Se publica al instante. Después no se puede editar ni borrar.
        </p>
      </div>

      <p
        v-if="errorCampo"
        class="mt-4 border-l-2 border-[#b45309] pl-3 font-mono text-[0.72rem] leading-relaxed text-[#7c2d12]"
        role="alert"
      >
        {{ errorCampo }}
      </p>

      <p
        v-if="errorEnvio"
        class="mt-4 border-l-2 border-[#b91c1c] pl-3 font-mono text-[0.72rem] leading-relaxed text-[#7f1d1d]"
        role="alert"
      >
        {{ errorEnvio }}
      </p>

      <p
        v-if="exito"
        class="mt-5 inline-block -rotate-1 border-2 border-dashed border-toxico/60 bg-toxico/10 px-3 py-2 font-mono text-[0.7rem] tracking-wider text-[#3f6212] uppercase"
        role="status"
      >
        {{ exito }}
      </p>
    </form>
  </div>
</template>
