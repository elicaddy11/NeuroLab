import { useState } from "react";
import {
  DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS,
  simulateChemicalSynapse,
  type ChemicalSynapseParameters,
  type ChemicalSynapseResult,
  type ChemicalSynapseSample,
} from "../../simulation/synapse/chemicalSynapse";
import { createHodgkinHuxleyTerminalInput } from "../../simulation/synapse/hodgkinHuxleyTerminalInput";
import {
  DEFAULT_HODGKIN_HUXLEY_STIMULUS,
  simulateHodgkinHuxley,
} from "../../simulation/neuron/hodgkinHuxley";
import "./ChemicalSynapseModel.css";

const EVENT_ONSET_MS = 5;
const HH_DURATION_MS = 30;
const SIMULATION_DURATION_MS = 35;
const DISPLAY_SAMPLE_LIMIT = 700;

export function ChemicalSynapseModel() {
  const [stimulusAmplitude, setStimulusAmplitude] = useState(10);
  const [stimulusDuration, setStimulusDuration] = useState(1);
  const [channelConductance, setChannelConductance] = useState(
    DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.singleChannelConductancePs,
  );
  const [activationThreshold, setActivationThreshold] = useState(
    DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.activationThresholdMv,
  );
  const [sensorDistance, setSensorDistance] = useState(
    DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.sensorDistanceNm,
  );
  const [clearanceTime, setClearanceTime] = useState(
    DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.calciumClearanceTimeConstantMs,
  );
  const [hillCoefficient, setHillCoefficient] = useState(
    DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.releaseHillCoefficient,
  );
  const [halfActivation, setHalfActivation] = useState(
    DEFAULT_CHEMICAL_SYNAPSE_PARAMETERS.releaseHalfActivationUm,
  );
  const [result, setResult] = useState<ChemicalSynapseResult | null>(null);
  const [peakTerminalVoltage, setPeakTerminalVoltage] = useState<number | null>(null);

  const runSimulation = () => {
    const neuron = simulateHodgkinHuxley({
      durationMs: HH_DURATION_MS,
      stimulus: {
        ...DEFAULT_HODGKIN_HUXLEY_STIMULUS,
        amplitudeUaPerCm2: stimulusAmplitude,
        durationMs: stimulusDuration,
      },
    });
    const event = createHodgkinHuxleyTerminalInput(neuron.samples, EVENT_ONSET_MS);
    const parameters: Partial<ChemicalSynapseParameters> = {
      singleChannelConductancePs: channelConductance,
      activationThresholdMv: activationThreshold,
      sensorDistanceNm: sensorDistance,
      calciumClearanceTimeConstantMs: clearanceTime,
      releaseHillCoefficient: hillCoefficient,
      releaseHalfActivationUm: halfActivation,
    };

    setResult(simulateChemicalSynapse({
      presynapticSpikeEvent: event,
      durationMs: SIMULATION_DURATION_MS,
      parameters,
    }));
    setPeakTerminalVoltage(Math.max(...event.waveform.map(({ voltageMv }) => voltageMv)));
  };

  const peakCalcium = result
    ? Math.max(...result.samples.map(({ localCalciumUm }) => localCalciumUm))
    : 0;
  const currentExtent = result
    ? Math.max(
      0.01,
      ...result.samples.map(({ calciumCurrentPa }) => Math.abs(calciumCurrentPa)),
    )
    : 0.01;
  const calciumAxisMax = Math.max(1, Math.ceil(peakCalcium / 5) * 5);
  const finalSample = result?.samples[result.samples.length - 1];
  const maxReleaseProbability = result
    ? Math.max(...result.samples.map(({ releaseProbability }) => releaseProbability))
    : 0;

  return (
    <section className="synapseModel" aria-label="Chemical synapse model">
      <div className="synapseControls">
        <RangeControl
          label="HH STIMULUS CURRENT"
          value={stimulusAmplitude}
          min={2}
          max={20}
          step={0.5}
          display={`${stimulusAmplitude.toFixed(1)} μA/cm²`}
          ends={["2", "20"]}
          onChange={setStimulusAmplitude}
        />
        <RangeControl
          label="HH STIMULUS DURATION"
          value={stimulusDuration}
          min={0.2}
          max={2}
          step={0.1}
          display={`${stimulusDuration.toFixed(1)} ms`}
          ends={["0.2", "2"]}
          onChange={setStimulusDuration}
        />
        <RangeControl
          label="SINGLE-CHANNEL CONDUCTANCE"
          value={channelConductance}
          min={1}
          max={5}
          step={0.1}
          display={`${channelConductance.toFixed(1)} pS`}
          ends={["1", "5"]}
          onChange={setChannelConductance}
        />
        <RangeControl
          label="CaV ACTIVATION THRESHOLD"
          value={activationThreshold}
          min={-50}
          max={-30}
          display={`${activationThreshold} mV`}
          ends={["−50", "−30"]}
          onChange={setActivationThreshold}
        />
        <RangeControl
          label="SENSOR DISTANCE"
          value={sensorDistance}
          min={20}
          max={100}
          step={5}
          display={`${sensorDistance} nm`}
          ends={["20", "100"]}
          onChange={setSensorDistance}
        />
        <RangeControl
          label="CALCIUM CLEARANCE τ"
          value={clearanceTime}
          min={0.2}
          max={5}
          step={0.1}
          display={`${clearanceTime.toFixed(1)} ms`}
          ends={["0.2", "5"]}
          onChange={setClearanceTime}
        />
        <RangeControl
          label="RELEASE HILL COEFFICIENT"
          value={hillCoefficient}
          min={1}
          max={5}
          step={0.1}
          display={hillCoefficient.toFixed(1)}
          ends={["1", "5"]}
          onChange={setHillCoefficient}
        />
        <RangeControl
          label="EFFECTIVE Ca HALF-ACTIVATION"
          value={halfActivation}
          min={2}
          max={20}
          step={0.5}
          display={`${halfActivation.toFixed(1)} μM`}
          ends={["2", "20"]}
          onChange={setHalfActivation}
        />
        <button type="button" className="synapseRunButton" onClick={runSimulation}>
          RUN EXPLICIT TERMINAL EVENT
        </button>
        {result && (
          <div className="synapseReadouts" aria-live="polite">
            <Readout label="PEAK TERMINAL VOLTAGE" value={`${peakTerminalVoltage?.toFixed(1)} mV`} />
            <Readout label="PEAK LOCAL Ca²⁺" value={`${peakCalcium.toFixed(2)} μM`} />
            <Readout label="MAX RELEASE PROBABILITY" value={maxReleaseProbability.toFixed(3)} />
            <Readout
              label="EXPECTED QUANTA RELEASED"
              value={finalSample?.expectedReleasedVesicles.toFixed(3) ?? "—"}
            />
          </div>
        )}
      </div>

      <div className="synapseTraces">
        {!result ? (
          <div className="synapseEmptyState">
            Adjust the inputs, then run the model to calculate a terminal voltage trace,
            Ca²⁺ current, local calcium, and expected vesicle fusion.
          </div>
        ) : (
          <>
            <SynapseChart
              title="IMPOSED TERMINAL VOLTAGE"
              units="mV"
              samples={result.samples}
              series={[{ label: "voltage", color: "voltage", value: (sample) => sample.terminalVoltageMv }]}
              min={-85}
              max={50}
              durationMs={result.durationMs}
            />
            <SynapseChart
              title="CaV ACTIVATION"
              units="fraction 0–1"
              samples={result.samples}
              series={[{ label: "activation", color: "activation", value: (sample) => sample.channelActivation }]}
              min={0}
              max={1}
              durationMs={result.durationMs}
            />
            <SynapseChart
              title="EXPECTED SINGLE-CHANNEL CALCIUM CURRENT"
              units={`pA · inward negative · max |I| ${currentExtent.toFixed(3)} pA`}
              samples={result.samples}
              series={[{ label: "current", color: "current", value: (sample) => sample.calciumCurrentPa }]}
              min={-currentExtent}
              max={currentExtent}
              durationMs={result.durationMs}
            />
            <SynapseChart
              title="LOCAL Ca²⁺ AT RELEASE SENSOR"
              units={`μM · baseline ${result.parameters.baselineCalciumUm} · peak ${peakCalcium.toFixed(2)}`}
              samples={result.samples}
              series={[{ label: "calcium", color: "calcium", value: (sample) => sample.localCalciumUm }]}
              min={0}
              max={calciumAxisMax}
              durationMs={result.durationMs}
            />
            <SynapseChart
              title="CALCIUM-DEPENDENT RELEASE PROBABILITY"
              units="fraction 0–1 · Hill approximation"
              samples={result.samples}
              series={[{ label: "probability", color: "probability", value: (sample) => sample.releaseProbability }]}
              min={0}
              max={1}
              durationMs={result.durationMs}
            />
            <SynapseChart
              title="EXPECTED VESICLE POOL"
              units="vesicle equivalents · deterministic expectation"
              samples={result.samples}
              series={[
                { label: "available", color: "available", value: (sample) => sample.availableVesicles },
                { label: "released", color: "released", value: (sample) => sample.expectedReleasedVesicles },
              ]}
              min={0}
              max={Math.max(1, result.parameters.initialVesiclePool)}
              durationMs={result.durationMs}
            />
          </>
        )}
        <p className="synapseModelMethod">
          The terminal waveform is calculated by the existing single-compartment Hodgkin–Huxley model
          and supplied explicitly to this synapse model; no axonal spatial propagation is simulated.
          A single CaV channel, point-source sensor calcium, first-order clearance, and deterministic
          Hill-based fusion are approximations, not a complete synapse or fitted universal parameter set.
          <span>
            Supporting basis:{" "}
            <a href="https://doi.org/10.3389/fnsyn.2020.00017" target="_blank" rel="noreferrer">
              Scarnati et al. (2020)
            </a>{" "}
            ·{" "}
            <a href="https://doi.org/10.1016/j.brainres.2011.05.011" target="_blank" rel="noreferrer">
              Matveev et al. (2011)
            </a>
          </span>
        </p>
      </div>
    </section>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  ends,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  ends: [string, string];
  onChange: (value: number) => void;
}) {
  return (
    <label className="synapseRangeControl">
      <span>{label}<b>{display}</b></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <small><span>{ends[0]}</span><span>{ends[1]}</span></small>
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return <div className="synapseReadout"><span>{label}</span><strong>{value}</strong></div>;
}

interface ChartSeries {
  label: string;
  color: string;
  value: (sample: ChemicalSynapseSample) => number;
}

function SynapseChart({
  title,
  units,
  samples,
  series,
  min,
  max,
  durationMs,
  ticks = [0, 0.5, 1],
}: {
  title: string;
  units: string;
  samples: readonly ChemicalSynapseSample[];
  series: ChartSeries[];
  min: number;
  max: number;
  durationMs: number;
  ticks?: number[];
}) {
  const left = 54;
  const right = 744;
  const top = 13;
  const bottom = 145;
  const step = Math.max(1, Math.floor(samples.length / DISPLAY_SAMPLE_LIMIT));
  const displaySamples = samples.filter((_, index) => index % step === 0);
  const finalSample = samples[samples.length - 1];
  if (displaySamples[displaySamples.length - 1] !== finalSample) displaySamples.push(finalSample);
  const x = (timeMs: number) => left + (timeMs / durationMs) * (right - left);
  const y = (value: number) => bottom - ((value - min) / (max - min)) * (bottom - top);
  const paths = series.map((item) => {
    const points = displaySamples.map((sample, index) =>
      `${index === 0 ? "M" : "L"}${x(sample.timeMs).toFixed(1)},${y(item.value(sample)).toFixed(1)}`,
    );
    return { ...item, path: points.join(" ") };
  });

  return (
    <div className="synapseChart">
      <div className="synapseChartTitle">{title}<span>{units}</span></div>
      <svg viewBox="0 0 760 174" role="img" aria-label={`${title}, ${units}`}>
        {ticks.map((tick) => {
          const value = min + tick * (max - min);
          const position = y(value);
          const label = value.toFixed(Math.abs(value) < 1 ? 2 : 0);
          return (
            <g key={tick}>
              <line x1={left} y1={position} x2={right} y2={position} className="synapseGrid" />
              <text x={left - 7} y={position + 3} textAnchor="end" className="synapseAxisLabel">{label}</text>
            </g>
          );
        })}
        <line x1={left} y1={top} x2={left} y2={bottom} className="synapseAxis" />
        <line x1={left} y1={bottom} x2={right} y2={bottom} className="synapseAxis" />
        {paths.map((item) => (
          <path key={item.label} d={item.path} className={`synapseTrace synapseTrace-${item.color}`} />
        ))}
        {[0, 0.5, 1].map((fraction) => {
          const time = durationMs * fraction;
          const position = x(time);
          return (
            <g key={fraction}>
              <line x1={position} y1={top} x2={position} y2={bottom} className="synapseGrid synapseVerticalGrid" />
              <text x={position} y="163" textAnchor="middle" className="synapseAxisLabel">{time.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="synapseLegend">
          {series.map((item) => <span key={item.label}><i className={`synapseTrace-${item.color}`} />{item.label}</span>)}
        </div>
      )}
      <span className="synapseTimeLabel">TIME (ms)</span>
    </div>
  );
}
