/**
 * Rotación estable por papelito: cada miedo tiene siempre la misma inclinación
 * (entre -3° y +3°), así el muro no "baila" entre renders ni al recargar.
 */
export function rotacionDe(id: number): number {
  const pasos = ((Number(id) * 37) % 13) - 6; // -6..6
  return pasos * 0.5; // de -3° a +3° en pasos de 0.5°
}
