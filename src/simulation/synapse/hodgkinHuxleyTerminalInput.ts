import type { HodgkinHuxleySample } from "../neuron/hodgkinHuxley";
import type { PresynapticSpikeEvent } from "./chemicalSynapse";

/**
 * Converts a single-compartment voltage trace into an explicit terminal input.
 * This mapping does not simulate or imply spatial axonal propagation.
 */
export function createHodgkinHuxleyTerminalInput(
  samples: readonly Pick<HodgkinHuxleySample, "timeMs" | "voltageMv">[],
  onsetMs: number,
): PresynapticSpikeEvent {
  if (!Number.isFinite(onsetMs) || onsetMs < 0) {
    throw new Error("Terminal event onset must be a finite nonnegative time.");
  }
  const firstAtOrAfterOnset = samples.findIndex(({ timeMs }) => timeMs >= onsetMs);
  if (
    firstAtOrAfterOnset < 0 ||
    samples[firstAtOrAfterOnset].timeMs !== onsetMs
  ) {
    throw new Error("Hodgkin-Huxley trace must contain a sample at the terminal event onset.");
  }

  const waveform = samples.slice(firstAtOrAfterOnset).map(({ timeMs, voltageMv }) => ({
    timeFromOnsetMs: timeMs - onsetMs,
    voltageMv,
  }));
  if (waveform.length < 2) {
    throw new Error("Hodgkin-Huxley trace must contain at least two terminal event samples.");
  }

  return { onsetMs, waveform };
}
