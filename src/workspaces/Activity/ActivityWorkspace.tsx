import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ActivityIcon, PauseIcon, PlayIcon, RotateIcon } from "../../components/icons";
import { findBrainRegion } from "../Brain/brainData";
import { NEURAL_SYSTEMS, NETWORK_EDGES, NETWORK_NODES } from "../Systems/systemsData";
import "./ActivityWorkspace.css";

const CHANNELS = [
  { id: "fp1", name: "Fp1", location: "Left frontal", color: "#22d3ee", frequency: 7.5, phase: 0 },
  { id: "c3", name: "C3", location: "Left central", color: "#8b5cf6", frequency: 5.2, phase: 1.7 },
  { id: "p4", name: "P4", location: "Right parietal", color: "#f59e0b", frequency: 6.1, phase: 3 },
  { id: "o1", name: "O1", location: "Left occipital", color: "#34d399", frequency: 9.2, phase: 4.1 },
];

const WINDOWS = [2, 5, 10];
const POINT_COUNT = 150;
const CHART_WIDTH = 820;
const CHART_HEIGHT = 360;
const PLOT_LEFT = 52;
const PLOT_RIGHT = 796;

interface ActivityWorkspaceProps {
  searchQuery: string;
  onFocusRegion: (regionId: string) => void;
}

export function ActivityWorkspace({ searchQuery, onFocusRegion }: ActivityWorkspaceProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [phase, setPhase] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState("fp1");
  const [windowSeconds, setWindowSeconds] = useState(5);
  const [gain, setGain] = useState(1);
  const [activityIntensity, setActivityIntensity] = useState(62);
  const [selectedSystemId, setSelectedSystemId] = useState(NEURAL_SYSTEMS[0].id);
  const [selectedRegionId, setSelectedRegionId] = useState("prefrontal-cortex");

  const selectedSystem = NEURAL_SYSTEMS.find((system) => system.id === selectedSystemId) ?? NEURAL_SYSTEMS[0];
  const activeRegions = new Set(selectedSystem.regions);
  const selectedRegion = findBrainRegion(selectedRegionId)?.region;

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => setPhase((current) => current + 0.045), 50);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!selectedSystem.regions.includes(selectedRegionId)) {
      setSelectedRegionId(selectedSystem.regions[0]);
    }
  }, [selectedRegionId, selectedSystem]);

  const traces = useMemo(() => CHANNELS.map((channel, row) => {
    const centerY = 62 + row * 84;
    const points = Array.from({ length: POINT_COUNT }, (_, index) => {
      const progress = index / (POINT_COUNT - 1);
      const t = progress * windowSeconds * 2.4 + phase * channel.frequency;
      const signal =
        Math.sin(t * channel.frequency + channel.phase) * 0.48 +
        Math.sin(t * channel.frequency * 2.27 + channel.phase * 0.7) * 0.2 +
        Math.sin(t * 0.72 + channel.phase) * 0.22 +
        Math.sin(t * 5.1 + channel.phase * 1.3) * 0.07;
      const x = PLOT_LEFT + progress * (PLOT_RIGHT - PLOT_LEFT);
      const y = centerY - signal * 32 * gain * (0.65 + activityIntensity / 100);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return { ...channel, points, centerY, row };
  }), [phase, windowSeconds, gain, activityIntensity]);

  const activeChannel = CHANNELS.find((channel) => channel.id === selectedChannel) ?? CHANNELS[0];
  const visibleSystems = NEURAL_SYSTEMS.filter((system) =>
    [
      system.name,
      system.overview,
      ...system.functions,
      ...system.regions.map((id) => findBrainRegion(id)?.region.label ?? id),
    ].some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase())),
  );
  const visibleChannels = CHANNELS.filter((channel) =>
    [channel.name, channel.location].some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase())),
  );

  return (
    <div className="activityWorkspace">
      <header className="activityHeader">
        <div>
          <div className="eyebrow"><span className="liveIndicator" /> SIGNAL OBSERVATORY <span className="eyebrowDivider">/</span> DEMO STREAM</div>
          <h1>Neural activity</h1>
          <p>Explore a simulated multichannel signal in a live, responsive trace viewer.</p>
        </div>
        <div className="signalStatus"><span className={`signalStatusDot ${isRunning ? "isLive" : ""}`} />{isRunning ? "SIMULATION RUNNING" : "SIMULATION PAUSED"} <span className="signalStatusDisclaimer">· ILLUSTRATIVE MODEL</span></div>
      </header>

      <section className={`activityNetworkPanel ${isRunning ? "" : "activityPaused"}`} aria-label="Illustrative brain network activity">
        <div className="activityNetworkHeading">
          <div>
            <div className="activitySectionEyebrow">NETWORK ACTIVITY · CONCEPTUAL</div>
            <h2>{selectedSystem.name}</h2>
            <p>Animated connections and node intensity respond to the selected system and activity level.</p>
          </div>
          <div className="intensityReadout"><span className="activityPulseDot" /> ACTIVITY <b>{activityIntensity}%</b></div>
        </div>

        <nav className="activitySystemPicker" aria-label="Select an illustrative neural system">
          {visibleSystems.map((system) => (
            <button
              type="button"
              key={system.id}
              className={`activitySystemChip ${selectedSystemId === system.id ? "systemChipActive" : ""}`}
              style={{ "--system-color": system.color } as CSSProperties}
              onClick={() => setSelectedSystemId(system.id)}
              aria-pressed={selectedSystemId === system.id}
            >
              <span />{system.shortName}
            </button>
          ))}
          {visibleSystems.length === 0 && <span className="activityNoSystems">No systems match this search.</span>}
        </nav>

        <svg className="activityNetworkDiagram" viewBox="0 0 760 430" role="img" aria-label={`${selectedSystem.name} activity diagram. Nodes navigate to brain anatomy.`}>
          <defs>
            <radialGradient id="activityNetworkGlow">
              <stop offset="0%" stopColor={selectedSystem.color} stopOpacity=".15" />
              <stop offset="100%" stopColor={selectedSystem.color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="378" cy="218" rx="300" ry="190" fill="url(#activityNetworkGlow)" />
          <path className="activityNetworkOutline" d="M75 199 C78 119 133 63 231 63 C283 30 380 47 438 70 C523 57 642 90 675 161 C710 235 650 309 609 341 C546 399 430 405 366 374 C283 408 188 375 146 341 C91 311 60 255 75 199Z" />
          {NETWORK_EDGES.map(([from, to]) => {
            const start = NETWORK_NODES.find((node) => node.id === from);
            const end = NETWORK_NODES.find((node) => node.id === to);
            if (!start || !end) return null;
            const isActive = activeRegions.has(from) && activeRegions.has(to);
            return (
              <line
                key={`${from}-${to}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                className={`activityNetworkEdge ${isActive ? "activityEdgeActive" : ""}`}
                style={{
                  "--system-color": selectedSystem.color,
                  "--activity-speed": `${Math.max(0.7, 3.8 - activityIntensity * 0.028)}s`,
                  "--activity-opacity": 0.2 + activityIntensity / 145,
                } as CSSProperties}
              />
            );
          })}
          {NETWORK_NODES.map((node) => {
            const isActive = activeRegions.has(node.id);
            const isSelected = selectedRegionId === node.id;
            return (
              <g
                key={node.id}
                className={`activityNetworkNode ${isActive ? "activityNodeActive" : ""} ${isSelected ? "activityNodeSelected" : ""}`}
                transform={`translate(${node.x} ${node.y})`}
                style={{ "--system-color": selectedSystem.color } as CSSProperties}
                role="button"
                tabIndex={0}
                aria-label={`Select ${node.label} and open it in Brain`}
                aria-pressed={isSelected}
                onClick={() => setSelectedRegionId(node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedRegionId(node.id);
                  }
                }}
              >
                <circle className="activityNodeHalo" r={isActive ? 22 : 14} />
                <circle className="activityNodeCircle" r={isActive ? 6 : 4} />
                <text className="activityNodeLabel" y={isActive ? 21 : 18}>{node.label}</text>
              </g>
            );
          })}
          <text className="activityNetworkOrientation" x="30" y="24">ANTERIOR</text>
          <text className="activityNetworkOrientation" x="665" y="24">POSTERIOR</text>
        </svg>

        <div className="activityNetworkFooter">
          <div className="activityRegionFocus">
            <span className="activityRegionMarker" />
            <span><b>{selectedRegion?.label ?? "Select a region"}</b><small>{selectedRegion?.details?.location}</small></span>
          </div>
          <button type="button" className="activityOpenBrain" disabled={!selectedRegion} onClick={() => selectedRegion && onFocusRegion(selectedRegion.id)}>
            Open in Brain <span>↗</span>
          </button>
          <span className="activityGraphNote">SYNTHETIC ACTIVITY · NOT RECORDED DATA</span>
        </div>
      </section>

      <div className="activityContent">
        <section className="signalPanel">
          <div className="signalPanelHeader">
            <div className="signalPanelTitle"><ActivityIcon size={16} /><span>Multichannel trace</span><span className="demoBadge">SYNTHETIC DATA</span></div>
            <div className="signalHeaderActions">
              <button type="button" className={`activityIconButton ${isRunning ? "active" : ""}`} onClick={() => setIsRunning((running) => !running)} aria-label={isRunning ? "Pause simulation" : "Resume simulation"}>{isRunning ? <PauseIcon size={16} /> : <PlayIcon size={16} />}</button>
              <button type="button" className="activityIconButton" onClick={() => { setPhase(0); setIsRunning(false); }} aria-label="Reset simulation"><RotateIcon size={16} /></button>
            </div>
          </div>

          <div className="chartMeta">
            <span>CHANNELS <b>04</b></span><span>GAIN <b>{gain.toFixed(1)}×</b></span><span>WINDOW <b>{windowSeconds}.0 s</b></span><span className="chartMetaRight">SAMPLE RATE <b>250 Hz</b> <span className="metaApprox">DEMO ONLY</span></span>
          </div>

          <div className="signalChartWrap">
            <svg className="signalChart" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Four channels of synthetic, simulated neural activity">
              {[0, 1, 2, 3].map((row) => {
                const y = 62 + row * 84;
                return <g key={row}><line x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} className="signalBaseline" /><line x1={PLOT_LEFT} y1={y - 28} x2={PLOT_RIGHT} y2={y - 28} className="signalGrid" /><line x1={PLOT_LEFT} y1={y + 28} x2={PLOT_RIGHT} y2={y + 28} className="signalGrid" /></g>;
              })}
              {Array.from({ length: 9 }, (_, i) => {
                const x = PLOT_LEFT + i * (PLOT_RIGHT - PLOT_LEFT) / 8;
                return <g key={i}><line x1={x} y1="25" x2={x} y2="330" className="signalGrid" /><text x={x} y="349" className="signalTick">{((i / 8) * windowSeconds).toFixed(1)}s</text></g>;
              })}
              {traces.map((trace) => (
                <g key={trace.id} className={selectedChannel === trace.id ? "traceSelected" : "traceDimmed"}>
                  <text x="8" y={trace.centerY + 4} className="signalChannelLabel" fill={trace.color}>{trace.name}</text>
                  <polyline points={trace.points} fill="none" stroke={trace.color} className="signalTrace" />
                </g>
              ))}
              <line x1={PLOT_RIGHT - 8} y1="25" x2={PLOT_RIGHT - 8} y2="330" className="signalCursor" />
            </svg>
          </div>
          <div className="chartFooter"><span>TIME →</span><span>AMPLITUDE · ARBITRARY UNITS</span><span className="footerChannel"><i style={{ background: activeChannel.color }} />FOCUS: {activeChannel.name}</span></div>

          <div className="channelSelector">
            <div className="sectionLabel">ELECTRODE CHANNELS</div>
            <div className="channelList">
              {visibleChannels.map((channel) => (
                <button type="button" key={channel.id} className={`channelCard ${channel.id === selectedChannel ? "channelActive" : ""}`} onClick={() => setSelectedChannel(channel.id)} style={{ "--channel-color": channel.color } as CSSProperties} aria-pressed={channel.id === selectedChannel}>
                  <span className="channelColor" />
                  <span className="channelName">{channel.name}</span>
                  <span className="channelLocation">{channel.location}</span>
                  <span className="channelChevron">↗</span>
                </button>
              ))}
              {visibleChannels.length === 0 && <p className="channelNoResults">No channels match this search.</p>}
            </div>
          </div>
        </section>

        <aside className="activityControls">
          <section className="activitySidePanel">
            <div className="sidePanelTitle">DISPLAY CONTROLS <span>01</span></div>
            <div className="activityControlGroup">
              <div className="controlLabel">TIME WINDOW <span>SECONDS</span></div>
              <div className="segmentedControl">
                {WINDOWS.map((seconds) => <button type="button" key={seconds} className={windowSeconds === seconds ? "segmentActive" : ""} onClick={() => setWindowSeconds(seconds)} aria-pressed={windowSeconds === seconds}>{seconds}s</button>)}
              </div>
            </div>
            <div className="activityControlGroup">
              <div className="controlLabel">VERTICAL GAIN <span>{gain.toFixed(1)}×</span></div>
              <input aria-label="Vertical gain" type="range" min="0.5" max="1.8" step="0.1" value={gain} onChange={(event) => setGain(Number(event.target.value))} />
              <div className="rangeLabels"><span>0.5×</span><span>1.8×</span></div>
            </div>
            <div className="activityControlGroup">
              <div className="controlLabel">NETWORK ACTIVITY <span>{activityIntensity}%</span></div>
              <input aria-label="Illustrative activity intensity" type="range" min="10" max="100" step="1" value={activityIntensity} onChange={(event) => setActivityIntensity(Number(event.target.value))} />
              <div className="rangeLabels"><span>QUIET</span><span>HIGH</span></div>
            </div>
            <div className="activityControlGroup">
              <div className="controlLabel">TRACE EMPHASIS</div>
              <div className="traceFocus"><span className="traceFocusDot" style={{ background: activeChannel.color }} />{activeChannel.name}<span className="traceFocusLocation">{activeChannel.location}</span></div>
            </div>
          </section>

          <section className="activitySidePanel signalInfoPanel">
            <div className="sidePanelTitle">SIGNAL CONTEXT <span>02</span></div>
            <div className="infoMetric"><span>MODEL</span><b>DETERMINISTIC SYNTHESIS</b></div>
            <div className="infoMetric"><span>UNITS</span><b>ARBITRARY · NOT CALIBRATED</b></div>
            <div className="signalDisclaimer">This is an illustrative waveform generated in the browser. It is not a physiological recording, diagnostic signal, or research dataset.</div>
          </section>
          <div className="activitySideFoot">DISPLAY CONTROLS CHANGE THE SIMULATION VIEW ONLY</div>
        </aside>
      </div>
    </div>
  );
}
