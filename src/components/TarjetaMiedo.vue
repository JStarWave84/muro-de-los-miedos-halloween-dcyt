<script setup lang="ts">
import { computed, inject, onMounted, ref, type Ref } from "vue";
import type { Miedo } from "../lib/miedos";
import { fechaCompleta, fechaCorta, fechaRelativa, folio } from "../lib/fecha";
import { rotacionDe } from "../lib/rotacion";

const props = withDefaults(
  defineProps<{
    miedo: Miedo;
    indice?: number;
    nueva?: boolean;
  }>(),
  { indice: 0, nueva: false },
);

/** Reloj compartido que inyecta MuroMiedos (un solo intervalo para todo el muro). */
const ahora = inject<Ref<number> | undefined>("ahora", undefined);

const rotacion = computed(() => rotacionDe(props.miedo.id));
const retraso = computed(() => Math.min(props.indice, 11) * 45);

/**
 * En el servidor mostramos la fecha corta ("26 oct") y, ya montados, la
 * relativa ("hace 5 min"): así el HTML de Astro y el de Vue coinciden y no hay
 * desajustes de hidratación.
 */
const montado = ref(false);
onMounted(() => {
  montado.value = true;
});

const cuando = computed(() => {
  if (!montado.value) return fechaCorta(props.miedo.creado_en);
  return fechaRelativa(props.miedo.creado_en, ahora?.value ?? Date.now());
});

const alias = computed(() => props.miedo.autor_alias?.trim() || "Anónimo");
const esAnonimo = computed(() => alias.value.toLowerCase() === "anónimo");
</script>

<template>
  <article class="group relative">
    <div
      class="animate-entrar motion-reduce:animate-none"
      :style="{ animationDelay: `${retraso}ms` }"
    >
      <div class="nota papel px-5 pt-6 pb-5" :style="{ '--rot': `${rotacion}deg` }">
        <span class="cinta" aria-hidden="true" />

        <span
          class="absolute top-3 right-4 font-mono text-[0.65rem] tracking-widest text-tinta-suave/55"
          aria-hidden="true"
        >
          #{{ folio(props.miedo.id) }}
        </span>

        <p class="font-nota text-[1.0625rem] leading-snug break-words whitespace-pre-line text-tinta">
          {{ props.miedo.contenido }}
        </p>

        <div class="mt-4 flex items-end justify-between gap-3 border-t border-tinta/10 pt-3">
          <p class="min-w-0 font-mono text-[0.7rem] text-tinta-suave">
            <span class="text-tinta-suave/60">por </span>
            <span :class="esAnonimo ? 'text-tinta-suave/70 italic' : 'font-semibold text-embrujado'">
              {{ alias }}
            </span>
          </p>

          <p class="flex shrink-0 items-center gap-1.5 font-mono text-[0.7rem] text-tinta-suave/80">
            <span v-if="props.nueva" class="text-calabaza" aria-hidden="true">●</span>
            <time :datetime="props.miedo.creado_en" :title="fechaCompleta(props.miedo.creado_en)">
              {{ cuando }}
            </time>
          </p>
        </div>
      </div>
    </div>
  </article>
</template>
