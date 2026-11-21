import { useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Panel, PanelSection } from "../../components/Panel/Panel";
import {
  InfoIcon,
  CrosshairIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateIcon,
  RulerIcon,
  EyeIcon,
} from "../../components/icons";
import { BrainVisualization } from "./BrainVisualization";
import { RegionTree } from "./RegionTree";
import { findBrainRegion, type BrainRegion } from "./brainData";
import {
  BRAIN_COLOR_LEGEND,
  BRAIN_DEEP_REGION_IDS,
  BRAIN_MESH_REGION_BY_ID,
} from "./brainVisualizationData";
import { findBrainRegionKnowledge } from "../../knowledge/adapters/brainKnowledgeAdapter";
import "./BrainWorkspace.css";

interface BrainWorkspaceProps {
  searchQuery: string;
  focusRegionId?: string | null;
  focusRegionSequence?: number;
}

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.8;

export function BrainWorkspace({
  searchQuery,
  focusRegionId,
  focusRegionSequence,
}: BrainWorkspaceProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [showModel, setShowModel] = useState(true);
  const [revealDeepStructures, setRevealDeepStructures] = useState(false);
  const [hoveredRegionLabel, setHoveredRegionLabel] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (!focusRegionId) return;
    setSelectedRegionId(focusRegionId);
    if (BRAIN_DEEP_REGION_IDS.has(focusRegionId)) {
      setRevealDeepStructures(true);
    }
  }, [focusRegionId, focusRegionSequence]);

  const selectedKnowledge = selectedRegionId
    ? findBrainRegionKnowledge(selectedRegionId)
    : undefined;
  const selectedRegion = selectedKnowledge?.region ?? null;
  const selectedMeshRegion = selectedRegionId
    ? BRAIN_MESH_REGION_BY_ID.get(selectedRegionId)
    : undefined;
  const details = selectedKnowledge?.legacyDetails;
  const selectedName = selectedKnowledge?.entity.names.find(
    ({ kind }) => kind === "preferred",
  )?.value;
  const claimText = (predicate: string) => {
    const value = selectedKnowledge?.claims.find((claim) => claim.predicate === predicate)?.value;
    return typeof value === "string" ? value : undefined;
  };
  const beginnerExplanation = claimText("beginner-explanation");
  const advancedExplanation = claimText("advanced-explanation");
  const functionTexts = selectedKnowledge?.claims.flatMap((claim) =>
    claim.predicate === "function" && typeof claim.value === "string"
      ? [claim.value]
      : [],
  ) ?? [];
  const cognitiveClaims = selectedKnowledge?.claims.filter(
    (claim) => claim.predicate === "cognitive-contribution" && typeof claim.value === "string",
  ) ?? [];
  const supportedRelatedIds = selectedKnowledge?.relationships.length
    ? selectedKnowledge.relationships.map(({ objectId }) => objectId)
    : undefined;

  const changeZoom = (amount: number) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (amount > 0) controls.dollyOut(1.2);
    else controls.dollyIn(1.2);
    setZoom(Number(Math.max(0.65, Math.min(1.8, 5.2 / controls.getDistance())).toFixed(2)));
  };

  const selectRegion = (region: BrainRegion) => {
    setSelectedRegionId(region.id);
    if (BRAIN_DEEP_REGION_IDS.has(region.id)) {
      setRevealDeepStructures(true);
    }
  };
  const setCameraView = (view: "lateral" | "anterior" | "superior") => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.up.set(0, 1, 0);
    if (view === "lateral") controls.object.position.set(5.2, 0.14, 0);
    else if (view === "anterior") controls.object.position.set(0, 0.14, 5.2);
    else {
      controls.object.position.set(0, 5.2, 0);
      controls.object.up.set(0, 0, -1);
    }
    controls.target.set(0, 0, 0);
    controls.update();
  };
  const resetView = () => {
    setZoom(1);
    controlsRef.current?.object.up.set(0, 1, 0);
    controlsRef.current?.reset();
  };

  return (
    <div className="brainWorkspace">
      <aside className="brainLeftPanel">
        <Panel title="Anatomy index" className="workspacePanel">
          <PanelSection title="Brain structures">
            <RegionTree
              selectedId={selectedRegionId}
              searchQuery={searchQuery}
              onSelect={selectRegion}
            />
            <p className="dataNotice">
              Drag to rotate · scroll to zoom · right-drag to pan. Lobe groups include selected gyri only.
            </p>
          </PanelSection>
          <div className="panelDivider" />
          <PanelSection title="View orientation">
            <div className="orientationCard">
              <span className="orientationAxis axis-front">A</span>
              <span className="orientationAxis axis-back">P</span>
              <span className="orientationAxis axis-left">L</span>
              <span className="orientationAxis axis-right">R</span>
              <span className="orientationCenter">●</span>
            </div>
            <div className="orientationCaption">ANTERIOR · POSTERIOR · L/R</div>
            <div className="brainViewPresets" role="group" aria-label="Preset viewing angles">
              <button type="button" onClick={() => setCameraView("lateral")}>Lateral</button>
              <button type="button" onClick={() => setCameraView("anterior")}>Anterior</button>
              <button type="button" onClick={() => setCameraView("superior")}>Superior</button>
            </div>
          </PanelSection>
          <div className="panelDivider" />
          <PanelSection title="Anatomy color key">
            <div className="locatorLegend">
              {BRAIN_COLOR_LEGEND.map(({ id, label, color }) => (
                <div className="locatorLegendItem" key={id}>
                  <span className="locatorLegendSwatch" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="locatorLegendNote">
              Colors follow source mesh segments. Lobe colors group selected gyri, not complete lobe masks.
            </p>
          </PanelSection>
        </Panel>
      </aside>

      <section className="brainViewport" aria-label="Interactive 3D brain viewport">
        <div className="viewportCanvas">
          <div className="viewportGrid" />
          <div className={`viewportAxes ${showCrosshair ? "visible" : ""}`} aria-hidden="true" />
          {showModel && (
            <div className="brainStage">
              <BrainVisualization
                selectedRegionId={selectedRegionId}
                revealDeepStructures={revealDeepStructures}
                onSelectRegion={selectRegion}
                onHoverRegion={setHoveredRegionLabel}
                onZoomChange={(distance) => setZoom(Number(Math.max(0.65, Math.min(1.8, 5.2 / distance)).toFixed(2)))}
                controlsRef={controlsRef}
              />
            </div>
          )}

          <div className="viewportHud" aria-live="polite">
            <div className="hudCorner tl">
              <div className="hudLine"><span className="hudKey">MODEL</span><span className="hudVal">BODYPARTS3D 4.0</span></div>
              <div className="hudLine"><span className="hudKey">STATUS</span><span className="hudVal hudValMuted">SEGMENTED MESHES</span></div>
            </div>
            <div className="hudCorner tr">
              <div className="hudLine"><span className="hudKey">ZOOM</span><span className="hudVal">{Math.round(zoom * 100)}%</span></div>
            </div>
            <div className="hudCorner br">
              <div className="hudLine"><span className="hudKey">REGION</span><span className="hudVal">{selectedRegion?.abbr ?? "NONE"}</span></div>
            </div>
            {hoveredRegionLabel && <div className="viewportHoverLabel">{hoveredRegionLabel}</div>}
            <div className="hudBottomNote">CORTICAL LOBE COLORS GROUP SELECTED GYRI · PREFRONTAL CORTEX NOT SEGMENTED</div>
          </div>

          <div className="viewportToolbar" role="group" aria-label="3D brain controls">
            <button type="button" className="vtBtn" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => changeZoom(-0.1)}><ZoomOutIcon size={16} /></button>
            <button type="button" className="vtBtn" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => changeZoom(0.1)}><ZoomInIcon size={16} /></button>
            <div className="vtDivider" />
            <button type="button" className="vtBtn" aria-label="Reset camera" title="Reset camera" onClick={resetView}><RotateIcon size={16} /></button>
            <button
              type="button"
              className={`vtBtn vtDeepBtn ${revealDeepStructures ? "active" : ""}`}
              aria-label={revealDeepStructures ? "Hide deep structures" : "Reveal deep structures"}
              aria-pressed={revealDeepStructures}
              title={revealDeepStructures ? "Hide deep structures" : "Reveal deep structures"}
              onClick={() => setRevealDeepStructures((current) => !current)}
            >
              DEEP
            </button>
            <button type="button" className={`vtBtn ${showCrosshair ? "active" : ""}`} aria-label="Toggle crosshair" aria-pressed={showCrosshair} onClick={() => setShowCrosshair((current) => !current)}><CrosshairIcon size={16} /></button>
            <button type="button" className="vtBtn" aria-label="Measurement unavailable: no calibrated anatomical model" title="Unavailable: no calibrated anatomical model." disabled><RulerIcon size={16} /></button>
            <div className="vtDivider" />
            <button
              type="button"
              className={`vtBtn ${showModel ? "" : "active"}`}
              aria-label={showModel ? "Hide model" : "Show model"}
              aria-pressed={!showModel}
              onClick={() => {
                if (!showModel) setZoom(1);
                setShowModel((current) => !current);
              }}
            >
              <EyeIcon size={16} />
            </button>
            <span className="vtLabel">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </section>

      <aside className="brainRightPanel">
        <Panel title="Structure profile" className="workspacePanel">
          {!details || !selectedRegion ? (
            <div className="structureEmpty">
              <div className="structureEmptyIcon"><InfoIcon size={22} /></div>
              <p className="structureEmptyText">Choose one of 12 anatomy entries. Prefrontal cortex is information-only in this mesh.</p>
            </div>
          ) : (
            <div className="fade-in">
              <div className="structureProfile">
                <span className="structureEyebrow mono">{selectedRegion.abbr} · INTRODUCTORY OVERVIEW</span>
                <h2>{selectedName ?? selectedRegion.label}</h2>
                <p>{beginnerExplanation ?? details.description}</p>
                {beginnerExplanation && (
                  <p className="profileCopy">
                    Simplified · source-checked · not expert-reviewed
                  </p>
                )}
              </div>
              <div className={`meshCoverageNote ${selectedMeshRegion ? "" : "unavailable"}`}>
                <strong>
                  {selectedMeshRegion ? "SOURCE SEGMENT PRESENT" : "INFORMATION ONLY · NO SEPARATE MESH"}
                </strong>
                <p>
                  {selectedMeshRegion?.coverageNote ??
                    "BodyParts3D 4.0 does not include a dedicated prefrontal-cortex segment in this model."}
                </p>
                {selectedMeshRegion && (
                  <span>{selectedMeshRegion.sourceComponents.join(" · ")}</span>
                )}
              </div>
              <div className="panelDivider" />
              <PanelSection title="Anatomical location">
                <p className="profileCopy">{details.location}</p>
              </PanelSection>
              {advancedExplanation && (
                <>
                  <div className="panelDivider" />
                  <PanelSection title="Advanced explanation">
                    <p className="profileCopy">{advancedExplanation}</p>
                    <p className="profileCopy">
                      Established · source-checked · not expert-reviewed
                    </p>
                  </PanelSection>
                </>
              )}
              <div className="panelDivider" />
              <PanelSection title="Major functions">
                <ul className="profileList">
                  {(functionTexts.length > 0 ? functionTexts : details.functions)
                    .map((item) => <li key={item}>{item}</li>)}
                </ul>
                {functionTexts.length > 0 && (
                  <p className="profileCopy">
                    Established · source-checked · not expert-reviewed
                  </p>
                )}
              </PanelSection>
              {cognitiveClaims.length > 0 && (
                <>
                  <div className="panelDivider" />
                  <PanelSection title="Cognitive contributions">
                    <ul className="profileList">
                      {cognitiveClaims.map((claim) => (
                        <li key={claim.id}>
                          {claim.value}
                          <span className="profileCopy"> Established · source-checked · not expert-reviewed</span>
                        </li>
                      ))}
                    </ul>
                  </PanelSection>
                </>
              )}
              <div className="panelDivider" />
              <PanelSection title="Connected structures">
                <div className="connectedList">
                  {(supportedRelatedIds ?? details.connections).map((id) => {
                    const connection = findBrainRegion(id)?.region;
                    if (!connection) return null;
                    return <button type="button" className="connectionChip" key={id} onClick={() => selectRegion(connection)}>{connection.label}<span>↗</span></button>;
                  })}
                </div>
                {supportedRelatedIds && supportedRelatedIds.length > 0 && (
                  <p className="profileCopy">
                    Established · source-checked · not expert-reviewed. Pathway-level relationships; not a claim of direct projection between every part of these lobes.
                  </p>
                )}
              </PanelSection>
              <div className="panelDivider" />
              <PanelSection title="Associated systems">
                <div className="tagList">{details.systems.map((system) => <span className="tag" key={system}>{system}</span>)}</div>
              </PanelSection>
              {selectedKnowledge?.sources.length ? (
                <>
                  <div className="panelDivider" />
                  <PanelSection title="Scientific sources">
                    <ul className="profileList">
                      {selectedKnowledge.sources.map((source) => {
                        const href = source.url ?? (source.doi
                          ? `https://doi.org/${source.doi}`
                          : undefined);
                        return (
                          <li key={source.id}>
                            {source.authors?.join(", ")} ({source.year}). {source.title}.{" "}
                            {source.containerTitle} {source.volume}
                            {source.issue ? `(${source.issue})` : ""}{source.pages ? `:${source.pages}` : ""}.{" "}
                            {href && (
                              <a href={href} target="_blank" rel="noreferrer">
                                {source.doi ?? href}
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </PanelSection>
                </>
              ) : null}
            </div>
          )}
        </Panel>
      </aside>
    </div>
  );
}
