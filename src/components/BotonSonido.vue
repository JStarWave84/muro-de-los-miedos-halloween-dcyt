<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { alternarSonido, iniciarSonido, sonidoActivo } from "../lib/sonido";

const activo = ref(sonidoActivo.get());
let desuscribir: (() => void) | undefined;

onMounted(() => {
  iniciarSonido();
  activo.value = sonidoActivo.get();
  desuscribir = sonidoActivo.subscribe((valor) => {
    activo.value = valor;
  });
});

onBeforeUnmount(() => desuscribir?.());
</script>

<template>
  <button
    type="button"
    class="fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-hueso/20 bg-carbon/80 text-hueso/70 shadow-lg backdrop-blur transition hover:border-calabaza/70 hover:text-calabaza"
    :style="{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }"
    :aria-pressed="activo"
    :aria-label="activo ? 'Silenciar el sonido del muro' : 'Activar el sonido del muro'"
    :title="activo ? 'Silenciar sonido' : 'Activar sonido'"
    @click="alternarSonido()"
  >
    <svg v-if="activo" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>
      <path d="M16 8.5a5 5 0 0 1 0 7"></path>
      <path d="M19 6a9 9 0 0 1 0 12"></path>
    </svg>
    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>
      <path d="m17 9 4 6M21 9l-4 6"></path>
    </svg>
  </button>
</template>
