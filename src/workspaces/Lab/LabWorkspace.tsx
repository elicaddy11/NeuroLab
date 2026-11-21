import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { DownloadIcon, LabIcon, PauseIcon, PlayIcon, RotateIcon } from "../../components/icons";
import { ExperimentModels } from "./ExperimentModels";
import { EXPERIMENT_TEMPLATES, LEARNING_EXPERIMENTS } from "./experimentData";
import "./LabWorkspace.css";

const DURATIONS = [30, 60, 90];
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

interface LabWorkspaceProps {
  searchQuery: string;
  mode: "models" | "protocols";
  onModeChange: (mode: "models" | "protocols") => void;
  selectedExperimentId: string;
  onSelectExperiment: (id: string) => void;
  selectedProtocolId: string;
  onSelectProtocol: (id: string) => void;
}

export function LabWorkspace({
  searchQuery,
  mode,
  onModeChange,
  selectedExperimentId,
  onSelectExperiment,
  selectedProtocolId,
  onSelectProtocol,
}: LabWorkspaceProps) {
  const [duration, setDuration] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const selectedTemplate = EXPERIMENT_TEMPLATES.find((template) => template.id === selectedProtocolId) ?? EXPERIMENT_TEMPLATES[0];
  const visibleTemplates = EXPERIMENT_TEMPLATES.filter((template) =>
    [template.name, template.protocol, template.category, template.code, template.description]
      .some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase())),
  );
  const progress = Math.min(1, elapsed / duration);
  const activePhaseIndex = selectedTemplate.phases.findIndex((phase) => progress < phase.duration + selectedTemplate.phases.slice(0, selectedTemplate.phases.indexOf(phase)).reduce((sum, item) => sum + item.duration, 0));
  const activePhase = activePhaseIndex >= 0 ? selectedTemplate.phases[activePhaseIndex] : null;

  useEffect(() => {
    if (!isRunning || mode !== "protocols") return;
    const timer = window.setInterval(() => {
      setElapsed((current) => Math.min(duration, current + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [duration, isRunning, mode]);

  useEffect(() => {
    if (isRunning && mode === "protocols" && elapsed >= duration) {
      setIsRunning(false);
    }
  }, [duration, elapsed, isRunning, mode]);

  const chooseTemplate = (id: string) => {
    onSelectProtocol(id);
    setElapsed(0);
    setIsRunning(false);
  };

  const reset = () => {
    setElapsed(0);
    setIsRunning(false);
  };

  return (
    <div className="labWorkspace">
      <header className="labHeader">
        <div>
          <div className="labEyebrow"><span className="labEyebrowMark"><LabIcon size={13} /></span> EXPERIMENT DESIGN <span className="labEyebrowDivider">/</span> LOCAL PROTOCOLS</div>
          <h1>Experimental lab</h1>
          <p>Explore educational learning models or preview a local protocol timeline.</p>
        </div>
        <div className="localOnlyBadge"><span /> LOCAL PREVIEW ONLY</div>
      </header>

      <nav className="labModeTabs" aria-label="Lab workspace">
        <button type="button" className={mode === "models" ? "labModeActive" : ""} onClick={() => onModeChange("models")} aria-pressed={mode === "models"}>
          Learning models <span>{String(LEARNING_EXPERIMENTS.length).padStart(2, "0")}</span>
        </button>
        <button type="button" className={mode === "protocols" ? "labModeActive" : ""} onClick={() => onModeChange("protocols")} aria-pressed={mode === "protocols"}>
          Protocol preview <span>LOCAL</span>
        </button>
      </nav>

      {mode === "models" ? (
        <ExperimentModels
          searchQuery={searchQuery}
          selectedExperimentId={selectedExperimentId}
          onSelectExperiment={onSelectExperiment}
        />
      ) : (
      <div className="labLayout">
        <aside className="templatePanel">
          <div className="labSectionTitle">PROTOCOL LIBRARY <span>{String(EXPERIMENT_TEMPLATES.length).padStart(2, "0")}</span></div>
          <div className="templateList">
            {visibleTemplates.map((template, index) => (
              <button type="button" className={`templateCard ${selectedProtocolId === template.id ? "templateSelected" : ""}`} key={template.id} onClick={() => chooseTemplate(template.id)} aria-pressed={selectedProtocolId === template.id}>
                <span className="templateIndex">{String(index + 1).padStart(2, "0")}</span>
                <span className="templateCopy"><span className="templateCategory">{template.category} · {template.code}</span><strong>{template.name}</strong><span className="templateDescription">{template.description}</span></span>
                <span className="templateArrow">↗</span>
              </button>
            ))}
            {visibleTemplates.length === 0 && <p className="templateNoResults">No protocols match this search.</p>}
          </div>
          <div className="templateFootnote">Templates are illustrative examples, not validated experimental protocols.</div>
        </aside>

        <main className="protocolWorkspace">
          <div className="protocolHeading">
            <div className="protocolHeadingText"><div className="protocolCode">{selectedTemplate.code} <span>·</span> {selectedTemplate.category}</div><h2>{selectedTemplate.protocol}</h2><p>{selectedTemplate.description}</p></div>
            <button type="button" className="exportButton" disabled title="Export is unavailable in this prototype"><DownloadIcon size={14} /> EXPORT <span>SOON</span></button>
          </div>

          <section className="timelinePanel">
            <div className="timelineHeader"><span>PROTOCOL TIMELINE</span><span>{selectedTemplate.phases.length} PHASES <i /> {duration} S TOTAL</span></div>
            <div className="timelineTrack" aria-label="Protocol phases">
              {selectedTemplate.phases.map((phase, index) => {
                const start = selectedTemplate.phases.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
                const phaseProgress = Math.max(0, Math.min(1, (progress - start) / phase.duration));
                const phaseState = progress >= start + phase.duration ? "complete" : progress >= start ? "phaseCurrent" : "";
                return (
                  <div className={`timelinePhase ${phaseState}`} key={phase.label} style={{ flex: phase.duration, "--phase-color": phase.color } as CSSProperties}>
                    <div className="phaseBar"><span style={{ transform: `scaleX(${phaseProgress})` }} /></div>
                    <div className="phaseIndex">{String(index + 1).padStart(2, "0")}</div>
                    <div className="phaseName">{phase.label}</div>
                    <div className="phaseDescription">{phase.description}</div>
                    {phaseState === "phaseCurrent" && <div className="phaseNow">NOW</div>}
                  </div>
                );
              })}
            </div>
            <div className="timelineProgress"><span style={{ width: `${progress * 100}%` }} /></div>
          </section>

          <section className="runPanel">
            <div className="runStatus">
              <span className={`runPulse ${isRunning ? "running" : ""}`} />
              <div><span className="runStatusLabel">SESSION STATE</span><strong>{isRunning ? "Preview running" : progress >= 1 ? "Preview complete" : "Ready to preview"}</strong></div>
              <span className="runTimer">{formatTime(elapsed)} <i>/</i> {formatTime(duration)}</span>
            </div>
            <div className="runProgressTrack"><span style={{ width: `${progress * 100}%` }} /></div>
            <div className="runActions">
              <span className="runContext">{activePhase ? `CURRENT PHASE  /  ${activePhase.label.toUpperCase()}` : progress >= 1 ? "ALL PHASES COMPLETE" : "PROTOCOL CONFIGURED"}</span>
              <div>
                <button type="button" className="runReset" onClick={reset} disabled={elapsed === 0 && !isRunning} aria-label="Reset preview"><RotateIcon size={15} /></button>
                <button type="button" className={`runButton ${isRunning ? "pauseButton" : ""}`} onClick={() => {
                  if (progress >= 1) setElapsed(0);
                  setIsRunning((running) => !running);
                }}>
                  {isRunning ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                  {isRunning ? "PAUSE PREVIEW" : progress >= 1 ? "RESTART PREVIEW" : "RUN PREVIEW"}
                </button>
              </div>
            </div>
          </section>

          <section className="labParameters">
            <div className="labSectionTitle">SESSION PARAMETERS <span>CONFIGURATION</span></div>
            <div className="parameterGrid">
              <div className="parameterField"><label htmlFor="preview-duration">PREVIEW DURATION</label><select id="preview-duration" value={duration} onChange={(event) => { setDuration(Number(event.target.value)); setElapsed(0); setIsRunning(false); }}>{DURATIONS.map((seconds) => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></div>
              <div className="parameterField"><span>STIMULUS DELIVERY</span><div className="parameterValue">VISUAL TIMELINE ONLY <i>NO OUTPUT</i></div></div>
              <div className="parameterField"><span>DATA COLLECTION</span><div className="parameterValue">DISABLED <i>LOCAL ONLY</i></div></div>
            </div>
          </section>

          <div className="labDisclaimer"><span>i</span> This preview only advances a local timeline. No stimuli are presented, participant information is collected, or research data is recorded.</div>
        </main>
      </div>
      )}
    </div>
  );
}
