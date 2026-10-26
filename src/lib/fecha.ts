const FORMATO_CORTO = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const FORMATO_COMPLETO = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** "hace 5 min", "hace 2 h", "hace 3 días"... */
export function fechaRelativa(iso: string, ahora: number = Date.now()): string {
  const instante = new Date(iso).getTime();
  if (Number.isNaN(instante)) return "";

  const segundos = Math.max(0, Math.round((ahora - instante) / 1000));
  if (segundos < 60) return "hace un momento";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return dias === 1 ? "hace 1 día" : `hace ${dias} días`;

  const semanas = Math.floor(dias / 7);
  if (semanas < 5) return semanas === 1 ? "hace 1 semana" : `hace ${semanas} semanas`;

  return fechaCorta(iso);
}

/** "26 oct" — se usa como texto neutro antes de hidratar en el cliente. */
export function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "" : FORMATO_CORTO.format(fecha);
}

/** "26 de octubre, 21:04" — para el atributo title de <time>. */
export function fechaCompleta(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "" : FORMATO_COMPLETO.format(fecha);
}

/** Número de folio tipo recibo: 7 → "0007". Da el orden real de llegada. */
export function folio(id: number): string {
  return String(id).padStart(4, "0");
}
