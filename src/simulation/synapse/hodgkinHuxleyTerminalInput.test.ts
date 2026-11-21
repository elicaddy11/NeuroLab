import { describe, expect, it } from "vitest";
import {
  DEFAULT_HODGKIN_HUXLEY_STIMULUS,
  simulateHodgkinHuxley,
} from "../neuron/hodgkinHuxley";
import { simulateChemicalSynapse } from "./chemicalSynapse";
import { createHodgkinHuxleyTerminalInput } from "./hodgkinHuxleyTerminalInput";

describe("explicit Hodgkin-Huxley terminal input", () => {
  it("passes the sampled HH voltage trace into the synapse without implying propagation", () => {
    const neuron = simulateHodgkinHuxley({
      durationMs: 20,
      stimulus: DEFAULT_HODGKIN_HUXLEY_STIMULUS,
    });
    const event = createHodgkinHuxleyTerminalInput(neuron.samples, 5);
    const result = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 22,
    });

    expect(event.waveform[0]).toEqual({
      timeFromOnsetMs: 0,
      voltageMv: neuron.samples.find(({ timeMs }) => timeMs === 5)?.voltageMv,
    });
    expect(event.waveform.some(({ voltageMv }) => voltageMv > 0)).toBe(true);
    expect(Math.max(...result.samples.map(({ localCalciumUm }) => localCalciumUm)))
      .toBeGreaterThan(result.parameters.baselineCalciumUm);
  });

  it("rejects a trace without a sample exactly at the requested onset", () => {
    expect(() => createHodgkinHuxleyTerminalInput([
      { timeMs: 0, voltageMv: -65 },
      { timeMs: 1, voltageMv: 20 },
    ], 0.5)).toThrow("must contain a sample at the terminal event onset");
  });
});
