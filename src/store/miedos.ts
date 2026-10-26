import { atom } from "nanostores";
import type { Miedo } from "../lib/miedos";

/**
 * Estado compartido entre islas.
 *
 * El muro inicial lo pinta Astro en el servidor; esta lista solo guarda los
 * miedos colgados durante la visita para que aparezcan arriba sin recargar.
 * Nano Stores mantiene una única instancia entre islas (Vite deduplica el
 * módulo en un chunk compartido).
 */
export const miedosColgados = atom<Miedo[]>([]);

const MAXIMO = 40;

export function colgarEnElMuro(miedo: Miedo): void {
  const previos = miedosColgados.get();
  if (previos.some((m) => m.id === miedo.id)) return;
  miedosColgados.set([miedo, ...previos].slice(0, MAXIMO));
}

export function limpiarColgados(): void {
  miedosColgados.set([]);
}
