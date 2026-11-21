/**
 * Classical squid-axon Hodgkin-Huxley membrane model in absolute mV:
 * Cm*dV/dt = Iapp - INa - IK - IL; ionic currents use outward-positive
 * conductance form. Gating kinetics and the temperature Q10 follow the
 * 1952 model and NEURON's squid implementation. This is a single isopotential
 * compartment, not a morphological or complete human-neuron model.
 */
export interface HodgkinHuxleyParameters {
  initialVoltageMv: number;
  capacitanceUfPerCm2: number;
  sodiumConductanceMsPerCm2: number;
  potassiumConductanceMsPerCm2: number;
  leakConductanceMsPerCm2: number;
  sodiumReversalMv: number;
  potassiumReversalMv: number;
  leakReversalMv: number;
  temperatureC: number;
}

export interface HodgkinHuxleyStimulus {
  amplitudeUaPerCm2: number;
  onsetMs: number;
  durationMs: number;
}

export interface HodgkinHuxleyOptions {
  durationMs?: number;
  dtMs?: number;
  parameters?: Partial<HodgkinHuxleyParameters>;
  stimulus?: Partial<HodgkinHuxleyStimulus>;
}

export interface HodgkinHuxleySample {
  timeMs: number;
  voltageMv: number;
  sodiumCurrentUaPerCm2: number;
  potassiumCurrentUaPerCm2: number;
  leakCurrentUaPerCm2: number;
  stimulusCurrentUaPerCm2: number;
  m: number;
  h: number;
  n: number;
}

export interface HodgkinHuxleyResult {
  samples: HodgkinHuxleySample[];
  durationMs: number;
  maxStepMs: number;
  parameters: HodgkinHuxleyParameters;
  stimulus: HodgkinHuxleyStimulus;
}

export interface HodgkinHuxleyRates {
  alphaM: number;
  betaM: number;
  alphaH: number;
  betaH: number;
  alphaN: number;
  betaN: number;
}

export interface HodgkinHuxleyState {
  voltageMv: number;
  m: number;
  h: number;
  n: number;
}

export interface HodgkinHuxleyIonicCurrents {
  sodiumCurrentUaPerCm2: number;
  potassiumCurrentUaPerCm2: number;
  leakCurrentUaPerCm2: number;
}

const BASE_TEMPERATURE_C = 6.3;
const BASE_MAX_STEP_MS = 0.01;
const MAX_INTEGRATION_STEPS = 2_000_000;

export const DEFAULT_HODGKIN_HUXLEY_PARAMETERS: Readonly<HodgkinHuxleyParameters> = {
  initialVoltageMv: -65,
  capacitanceUfPerCm2: 1,
  sodiumConductanceMsPerCm2: 120,
  potassiumConductanceMsPerCm2: 36,
  leakConductanceMsPerCm2: 0.3,
  sodiumReversalMv: 50,
  potassiumReversalMv: -77,
  leakReversalMv: -54.3,
  temperatureC: BASE_TEMPERATURE_C,
};

export const DEFAULT_HODGKIN_HUXLEY_STIMULUS: Readonly<HodgkinHuxleyStimulus> = {
  amplitudeUaPerCm2: 10,
  onsetMs: 5,
  durationMs: 1,
};

function vtrap(x: number, y: number): number {
  const scaled = x / y;
  if (Math.abs(scaled) < 1e-6) {
    return y * (1 - scaled / 2);
  }
  return x / Math.expm1(scaled);
}

export function getHodgkinHuxleyRates(voltageMv: number): HodgkinHuxleyRates {
  if (!Number.isFinite(voltageMv)) {
    throw new Error("Membrane voltage must be finite.");
  }

  return {
    alphaM: 0.1 * vtrap(-(voltageMv + 40), 10),
    betaM: 4 * Math.exp(-(voltageMv + 65) / 18),
    alphaH: 0.07 * Math.exp(-(voltageMv + 65) / 20),
    betaH: 1 / (Math.exp(-(voltageMv + 35) / 10) + 1),
    alphaN: 0.01 * vtrap(-(voltageMv + 55), 10),
    betaN: 0.125 * Math.exp(-(voltageMv + 65) / 80),
  };
}

export function resolveHodgkinHuxleyParameters(
  overrides: Partial<HodgkinHuxleyParameters> = {},
): HodgkinHuxleyParameters {
  const parameters = { ...DEFAULT_HODGKIN_HUXLEY_PARAMETERS, ...overrides };
  const finiteFields: Array<keyof HodgkinHuxleyParameters> = [
    "initialVoltageMv",
    "capacitanceUfPerCm2",
    "sodiumConductanceMsPerCm2",
    "potassiumConductanceMsPerCm2",
    "leakConductanceMsPerCm2",
    "sodiumReversalMv",
    "potassiumReversalMv",
    "leakReversalMv",
    "temperatureC",
  ];

  for (const field of finiteFields) {
    if (!Number.isFinite(parameters[field])) {
      throw new Error(`${field} must be a finite number.`);
    }
  }
  if (parameters.capacitanceUfPerCm2 <= 0) {
    throw new Error("Membrane capacitance must be greater than zero.");
  }
  if (
    parameters.sodiumConductanceMsPerCm2 < 0 ||
    parameters.potassiumConductanceMsPerCm2 < 0 ||
    parameters.leakConductanceMsPerCm2 < 0
  ) {
    throw new Error("Maximum conductances cannot be negative.");
  }
  if (parameters.temperatureC < 0 || parameters.temperatureC > 40) {
    throw new Error("Temperature must be between 0 and 40 degrees Celsius.");
  }

  return parameters;
}

function mergeStimulus(
  overrides: Partial<HodgkinHuxleyStimulus> = {},
): HodgkinHuxleyStimulus {
  const stimulus = { ...DEFAULT_HODGKIN_HUXLEY_STIMULUS, ...overrides };
  if (
    !Number.isFinite(stimulus.amplitudeUaPerCm2) ||
    !Number.isFinite(stimulus.onsetMs) ||
    !Number.isFinite(stimulus.durationMs)
  ) {
    throw new Error("Stimulus amplitude, onset, and duration must be finite.");
  }
  if (stimulus.onsetMs < 0 || stimulus.durationMs < 0) {
    throw new Error("Stimulus onset and duration cannot be negative.");
  }
  return stimulus;
}

function steadyStateGates(voltageMv: number): HodgkinHuxleyState {
  const rates = getHodgkinHuxleyRates(voltageMv);
  const m = rates.alphaM / (rates.alphaM + rates.betaM);
  const h = rates.alphaH / (rates.alphaH + rates.betaH);
  const n = rates.alphaN / (rates.alphaN + rates.betaN);
  return {
    voltageMv,
    m,
    h,
    n,
  };
}

export function createHodgkinHuxleyInitialState(
  parameters: Partial<HodgkinHuxleyParameters> = {},
): HodgkinHuxleyState {
  const resolvedParameters = resolveHodgkinHuxleyParameters(parameters);
  return steadyStateGates(resolvedParameters.initialVoltageMv);
}

export function getHodgkinHuxleyIonicCurrents(
  state: HodgkinHuxleyState,
  parameters: HodgkinHuxleyParameters,
): HodgkinHuxleyIonicCurrents {
  return {
    sodiumCurrentUaPerCm2: parameters.sodiumConductanceMsPerCm2 *
      state.m ** 3 * state.h * (state.voltageMv - parameters.sodiumReversalMv),
    potassiumCurrentUaPerCm2: parameters.potassiumConductanceMsPerCm2 *
      state.n ** 4 * (state.voltageMv - parameters.potassiumReversalMv),
    leakCurrentUaPerCm2: parameters.leakConductanceMsPerCm2 *
      (state.voltageMv - parameters.leakReversalMv),
  };
}

function derivatives(
  state: HodgkinHuxleyState,
  appliedCurrentUaPerCm2: number,
  parameters: HodgkinHuxleyParameters,
  temperatureScale: number,
): HodgkinHuxleyState {
  const sodiumCurrent = parameters.sodiumConductanceMsPerCm2 *
    state.m ** 3 * state.h * (state.voltageMv - parameters.sodiumReversalMv);
  const potassiumCurrent = parameters.potassiumConductanceMsPerCm2 *
    state.n ** 4 * (state.voltageMv - parameters.potassiumReversalMv);
  const leakCurrent = parameters.leakConductanceMsPerCm2 *
    (state.voltageMv - parameters.leakReversalMv);
  const rates = getHodgkinHuxleyRates(state.voltageMv);

  return {
    voltageMv: (
      appliedCurrentUaPerCm2 - sodiumCurrent - potassiumCurrent - leakCurrent
    ) / parameters.capacitanceUfPerCm2,
    m: temperatureScale * (
      rates.alphaM * (1 - state.m) - rates.betaM * state.m
    ),
    h: temperatureScale * (
      rates.alphaH * (1 - state.h) - rates.betaH * state.h
    ),
    n: temperatureScale * (
      rates.alphaN * (1 - state.n) - rates.betaN * state.n
    ),
  };
}

export function getHodgkinHuxleyStateDerivative(
  state: HodgkinHuxleyState,
  appliedCurrentUaPerCm2: number,
  parameters: HodgkinHuxleyParameters,
): HodgkinHuxleyState {
  if (!Number.isFinite(appliedCurrentUaPerCm2)) {
    throw new Error("Applied current must be finite.");
  }
  const temperatureScale = 3 ** (
    (parameters.temperatureC - BASE_TEMPERATURE_C) / 10
  );
  return derivatives(state, appliedCurrentUaPerCm2, parameters, temperatureScale);
}

export function getHodgkinHuxleyMaxStepMs(
  requestedStepMs: number,
  parameters: HodgkinHuxleyParameters,
): number {
  const temperatureScale = 3 ** (
    (parameters.temperatureC - BASE_TEMPERATURE_C) / 10
  );
  return Math.min(requestedStepMs, BASE_MAX_STEP_MS / temperatureScale);
}

export function validateHodgkinHuxleyState(
  state: HodgkinHuxleyState,
  timeMs: number,
): void {
  if (
    !Number.isFinite(state.voltageMv) ||
    !Number.isFinite(state.m) ||
    !Number.isFinite(state.h) ||
    !Number.isFinite(state.n)
  ) {
    throw new Error(`Hodgkin-Huxley integration became non-finite at ${timeMs} ms.`);
  }
  if (
    state.m < 0 || state.m > 1 ||
    state.h < 0 || state.h > 1 ||
    state.n < 0 || state.n > 1
  ) {
    throw new Error(
      `Hodgkin-Huxley gating state left [0, 1] at ${timeMs} ms; reduce the time step or use a less extreme parameter set.`,
    );
  }
}

function addScaled(state: HodgkinHuxleyState, derivative: HodgkinHuxleyState, scale: number): HodgkinHuxleyState {
  return {
    voltageMv: state.voltageMv + derivative.voltageMv * scale,
    m: state.m + derivative.m * scale,
    h: state.h + derivative.h * scale,
    n: state.n + derivative.n * scale,
  };
}

function rk4Step(
  state: HodgkinHuxleyState,
  timeMs: number,
  stepMs: number,
  appliedCurrentUaPerCm2: number,
  parameters: HodgkinHuxleyParameters,
  temperatureScale: number,
): HodgkinHuxleyState {
  const k1 = derivatives(state, appliedCurrentUaPerCm2, parameters, temperatureScale);
  const k2 = derivatives(
    addScaled(state, k1, stepMs / 2),
    appliedCurrentUaPerCm2,
    parameters,
    temperatureScale,
  );
  const k3 = derivatives(
    addScaled(state, k2, stepMs / 2),
    appliedCurrentUaPerCm2,
    parameters,
    temperatureScale,
  );
  const k4 = derivatives(
    addScaled(state, k3, stepMs),
    appliedCurrentUaPerCm2,
    parameters,
    temperatureScale,
  );

  const next = {
    voltageMv: state.voltageMv + (stepMs / 6) * (
      k1.voltageMv + 2 * k2.voltageMv + 2 * k3.voltageMv + k4.voltageMv
    ),
    m: state.m + (stepMs / 6) * (k1.m + 2 * k2.m + 2 * k3.m + k4.m),
    h: state.h + (stepMs / 6) * (k1.h + 2 * k2.h + 2 * k3.h + k4.h),
    n: state.n + (stepMs / 6) * (k1.n + 2 * k2.n + 2 * k3.n + k4.n),
  };

  validateHodgkinHuxleyState(next, timeMs);
  return next;
}

function currentAt(
  timeMs: number,
  stimulus: HodgkinHuxleyStimulus,
): number {
  return timeMs >= stimulus.onsetMs &&
    timeMs < stimulus.onsetMs + stimulus.durationMs
    ? stimulus.amplitudeUaPerCm2
    : 0;
}

function sampleAt(
  timeMs: number,
  state: HodgkinHuxleyState,
  parameters: HodgkinHuxleyParameters,
  stimulus: HodgkinHuxleyStimulus,
): HodgkinHuxleySample {
  const ionicCurrents = getHodgkinHuxleyIonicCurrents(state, parameters);
  return {
    timeMs,
    voltageMv: state.voltageMv,
    ...ionicCurrents,
    stimulusCurrentUaPerCm2: currentAt(timeMs, stimulus),
    m: state.m,
    h: state.h,
    n: state.n,
  };
}

export function simulateHodgkinHuxley(
  options: HodgkinHuxleyOptions = {},
): HodgkinHuxleyResult {
  const durationMs = options.durationMs ?? 50;
  const requestedStepMs = options.dtMs ?? BASE_MAX_STEP_MS;
  const parameters = resolveHodgkinHuxleyParameters(options.parameters);
  const stimulus = mergeStimulus(options.stimulus);

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

  const temperatureScale = 3 ** (
    (parameters.temperatureC - BASE_TEMPERATURE_C) / 10
  );
  const maxStepMs = getHodgkinHuxleyMaxStepMs(requestedStepMs, parameters);
  if (Math.ceil(durationMs / maxStepMs) + 2 > MAX_INTEGRATION_STEPS) {
    throw new Error(
      `Simulation exceeds the ${MAX_INTEGRATION_STEPS} integration-step safety limit.`,
    );
  }

  let state = createHodgkinHuxleyInitialState(parameters);
  let timeMs = 0;
  const samples = [sampleAt(timeMs, state, parameters, stimulus)];
  const pulseEndMs = stimulus.onsetMs + stimulus.durationMs;

  while (timeMs < durationMs) {
    let nextTimeMs = Math.min(durationMs, timeMs + maxStepMs);
    for (const boundaryMs of [stimulus.onsetMs, pulseEndMs]) {
      if (boundaryMs > timeMs && boundaryMs < nextTimeMs) {
        nextTimeMs = boundaryMs;
      }
    }
    const stepMs = nextTimeMs - timeMs;
    const appliedCurrent = currentAt(timeMs + stepMs / 2, stimulus);
    state = rk4Step(
      state,
      timeMs,
      stepMs,
      appliedCurrent,
      parameters,
      temperatureScale,
    );
    timeMs = nextTimeMs;
    samples.push(sampleAt(timeMs, state, parameters, stimulus));
  }

  return { samples, durationMs, maxStepMs, parameters, stimulus };
}
