/**
 * Deterministic, one-channel/one-release-site chemical synapse approximation.
 * The supplied terminal voltage is an explicit input waveform, not an axonal
 * propagation result. Activation a is an expected open-probability fraction,
 * with da/dt=(a∞(V)-a)/τa and ICa=g*a*(V-ECa), so current is expected
 * single-channel current with outward-positive sign in pA. A point-source estimate maps inward current
 * to sensor calcium: [Ca]target=[Ca]rest+max(0,-ICa)/(4πzFDr); concentration
 * relaxes toward that estimate with a first-order clearance time constant.
 * Release uses P(Ca)=Ca^n/(Ca^n+K^n), with expected fusion rate
 * kmax*P*available-vesicles. Calcium-channel parameters (ECa=43 mV,
 * g=2.76 pS, D=220 μm²/s) and activation onset near -40 mV are based on
 * Scarnati et al. (2020; P8-P12 mouse calyx of Held; DOI
 * 10.3389/fnsyn.2020.00017); its point-source estimate is a local approximation,
 * not a spatial calcium simulation. The linear
 * activation curve, activation/clearance time constants, sensor distance,
 * effective release half-activation, and fusion rate are adjustable modeling
 * assumptions rather than universal or fitted biological constants. The
 * adjustable Hill exponent is motivated by the preparation-dependent range
 * reviewed by Matveev et al. (2011; DOI 10.1016/j.brainres.2011.05.011). A
 * finite one-site pool is used without replenishment. Molecular SNARE kinetics,
 * transmitter diffusion, receptors, postsynaptic responses, and stochastic
 * channel opening/release are not represented.
 */
export interface PresynapticVoltageSample {
  timeFromOnsetMs: number;
  voltageMv: number;
}

export interface PresynapticSpikeEvent {
  onsetMs: number;
  waveform: readonly PresynapticVoltageSample[];
}

export interface ChemicalSynapseParameters {
  baselineVoltageMv: number;
  calciumReversalMv: number;
  singleChannelConductancePs: number;
  activationThresholdMv: number;
  activationSaturationMv: number;
  activationTimeConstantMs: number;
  calciumDiffusionUm2PerS: number;
  sensorDistanceNm: number;
  baselineCalciumUm: number;
  calciumClearanceTimeConstantMs: number;
  releaseHillCoefficient: number;
  releaseHalfActivationUm: number;
  maximumFusionRatePerMs: number;
  initialVesiclePool: number;
}

export interface ChemicalSynapseOptions {
  presynapticSpikeEvent: PresynapticSpikeEvent;
  durationMs?: number;
  dtMs?: number;
  parameters?: Partial<ChemicalSynapseParameters>;
}

export interface ChemicalSynapseSample {
  timeMs: number;
  terminalVoltageMv: number;
  channelActivation: number;
  calciumCurrentPa: number;
  localCalciumUm: number;
  releaseProbability: number;
  expectedVesicleReleaseRatePerMs: number;
  expectedReleasedVesicles: number;
  availableVesicles: number;
}

export interface ChemicalSynapseResult {
  samples: ChemicalSynapseSample[];
  durationMs: number;
  maxStepMs: number;
  parameters: ChemicalSynapseParameters;
  presynapticSpikeEvent: PresynapticSpikeEvent;
}

export interface ChemicalSynapseState {
  channelActivation: number;
  localCalciumUm: number;
  expectedReleasedVesicles: number;
  availableVesicles: number;
}

export interface ChemicalSynapseStateDerivative {
  channelActivation: number;
  localCalciumUm: number;
  expectedReleasedVesicles: number;
  availableVesicles: number;
}

const FARADAY_C_PER_MOL = 96_485.33212;
export const DEFAULT_CHEMICAL_SYNAPSE_STEP_MS = 0.005;
const MAX_INTEGRATION_STEPS = 1_000_000;

export const DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS: Readonly<ChemicalSynapseParameters> = {
  baselineVoltageMv: -65,
  calciumReversalMv: 43,
  singleChannelConductancePs: 2.76,
  activationThresholdMv: -40,
  activationSaturationMv: 10,
  activationTimeConstantMs: 0.3,
  calciumDiffusionUm2PerS: 220,
  sensorDistanceNm: 40,
  baselineCalciumUm: 0.05,
  calciumClearanceTimeConstantMs: 1,
  releaseHillCoefficient: 4,
  releaseHalfActivationUm: 10,
  maximumFusionRatePerMs: 2,
  initialVesiclePool: 1,
};

export function resolveChemicalSynapseParameters(
  overrides: Partial<ChemicalSynapseParameters> = {},
): ChemicalSynapseParameters {
  const parameters = { ...DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS, ...overrides };
  for (const [name, value] of Object.entries(parameters)) {
    if (!Number.isFinite(value)) {
      throw new Error(`${name} must be a finite number.`);
    }
  }
  if (
    parameters.singleChannelConductancePs <= 0 ||
    parameters.activationTimeConstantMs <= 0 ||
    parameters.calciumDiffusionUm2PerS <= 0 ||
    parameters.sensorDistanceNm <= 0 ||
    parameters.baselineCalciumUm < 0 ||
    parameters.calciumClearanceTimeConstantMs <= 0 ||
    parameters.releaseHalfActivationUm <= 0 ||
    parameters.maximumFusionRatePerMs < 0 ||
    parameters.initialVesiclePool < 0
  ) {
    throw new Error("Conductance, time, diffusion, distance, and release parameters are out of range.");
  }
  if (parameters.activationSaturationMv <= parameters.activationThresholdMv) {
    throw new Error("Activation saturation voltage must exceed its threshold.");
  }
  if (
    parameters.releaseHillCoefficient < 1 ||
    parameters.releaseHillCoefficient > 5
  ) {
    throw new Error("Release Hill coefficient must be between 1 and 5.");
  }
  return parameters;
}

export function createChemicalSynapseInitialState(
  parameters: ChemicalSynapseParameters,
): ChemicalSynapseState {
  return {
    channelActivation: 0,
    localCalciumUm: parameters.baselineCalciumUm,
    expectedReleasedVesicles: 0,
    availableVesicles: parameters.initialVesiclePool,
  };
}

function validateSpikeEvent(event: PresynapticSpikeEvent): void {
  if (typeof event !== "object" || event === null || !Array.isArray(event.waveform)) {
    throw new Error("Presynaptic spike event must contain a voltage waveform.");
  }
  if (!Number.isFinite(event.onsetMs) || event.onsetMs < 0) {
    throw new Error("Presynaptic spike onset must be a finite nonnegative time.");
  }
  if (event.waveform.length < 2 || event.waveform[0].timeFromOnsetMs !== 0) {
    throw new Error("Spike waveform must contain at least two samples and start at time zero.");
  }
  let previousTimeMs = -1;
  for (const sample of event.waveform) {
    if (
      typeof sample !== "object" ||
      sample === null ||
      !Number.isFinite(sample.timeFromOnsetMs) ||
      !Number.isFinite(sample.voltageMv) ||
      sample.timeFromOnsetMs <= previousTimeMs
    ) {
      throw new Error("Spike waveform samples must have finite, strictly increasing times and voltages.");
    }
    previousTimeMs = sample.timeFromOnsetMs;
  }
}

function channelActivationTarget(
  voltageMv: number,
  parameters: ChemicalSynapseParameters,
): number {
  return Math.min(1, Math.max(
    0,
    (voltageMv - parameters.activationThresholdMv) /
      (parameters.activationSaturationMv - parameters.activationThresholdMv),
  ));
}

function calciumCurrentPa(
  voltageMv: number,
  activation: number,
  parameters: ChemicalSynapseParameters,
): number {
  return activation *
    parameters.singleChannelConductancePs *
    (voltageMv - parameters.calciumReversalMv) *
    0.001;
}

function pointSourceCalciumUm(
  inwardCurrentPa: number,
  parameters: ChemicalSynapseParameters,
): number {
  if (inwardCurrentPa <= 0) return parameters.baselineCalciumUm;

  const distanceM = parameters.sensorDistanceNm * 1e-9;
  const diffusionM2PerS = parameters.calciumDiffusionUm2PerS * 1e-12;
  const concentrationMolPerM3 = inwardCurrentPa * 1e-12 /
    (4 * Math.PI * FARADAY_C_PER_MOL * diffusionM2PerS * distanceM);
  return parameters.baselineCalciumUm + concentrationMolPerM3 * 1000;
}

function releaseProbability(
  calciumUm: number,
  parameters: ChemicalSynapseParameters,
): number {
  const calciumPower = calciumUm ** parameters.releaseHillCoefficient;
  const halfActivationPower =
    parameters.releaseHalfActivationUm ** parameters.releaseHillCoefficient;
  return calciumPower / (calciumPower + halfActivationPower);
}

function terminalVoltageAt(
  timeMs: number,
  event: PresynapticSpikeEvent,
  baselineVoltageMv: number,
): number {
  const waveformTimeMs = timeMs - event.onsetMs;
  if (
    waveformTimeMs < 0 ||
    waveformTimeMs > event.waveform[event.waveform.length - 1].timeFromOnsetMs
  ) {
    return baselineVoltageMv;
  }

  let low = 0;
  let high = event.waveform.length - 1;
  while (low < high - 1) {
    const middle = Math.floor((low + high) / 2);
    if (event.waveform[middle].timeFromOnsetMs <= waveformTimeMs) low = middle;
    else high = middle;
  }

  const before = event.waveform[low];
  const after = event.waveform[high];
  const fraction = (waveformTimeMs - before.timeFromOnsetMs) /
    (after.timeFromOnsetMs - before.timeFromOnsetMs);
  return before.voltageMv + (after.voltageMv - before.voltageMv) * fraction;
}

function nextWaveformKnotMs(
  timeMs: number,
  event: PresynapticSpikeEvent,
): number | undefined {
  const waveformTimeMs = timeMs - event.onsetMs;
  let low = 0;
  let high = event.waveform.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (event.waveform[middle].timeFromOnsetMs <= waveformTimeMs) low = middle + 1;
    else high = middle;
  }
  const nextSample = event.waveform[low];
  return nextSample
    ? event.onsetMs + nextSample.timeFromOnsetMs
    : undefined;
}

export function getChemicalSynapseStateDerivative(
  state: ChemicalSynapseState,
  terminalVoltageMv: number,
  parameters: ChemicalSynapseParameters,
): ChemicalSynapseStateDerivative {
  if (!Number.isFinite(terminalVoltageMv)) {
    throw new Error("Terminal voltage must be finite.");
  }
  const targetActivation = channelActivationTarget(terminalVoltageMv, parameters);
  const currentPa = calciumCurrentPa(
    terminalVoltageMv,
    state.channelActivation,
    parameters,
  );
  const targetCalciumUm = pointSourceCalciumUm(-currentPa, parameters);
  const probability = releaseProbability(state.localCalciumUm, parameters);
  const fusionRatePerMs = parameters.maximumFusionRatePerMs * probability;
  const expectedFusionRate = fusionRatePerMs * state.availableVesicles;

  return {
    channelActivation:
      (targetActivation - state.channelActivation) /
      parameters.activationTimeConstantMs,
    localCalciumUm:
      (targetCalciumUm - state.localCalciumUm) /
      parameters.calciumClearanceTimeConstantMs,
    expectedReleasedVesicles: expectedFusionRate,
    availableVesicles: -expectedFusionRate,
  };
}

function addScaled(
  state: ChemicalSynapseState,
  derivative: ChemicalSynapseStateDerivative,
  scale: number,
): ChemicalSynapseState {
  return {
    channelActivation: state.channelActivation + derivative.channelActivation * scale,
    localCalciumUm: state.localCalciumUm + derivative.localCalciumUm * scale,
    expectedReleasedVesicles:
      state.expectedReleasedVesicles +
      derivative.expectedReleasedVesicles * scale,
    availableVesicles: state.availableVesicles + derivative.availableVesicles * scale,
  };
}

function rk4Step(
  state: ChemicalSynapseState,
  timeMs: number,
  stepMs: number,
  event: PresynapticSpikeEvent,
  parameters: ChemicalSynapseParameters,
): ChemicalSynapseState {
  const k1 = getChemicalSynapseStateDerivative(
    state,
    terminalVoltageAt(timeMs, event, parameters.baselineVoltageMv),
    parameters,
  );
  const k2 = getChemicalSynapseStateDerivative(
    addScaled(state, k1, stepMs / 2),
    terminalVoltageAt(timeMs + stepMs / 2, event, parameters.baselineVoltageMv),
    parameters,
  );
  const k3 = getChemicalSynapseStateDerivative(
    addScaled(state, k2, stepMs / 2),
    terminalVoltageAt(timeMs + stepMs / 2, event, parameters.baselineVoltageMv),
    parameters,
  );
  const k4 = getChemicalSynapseStateDerivative(
    addScaled(state, k3, stepMs),
    terminalVoltageAt(timeMs + stepMs, event, parameters.baselineVoltageMv),
    parameters,
  );
  const next = {
    channelActivation: state.channelActivation + (stepMs / 6) * (
      k1.channelActivation + 2 * k2.channelActivation +
      2 * k3.channelActivation + k4.channelActivation
    ),
    localCalciumUm: state.localCalciumUm + (stepMs / 6) * (
      k1.localCalciumUm + 2 * k2.localCalciumUm +
      2 * k3.localCalciumUm + k4.localCalciumUm
    ),
    expectedReleasedVesicles: state.expectedReleasedVesicles + (stepMs / 6) * (
      k1.expectedReleasedVesicles + 2 * k2.expectedReleasedVesicles +
      2 * k3.expectedReleasedVesicles + k4.expectedReleasedVesicles
    ),
    availableVesicles: state.availableVesicles + (stepMs / 6) * (
      k1.availableVesicles + 2 * k2.availableVesicles +
      2 * k3.availableVesicles + k4.availableVesicles
    ),
  };
  validateChemicalSynapseState(next, timeMs);
  return normalizeChemicalSynapseState(next, timeMs);
}

export function validateChemicalSynapseState(
  state: ChemicalSynapseState,
  timeMs: number,
): void {
  if (Object.values(state).some((value) => !Number.isFinite(value))) {
    throw new Error(`Synaptic integration became non-finite at ${timeMs} ms.`);
  }
  if (
    state.channelActivation < -1e-8 ||
    state.channelActivation > 1 + 1e-8 ||
    state.localCalciumUm < 0 ||
    state.availableVesicles < -1e-8 ||
    state.expectedReleasedVesicles < -1e-8
  ) {
    throw new Error(`Synaptic state left its physical bounds at ${timeMs} ms; reduce the time step.`);
  }
}

export function normalizeChemicalSynapseState(
  state: ChemicalSynapseState,
  timeMs: number,
): ChemicalSynapseState {
  validateChemicalSynapseState(state, timeMs);
  return {
    ...state,
    channelActivation: Math.min(1, Math.max(0, state.channelActivation)),
    availableVesicles: Math.max(0, state.availableVesicles),
  };
}

export function sampleChemicalSynapseState(
  timeMs: number,
  state: ChemicalSynapseState,
  terminalVoltageMv: number,
  parameters: ChemicalSynapseParameters,
): ChemicalSynapseSample {
  const currentPa = calciumCurrentPa(
    terminalVoltageMv,
    state.channelActivation,
    parameters,
  );
  return {
    timeMs,
    terminalVoltageMv,
    channelActivation: state.channelActivation,
    calciumCurrentPa: currentPa,
    localCalciumUm: state.localCalciumUm,
    releaseProbability: releaseProbability(state.localCalciumUm, parameters),
    expectedVesicleReleaseRatePerMs:
      getChemicalSynapseStateDerivative(state, terminalVoltageMv, parameters)
        .expectedReleasedVesicles,
    expectedReleasedVesicles: state.expectedReleasedVesicles,
    availableVesicles: state.availableVesicles,
  };
}

export function simulateChemicalSynapse(
  options: ChemicalSynapseOptions,
): ChemicalSynapseResult {
  validateSpikeEvent(options.presynapticSpikeEvent);
  const parameters = resolveChemicalSynapseParameters(options.parameters);
  const durationMs = options.durationMs ?? 30;
  const requestedStepMs = options.dtMs ?? DEFAULT_CHEMICAL_SYNAPSE_STEP_MS;
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error("Simulation duration must be a finite positive number.");
  }
  if (
    !Number.isFinite(requestedStepMs) ||
    requestedStepMs < 0.0001 ||
    requestedStepMs > 0.05
  ) {
    throw new Error("Time step must be between 0.0001 and 0.05 ms.");
  }
  if (Math.ceil(durationMs / requestedStepMs) + 1 > MAX_INTEGRATION_STEPS) {
    throw new Error(`Simulation exceeds the ${MAX_INTEGRATION_STEPS} integration-step safety limit.`);
  }

  const event = options.presynapticSpikeEvent;
  let state = createChemicalSynapseInitialState(parameters);
  let timeMs = 0;
  const samples = [sampleChemicalSynapseState(
    timeMs,
    state,
    terminalVoltageAt(timeMs, event, parameters.baselineVoltageMv),
    parameters,
  )];

  while (timeMs < durationMs) {
    let nextTimeMs = Math.min(durationMs, timeMs + requestedStepMs);
    const nextKnotMs = nextWaveformKnotMs(timeMs, event);
    if (nextKnotMs !== undefined && nextKnotMs > timeMs && nextKnotMs < nextTimeMs) {
      nextTimeMs = nextKnotMs;
    }
    const stepMs = nextTimeMs - timeMs;
    state = rk4Step(state, timeMs, stepMs, event, parameters);
    timeMs = nextTimeMs;
    samples.push(sampleChemicalSynapseState(
      timeMs,
      state,
      terminalVoltageAt(timeMs, event, parameters.baselineVoltageMv),
      parameters,
    ));
  }

  return {
    samples,
    durationMs,
    maxStepMs: requestedStepMs,
    parameters,
    presynapticSpikeEvent: event,
  };
}
