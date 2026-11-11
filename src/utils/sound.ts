// Mismo patrón que el resto del hub (imaginaloReact/enganchadoReact/
// enroscaloReact/emojinaloReact/tuttifrutaloReact): tonos sintetizados con
// la Web Audio API, no archivos de audio — ningún repo del hub carga
// .mp3/.wav, así que no correspondía ser el primero en sumar esa
// dependencia solo para Encastralo.

function playTone(
  type: OscillatorType,
  frequencies: { at: number; hz: number }[],
  durationSec: number,
  volume: number,
): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    for (const { at, hz } of frequencies) {
      osc.frequency.setValueAtTime(hz, ctx.currentTime + at);
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSec);
  } catch {
    // Web Audio no disponible (navegador viejo, modo restringido, etc.)
  }
}

export function playSuccessSound(): void {
  playTone(
    "sine",
    [
      { at: 0, hz: 523 },
      { at: 0.1, hz: 784 },
      { at: 0.2, hz: 1047 },
    ],
    0.35,
    0.2,
  );
}

// Barrido descendente (no notas escalonadas como el éxito), así que va
// aparte de playTone en vez de forzarlo a su forma de "lista de notas".
export function playErrorSound(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Web Audio no disponible (navegador viejo, modo restringido, etc.)
  }
}
