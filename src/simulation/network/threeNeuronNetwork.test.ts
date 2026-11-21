import { describe, expect, it } from "vitest";
import {
  DEFAULT_THREE_NEURON_CONNECTIONS,
  DEFAULT_THREE_NEURON_DEFINITIONS,
  simulateThreeNeuronNetwork,
} from "./threeNeuronNetwork";

const maximum = (values: number[]) => Math.max(...values);

describe("three-neuron feedforward network", () => {
  it("transmits computed activity from A through B to C using the configured topology", () => {
    const result = simulateThreeNeuronNetwork();
    const [neuronA, neuronB, neuronC] = result.neurons;

    expect(result.neurons.map(({ id }) => id))
      .toEqual(["neuron-a", "neuron-b", "neuron-c"]);
    expect(result.synapses.map(({ id, presynapticNeuronId, postsynapticNeuronId }) => [
      id,
      presynapticNeuronId,
      postsynapticNeuronId,
    ])).toEqual([
      ["synapse-a-b", "neuron-a", "neuron-b"],
      ["synapse-b-c", "neuron-b", "neuron-c"],
    ]);
    expect(neuronA.actionPotentialTimesMs).toHaveLength(1);
    expect(neuronB.actionPotentialTimesMs).toHaveLength(1);
    expect(neuronC.actionPotentialTimesMs).toHaveLength(1);
    expect(neuronA.actionPotentialTimesMs[0]).toBeLessThan(neuronB.actionPotentialTimesMs[0]);
    expect(neuronB.actionPotentialTimesMs[0]).toBeLessThan(neuronC.actionPotentialTimesMs[0]);
    expect(maximum(neuronB.samples.map(({ appliedSynapticCurrentUaPerCm2 }) =>
      appliedSynapticCurrentUaPerCm2,
    ))).toBeGreaterThan(0);
    expect(maximum(neuronC.samples.map(({ appliedSynapticCurrentUaPerCm2 }) =>
      appliedSynapticCurrentUaPerCm2,
    ))).toBeGreaterThan(0);

    for (const synapse of result.synapses) {
      const presynapticTrace = result.neurons.find(
        ({ id }) => id === synapse.presynapticNeuronId,
      )!;
      expect(maximum(synapse.samples.map(({ intracellularCalciumUm }) =>
        intracellularCalciumUm,
      ))).toBeGreaterThan(synapse.chemicalParameters.baselineCalciumUm);
      expect(maximum(synapse.samples.map(({ expectedVesicleReleaseRatePerMs }) =>
        expectedVesicleReleaseRatePerMs,
      ))).toBeGreaterThan(0);
      expect(maximum(synapse.samples.map(({ cleftGlutamateUm }) =>
        cleftGlutamateUm,
      ))).toBeGreaterThan(0);
      expect(maximum(synapse.samples.map(({ ampaOpenFraction }) =>
        ampaOpenFraction,
      ))).toBeGreaterThan(0);
      expect(Math.min(...synapse.samples.map(({ postsynapticCurrentUaPerCm2 }) =>
        postsynapticCurrentUaPerCm2,
      ))).toBeLessThan(0);

      const postsynapticTrace = result.neurons.find(
        ({ id }) => id === synapse.postsynapticNeuronId,
      )!;
      for (let index = 0; index < synapse.samples.length; index += 1) {
        const sample = synapse.samples[index];
        expect(sample.presynapticTerminalVoltageMv)
          .toBe(presynapticTrace.samples[index].voltageMv);
        expect(sample.postsynapticCurrentUaPerCm2).toBeCloseTo(
          sample.postsynapticConductanceMsPerCm2 *
            (sample.postsynapticVoltageMv - synapse.receptorParameters.reversalPotentialMv),
          8,
        );
        expect(sample.postsynapticVoltageMv).toBe(postsynapticTrace.samples[index].voltageMv);
        expect(sample.expectedReleasedVesicles + sample.availableVesicles)
          .toBeCloseTo(synapse.chemicalParameters.initialVesiclePool, 8);
      }
    }

    expect(result.dtMs).toBe(0.005);
    expect(result.externalStimuli).toHaveLength(1);
    expect(result.externalStimuli[0].neuronId).toBe("neuron-a");
  });

  it("changes the receiving neuron's input and firing when a directed connection is removed", () => {
    const complete = simulateThreeNeuronNetwork();
    const withoutAToB = simulateThreeNeuronNetwork({
      connections: DEFAULT_THREE_NEURON_CONNECTIONS.filter(
        ({ id }) => id !== "synapse-a-b",
      ),
    });
    const withoutBToC = simulateThreeNeuronNetwork({
      connections: DEFAULT_THREE_NEURON_CONNECTIONS.filter(
        ({ id }) => id !== "synapse-b-c",
      ),
    });
    const completeB = complete.neurons.find(({ id }) => id === "neuron-b")!;
    const disconnectedB = withoutAToB.neurons.find(({ id }) => id === "neuron-b")!;
    const completeC = complete.neurons.find(({ id }) => id === "neuron-c")!;
    const disconnectedC = withoutBToC.neurons.find(({ id }) => id === "neuron-c")!;

    expect(completeB.actionPotentialTimesMs).toHaveLength(1);
    expect(disconnectedB.actionPotentialTimesMs).toEqual([]);
    expect(disconnectedB.samples.every(({ appliedSynapticCurrentUaPerCm2 }) =>
      appliedSynapticCurrentUaPerCm2 === 0,
    )).toBe(true);
    expect(completeC.actionPotentialTimesMs).toHaveLength(1);
    expect(disconnectedC.actionPotentialTimesMs).toEqual([]);
    expect(disconnectedC.samples.every(({ appliedSynapticCurrentUaPerCm2 }) =>
      appliedSynapticCurrentUaPerCm2 === 0,
    )).toBe(true);
    expect(maximum(completeB.samples.map(({ voltageMv }) => voltageMv)))
      .toBeGreaterThan(maximum(disconnectedB.samples.map(({ voltageMv }) => voltageMv)));
  });

  it("does not force downstream firing without a computed presynaptic spike", () => {
    const result = simulateThreeNeuronNetwork({ externalStimuli: [] });

    expect(result.neurons.every(({ actionPotentialTimesMs }) =>
      actionPotentialTimesMs.length === 0,
    )).toBe(true);
    expect(result.neurons.every(({ samples }) => samples.every(({ voltageMv }) =>
      Math.abs(voltageMv + 65) < 0.1,
    ))).toBe(true);
    expect(result.synapses.every(({ samples }) => samples.every(({ ampaOpenFraction }) =>
      ampaOpenFraction < 1e-6,
    ))).toBe(true);
  });

  it("models glutamate accumulation, clearance, and vesicle-content-to-concentration scaling", () => {
    const standard = simulateThreeNeuronNetwork();
    const increasedContent = simulateThreeNeuronNetwork({
      connections: DEFAULT_THREE_NEURON_CONNECTIONS.map((connection, index) => (
        index === 0
          ? {
            ...connection,
            neurotransmitterParameters: { glutamateMoleculesPerVesicle: 6_000 },
          }
          : connection
      )),
    });
    const first = standard.synapses[0];
    const firstWithMoreContent = increasedContent.synapses[0];
    const standardPeak = maximum(first.samples.map(({ cleftGlutamateUm }) => cleftGlutamateUm));
    const increasedPeak = maximum(firstWithMoreContent.samples.map(
      ({ cleftGlutamateUm }) => cleftGlutamateUm,
    ));

    expect(standardPeak).toBeGreaterThan(0);
    expect(first.samples[first.samples.length - 1].cleftGlutamateUm)
      .toBeLessThan(standardPeak);
    expect(increasedPeak).toBeCloseTo(standardPeak * 2, 6);
    expect(maximum(first.samples.map(({ ampaOpenFraction }) => ampaOpenFraction)))
      .toBeGreaterThan(first.samples[first.samples.length - 1].ampaOpenFraction);
  });

  it("keeps neuron states independent when only neuron A receives external stimulation", () => {
    const result = simulateThreeNeuronNetwork({ connections: [] });
    const [neuronA, neuronB, neuronC] = result.neurons;

    expect(neuronA.actionPotentialTimesMs.length).toBeGreaterThan(0);
    expect(neuronB.actionPotentialTimesMs).toEqual([]);
    expect(neuronC.actionPotentialTimesMs).toEqual([]);
    expect(neuronB.samples.every(({ voltageMv, synapticCurrentUaPerCm2 }) =>
      Math.abs(voltageMv + 65) < 0.1 && synapticCurrentUaPerCm2 === 0,
    )).toBe(true);
    expect(neuronB.samples).not.toBe(neuronC.samples);
  });

  it("remains finite at the strongest stimulation and AMPA conductance exposed in the Lab", () => {
    const result = simulateThreeNeuronNetwork({
      externalStimuli: [{
        neuronId: "neuron-a",
        amplitudeUaPerCm2: 20,
        onsetMs: 5,
        durationMs: 2,
      }],
      connections: DEFAULT_THREE_NEURON_CONNECTIONS.map((connection) => ({
        ...connection,
        receptorParameters: { maximumConductanceMsPerCm2: 2 },
      })),
    });

    for (const neuron of result.neurons) {
      for (const sample of neuron.samples) {
        expect(Object.values(sample).every(Number.isFinite)).toBe(true);
        expect(sample.m).toBeGreaterThanOrEqual(0);
        expect(sample.m).toBeLessThanOrEqual(1);
        expect(sample.h).toBeGreaterThanOrEqual(0);
        expect(sample.h).toBeLessThanOrEqual(1);
        expect(sample.n).toBeGreaterThanOrEqual(0);
        expect(sample.n).toBeLessThanOrEqual(1);
      }
    }
    for (const synapse of result.synapses) {
      for (const sample of synapse.samples) {
        expect(Object.values(sample).every(Number.isFinite)).toBe(true);
        expect(sample.ampaOpenFraction).toBeGreaterThanOrEqual(0);
        expect(sample.ampaOpenFraction).toBeLessThanOrEqual(1);
        expect(sample.intracellularCalciumUm).toBeGreaterThanOrEqual(0);
        expect(sample.cleftGlutamateUm).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("initializes distinct membrane states from each neuron's own parameters", () => {
    const neurons = DEFAULT_THREE_NEURON_DEFINITIONS.map((neuron) => (
      neuron.id === "neuron-b"
        ? { ...neuron, parameters: { initialVoltageMv: -60 } }
        : neuron
    ));
    const result = simulateThreeNeuronNetwork({
      neurons,
      connections: [],
      externalStimuli: [],
      durationMs: 0.01,
    });

    expect(result.neurons.map(({ samples }) => samples[0].voltageMv))
      .toEqual([-65, -60, -65]);
    expect(result.neurons[0].samples).not.toBe(result.neurons[1].samples);
  });

  it("reduces the shared step for faster configured chemical kinetics", () => {
    const result = simulateThreeNeuronNetwork({
      durationMs: 0.001,
      dtMs: 0.05,
      externalStimuli: [],
      connections: [{
        ...DEFAULT_THREE_NEURON_CONNECTIONS[0],
        chemicalSynapseParameters: { activationTimeConstantMs: 0.001 },
      }],
    });

    expect(result.dtMs).toBeCloseTo(0.0001, 12);
    expect(result.synapses[0].samples).toHaveLength(11);
  });

  it("is deterministic and maintains qualitative responses at a refined time step", () => {
    const result = simulateThreeNeuronNetwork();
    const repeated = simulateThreeNeuronNetwork();
    const refined = simulateThreeNeuronNetwork({ dtMs: 0.0025 });

    expect(repeated).toEqual(result);
    for (let index = 0; index < result.neurons.length; index += 1) {
      expect(refined.neurons[index].actionPotentialTimesMs).toHaveLength(
        result.neurons[index].actionPotentialTimesMs.length,
      );
      expect(Math.abs(
        maximum(refined.neurons[index].samples.map(({ voltageMv }) => voltageMv)) -
        maximum(result.neurons[index].samples.map(({ voltageMv }) => voltageMv)),
      )).toBeLessThan(1);
    }
    expect(refined.synapses.every(({ samples }) => samples.every((sample) =>
      Object.values(sample).every(Number.isFinite),
    ))).toBe(true);
  });

  it("rejects duplicate IDs, missing endpoints, and invalid input parameters", () => {
    expect(() => simulateThreeNeuronNetwork({
      neurons: [DEFAULT_THREE_NEURON_DEFINITIONS[0], DEFAULT_THREE_NEURON_DEFINITIONS[0]],
    })).toThrow("IDs unique");
    expect(() => simulateThreeNeuronNetwork({
      connections: [{
        ...DEFAULT_THREE_NEURON_CONNECTIONS[0],
        presynapticNeuronId: "missing-neuron",
      }],
    })).toThrow("references a missing neuron");
    expect(() => simulateThreeNeuronNetwork({
      connections: [
        DEFAULT_THREE_NEURON_CONNECTIONS[0],
        { ...DEFAULT_THREE_NEURON_CONNECTIONS[0] },
      ],
    })).toThrow("IDs must be nonempty and unique");
    expect(() => simulateThreeNeuronNetwork({
      externalStimuli: [{
        neuronId: "missing-neuron",
        amplitudeUaPerCm2: 10,
        onsetMs: 5,
        durationMs: 1,
      }],
    })).toThrow("references missing neuron");
    expect(() => simulateThreeNeuronNetwork({
      connections: [{
        ...DEFAULT_THREE_NEURON_CONNECTIONS[0],
        receptorParameters: { maximumConductanceMsPerCm2: -1 },
      }],
    })).toThrow("cannot be negative");
    expect(() => simulateThreeNeuronNetwork({ dtMs: 0 }))
      .toThrow("Network time step must be between");
  });
});
