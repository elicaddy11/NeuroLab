import { describe, expect, it } from "vitest";
import {
  getHodgkinHuxleyRates,
  simulateHodgkinHuxley,
} from "./hodgkinHuxley";

function risingZeroCrossings(voltage: number[]): number {
  let crossings = 0;
  for (let index = 1; index < voltage.length; index += 1) {
    if (voltage[index - 1] < 0 && voltage[index] >= 0) crossings += 1;
  }
  return crossings;
}

describe("Hodgkin-Huxley single-compartment model", () => {
  it("remains at its initialized resting equilibrium without stimulation", () => {
    const result = simulateHodgkinHuxley({
      durationMs: 20,
      stimulus: { amplitudeUaPerCm2: 0 },
    });

    expect(result.samples[0].voltageMv).toBe(-65);
    expect(Math.max(...result.samples.map(({ voltageMv }) =>
      Math.abs(voltageMv + 65),
    ))).toBeLessThan(0.1);
  });

  it("generates an action potential from a depolarizing current pulse", () => {
    const result = simulateHodgkinHuxley();
    const voltages = result.samples.map(({ voltageMv }) => voltageMv);

    const spikePeakMv = Math.max(...voltages);
    expect(spikePeakMv).toBeGreaterThan(30);
    expect(spikePeakMv).toBeLessThan(50);
    expect(risingZeroCrossings(voltages)).toBeGreaterThanOrEqual(1);
    expect(result.samples.find(({ timeMs }) => timeMs >= 5 && timeMs < 6)
      ?.stimulusCurrentUaPerCm2).toBe(10);
    expect(result.samples.find(({ timeMs }) => timeMs === 6)
      ?.stimulusCurrentUaPerCm2).toBe(0);
  });

  it("returns inward sodium and outward potassium currents during the spike", () => {
    const result = simulateHodgkinHuxley();
    const spikeSamples = result.samples.filter(({ voltageMv }) => voltageMv > 20);

    expect(spikeSamples.length).toBeGreaterThan(0);
    expect(spikeSamples.some(({ sodiumCurrentUaPerCm2 }) =>
      sodiumCurrentUaPerCm2 < 0,
    )).toBe(true);
    expect(spikeSamples.some(({ potassiumCurrentUaPerCm2 }) =>
      potassiumCurrentUaPerCm2 > 0,
    )).toBe(true);
    expect(spikeSamples.some(({ leakCurrentUaPerCm2 }) =>
      leakCurrentUaPerCm2 > 0,
    )).toBe(true);
  });

  it("keeps all gating variables bounded and evaluates removable rate singularities", () => {
    const result = simulateHodgkinHuxley();
    for (const sample of result.samples) {
      expect(sample.m).toBeGreaterThanOrEqual(0);
      expect(sample.m).toBeLessThanOrEqual(1);
      expect(sample.h).toBeGreaterThanOrEqual(0);
      expect(sample.h).toBeLessThanOrEqual(1);
      expect(sample.n).toBeGreaterThanOrEqual(0);
      expect(sample.n).toBeLessThanOrEqual(1);
    }

    for (const voltageMv of [-55, -40]) {
      const rates = getHodgkinHuxleyRates(voltageMv);
      expect(Object.values(rates).every(Number.isFinite)).toBe(true);
    }
  });

  it("is repeatable and stable when the integration step is refined", () => {
    const first = simulateHodgkinHuxley();
    const repeated = simulateHodgkinHuxley();
    const refined = simulateHodgkinHuxley({ dtMs: 0.005 });
    const firstPeak = Math.max(...first.samples.map(({ voltageMv }) => voltageMv));
    const refinedPeak = Math.max(...refined.samples.map(({ voltageMv }) => voltageMv));

    expect(repeated.samples).toEqual(first.samples);
    expect(risingZeroCrossings(refined.samples.map(({ voltageMv }) => voltageMv)))
      .toBe(risingZeroCrossings(first.samples.map(({ voltageMv }) => voltageMv)));
    expect(Math.abs(firstPeak - refinedPeak)).toBeLessThan(1);
  });

  it("responds qualitatively to stimulus duration and sodium conductance changes", () => {
    const shorterPulse = simulateHodgkinHuxley({
      stimulus: { durationMs: 0 },
    });
    const reducedSodium = simulateHodgkinHuxley({
      parameters: { sodiumConductanceMsPerCm2: 60 },
    });
    const standardPeak = Math.max(...simulateHodgkinHuxley().samples.map(
      ({ voltageMv }) => voltageMv,
    ));
    const shortPulsePeak = Math.max(...shorterPulse.samples.map(
      ({ voltageMv }) => voltageMv,
    ));
    const reducedSodiumPeak = Math.max(...reducedSodium.samples.map(
      ({ voltageMv }) => voltageMv,
    ));

    expect(shortPulsePeak).toBeLessThan(-60);
    expect(reducedSodiumPeak).toBeLessThan(standardPeak);
  });

  it("remains finite at the strongest settings exposed by the Lab controls", () => {
    const result = simulateHodgkinHuxley({
      durationMs: 20,
      parameters: {
        sodiumConductanceMsPerCm2: 180,
        potassiumConductanceMsPerCm2: 54,
        temperatureC: 12,
      },
      stimulus: { amplitudeUaPerCm2: 20, durationMs: 10 },
    });

    for (const sample of result.samples) {
      expect(Object.values(sample).every(Number.isFinite)).toBe(true);
      expect(sample.m).toBeGreaterThanOrEqual(0);
      expect(sample.m).toBeLessThanOrEqual(1);
      expect(sample.h).toBeGreaterThanOrEqual(0);
      expect(sample.h).toBeLessThanOrEqual(1);
      expect(sample.n).toBeGreaterThanOrEqual(0);
      expect(sample.n).toBeLessThanOrEqual(1);
    }
  });

  it("rejects invalid integration intervals and unphysical parameter inputs", () => {
    expect(() => simulateHodgkinHuxley({ dtMs: 0 }))
      .toThrow("Time step must be between");
    expect(() => simulateHodgkinHuxley({
      parameters: { capacitanceUfPerCm2: 0 },
    })).toThrow("Membrane capacitance");
    expect(() => simulateHodgkinHuxley({
      parameters: { temperatureC: 100 },
    })).toThrow("Temperature must be between");
  });
});
