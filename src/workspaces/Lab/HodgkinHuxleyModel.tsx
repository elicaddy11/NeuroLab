import { useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_HODGKIN_HUXLEY_PARAMETERS,
  simulateHodgkinHuxley,
  type HodgkinHuxleySample,
} from "../../simulation/neuron/hodgkinHuxley";

const CHART_LEFT = 48;
const CHART_RIGHT = 736;
const CHART_TOP = 18;
const CHART_BOTTOM = 128;
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT;
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP;

function toPath(
  samples: HodgkinHuxleySample[],
  durationMs: number,
  readValue: (sample: HodgkinHuxleySample) => number,
  minValue: number,
  maxValue: number,
): string {
  const stride = Math.max(1, Math.ceil(samples.length / 900));
  const points = samples.filter((_, index) =>
    index % stride === 0 || index === samples.length - 1,
  );
  return points.map((sample, index) => {
    const x = CHART_LEFT + (sample.timeMs / durationMs) * CHART_WIDTH;
    const ratio = (readValue(sample) - minValue) / (maxValue - minValue);
    const y = CHART_BOTTOM - ratio * CHART_HEIGHT;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function spikeCount(samples: HodgkinHuxleySample[]): number {
  let count = 0;
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index - 1].voltageMv < 0 && samples[index].voltageMv >= 0) {
      count += 1;
    }
  }
  return count;
}

function TraceAxes({ durationMs, yLabels }: { durationMs: number; yLabels: string[] }) {
  return (
    <>
      {yLabels.map((label, index) => {
        const y = CHART_TOP + index * (CHART_HEIGHT / (yLabels.length - 1));
        return (
          <g key={`${label}-${index}`}>
            <line x1={CHART_LEFT} y1={y} x2={CHART_RIGHT} y2={y} className="hhGrid" />
            <text x={CHART_LEFT - 7} y={y + 3} className="hhAxisLabel" textAnchor="end">{label}</text>
          </g>
        );
      })}
      <line x1={CHART_LEFT} y1={CHART_BOTTOM} x2={CHART_RIGHT} y2={CHART_BOTTOM} className="hhAxis" />
      <text x={CHART_LEFT} y="151" className="hhAxisLabel">0 ms</text>
      <text x={CHART_RIGHT} y="151" className="hhAxisLabel" textAnchor="end">{durationMs} ms</text>
    </>
  );
}

export function HodgkinHuxleyModel() {
  const [stimulusCurrent, setStimulusCurrent] = useState(10);
  const [pulseDuration, setPulseDuration] = useState(1);
  const [sodiumPercent, setSodiumPercent] = useState(100);
  const [potassiumPercent, setPotassiumPercent] = useState(100);
  const [temperature, setTemperature] = useState(6.3);

  const result = useMemo(() => simulateHodgkinHuxley({
    durationMs: 50,
    parameters: {
      sodiumConductanceMsPerCm2:
        DEFAULT_HODGKIN_HUXLEY_PARAMETERS.sodiumConductanceMsPerCm2 * sodiumPercent / 100,
      potassiumConductanceMsPerCm2:
        DEFAULT_HODGKIN_HUXLEY_PARAMETERS.potassiumConductanceMsPerCm2 * potassiumPercent / 100,
      temperatureC: temperature,
    },
    stimulus: {
      amplitudeUaPerCm2: stimulusCurrent,
      onsetMs: 5,
      durationMs: pulseDuration,
    },
  }), [pulseDuration, potassiumPercent, sodiumPercent, stimulusCurrent, temperature]);

  const { peakVoltage, currentLimit } = result.samples.reduce((maximums, sample) => ({
    peakVoltage: Math.max(maximums.peakVoltage, sample.voltageMv),
    currentLimit: Math.max(
      maximums.currentLimit,
      Math.abs(sample.sodiumCurrentUaPerCm2),
      Math.abs(sample.potassiumCurrentUaPerCm2),
      Math.abs(sample.leakCurrentUaPerCm2),
      Math.abs(sample.stimulusCurrentUaPerCm2),
    ),
  }), { peakVoltage: Number.NEGATIVE_INFINITY, currentLimit: 20 });
  const paddedCurrentLimit = currentLimit * 1.05;

  return (
    <div className="hhModel">
      <div className="hhControls">
        <RangeControl
          label="STIMULUS CURRENT"
          value={stimulusCurrent}
          min={-5}
          max={20}
          step={0.5}
          display={`${stimulusCurrent.toFixed(1)} μA/cm²`}
          onChange={setStimulusCurrent}
        />
        <RangeControl
          label="PULSE DURATION"
          value={pulseDuration}
          min={0}
          max={10}
          step={0.1}
          display={`${pulseDuration.toFixed(1)} ms`}
          onChange={setPulseDuration}
        />
        <RangeControl
          label="MAXIMUM Na⁺ CONDUCTANCE"
          value={sodiumPercent}
          min={50}
          max={150}
          display={`${(result.parameters.sodiumConductanceMsPerCm2).toFixed(0)} mS/cm²`}
          onChange={setSodiumPercent}
        />
        <RangeControl
          label="MAXIMUM K⁺ CONDUCTANCE"
          value={potassiumPercent}
          min={50}
          max={150}
          display={`${result.parameters.potassiumConductanceMsPerCm2.toFixed(1)} mS/cm²`}
          onChange={setPotassiumPercent}
        />
        <RangeControl
          label="TEMPERATURE"
          value={temperature}
          min={4}
          max={12}
          step={0.1}
          display={`${temperature.toFixed(1)} °C`}
          onChange={setTemperature}
        />
        <div className="hhReadout">
          <span>COMPUTED OUTPUT</span>
          <strong>{peakVoltage.toFixed(1)}<small> mV peak</small></strong>
          <small>{spikeCount(result.samples)} rising zero-crossing(s)</small>
        </div>
      </div>

      <div className="hhTraces">
        <TraceChart
          title="MEMBRANE POTENTIAL"
          unit="mV"
          durationMs={result.durationMs}
          yLabels={["+60", "−20", "−100"]}
          path={toPath(result.samples, result.durationMs, ({ voltageMv }) => voltageMv, -100, 60)}
          color="hhVoltageTrace"
          ariaLabel="Computed membrane potential over time"
        />
        <TraceChart
          title="IONIC AND APPLIED CURRENTS"
          unit="μA/cm²"
          durationMs={result.durationMs}
          yLabels={[paddedCurrentLimit.toFixed(0), "0", `−${paddedCurrentLimit.toFixed(0)}`]}
          ariaLabel="Computed sodium, potassium, leak, and applied current traces"
        >
          <path d={toPath(result.samples, result.durationMs, ({ sodiumCurrentUaPerCm2 }) => sodiumCurrentUaPerCm2, -paddedCurrentLimit, paddedCurrentLimit)} className="hhSodiumTrace" />
          <path d={toPath(result.samples, result.durationMs, ({ potassiumCurrentUaPerCm2 }) => potassiumCurrentUaPerCm2, -paddedCurrentLimit, paddedCurrentLimit)} className="hhPotassiumTrace" />
          <path d={toPath(result.samples, result.durationMs, ({ leakCurrentUaPerCm2 }) => leakCurrentUaPerCm2, -paddedCurrentLimit, paddedCurrentLimit)} className="hhLeakTrace" />
          <path d={toPath(result.samples, result.durationMs, ({ stimulusCurrentUaPerCm2 }) => stimulusCurrentUaPerCm2, -paddedCurrentLimit, paddedCurrentLimit)} className="hhStimulusTrace" />
        </TraceChart>
        <TraceChart
          title="GATING VARIABLES"
          unit="fraction"
          durationMs={result.durationMs}
          yLabels={["1.0", "0.5", "0.0"]}
          ariaLabel="Computed sodium activation, sodium inactivation, and potassium activation gates"
        >
          <path d={toPath(result.samples, result.durationMs, ({ m }) => m, 0, 1)} className="hhMTrace" />
          <path d={toPath(result.samples, result.durationMs, ({ h }) => h, 0, 1)} className="hhHTrace" />
          <path d={toPath(result.samples, result.durationMs, ({ n }) => n, 0, 1)} className="hhNTrace" />
        </TraceChart>

        <div className="hhLegend" aria-label="Trace legend">
          <span><i className="hhVoltageTrace" />MEMBRANE VOLTAGE</span>
          <span><i className="hhSodiumTrace" />Na⁺ CURRENT</span>
          <span><i className="hhPotassiumTrace" />K⁺ CURRENT</span>
          <span><i className="hhLeakTrace" />LEAK CURRENT</span>
          <span><i className="hhStimulusTrace" />APPLIED CURRENT</span>
          <span><i className="hhMTrace" />m GATE</span>
          <span><i className="hhHTrace" />h GATE</span>
          <span><i className="hhNTrace" />n GATE</span>
        </div>
        <p className="hhModelMethod">
          Computed with fourth-order Runge-Kutta integration from the classic squid-axon equations. Gates start at steady state at −65 mV; temperature scales gating kinetics. Reversal potentials are +50, −77, and −54.3 mV (Na, K, leak).
          <span> References: <a href="https://doi.org/10.1113/jphysiol.1952.sp004764" target="_blank" rel="noreferrer">Hodgkin &amp; Huxley (1952)</a> · NEURON <a href="https://raw.githubusercontent.com/neuronsimulator/nrn/master/src/nrnoc/hh.mod" target="_blank" rel="noreferrer">squid equations</a> and <a href="https://raw.githubusercontent.com/neuronsimulator/nrn/master/share/examples/nrniv/nmodl/hh1.mod" target="_blank" rel="noreferrer">parameter example</a> (some references vary slightly in reversal potentials).</span>
        </p>
      </div>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="hhRangeControl">
      <span>{label}<b>{display}</b></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <small><span>{min}</span><span>{max}</span></small>
    </label>
  );
}

function TraceChart({
  title,
  unit,
  durationMs,
  yLabels,
  path,
  color,
  ariaLabel,
  children,
}: {
  title: string;
  unit: string;
  durationMs: number;
  yLabels: string[];
  path?: string;
  color?: string;
  ariaLabel: string;
  children?: ReactNode;
}) {
  return (
    <section className="hhChart">
      <div className="hhChartTitle">{title}<span>{unit}</span></div>
      <svg viewBox="0 0 760 160" role="img" aria-label={ariaLabel}>
        <TraceAxes durationMs={durationMs} yLabels={yLabels} />
        {path && <path d={path} className={color} />}
        {children}
      </svg>
    </section>
  );
}
