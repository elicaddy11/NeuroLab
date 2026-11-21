import { useMemo, useState } from "react";
import { LEARNING_EXPERIMENTS } from "./experimentData";
import "./ExperimentModels.css";

interface ExperimentModelsProps {
  searchQuery: string;
  selectedExperimentId: string;
  onSelectExperiment: (id: string) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ExperimentModels({
  searchQuery,
  selectedExperimentId,
  onSelectExperiment,
}: ExperimentModelsProps) {
  const [expectedOutcome, setExpectedOutcome] = useState(55);
  const [actualOutcome, setActualOutcome] = useState(78);
  const [learningRate, setLearningRate] = useState(0.35);
  const [encoding, setEncoding] = useState(72);
  const [consolidation, setConsolidation] = useState(68);
  const [retrievalDelay, setRetrievalDelay] = useState(7);
  const [stress, setStress] = useState(50);

  const visibleExperiments = LEARNING_EXPERIMENTS.filter((experiment) =>
    [experiment.name, experiment.description, ...experiment.keywords].some((value) =>
      value.toLowerCase().includes(searchQuery.trim().toLowerCase()),
    ),
  );
  const selectedExperiment = LEARNING_EXPERIMENTS.find((item) => item.id === selectedExperimentId)
    ?? LEARNING_EXPERIMENTS[0];
  const predictionError = actualOutcome - expectedOutcome;
  const updatedExpectation = clamp(expectedOutcome + learningRate * predictionError, 0, 100);
  const memoryStrength = Math.round(
    100 * (encoding / 100) * (0.35 + 0.65 * consolidation / 100) * Math.exp(-retrievalDelay / 35),
  );
  const attention = Math.round(Math.max(0, 100 - ((stress - 50) / 50) ** 2 * 100));
  const workingMemory = Math.round(Math.max(0, 100 - ((stress - 42) / 55) ** 2 * 100));

  const memoryCurve = useMemo(() => Array.from({ length: 41 }, (_, index) => {
    const delay = index * 1.5;
    const strength = 100 * (encoding / 100) * (0.35 + 0.65 * consolidation / 100) * Math.exp(-delay / 35);
    const x = 56 + (index / 40) * 650;
    const y = 244 - (strength / 100) * 185;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" "), [encoding, consolidation]);

  const stressCurves = useMemo(() => {
    const points = Array.from({ length: 51 }, (_, index) => {
      const level = index * 2;
      const x = 56 + (level / 100) * 650;
      const attentionScore = Math.max(0, 100 - ((level - 50) / 50) ** 2 * 100);
      const memoryScore = Math.max(0, 100 - ((level - 42) / 55) ** 2 * 100);
      const attentionY = 244 - (attentionScore / 100) * 185;
      const memoryY = 244 - (memoryScore / 100) * 185;
      return { x, attentionY, memoryY };
    });
    return {
      attention: points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.attentionY.toFixed(1)}`).join(" "),
      memory: points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.memoryY.toFixed(1)}`).join(" "),
    };
  }, []);

  const stressMarkerX = 56 + (stress / 100) * 650;
  const attentionMarkerY = 244 - (attention / 100) * 185;
  const memoryMarkerY = 244 - (workingMemory / 100) * 185;

  return (
    <div className="experimentModels">
      <header className="modelsHeader">
        <div>
          <div className="labEyebrow"><span className="modelPulse" /> LEARNING MODELS <span className="labEyebrowDivider">/</span> EDUCATIONAL</div>
          <h2>Explore a model</h2>
          <p>Change one or more inputs and observe how a simplified mathematical model responds.</p>
        </div>
        <div className="modelStatus">3 INTERACTIVE CONCEPTS <span>·</span> NO BIOLOGICAL DATA</div>
      </header>

      <nav className="experimentPicker" aria-label="Select an educational model">
        {visibleExperiments.map((experiment, index) => (
          <button
            type="button"
            className={`experimentPickerCard ${selectedExperimentId === experiment.id ? "experimentSelected" : ""}`}
            key={experiment.id}
            onClick={() => onSelectExperiment(experiment.id)}
            aria-pressed={selectedExperimentId === experiment.id}
          >
            <span className="experimentPickerIndex">{String(index + 1).padStart(2, "0")}</span>
            <strong>{experiment.name}</strong>
            <span>{experiment.description}</span>
          </button>
        ))}
        {visibleExperiments.length === 0 && <p className="experimentNoResults">No learning models match this search.</p>}
      </nav>

      <section className="experimentModelPanel" aria-live="polite">
        <div className="modelPanelHeader">
          <div>
            <span className="modelCode">CONCEPT MODEL · {selectedExperiment.id.toUpperCase().replace(/-/g, "_")}</span>
            <h3>{selectedExperiment.name}</h3>
            <p>{selectedExperiment.description}</p>
          </div>
          <span className="modelTag">EDUCATIONAL · NOT VALIDATED</span>
        </div>

        {selectedExperiment.id === "reward-learning" && (
          <div className="modelContent">
            <div className="modelControls">
              <RangeControl label="EXPECTED OUTCOME" value={expectedOutcome} min={0} max={100} onChange={setExpectedOutcome} />
              <RangeControl label="ACTUAL OUTCOME" value={actualOutcome} min={0} max={100} onChange={setActualOutcome} />
              <RangeControl label="LEARNING RATE" value={learningRate} min={0} max={1} step={0.01} display={`${learningRate.toFixed(2)} α`} onChange={setLearningRate} />
              <div className={`predictionError ${predictionError >= 0 ? "positiveError" : "negativeError"}`}>
                <span>PREDICTION ERROR</span>
                <strong>{predictionError > 0 ? "+" : ""}{predictionError}</strong>
                <small>δ = actual − expected</small>
              </div>
            </div>
            <div className="modelVisualization">
              <div className="modelGraphTitle">SIMPLIFIED VALUE UPDATE <span>0–100 ARBITRARY UNITS</span></div>
              <svg className="rewardGraph" viewBox="0 0 760 270" role="img" aria-label={`Expected outcome ${expectedOutcome}, actual outcome ${actualOutcome}, updated expectation ${updatedExpectation.toFixed(0)}`}>
                <line x1="140" y1="46" x2="140" y2="226" className="modelGraphAxis" />
                <line x1="140" y1="226" x2="690" y2="226" className="modelGraphAxis" />
                {[0, 25, 50, 75, 100].map((value) => {
                  const x = 140 + value * 5.5;
                  return <g key={value}><line x1={x} y1="46" x2={x} y2="226" className="modelGraphGrid" /><text x={x} y="246" className="modelGraphTick">{value}</text></g>;
                })}
                <text x="15" y="92" className="modelBarLabel">EXPECTED</text>
                <text x="15" y="148" className="modelBarLabel">OBSERVED</text>
                <text x="15" y="204" className="modelBarLabel">UPDATED VALUE</text>
                <rect x="140" y="72" width={expectedOutcome * 5.5} height="27" rx="2" className="expectationBar" />
                <rect x="140" y="128" width={actualOutcome * 5.5} height="27" rx="2" className="outcomeBar" />
                <rect x="140" y="184" width={updatedExpectation * 5.5} height="27" rx="2" className="updatedBar" />
                <text x={Math.min(675, 147 + expectedOutcome * 5.5)} y="90" className="modelBarValue">{expectedOutcome}</text>
                <text x={Math.min(675, 147 + actualOutcome * 5.5)} y="146" className="modelBarValue">{actualOutcome}</text>
                <text x={Math.min(675, 147 + updatedExpectation * 5.5)} y="202" className="modelBarValue">{updatedExpectation.toFixed(0)}</text>
              </svg>
              <div className="modelEquation">updated expectation = expected + learning rate × prediction error</div>
            </div>
          </div>
        )}

        {selectedExperiment.id === "memory-formation" && (
          <div className="modelContent">
            <div className="modelControls">
              <RangeControl label="ENCODING STRENGTH" value={encoding} min={0} max={100} display={`${encoding}%`} onChange={setEncoding} />
              <RangeControl label="CONSOLIDATION OPPORTUNITY" value={consolidation} min={0} max={100} display={`${consolidation}%`} onChange={setConsolidation} />
              <RangeControl label="RETRIEVAL DELAY" value={retrievalDelay} min={0} max={60} display={`${retrievalDelay} days`} onChange={setRetrievalDelay} />
              <div className="memoryReadout">
                <span>CONCEPTUAL RETENTION</span>
                <strong>{memoryStrength}<small>%</small></strong>
                <div className="memoryStrengthTrack"><span style={{ width: `${memoryStrength}%` }} /></div>
              </div>
            </div>
            <div className="modelVisualization">
              <div className="modelGraphTitle">SIMPLIFIED RETENTION CURVE <span>CONCEPTUAL · ARBITRARY SCALE</span></div>
              <svg className="modelCurveGraph" viewBox="0 0 760 270" role="img" aria-label={`Conceptual memory retention curve with current strength ${memoryStrength} percent at ${retrievalDelay} days`}>
                <GraphGrid />
                <path d={memoryCurve} className="memoryCurve" />
                <line x1={56 + (retrievalDelay / 60) * 650} y1="55" x2={56 + (retrievalDelay / 60) * 650} y2="244" className="modelCurrentMarker" />
                <circle cx={56 + (retrievalDelay / 60) * 650} cy={244 - (memoryStrength / 100) * 185} r="5" className="memoryCurrentPoint" />
                <text x="56" y="260" className="modelGraphTick">0 DAYS</text>
                <text x="706" y="260" className="modelGraphTick">60 DAYS</text>
                <text x="65" y="48" className="modelGraphTick">STRONGER TRACE</text>
                <text x="65" y="238" className="modelGraphTick">WEAKER TRACE</text>
              </svg>
              <div className="memoryStages">
                <div><i className="encodingStage" /><span>ENCODING</span><b>{encoding}%</b></div>
                <div><i className="consolidationStage" /><span>CONSOLIDATION</span><b>{consolidation}%</b></div>
                <div><i className="retrievalStage" /><span>RETRIEVAL</span><b>{retrievalDelay} d</b></div>
              </div>
            </div>
          </div>
        )}

        {selectedExperiment.id === "stress-performance" && (
          <div className="modelContent">
            <div className="modelControls">
              <RangeControl label="CONCEPTUAL STRESS LEVEL" value={stress} min={0} max={100} display={`${stress}%`} onChange={setStress} />
              <div className="performanceReadout"><span>ATTENTION</span><strong>{attention}<small>/100</small></strong><div><i style={{ width: `${attention}%` }} /></div></div>
              <div className="performanceReadout workingMemoryReadout"><span>WORKING MEMORY</span><strong>{workingMemory}<small>/100</small></strong><div><i style={{ width: `${workingMemory}%` }} /></div></div>
              <p className="stressReadoutNote">Peak levels are set by this toy model and are not an individual prediction.</p>
            </div>
            <div className="modelVisualization">
              <div className="modelGraphTitle">ILLUSTRATIVE INVERTED-U RESPONSE <span>NOT A CLINICAL MEASURE</span></div>
              <svg className="modelCurveGraph" viewBox="0 0 760 270" role="img" aria-label={`Stress level ${stress}; modeled attention ${attention} and working memory ${workingMemory} out of 100`}>
                <GraphGrid />
                <path d={stressCurves.attention} className="attentionCurve" />
                <path d={stressCurves.memory} className="workingMemoryCurve" />
                <line x1={stressMarkerX} y1="55" x2={stressMarkerX} y2="244" className="modelCurrentMarker" />
                <circle cx={stressMarkerX} cy={attentionMarkerY} r="5" className="attentionCurrentPoint" />
                <circle cx={stressMarkerX} cy={memoryMarkerY} r="5" className="memoryCurrentPoint" />
                <text x="56" y="260" className="modelGraphTick">LOW STRESS</text>
                <text x="706" y="260" className="modelGraphTick">HIGH STRESS</text>
                <text x="65" y="48" className="modelGraphTick">PERFORMANCE</text>
              </svg>
              <div className="modelLegend"><span><i className="attentionLegend" />ATTENTION</span><span><i className="memoryLegend" />WORKING MEMORY</span></div>
            </div>
          </div>
        )}

        <div className="modelDisclaimer">
          <span>i</span>
          <p>These are educational mathematical demonstrations with deliberately simplified equations. They are not validated biological simulations, measurements, clinical guidance, or individual predictions.</p>
        </div>
      </section>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  display = `${value}`,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="modelRangeControl">
      <span className="modelControlLabel">{label}<b>{display}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="modelRangeEnds"><small>{min}</small><small>{max}</small></span>
    </label>
  );
}

function GraphGrid() {
  return (
    <>
      {[0, 25, 50, 75, 100].map((value) => {
        const x = 56 + value * 6.5;
        const y = 244 - value * 1.85;
        return (
          <g key={value}>
            <line x1={x} y1="55" x2={x} y2="244" className="modelGraphGrid" />
            <line x1="56" y1={y} x2="706" y2={y} className="modelGraphGrid" />
          </g>
        );
      })}
      <line x1="56" y1="244" x2="706" y2="244" className="modelGraphAxis" />
      <line x1="56" y1="55" x2="56" y2="244" className="modelGraphAxis" />
    </>
  );
}
