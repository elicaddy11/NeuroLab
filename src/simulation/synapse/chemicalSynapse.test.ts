import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS,
  simulateChemicalSynapse,
  type PresynapticSpikeEvent,
} from "./chemicalSynapse";

function makeSpikeEvent(): PresynapticSpikeEvent {
  return {
    onsetMs: 2,
    waveform: [
      { timeFromOnsetMs: 0, voltageMv: -65 },
      { timeFromOnsetMs: 0.3, voltageMv: 30 },
      { timeFromOnsetMs: 1, voltageMv: -65 },
    ],
  };
}

describe("deterministic chemical synapse model", () => {
  it("converts a presynaptic voltage event into channel current, local calcium, and expected release", () => {
    const result = simulateChemicalSynapse({
      presynapticSpikeEvent: makeSpikeEvent(),
      durationMs: 10,
    });
    const activeSamples = result.samples.filter(
      ({ timeMs }) => timeMs >= 2 && timeMs <= 3,
    );
    const peakCalcium = Math.max(...result.samples.map(({ localCalciumUm }) => localCalciumUm));
    const final = result.samples[result.samples.length - 1];

    expect(activeSamples.some(({ channelActivation }) => channelActivation > 0)).toBe(true);
    expect(activeSamples.some(({ calciumCurrentPa }) => calciumCurrentPa < 0)).toBe(true);
    expect(peakCalcium).toBeGreaterThan(DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.baselineCalciumUm);
    expect(Math.max(...result.samples.map(({ releaseProbability }) => releaseProbability))).toBeGreaterThan(0);
    expect(final.expectedReleasedVesicles).toBeGreaterThan(0);
    expect(final.expectedReleasedVesicles + final.availableVesicles)
      .toBeCloseTo(DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.initialVesiclePool, 8);
  });

  it("does not produce calcium influx and keeps basal release negligible below activation threshold", () => {
    const result = simulateChemicalSynapse({
      presynapticSpikeEvent: {
        onsetMs: 1,
        waveform: [
          { timeFromOnsetMs: 0, voltageMv: -65 },
          { timeFromOnsetMs: 0.5, voltageMv: -45 },
          { timeFromOnsetMs: 1, voltageMv: -65 },
        ],
      },
      durationMs: 5,
    });

    expect(result.samples.every(({ channelActivation }) => channelActivation === 0)).toBe(true);
    expect(result.samples.every(({ calciumCurrentPa }) => calciumCurrentPa === 0)).toBe(true);
    expect(result.samples.every(({ localCalciumUm }) =>
      localCalciumUm === DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.baselineCalciumUm,
    )).toBe(true);
    expect(result.samples[result.samples.length - 1].expectedReleasedVesicles).toBeLessThan(1e-8);
  });

  it("scales local calcium with single-channel conductance and sensor distance", () => {
    const event = makeSpikeEvent();
    const standard = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 5,
    });
    const strongerChannel = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 5,
      parameters: {
        singleChannelConductancePs:
          DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.singleChannelConductancePs * 2,
      },
    });
    const fartherSensor = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 5,
      parameters: { sensorDistanceNm: 80 },
    });
    const peak = (values: number[]) => Math.max(...values);

    expect(peak(strongerChannel.samples.map(({ localCalciumUm }) => localCalciumUm)))
      .toBeGreaterThan(peak(standard.samples.map(({ localCalciumUm }) => localCalciumUm)));
    expect(peak(fartherSensor.samples.map(({ localCalciumUm }) => localCalciumUm)))
      .toBeLessThan(peak(standard.samples.map(({ localCalciumUm }) => localCalciumUm)));
  });

  it("reverses calcium-current direction above the calcium reversal potential", () => {
    const result = simulateChemicalSynapse({
      presynapticSpikeEvent: {
        onsetMs: 0,
        waveform: [
          { timeFromOnsetMs: 0, voltageMv: -65 },
          { timeFromOnsetMs: 0.01, voltageMv: 50 },
          { timeFromOnsetMs: 0.1, voltageMv: 50 },
        ],
      },
      durationMs: 0.1,
    });
    const final = result.samples[result.samples.length - 1];

    expect(final.terminalVoltageMv).toBe(50);
    expect(final.calciumCurrentPa).toBeGreaterThan(0);
  });

  it("models calcium clearance after the terminal waveform returns to baseline", () => {
    const event = makeSpikeEvent();
    const fastClearance = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 12,
      parameters: { calciumClearanceTimeConstantMs: 0.2 },
    });
    const slowClearance = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 12,
      parameters: { calciumClearanceTimeConstantMs: 5 },
    });

    expect(fastClearance.samples[fastClearance.samples.length - 1].localCalciumUm)
      .toBeLessThan(slowClearance.samples[slowClearance.samples.length - 1].localCalciumUm);
    expect(fastClearance.samples[fastClearance.samples.length - 1].localCalciumUm)
      .toBeGreaterThan(DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.baselineCalciumUm);
    expect(fastClearance.samples[fastClearance.samples.length - 1].localCalciumUm)
      .toBeCloseTo(DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.baselineCalciumUm, 8);
  });

  it("uses Hill cooperativity and keeps expected vesicle availability bounded", () => {
    const event = makeSpikeEvent();
    const lowerCooperativity = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 5,
      parameters: {
        releaseHillCoefficient: 1,
        releaseHalfActivationUm: 1,
      },
    });
    const higherCooperativity = simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: 5,
      parameters: {
        releaseHillCoefficient: 4,
        releaseHalfActivationUm: 1,
      },
    });
    const releaseAtPeakCalcium = (result: ReturnType<typeof simulateChemicalSynapse>) => {
      const sample = result.samples.reduce((maximum, current) =>
        current.localCalciumUm > maximum.localCalciumUm ? current : maximum,
      );
      return sample.releaseProbability;
    };

    expect(releaseAtPeakCalcium(higherCooperativity))
      .toBeGreaterThan(releaseAtPeakCalcium(lowerCooperativity));
    for (const sample of higherCooperativity.samples) {
      expect(sample.availableVesicles).toBeGreaterThanOrEqual(0);
      expect(sample.expectedReleasedVesicles).toBeGreaterThanOrEqual(0);
      expect(sample.expectedReleasedVesicles + sample.availableVesicles)
        .toBeCloseTo(DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.initialVesiclePool, 8);
    }
  });

  it("is deterministic and converges when the integration step is refined", () => {
    const options = { presynapticSpikeEvent: makeSpikeEvent(), durationMs: 6 };
    const result = simulateChemicalSynapse(options);
    const repeat = simulateChemicalSynapse(options);
    const refined = simulateChemicalSynapse({ ...options, dtMs: 0.0025 });
    const peak = (values: number[]) => Math.max(...values);

    expect(repeat.samples).toEqual(result.samples);
    expect(Math.abs(
      peak(refined.samples.map(({ localCalciumUm }) => localCalciumUm)) -
      peak(result.samples.map(({ localCalciumUm }) => localCalciumUm)),
    )).toBeLessThan(0.1);
    expect(Math.abs(
      refined.samples[refined.samples.length - 1].expectedReleasedVesicles -
      result.samples[result.samples.length - 1].expectedReleasedVesicles,
    )).toBeLessThan(0.01);
  });

  it("rejects malformed voltage traces and invalid model parameters", () => {
    expect(() => simulateChemicalSynapse({
      presynapticSpikeEvent: {
        onsetMs: 0,
        waveform: [
          { timeFromOnsetMs: 0, voltageMv: -65 },
          { timeFromOnsetMs: 0, voltageMv: 20 },
        ],
      },
    })).toThrow("strictly increasing");
    expect(() => simulateChemicalSynapse({
      presynapticSpikeEvent: makeSpikeEvent(),
      dtMs: 0,
    })).toThrow("Time step must be between");
    expect(() => simulateChemicalSynapse({
      presynapticSpikeEvent: makeSpikeEvent(),
      parameters: { releaseHillCoefficient: 6 },
    })).toThrow("Hill coefficient");
    expect(() => simulateChemicalSynapse({
      presynapticSpikeEvent: makeSpikeEvent(),
      parameters: { sensorDistanceNm: 0 },
    })).toThrow("out of range");
    const malformedOptions = {
      presynapticSpikeEvent: {
        onsetMs: 0,
        waveform: undefined,
      },
    };
    // @ts-expect-error Runtime validation also protects untyped callers.
    expect(() => simulateChemicalSynapse(malformedOptions))
      .toThrow("must contain a voltage waveform");
  });
});
