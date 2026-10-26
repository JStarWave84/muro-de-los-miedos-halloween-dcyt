import { atom } from "nanostores";

const CLAVE = "muro-miedo-sonido";

/** Estado compartido entre la isla del formulario y el botón de silencio. */
export const sonidoActivo = atom(true);

let contexto: AudioContext | null = null;

/** Lee la preferencia guardada. Se llama en el cliente, al montar las islas. */
export function iniciarSonido(): void {
  if (typeof window === "undefined") return;
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    if (guardado !== null) sonidoActivo.set(guardado === "1");
  } catch {
    /* modo privado: nos quedamos con el valor por defecto */
  }
}

export function alternarSonido(): boolean {
  const nuevo = !sonidoActivo.get();
  sonidoActivo.set(nuevo);
  try {
    window.localStorage.setItem(CLAVE, nuevo ? "1" : "0");
  } catch {
    /* sin persistencia, no pasa nada */
  }
  if (nuevo) reproducirClickTenebroso();
  return nuevo;
}

function obtenerContexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext;
  if (!Ctor) return null;
  contexto ??= new Ctor();
  if (contexto.state === "suspended") void contexto.resume();
  return contexto;
}

/**
 * "Click" tenebroso sintetizado con Web Audio: un golpe grave + un crujido de
 * ruido filtrado. Sin archivos de audio, sin licencias, 0 KB de descarga.
 */
export function reproducirClickTenebroso(): void {
  if (!sonidoActivo.get()) return;

  const ctx = obtenerContexto();
  if (!ctx) return;

  const ahora = ctx.currentTime;

  // 1) Golpe grave que cae de tono (la losa cayendo)
  const golpe = ctx.createOscillator();
  const gananciaGolpe = ctx.createGain();
  golpe.type = "sine";
  golpe.frequency.setValueAtTime(150, ahora);
  golpe.frequency.exponentialRampToValueAtTime(46, ahora + 0.3);
  gananciaGolpe.gain.setValueAtTime(0.0001, ahora);
  gananciaGolpe.gain.exponentialRampToValueAtTime(0.16, ahora + 0.012);
  gananciaGolpe.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.42);
  golpe.connect(gananciaGolpe).connect(ctx.destination);
  golpe.start(ahora);
  golpe.stop(ahora + 0.45);

  // 2) Crujido de papel viejo
  const duracion = 0.32;
  const muestras = Math.max(1, Math.floor(ctx.sampleRate * duracion));
  const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < muestras; i += 1) {
    const caida = (1 - i / muestras) ** 2;
    datos[i] = (Math.random() * 2 - 1) * caida;
  }

  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;

  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = 1750;
  filtro.Q.value = 1.1;

  const gananciaRuido = ctx.createGain();
  gananciaRuido.gain.value = 0.045;

  ruido.connect(filtro).connect(gananciaRuido).connect(ctx.destination);
  ruido.start(ahora + 0.03);
}
