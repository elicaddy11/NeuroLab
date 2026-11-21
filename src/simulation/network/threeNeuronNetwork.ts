import {
  getHodgkinHuxleyIonicCurrents,
  getHodgkinHuxleyMaxStepMs,
  getHodgkinHuxleyStateDerivative,
  createHodgkinHuxleyInitialState,
  resolveHodgkinHuxleyParameters,
  validateHodgkinHuxleyState,
  type HodgkinHuxleyParameters,
  type HodgkinHuxleyState,
} from "../neuron/hodgkinHuxley";
import {
  DEFAULT_CHEMICAL_SYNAPSE_STEP_MS,
  createChemicalSynapseInitialState,
  getChemicalSynapseStateDerivative,
  normalizeChemicalSynapseState,
  resolveChemicalSynapseParameters,
  sampleChemicalSynapseState,
  type ChemicalSynapseParameters,
  type ChemicalSynapseState,
  type ChemicalSynapseStateDerivative,
} from "../synapse/chemicalSynapse";

const AVOGADRO_MOLECULES_PER_MOL = 6.02214076e23;
const MAX_NETWORK_STEPS = 2_000_000;

/**
 * Glutamate released per expected vesicle is converted to a well-mixed cleft
 * concentration. Content and cleft volume are explicit educational assumptions;
 * the first-order clearance term summarizes diffusion and uptake.
 *
 * AMPA current uses outward-positive sign: I = gmax*open*(Vpost-Erev),
 * in μA/cm². The HH equations use inward-positive applied current, so the
 * coupled membrane receives -I. All neurons and connections advance together
 * with the same RK4 stages and simulation clock.
 */
export interface NeurotransmitterParameters {
  glutamateMoleculesPerVesicle: number;
  cleftVolumeLiters: number;
  clearanceTimeConstantMs: number;
}

/**
 * Effective two-state AMPA activation: closed/unbound <-> active/open.
 * Conductance is a density so its current density can enter the HH membrane
 * equation without an unverified cell-surface-area conversion.
 */
export interface AMPAReceptorParameters {
  associationRatePerUmMs: number;
  dissociationRatePerMs: number;
  maximumConductanceMsPerCm2: number;
  reversalPotentialMv: number;
}

export interface NetworkNeuronDefinition {
  id: string;
  label: string;
  parameters?: Partial<HodgkinHuxleyParameters>;
}

export interface NetworkConnectionDefinition {
  id: string;
  presynapticNeuronId: string;
  postsynapticNeuronId: string;
  chemicalSynapseParameters?: Partial<ChemicalSynapseParameters>;
  neurotransmitterParameters?: Partial<NeurotransmitterParameters>;
  receptorParameters?: Partial<AMPAReceptorParameters>;
}

export interface NetworkCurrentPulse {
  neuronId: string;
  amplitudeUaPerCm2: number;
  onsetMs: number;
  durationMs: number;
}

export interface ThreeNeuronNetworkOptions {
  durationMs?: number;
  dtMs?: number;
  neurons?: readonly NetworkNeuronDefinition[];
  connections?: readonly NetworkConnectionDefinition[];
  externalStimuli?: readonly NetworkCurrentPulse[];
}

export interface NetworkNeuronSample {
  timeMs: number;
  voltageMv: number;
  sodiumCurrentUaPerCm2: number;
  potassiumCurrentUaPerCm2: number;
  leakCurrentUaPerCm2: number;
  m: number;
  h: number;
  n: number;
  externalCurrentUaPerCm2: number;
  synapticCurrentUaPerCm2: number;
  appliedSynapticCurrentUaPerCm2: number;
}

export interface NetworkNeuronTrace {
  id: string;
  label: string;
  parameters: HodgkinHuxleyParameters;
  actionPotentialThresholdMv: number;
  actionPotentialTimesMs: number[];
  samples: NetworkNeuronSample[];
}

export interface NetworkSynapseSample {
  timeMs: number;
  presynapticTerminalVoltageMv: number;
  postsynapticVoltageMv: number;
  calciumChannelActivation: number;
  calciumCurrentPa: number;
  intracellularCalciumUm: number;
  releaseProbability: number;
  expectedVesicleReleaseRatePerMs: number;
  expectedReleasedVesicles: number;
  availableVesicles: number;
  glutamateReleaseRateUmPerMs: number;
  cleftGlutamateUm: number;
  ampaOpenFraction: number;
  postsynapticConductanceMsPerCm2: number;
  postsynapticCurrentUaPerCm2: number;
}

export interface NetworkSynapseTrace {
  id: string;
  presynapticNeuronId: string;
  postsynapticNeuronId: string;
  chemicalParameters: ChemicalSynapseParameters;
  neurotransmitterParameters: NeurotransmitterParameters;
  receptorParameters: AMPAReceptorParameters;
  samples: NetworkSynapseSample[];
}

export interface ThreeNeuronNetworkResult {
  durationMs: number;
  dtMs: number;
  externalStimuli: NetworkCurrentPulse[];
  neurons: NetworkNeuronTrace[];
  synapses: NetworkSynapseTrace[];
}

interface ResolvedNeuron {
  definition: NetworkNeuronDefinition;
  parameters: HodgkinHuxleyParameters;
}

interface ResolvedConnection {
  definition: NetworkConnectionDefinition;
  presynapticNeuronIndex: number;
  postsynapticNeuronIndex: number;
  chemicalParameters: ChemicalSynapseParameters;
  neurotransmitterParameters: NeurotransmitterParameters;
  receptorParameters: AMPAReceptorParameters;
}

interface ConnectionState {
  terminal: ChemicalSynapseState;
  cleftGlutamateUm: number;
  ampaOpenFraction: number;
}

interface NetworkState {
  neurons: HodgkinHuxleyState[];
  connections: ConnectionState[];
}

interface ConnectionDerivative {
  terminal: ChemicalSynapseStateDerivative;
  cleftGlutamateUm: number;
  ampaOpenFraction: number;
}

interface NetworkDerivative {
  neurons: HodgkinHuxleyState[];
  connections: ConnectionDerivative[];
}

interface SynapseCurrents {
  outwardCurrentUaPerCm2: number;
  conductanceMsPerCm2: number;
}

export const DEFAULT_NETWORK_DT_MS = DEFAULT_CHEMICAL_SYNAPSE_STEP_MS;

export const DEFAULT_THREE_NEURON_DEFINITIONS: readonly NetworkNeuronDefinition[] = [
  { id: "neuron-a", label: "Neuron A" },
  { id: "neuron-b", label: "Neuron B" },
  { id: "neuron-c", label: "Neuron C" },
];

export const DEFAULT_THREE_NEURON_CONNECTIONS: readonly NetworkConnectionDefinition[] = [
  {
    id: "synapse-a-b",
    presynapticNeuronId: "neuron-a",
    postsynapticNeuronId: "neuron-b",
  },
  {
    id: "synapse-b-c",
    presynapticNeuronId: "neuron-b",
    postsynapticNeuronId: "neuron-c",
  },
];

export const DEFAULT_NETWORK_STIMULUS: Readonly<NetworkCurrentPulse> = {
  neuronId: "neuron-a",
  amplitudeUaPerCm2: 10,
  onsetMs: 5,
  durationMs: 1,
};

export const DEFAULT_NEUROTRANSMITTER_PARAMETERS: Readonly<NeurotransmitterParameters> = {
  glutamateMoleculesPerVesicle: 3_000,
  cleftVolumeLiters: 2e-17,
  clearanceTimeConstantMs: 0.5,
};

export const DEFAULT_AMPA_RECEPTOR_PARAMETERS: Readonly<AMPAReceptorParameters> = {
  associationRatePerUmMs: 0.01,
  dissociationRatePerMs: 0.5,
  maximumConductanceMsPerCm2: 0.5,
  reversalPotentialMv: 0,
};

function resolveNeurotransmitterParameters(
  overrides: Partial<NeurotransmitterParameters> = {},
): NeurotransmitterParameters {
  const parameters = { ...DEFAULT_NEUROTRANSMITTER_PARAMETERS, ...overrides };
  if (Object.values(parameters).some((value) => !Number.isFinite(value))) {
    throw new Error("Neurotransmitter parameters must be finite.");
  }
  if (
    parameters.glutamateMoleculesPerVesicle <= 0 ||
    parameters.cleftVolumeLiters <= 0 ||
    parameters.clearanceTimeConstantMs <= 0
  ) {
    throw new Error("Vesicle content, cleft volume, and clearance time must be positive.");
  }
  return parameters;
}

function resolveReceptorParameters(
  overrides: Partial<AMPAReceptorParameters> = {},
): AMPAReceptorParameters {
  const parameters = { ...DEFAULT_AMPA_RECEPTOR_PARAMETERS, ...overrides };
  if (Object.values(parameters).some((value) => !Number.isFinite(value))) {
    throw new Error("AMPA receptor parameters must be finite.");
  }
  if (
    parameters.associationRatePerUmMs < 0 ||
    parameters.dissociationRatePerMs < 0 ||
    parameters.maximumConductanceMsPerCm2 < 0
  ) {
    throw new Error("AMPA rates and conductance cannot be negative.");
  }
  return parameters;
}

function validatePulse(
  pulse: NetworkCurrentPulse,
  neuronIds: Set<string>,
): void {
  if (!neuronIds.has(pulse.neuronId)) {
    throw new Error(`External stimulus references missing neuron "${pulse.neuronId}".`);
  }
  if (
    !Number.isFinite(pulse.amplitudeUaPerCm2) ||
    !Number.isFinite(pulse.onsetMs) ||
    !Number.isFinite(pulse.durationMs)
  ) {
    throw new Error("External stimulus values must be finite.");
  }
  if (pulse.onsetMs < 0 || pulse.durationMs < 0) {
    throw new Error("External stimulus onset and duration cannot be negative.");
  }
}

function resolveNetwork(
  options: ThreeNeuronNetworkOptions,
): {
  neurons: ResolvedNeuron[];
  connections: ResolvedConnection[];
  stimuli: readonly NetworkCurrentPulse[];
  durationMs: number;
  dtMs: number;
} {
  const durationMs = options.durationMs ?? 40;
  const requestedStepMs = options.dtMs ?? DEFAULT_NETWORK_DT_MS;
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error("Network duration must be a finite positive number.");
  }
  if (
    !Number.isFinite(requestedStepMs) ||
    requestedStepMs < 0.0001 ||
    requestedStepMs > 0.05
  ) {
    throw new Error("Network time step must be between 0.0001 and 0.05 ms.");
  }

  const neuronDefinitions = options.neurons ?? DEFAULT_THREE_NEURON_DEFINITIONS;
  if (neuronDefinitions.length === 0) {
    throw new Error("A network must contain at least one neuron.");
  }
  const neuronIds = new Set<string>();
  const neurons = neuronDefinitions.map((definition) => {
    if (!definition.id.trim() || !definition.label.trim() || neuronIds.has(definition.id)) {
      throw new Error(`Neuron IDs and labels must be nonempty and IDs unique ("${definition.id}").`);
    }
    neuronIds.add(definition.id);
    return {
      definition,
      parameters: resolveHodgkinHuxleyParameters(definition.parameters),
    };
  });
  const indexByNeuronId = new Map(
    neurons.map(({ definition }, index) => [definition.id, index]),
  );
  const connectionDefinitions = options.connections ?? DEFAULT_THREE_NEURON_CONNECTIONS;
  const connectionIds = new Set<string>();
  const connections = connectionDefinitions.map((definition) => {
    if (!definition.id.trim() || connectionIds.has(definition.id)) {
      throw new Error(`Connection IDs must be nonempty and unique ("${definition.id}").`);
    }
    connectionIds.add(definition.id);
    const presynapticNeuronIndex = indexByNeuronId.get(definition.presynapticNeuronId);
    const postsynapticNeuronIndex = indexByNeuronId.get(definition.postsynapticNeuronId);
    if (presynapticNeuronIndex === undefined || postsynapticNeuronIndex === undefined) {
      throw new Error(`Connection "${definition.id}" references a missing neuron.`);
    }
    return {
      definition,
      presynapticNeuronIndex,
      postsynapticNeuronIndex,
      chemicalParameters: resolveChemicalSynapseParameters(
        definition.chemicalSynapseParameters,
      ),
      neurotransmitterParameters: resolveNeurotransmitterParameters(
        definition.neurotransmitterParameters,
      ),
      receptorParameters: resolveReceptorParameters(definition.receptorParameters),
    };
  });
  const stimuli = options.externalStimuli ?? [DEFAULT_NETWORK_STIMULUS];
  for (const pulse of stimuli) validatePulse(pulse, neuronIds);

  const membraneStepMs = neurons.reduce(
    (step, neuron) => getHodgkinHuxleyMaxStepMs(step, neuron.parameters),
    requestedStepMs,
  );
  // Keep at least ten RK4 steps across each configured chemical time scale.
  const dtMs = connections.reduce((step, connection) => {
    const chemical = connection.chemicalParameters;
    const transmitter = connection.neurotransmitterParameters;
    const receptor = connection.receptorParameters;
    const maximumSteadyGlutamateUm =
      chemical.maximumFusionRatePerMs *
      chemical.initialVesiclePool *
      transmitter.glutamateMoleculesPerVesicle /
      AVOGADRO_MOLECULES_PER_MOL /
      transmitter.cleftVolumeLiters *
      1e6 *
      transmitter.clearanceTimeConstantMs;
    const receptorRatePerMs =
      receptor.associationRatePerUmMs * maximumSteadyGlutamateUm +
      receptor.dissociationRatePerMs;
    if (!Number.isFinite(receptorRatePerMs)) {
      throw new Error(`Synapse "${connection.definition.id}" has a non-finite receptor rate.`);
    }

    return Math.min(
      step,
      chemical.activationTimeConstantMs / 10,
      chemical.calciumClearanceTimeConstantMs / 10,
      (transmitter.clearanceTimeConstantMs / 10),
      chemical.maximumFusionRatePerMs > 0
        ? 0.1 / chemical.maximumFusionRatePerMs
        : step,
      receptorRatePerMs > 0 ? 0.1 / receptorRatePerMs : step,
    );
  }, membraneStepMs);
  if (
    Math.ceil(durationMs / dtMs) + stimuli.length * 2 + 1 >
    MAX_NETWORK_STEPS
  ) {
    throw new Error(`Network exceeds the ${MAX_NETWORK_STEPS} integration-step safety limit.`);
  }
  return { neurons, connections, stimuli, durationMs, dtMs };
}

function externalCurrentAt(
  neuronId: string,
  timeMs: number,
  stimuli: readonly NetworkCurrentPulse[],
): number {
  return stimuli.reduce((sum, pulse) => (
    pulse.neuronId === neuronId &&
    timeMs >= pulse.onsetMs &&
    timeMs < pulse.onsetMs + pulse.durationMs
      ? sum + pulse.amplitudeUaPerCm2
      : sum
  ), 0);
}

function connectionCurrents(
  connection: ResolvedConnection,
  state: ConnectionState,
  postsynapticVoltageMv: number,
): SynapseCurrents {
  const conductanceMsPerCm2 =
    connection.receptorParameters.maximumConductanceMsPerCm2 *
    state.ampaOpenFraction;
  return {
    conductanceMsPerCm2,
    outwardCurrentUaPerCm2: conductanceMsPerCm2 *
      (postsynapticVoltageMv - connection.receptorParameters.reversalPotentialMv),
  };
}

function glutamateInputRateUmPerMs(
  vesicleReleaseRatePerMs: number,
  parameters: NeurotransmitterParameters,
): number {
  const molesPerMs =
    vesicleReleaseRatePerMs * parameters.glutamateMoleculesPerVesicle /
    AVOGADRO_MOLECULES_PER_MOL;
  return molesPerMs / parameters.cleftVolumeLiters * 1e6;
}

function evaluateNetworkDerivative(
  timeMs: number,
  state: NetworkState,
  neurons: readonly ResolvedNeuron[],
  connections: readonly ResolvedConnection[],
  stimuli: readonly NetworkCurrentPulse[],
): NetworkDerivative {
  const synapticOutwardCurrents = neurons.map(() => 0);
  const connectionDerivatives = connections.map((connection, index) => {
    const connectionState = state.connections[index];
    const presynapticVoltage = state.neurons[connection.presynapticNeuronIndex].voltageMv;
    const chemicalDerivative = getChemicalSynapseStateDerivative(
      connectionState.terminal,
      presynapticVoltage,
      connection.chemicalParameters,
    );
    const transmitterInputRate = glutamateInputRateUmPerMs(
      chemicalDerivative.expectedReleasedVesicles,
      connection.neurotransmitterParameters,
    );
    const glutamateDerivative = transmitterInputRate -
      connectionState.cleftGlutamateUm /
        connection.neurotransmitterParameters.clearanceTimeConstantMs;
    const receptorDerivative =
      connection.receptorParameters.associationRatePerUmMs *
        connectionState.cleftGlutamateUm *
        (1 - connectionState.ampaOpenFraction) -
      connection.receptorParameters.dissociationRatePerMs *
        connectionState.ampaOpenFraction;
    const current = connectionCurrents(
      connection,
      connectionState,
      state.neurons[connection.postsynapticNeuronIndex].voltageMv,
    );
    synapticOutwardCurrents[connection.postsynapticNeuronIndex] +=
      current.outwardCurrentUaPerCm2;

    return {
      terminal: chemicalDerivative,
      cleftGlutamateUm: glutamateDerivative,
      ampaOpenFraction: receptorDerivative,
    };
  });

  const neuronDerivatives = neurons.map((neuron, index) => {
    const synapticAppliedCurrent = -synapticOutwardCurrents[index];
    const externalCurrent = externalCurrentAt(
      neuron.definition.id,
      timeMs,
      stimuli,
    );
    return getHodgkinHuxleyStateDerivative(
      state.neurons[index],
      externalCurrent + synapticAppliedCurrent,
      neuron.parameters,
    );
  });

  return { neurons: neuronDerivatives, connections: connectionDerivatives };
}

function addScaled(
  state: NetworkState,
  derivative: NetworkDerivative,
  scale: number,
): NetworkState {
  return {
    neurons: state.neurons.map((neuron, index) => ({
      voltageMv: neuron.voltageMv + derivative.neurons[index].voltageMv * scale,
      m: neuron.m + derivative.neurons[index].m * scale,
      h: neuron.h + derivative.neurons[index].h * scale,
      n: neuron.n + derivative.neurons[index].n * scale,
    })),
    connections: state.connections.map((connection, index) => ({
      terminal: {
        channelActivation: connection.terminal.channelActivation +
          derivative.connections[index].terminal.channelActivation * scale,
        localCalciumUm: connection.terminal.localCalciumUm +
          derivative.connections[index].terminal.localCalciumUm * scale,
        expectedReleasedVesicles: connection.terminal.expectedReleasedVesicles +
          derivative.connections[index].terminal.expectedReleasedVesicles * scale,
        availableVesicles: connection.terminal.availableVesicles +
          derivative.connections[index].terminal.availableVesicles * scale,
      },
      cleftGlutamateUm: connection.cleftGlutamateUm +
        derivative.connections[index].cleftGlutamateUm * scale,
      ampaOpenFraction: connection.ampaOpenFraction +
        derivative.connections[index].ampaOpenFraction * scale,
    })),
  };
}

function integrateNetworkStep(
  state: NetworkState,
  timeMs: number,
  stepMs: number,
  neurons: readonly ResolvedNeuron[],
  connections: readonly ResolvedConnection[],
  stimuli: readonly NetworkCurrentPulse[],
): NetworkState {
  const k1 = evaluateNetworkDerivative(timeMs, state, neurons, connections, stimuli);
  const k2 = evaluateNetworkDerivative(
    timeMs + stepMs / 2,
    addScaled(state, k1, stepMs / 2),
    neurons,
    connections,
    stimuli,
  );
  const k3 = evaluateNetworkDerivative(
    timeMs + stepMs / 2,
    addScaled(state, k2, stepMs / 2),
    neurons,
    connections,
    stimuli,
  );
  const k4 = evaluateNetworkDerivative(
    timeMs + stepMs,
    addScaled(state, k3, stepMs),
    neurons,
    connections,
    stimuli,
  );
  const next = {
    neurons: state.neurons.map((neuron, index) => ({
      voltageMv: neuron.voltageMv + (stepMs / 6) * (
        k1.neurons[index].voltageMv + 2 * k2.neurons[index].voltageMv +
        2 * k3.neurons[index].voltageMv + k4.neurons[index].voltageMv
      ),
      m: neuron.m + (stepMs / 6) * (
        k1.neurons[index].m + 2 * k2.neurons[index].m +
        2 * k3.neurons[index].m + k4.neurons[index].m
      ),
      h: neuron.h + (stepMs / 6) * (
        k1.neurons[index].h + 2 * k2.neurons[index].h +
        2 * k3.neurons[index].h + k4.neurons[index].h
      ),
      n: neuron.n + (stepMs / 6) * (
        k1.neurons[index].n + 2 * k2.neurons[index].n +
        2 * k3.neurons[index].n + k4.neurons[index].n
      ),
    })),
    connections: state.connections.map((connection, index) => ({
      terminal: {
        channelActivation: connection.terminal.channelActivation + (stepMs / 6) * (
          k1.connections[index].terminal.channelActivation +
          2 * k2.connections[index].terminal.channelActivation +
          2 * k3.connections[index].terminal.channelActivation +
          k4.connections[index].terminal.channelActivation
        ),
        localCalciumUm: connection.terminal.localCalciumUm + (stepMs / 6) * (
          k1.connections[index].terminal.localCalciumUm +
          2 * k2.connections[index].terminal.localCalciumUm +
          2 * k3.connections[index].terminal.localCalciumUm +
          k4.connections[index].terminal.localCalciumUm
        ),
        expectedReleasedVesicles:
          connection.terminal.expectedReleasedVesicles + (stepMs / 6) * (
            k1.connections[index].terminal.expectedReleasedVesicles +
            2 * k2.connections[index].terminal.expectedReleasedVesicles +
            2 * k3.connections[index].terminal.expectedReleasedVesicles +
            k4.connections[index].terminal.expectedReleasedVesicles
          ),
        availableVesicles: connection.terminal.availableVesicles + (stepMs / 6) * (
          k1.connections[index].terminal.availableVesicles +
          2 * k2.connections[index].terminal.availableVesicles +
          2 * k3.connections[index].terminal.availableVesicles +
          k4.connections[index].terminal.availableVesicles
        ),
      },
      cleftGlutamateUm: connection.cleftGlutamateUm + (stepMs / 6) * (
        k1.connections[index].cleftGlutamateUm +
        2 * k2.connections[index].cleftGlutamateUm +
        2 * k3.connections[index].cleftGlutamateUm +
        k4.connections[index].cleftGlutamateUm
      ),
      ampaOpenFraction: connection.ampaOpenFraction + (stepMs / 6) * (
        k1.connections[index].ampaOpenFraction +
        2 * k2.connections[index].ampaOpenFraction +
        2 * k3.connections[index].ampaOpenFraction +
        k4.connections[index].ampaOpenFraction
      ),
    })),
  };

  next.neurons.forEach((neuron) => validateHodgkinHuxleyState(neuron, timeMs));
  next.connections.forEach((connection) => {
    connection.terminal = normalizeChemicalSynapseState(connection.terminal, timeMs);
    if (
      !Number.isFinite(connection.cleftGlutamateUm) ||
      connection.cleftGlutamateUm < -1e-8 ||
      !Number.isFinite(connection.ampaOpenFraction) ||
      connection.ampaOpenFraction < -1e-8 ||
      connection.ampaOpenFraction > 1 + 1e-8
    ) {
      throw new Error(`Synapse state left its physical bounds at ${timeMs} ms.`);
    }
    connection.cleftGlutamateUm = Math.max(0, connection.cleftGlutamateUm);
    connection.ampaOpenFraction = Math.min(1, Math.max(0, connection.ampaOpenFraction));
  });
  return next;
}

function nextStimulusBoundaryMs(
  timeMs: number,
  nextTimeMs: number,
  stimuli: readonly NetworkCurrentPulse[],
): number {
  let boundary = nextTimeMs;
  for (const pulse of stimuli) {
    for (const pulseBoundary of [pulse.onsetMs, pulse.onsetMs + pulse.durationMs]) {
      if (pulseBoundary > timeMs && pulseBoundary < boundary) boundary = pulseBoundary;
    }
  }
  return boundary;
}

function sampleNetwork(
  timeMs: number,
  state: NetworkState,
  neurons: readonly ResolvedNeuron[],
  connections: readonly ResolvedConnection[],
  stimuli: readonly NetworkCurrentPulse[],
): {
  neuronSamples: NetworkNeuronSample[];
  connectionSamples: NetworkSynapseSample[];
} {
  const synapticOutwardCurrents = neurons.map(() => 0);
  const connectionSamples = connections.map((connection, index) => {
    const connectionState = state.connections[index];
    const terminalVoltage = state.neurons[connection.presynapticNeuronIndex].voltageMv;
    const chemical = sampleChemicalSynapseState(
      timeMs,
      connectionState.terminal,
      terminalVoltage,
      connection.chemicalParameters,
    );
    const current = connectionCurrents(
      connection,
      connectionState,
      state.neurons[connection.postsynapticNeuronIndex].voltageMv,
    );
    synapticOutwardCurrents[connection.postsynapticNeuronIndex] +=
      current.outwardCurrentUaPerCm2;
    const transmitterRate = glutamateInputRateUmPerMs(
      chemical.expectedVesicleReleaseRatePerMs,
      connection.neurotransmitterParameters,
    );
    return {
      timeMs,
      presynapticTerminalVoltageMv: terminalVoltage,
      postsynapticVoltageMv: state.neurons[connection.postsynapticNeuronIndex].voltageMv,
      calciumChannelActivation: chemical.channelActivation,
      calciumCurrentPa: chemical.calciumCurrentPa,
      intracellularCalciumUm: chemical.localCalciumUm,
      releaseProbability: chemical.releaseProbability,
      expectedVesicleReleaseRatePerMs: chemical.expectedVesicleReleaseRatePerMs,
      expectedReleasedVesicles: chemical.expectedReleasedVesicles,
      availableVesicles: chemical.availableVesicles,
      glutamateReleaseRateUmPerMs: transmitterRate,
      cleftGlutamateUm: connectionState.cleftGlutamateUm,
      ampaOpenFraction: connectionState.ampaOpenFraction,
      postsynapticConductanceMsPerCm2: current.conductanceMsPerCm2,
      postsynapticCurrentUaPerCm2: current.outwardCurrentUaPerCm2,
    };
  });

  const neuronSamples = neurons.map((neuron, index) => {
    const stateAtNeuron = state.neurons[index];
    const ionicCurrents = getHodgkinHuxleyIonicCurrents(
      stateAtNeuron,
      neuron.parameters,
    );
    const synapticCurrent = synapticOutwardCurrents[index];
    return {
      timeMs,
      voltageMv: stateAtNeuron.voltageMv,
      ...ionicCurrents,
      m: stateAtNeuron.m,
      h: stateAtNeuron.h,
      n: stateAtNeuron.n,
      externalCurrentUaPerCm2: externalCurrentAt(
        neuron.definition.id,
        timeMs,
        stimuli,
      ),
      synapticCurrentUaPerCm2: synapticCurrent,
      appliedSynapticCurrentUaPerCm2: -synapticCurrent,
    };
  });
  return { neuronSamples, connectionSamples };
}

function findActionPotentialTimes(samples: readonly NetworkNeuronSample[]): number[] {
  const thresholdMv = 0;
  const events: number[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (previous.voltageMv < thresholdMv && current.voltageMv >= thresholdMv) {
      const fraction = (thresholdMv - previous.voltageMv) /
        (current.voltageMv - previous.voltageMv);
      events.push(previous.timeMs + fraction * (current.timeMs - previous.timeMs));
    }
  }
  return events;
}

export function simulateThreeNeuronNetwork(
  options: ThreeNeuronNetworkOptions = {},
): ThreeNeuronNetworkResult {
  const configuration = resolveNetwork(options);
  const { neurons, connections, stimuli, durationMs, dtMs } = configuration;
  let state: NetworkState = {
    neurons: neurons.map(({ parameters }) =>
      createHodgkinHuxleyInitialState(parameters),
    ),
    connections: connections.map((connection) => ({
      terminal: createChemicalSynapseInitialState(connection.chemicalParameters),
      cleftGlutamateUm: 0,
      ampaOpenFraction: 0,
    })),
  };
  const neuronSamples = neurons.map(() => [] as NetworkNeuronSample[]);
  const connectionSamples = connections.map(() => [] as NetworkSynapseSample[]);
  let timeMs = 0;
  const firstSamples = sampleNetwork(timeMs, state, neurons, connections, stimuli);
  firstSamples.neuronSamples.forEach((sample, index) => neuronSamples[index].push(sample));
  firstSamples.connectionSamples.forEach((sample, index) => connectionSamples[index].push(sample));

  while (timeMs < durationMs) {
    let nextTimeMs = Math.min(durationMs, timeMs + dtMs);
    nextTimeMs = nextStimulusBoundaryMs(timeMs, nextTimeMs, stimuli);
    const stepMs = nextTimeMs - timeMs;
    state = integrateNetworkStep(
      state,
      timeMs,
      stepMs,
      neurons,
      connections,
      stimuli,
    );
    timeMs = nextTimeMs;
    const samples = sampleNetwork(timeMs, state, neurons, connections, stimuli);
    samples.neuronSamples.forEach((sample, index) => neuronSamples[index].push(sample));
    samples.connectionSamples.forEach((sample, index) => connectionSamples[index].push(sample));
  }

  return {
    durationMs,
    dtMs,
    externalStimuli: stimuli.map((pulse) => ({ ...pulse })),
    neurons: neurons.map(({ definition }, index) => ({
      id: definition.id,
      label: definition.label,
      parameters: neurons[index].parameters,
      actionPotentialThresholdMv: 0,
      actionPotentialTimesMs: findActionPotentialTimes(neuronSamples[index]),
      samples: neuronSamples[index],
    })),
    synapses: connections.map(({ definition }, index) => ({
      id: definition.id,
      presynapticNeuronId: definition.presynapticNeuronId,
      postsynapticNeuronId: definition.postsynapticNeuronId,
      chemicalParameters: connections[index].chemicalParameters,
      neurotransmitterParameters: connections[index].neurotransmitterParameters,
      receptorParameters: connections[index].receptorParameters,
      samples: connectionSamples[index],
    })),
  };
}

