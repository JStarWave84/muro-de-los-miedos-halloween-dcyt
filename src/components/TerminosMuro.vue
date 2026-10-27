<script setup lang="ts">
import { onMounted, ref } from "vue";

/**
 * Términos y condiciones del muro, en forma de diálogo modal.
 *
 * · Al entrar se comprueba si ya se aceptaron (localStorage) y, si no, se
 *   abre un <dialog> modal: la página queda inerte hasta aceptar, así que no
 *   se puede escribir antes de guardar la aceptación.
 * · No hay botón de cerrar ni Escape: el único camino es aceptar. Si alguien
 *   quiere releer, el muro muestra las reglas en la sección del formulario.
 * · Al cambiar el texto hay que SUBIR LA VERSIÓN: todos los que ya aceptaron
 *   la anterior verán el diálogo de nuevo.
 */
const VERSION_TERMINOS = "2026-halloween-v1";
const CLAVE_TERMINOS = "muro-halloween-terminos";

const dialogo = ref<HTMLDialogElement | null>(null);

onMounted(() => {
  try {
    const yaAceptado = localStorage.getItem(CLAVE_TERMINOS) === VERSION_TERMINOS;
    if (!yaAceptado) dialogo.value?.showModal();
  } catch {
    // Sin localStorage disponible (privacidad estricta): se pide en cada visita.
    dialogo.value?.showModal();
  }
});

/** Guarda la aceptación y cierra. Si el navegador no permite guardar, se pedirá otra vez. */
function aceptar(): void {
  try {
    localStorage.setItem(CLAVE_TERMINOS, VERSION_TERMINOS);
  } catch {
    /* el muro no muere por esto */
  }
  dialogo.value?.close();

  // El foco se lo llevaría el botón aceptado; devolvemos al form el turno.
  (document.getElementById("contenido") as HTMLElement | null)?.focus();
}
</script>

<template>
  <dialog ref="dialogo" class="dialogo-muro" aria-labelledby="titulo-terminos" @cancel.prevent>
    <div class="papel max-h-[85dvh] overflow-y-auto px-5 py-8 text-tinta sm:px-9 sm:py-10 motion-safe:animate-entrar">
      <span class="cinta" aria-hidden="true" />

      <p class="etiqueta text-tinta-suave/70">Aviso antes de escribir</p>
      <h2
        id="titulo-terminos"
        class="mt-2 font-display text-[2rem] leading-none sm:text-[2.5rem]"
      >
        Las reglas del mural
      </h2>

      <p class="mt-3 max-w-lg font-nota text-[1.05rem] leading-snug text-tinta-suave">
        Lee esto de una pasada. Entrar es gratis, pero leer no es opcional: lo
        que escribas en el papelito no es anónimo para nosotros.
      </p>

      <ol class="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-tinta">
        <li class="flex gap-3">
          <span class="font-mono text-[0.68rem] text-embrujado">01</span>
          <span>Empieza tu carta con <strong class="font-semibold">«Tengo miedo de…»</strong>, así el muro se lee como una sola voz.</span>
        </li>
        <li class="flex gap-3">
          <span class="font-mono text-[0.68rem] text-embrujado">02</span>
          <span>Nada de nombres de otras personas, insultos ni datos personales. El muro es para miedos, no para herir.</span>
        </li>
        <li class="flex gap-3">
          <span class="font-mono text-[0.68rem] text-embrujado">03</span>
          <span>Se publica al instante y <strong class="font-semibold">ya no se puede editar ni borrar</strong>.</span>
        </li>
      </ol>

      <div class="mt-6 border-l-2 border-calabaza bg-calabaza/8 pl-4 py-3">
        <p class="font-nota text-[1rem] leading-snug text-tinta">
          Este muro <strong class="font-semibold">está siendo monitoreado</strong>
          por el equipo organizador. Las cartas que rompan las reglas del sitio
          se retiran y se llevan a las instancias correspondientes.
        </p>
      </div>

      <p class="mt-5 font-mono text-[0.7rem] leading-relaxed text-tinta-suave/70">
        Lo que guardamos: tu carta, la firma (si decides ponerla) y la hora. Sin
        cuentas, sin datos personales. Al aceptar, guardamos en este navegador
        que ya leíste las reglas.
      </p>

      <button type="button" class="boton-vela mt-7 w-full sm:w-auto" @click="aceptar">
        <span class="llama" aria-hidden="true"></span>
        <span>He leído las reglas y entro</span>
      </button>
    </div>
  </dialog>
</template>
