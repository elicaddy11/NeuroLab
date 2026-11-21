import { useState } from "react";
import {
  DEFAULT_AMPA_RECEPTOR_PARAMETERS,
  DEFAULT_NETWORK_STIMULUS,
  DEFAULT_THREE_NEURON_CONNECTIONS,
  DEFAULT_THREE_NEURON_DEFINITIONS,
  simulateThreeNeuronNetwork,
  type NetworkCurrentPulse,
  type NetworkNeuronSample,
  type NetworkSynapseSample,
  type NetworkSynapseTrace,
  type ThreeNeuronNetworkResult,
} from "../../simulation/network/threeNeuronNetwork";
import "./NetworkModel.css";

const NETWORK_DURATION_MS = 40;
const DISPLAY_SAMPLE_LIMIT = 700;

export function NetworkModel() {
  const [stimulusAmplitude, setStimulusAmplitude] = useState(
    DEFAULT_NETWORK_STIMULUS.amplitudeUaPerCm2,
  );
  const [stimulusDuration, setStimulusDuration] = useState(
    DEFAULT_NETWORK_STIMULUS.durationMs,
  );
  const [ampaConductance, setAmpaConductance] = useState(
    DEFAULT_AMPA_RECEPTOR_PARAMETERS.maximumConductanceMsPerCm2,
  );
  const [result, setResult] = useState<ThreeNeuronNetworkResult | null>(null);

  const runNetwork = () => {
    const externalStimuli: NetworkCurrentPulse[] = [{
      ...DEFAULT_NETWORK_STIMULUS,
      amplitudeUaPerCm2: stimulusAmplitude,
      durationMs: stimulusDuration,
    }];
    const connections = DEFAULT_THREE_NEURON_CONNECTIONS.map((connection) => ({
      ...connection,
      receptorParameters: {
        maximumConductanceMsPerCm2: ampaConductance,
      },
    }));
    setResult(simulateThreeNeuronNetwork({
      durationMs: NETWORK_DURATION_MS,
      externalStimuli,
      connections,
    }));
  };

  const diagramNeurons = result?.neurons ?? DEFAULT_THREE_NEURON_DEFINITIONS.map(
    (definition) => ({
      ...definition,
      actionPotentialTimesMs: [] as number[],
      samples: [] as NetworkNeuronSample[],
    }),
  );
  const diagramSynapses = result?.synapses ?? DEFAULT_THREE_NEURON_CONNECTIONS.map(
    (connection) => ({
      ...connection,
      samples: [] as NetworkSynapseSample[],
    }),
  );

  return (
    <section className="networkModel" aria-label="Three-neuron communication network">
      <div className="networkControls">
        <div className="networkModelBadge">SIMULATED OUTPUT · NOT A BIOLOGICAL RECORDING</div>
        <RangeControl
          label="NEURON A STIMULUS"
          value={stimulusAmplitude}
          min={0}
          max={20}
          step={0.5}
          display={`${stimulusAmplitude.toFixed(1)} μA/cm²`}
          ends={["0", "20"]}
          onChange={setStimulusAmplitude}
        />
        <RangeControl
          label="STIMULUS DURATION"
          value={stimulusDuration}
          min={0.2}
          max={2}
          step={0.1}
          display={`${stimulusDuration.toFixed(1)} ms`}
          ends={["0.2", "2"]}
          onChange={setStimulusDuration}
        />
        <RangeControl
          label="AMPA MAX CONDUCTANCE DENSITY"
          value={ampaConductance}
          min={0}
          max={2}
          step={0.05}
          display={`${ampaConductance.toFixed(2)} mS/cm²`}
          ends={["0", "2"]}
          onChange={setAmpaConductance}
        />
        <div className="networkActions">
          <button type="button" className="networkRunButton" onClick={runNetwork}>
            RUN NETWORK
          </button>
          <button
            type="button"
            className="networkResetButton"
            onClick={() => setResult(null)}
            disabled={!result}
          >
            RESET
          </button>
        </div>
        <p className="networkControlNote">
          The pulse begins at {DEFAULT_NETWORK_STIMULUS.onsetMs} ms. Connections
          and other model parameters are recorded with each result; run again to
          apply changed controls.
        </p>
        {result && (
          <div className="networkRunSummary" aria-live="polite">
            <span>SHARED INTEGRATION STEP</span><strong>{result.dtMs} ms RK4</strong>
            <span>NETWORK DURATION</span><strong>{result.durationMs} ms</strong>
          </div>
        )}
      </div>

      <div className="networkOutput">
        <section className="networkDiagramPanel" aria-label="Network topology and simulated activity">
          <div className="networkSectionTitle">
            FEEDFORWARD TOPOLOGY <span>A → B → C</span>
          </div>
          <div className="networkDiagram">
            {diagramNeurons.map((neuron, index) => {
              const isFiring = neuron.actionPotentialTimesMs.length > 0;
              const firingTimes = neuron.actionPotentialTimesMs
                .map((timeMs) => `${timeMs.toFixed(2)} ms`)
                .join(" · ");
              return (
                <div className="networkDiagramCell" key={neuron.id}>
                  <div className={`networkNode ${isFiring ? "networkNodeFired" : ""}`}>
                    <span className="networkNodeId">{neuron.label}</span>
                    <strong>
                      {isFiring
                        ? `${neuron.actionPotentialTimesMs.length} ACTION POTENTIAL${neuron.actionPotentialTimesMs.length === 1 ? "" : "S"}`
                        : result ? "NO THRESHOLD CROSSING" : "READY"}
                    </strong>
                    <small>{isFiring ? `0 mV crossings · ${firingTimes}` : "independent HH state"}</small>
                  </div>
                  {index < diagramSynapses.length && (
                    <NetworkArrow synapse={diagramSynapses[index]} hasResult={Boolean(result)} />
                  )}
                </div>
              );
            })}
          </div>
          {result && (
            <NetworkChart<NetworkNeuronSample>
              title="MEMBRANE VOLTAGE · THREE INDEPENDENT HH STATES"
              units="mV · AP event = upward 0 mV crossing"
              samples={result.neurons[0].samples}
              series={result.neurons.map((neuron, index) => ({
                label: neuron.label,
                color: ["cyan", "violet", "green"][index % 3],
                value: (_, sampleIndex) =>
                  result.neurons[index].samples[sampleIndex].voltageMv,
              }))}
              min={-85}
              max={50}
              timeStepMs={result.dtMs}
            />
          )}
        </section>

        {result && (
          <div className="networkSynapseGrid">
            {result.synapses.map((synapse) => (
              <SynapsePanel key={synapse.id} synapse={synapse} result={result} />
            ))}
          </div>
        )}
        {!result && (
          <div className="networkEmptyState">
            Run the network to calculate all neuron and synapse states on one shared
            simulation clock. Downstream firing, if any, emerges from the coupled
            membrane equations and receptor currents.
          </div>
        )}
      </div>

      <div className="networkMethod">
        <strong>MODEL AND LIMITATIONS</strong>
        <p>
          Each neuron uses the existing single-compartment Hodgkin–Huxley squid-axon
          equations. The presynaptic compartment voltage is supplied directly to
          its terminal model with no propagation delay; this is a terminal-voltage
          abstraction, not spatial axonal conduction. Every neuron, calcium terminal,
          cleft, and receptor state advances synchronously with shared RK4 stages
          ({DEFAULT_NETWORK_STIMULUS.durationMs} ms stimulus by default; 0.005 ms step).
        </p>
        <p>
          Expected vesicle release is converted to glutamate concentration as
          d[Glu]/dt = release rate × molecules per vesicle ÷ (Avogadro number ×
          cleft volume) − [Glu]/τ. Defaults (3,000 molecules, 2×10⁻¹⁷ L cleft,
          τ=0.5 ms) are explicit illustrative assumptions, not universal measurements.
          The AMPA state follows ds/dt = kon[Glu](1−s) − koff·s, with
          g = gmax·s and outward-positive I = g(V−EAMPA), EAMPA=0 mV. Synaptic
          current is sign-converted when applied to the HH membrane equation.
          The effective two-state receptor omits multiple binding sites, desensitization,
          receptor subtypes, and postsynaptic morphology.
        </p>
        <p>
          Literature basis:{" "}
          <a href="https://doi.org/10.1113/jphysiol.1952.sp004764" target="_blank" rel="noreferrer">Hodgkin &amp; Huxley (1952)</a>
          {" · "}
          <a href="https://doi.org/10.3389/fnsyn.2020.00017" target="_blank" rel="noreferrer">Scarnati et al. (2020)</a>
          {" · "}
          <a href="https://doi.org/10.1126/science.1359647" target="_blank" rel="noreferrer">Clements et al. (1992)</a>
          {" · "}
          <a href="https://doi.org/10.1162/neco.1994.6.1.14" target="_blank" rel="noreferrer">Destexhe et al. (1994)</a>.
          These sources motivate component mechanisms; they do not validate this
          combined network or its default parameters.
        </p>
      </div>
    </section>
  );
}

function NetworkArrow({
  synapse,
  hasResult,
}: {
  synapse: Pick<NetworkSynapseTrace, "id" | "samples">;
  hasResult: boolean;
}) {
  const peakGlutamate = hasResult
    ? Math.max(...synapse.samples.map(({ cleftGlutamateUm }) => cleftGlutamateUm))
    : 0;
  const aboveDisplayThreshold = peakGlutamate > 1e-4;
  return (
    <div className={`networkArrow ${aboveDisplayThreshold ? "networkArrowActive" : ""}`}>
      <span aria-hidden="true">→</span>
      <small>{synapse.id}</small>
      <small>
        {hasResult
          ? (aboveDisplayThreshold ? "GLU > 0.0001 μM" : "GLU ≤ 0.0001 μM")
          : "DIRECTED SYNAPSE"}
      </small>
    </div>
  );
}

function SynapsePanel({
  synapse,
  result,
}: {
  synapse: NetworkSynapseTrace;
  result: ThreeNeuronNetworkResult;
}) {
  const peakCalcium = Math.max(...synapse.samples.map(({ intracellularCalciumUm }) =>
    intracellularCalciumUm,
  ));
  const peakGlutamate = Math.max(...synapse.samples.map(({ cleftGlutamateUm }) =>
    cleftGlutamateUm,
  ));
  const peakReleaseRate = Math.max(...synapse.samples.map(({ expectedVesicleReleaseRatePerMs }) =>
    expectedVesicleReleaseRatePerMs,
  ));
  const peakReleaseProbability = Math.max(...synapse.samples.map(({ releaseProbability }) =>
    releaseProbability,
  ));
  const peakChannelActivation = Math.max(...synapse.samples.map(({ calciumChannelActivation }) =>
    calciumChannelActivation,
  ));
  const peakCalciumCurrent = Math.max(...synapse.samples.map(({ calciumCurrentPa }) =>
    Math.abs(calciumCurrentPa),
  ));
  const peakSynapticCurrent = Math.max(...synapse.samples.map(({ postsynapticCurrentUaPerCm2 }) =>
    Math.abs(postsynapticCurrentUaPerCm2),
  ));
  const finalSample = synapse.samples[synapse.samples.length - 1];
  const currentExtent = Math.max(0.01, peakSynapticCurrent);

  return (
    <section className="networkSynapsePanel">
      <header className="networkSynapseHeader">
        <div>
          <span>{synapse.id}</span>
          <h4>{synapse.presynapticNeuronId} → {synapse.postsynapticNeuronId}</h4>
        </div>
        <span className="networkSynapseStatus">
          {peakGlutamate > 1e-4 ? "GLU > 0.0001 μM" : "GLU ≤ 0.0001 μM"}
        </span>
      </header>
      <div className="networkSynapseReadouts">
        <Readout label="PEAK |ICa|" value={`${peakCalciumCurrent.toFixed(3)} pA`} />
        <Readout label="PEAK CaV ACTIVATION" value={peakChannelActivation.toFixed(3)} />
        <Readout label="PEAK RELEASE PROBABILITY" value={peakReleaseProbability.toFixed(4)} />
        <Readout label="PEAK RELEASE RATE" value={`${peakReleaseRate.toFixed(3)} ves/ms`} />
        <Readout label="EXPECTED VESICLES" value={finalSample.expectedReleasedVesicles.toFixed(3)} />
        <Readout label="AVAILABLE POOL" value={finalSample.availableVesicles.toFixed(3)} />
      </div>
      <NetworkChart<NetworkSynapseSample>
        title="EXPECTED PRESYNAPTIC CALCIUM CURRENT"
        units="pA · inward negative"
        samples={synapse.samples}
        series={[{ label: "ICa", color: "cyan", value: (sample) => sample.calciumCurrentPa }]}
        min={-Math.max(0.001, peakCalciumCurrent)}
        max={Math.max(0.001, peakCalciumCurrent)}
        timeStepMs={result.dtMs}
      />
      <NetworkChart<NetworkSynapseSample>
        title="PRESYNAPTIC LOCAL CALCIUM"
        units={`μM · baseline ${synapse.chemicalParameters.baselineCalciumUm}`}
        samples={synapse.samples}
        series={[{ label: "Ca²⁺", color: "green", value: (sample) => sample.intracellularCalciumUm }]}
        min={0}
        max={Math.max(1, Math.ceil(peakCalcium / 5) * 5)}
        timeStepMs={result.dtMs}
      />
      <NetworkChart<NetworkSynapseSample>
        title="EXPECTED VESICLE RELEASE RATE"
        units="expected vesicles/ms"
        samples={synapse.samples}
        series={[{ label: "release rate", color: "rose", value: (sample) => sample.expectedVesicleReleaseRatePerMs }]}
        min={0}
        max={Math.max(0.01, Math.ceil(peakReleaseRate * 10) / 10)}
        timeStepMs={result.dtMs}
      />
      <NetworkChart<NetworkSynapseSample>
        title="CLEFT GLUTAMATE"
        units={`μM · peak ${peakGlutamate.toFixed(2)}`}
        samples={synapse.samples}
        series={[{ label: "glutamate", color: "amber", value: (sample) => sample.cleftGlutamateUm }]}
        min={0}
        max={Math.max(1, Math.ceil(peakGlutamate / 5) * 5)}
        timeStepMs={result.dtMs}
      />
      <NetworkChart<NetworkSynapseSample>
        title="AMPA OPEN FRACTION"
        units="fraction 0–1 · effective two-state kinetic model"
        samples={synapse.samples}
        series={[{ label: "open", color: "violet", value: (sample) => sample.ampaOpenFraction }]}
        min={0}
        max={1}
        timeStepMs={result.dtMs}
      />
      <NetworkChart<NetworkSynapseSample>
        title="POSTSYNAPTIC AMPA CURRENT DENSITY"
        units="μA/cm² · inward negative"
        samples={synapse.samples}
        series={[{ label: "AMPA current", color: "rose", value: (sample) => sample.postsynapticCurrentUaPerCm2 }]}
        min={-currentExtent}
        max={currentExtent}
        timeStepMs={result.dtMs}
      />
    </section>
  );
}

interface TimedSample {
  timeMs: number;
}

interface NetworkChartSeries<T extends TimedSample> {
  label: string;
  color: string;
  value: (sample: T, index: number) => number;
}

function NetworkChart<T extends TimedSample>({
  title,
  units,
  samples,
  series,
  min,
  max,
  timeStepMs,
}: {
  title: string;
  units: string;
  samples: readonly T[];
  series: NetworkChartSeries<T>[];
  min: number;
  max: number;
  timeStepMs: number;
}) {
  const left = 44;
  const right = 594;
  const top = 10;
  const bottom = 102;
  const durationMs = samples[samples.length - 1].timeMs;
  const stride = Math.max(1, Math.floor(samples.length / DISPLAY_SAMPLE_LIMIT));
  const indices = samples.map((_, index) => index).filter((index) => index % stride === 0);
  if (indices[indices.length - 1] !== samples.length - 1) indices.push(samples.length - 1);
  const x = (timeMs: number) => left + timeMs / durationMs * (right - left);
  const y = (value: number) => bottom - (value - min) / (max - min) * (bottom - top);

  return (
    <div className="networkChart">
      <div className="networkChartTitle">{title}<span>{units}</span></div>
      <svg viewBox="0 0 610 126" role="img" aria-label={`${title}; ${units}`}>
        {[0, 0.5, 1].map((fraction) => {
          const value = min + fraction * (max - min);
          const position = y(value);
          return (
            <g key={fraction}>
              <line x1={left} y1={position} x2={right} y2={position} className="networkChartGrid" />
              <text x={left - 5} y={position + 3} textAnchor="end" className="networkChartAxisLabel">
                {value.toFixed(Math.abs(value) < 1 ? 2 : 0)}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={top} x2={left} y2={bottom} className="networkChartAxis" />
        <line x1={left} y1={bottom} x2={right} y2={bottom} className="networkChartAxis" />
        {series.map((item) => {
          const path = indices.map((sampleIndex, index) => {
            const sample = samples[sampleIndex];
            return `${index === 0 ? "M" : "L"}${x(sample.timeMs).toFixed(1)},${y(item.value(sample, sampleIndex)).toFixed(1)}`;
          }).join(" ");
          return <path key={item.label} d={path} className={`networkChartTrace networkTrace-${item.color}`} />;
        })}
        {[0, 0.5, 1].map((fraction) => {
          const time = durationMs * fraction;
          const position = x(time);
          return (
            <g key={fraction}>
              <line x1={position} y1={top} x2={position} y2={bottom} className="networkChartGrid networkChartVerticalGrid" />
              <text x={position} y="118" textAnchor="middle" className="networkChartAxisLabel">{time.toFixed(0)}</text>
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="networkChartLegend">
          {series.map((item) => (
            <span key={item.label}><i className={`networkTrace-${item.color}`} />{item.label}</span>
          ))}
        </div>
      )}
      <span className="networkChartTime">TIME (ms) · Δt {timeStepMs}</span>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  ends,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  ends: [string, string];
  onChange: (value: number) => void;
}) {
  return (
    <label className="networkRangeControl">
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
  return <div className="networkReadout"><span>{label}</span><strong>{value}</strong></div>;
}
