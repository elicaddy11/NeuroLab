import { useState } from "react";
import { Panel, PanelSection } from "../../components/Panel/Panel";
import {
  PlusIcon,
  InfoIcon,
  TargetIcon,
  CrosshairIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateIcon,
  RulerIcon,
  EyeIcon,
  ShareIcon,
} from "../../components/icons";
import { BrainVisualization } from "./BrainVisualization";
import { RegionTree } from "./RegionTree";
import { SAMPLE_STRUCTURE, type BrainRegion } from "./brainData";
import "./BrainWorkspace.css";

type ViewPlane = "sagittal" | "coronal" | "axial";

export function BrainWorkspace() {
  const [selectedRegion, setSelectedRegion] = useState<BrainRegion | null>(null);
  const [viewPlane, setViewPlane] = useState<ViewPlane>("sagittal");

  const hasSelection = selectedRegion !== null;
  const structure = SAMPLE_STRUCTURE;

  return (
    <div className="brainWorkspace">
      {/* Left panel — exploration & navigation */}
      <div className="brainLeftPanel">
        <Panel
          title="Anatomical Tree"
          actions={
            <button className="panelAction" aria-label="Add region">
              <PlusIcon size={14} />
            </button>
          }
        >
          <PanelSection title="Region Hierarchy">
            <RegionTree
              selectedId={selectedRegion?.id ?? null}
              onSelect={setSelectedRegion}
            />
          </PanelSection>

          <div className="panelDivider" />

          <PanelSection title="View Plane">
            <div className="viewControls2D">
              {(["sagittal", "coronal", "axial"] as ViewPlane[]).map((plane) => (
                <button
                  key={plane}
                  className={`viewBtn ${viewPlane === plane ? "active" : ""}`}
                  onClick={() => setViewPlane(plane)}
                >
                  <span className="viewBtnFace" data-axis={plane[0].toUpperCase()} />
                  <span>{plane}</span>
                </button>
              ))}
            </div>
          </PanelSection>
        </Panel>
      </div>

      {/* Center viewport */}
      <div className="brainViewport">
        <div className="viewportCanvas">
          <div className="viewportGrid" />
          <div className="viewportAxes" />
          <div className="scanLine" />

          <div className="brainStage">
            <div className="brainVisual">
              <span className="brainRing r1" />
              <span className="brainRing r2" />
              <BrainVisualization />
            </div>
          </div>

          {/* HUD overlays */}
          <div className="viewportHud">
            <div className="hudCorner tl">
              <div className="hudLine">
                <span className="hudKey">VIEW</span>
                <span className="hudVal">{viewPlane.toUpperCase()}</span>
              </div>
              <div className="hudLine">
                <span className="hudKey">SLICE</span>
                <span className="hudVal">—</span>
              </div>
            </div>
            <div className="hudCorner tr">
              <div className="hudLine">
                <span className="hudKey">SCALE</span>
                <span className="hudVal">1:1.00</span>
              </div>
              <div className="hudLine">
                <span className="hudKey">FPS</span>
                <span className="hudVal">60</span>
              </div>
            </div>
            <div className="hudCorner bl">
              <div className="hudLine">
                <span className="hudKey">MODEL</span>
                <span className="hudVal">PLACEHOLDER</span>
              </div>
            </div>
            <div className="hudCorner br">
              <div className="hudLine">
                <span className="hudKey">REGIONS</span>
                <span className="hudVal">93</span>
              </div>
            </div>
          </div>

          {/* Floating viewport toolbar */}
          <div className="viewportToolbar">
            <button className="vtBtn" aria-label="Zoom in"><ZoomInIcon size={16} /></button>
            <button className="vtBtn" aria-label="Zoom out"><ZoomOutIcon size={16} /></button>
            <div className="vtDivider" />
            <button className="vtBtn" aria-label="Rotate"><RotateIcon size={16} /></button>
            <button className="vtBtn" aria-label="Ruler"><RulerIcon size={16} /></button>
            <button className="vtBtn" aria-label="Crosshair"><CrosshairIcon size={16} /></button>
            <div className="vtDivider" />
            <button className="vtBtn" aria-label="Visibility"><EyeIcon size={16} /></button>
            <span className="vtLabel">100%</span>
          </div>
        </div>
      </div>

      {/* Right panel — structure info */}
      <div className="brainRightPanel">
        <Panel
          title="Structure Inspector"
          actions={
            <>
              <button className="panelAction" aria-label="Pin"><TargetIcon size={13} /></button>
              <button className="panelAction" aria-label="Share"><ShareIcon size={13} /></button>
            </>
          }
        >
          {!hasSelection ? (
            <div className="structureEmpty">
              <div className="structureEmptyIcon">
                <InfoIcon size={22} />
              </div>
              <p className="structureEmptyText">
                Select a region from the anatomical tree to inspect its properties, connections, and functional data.
              </p>
            </div>
          ) : (
            <div className="fade-in">
              <PanelSection title="Overview">
                <div className="metaRow">
                  <span className="metaKey">NAME</span>
                  <span className="metaVal">{structure.name}</span>
                </div>
                <div className="metaRow">
                  <span className="metaKey">ABBR</span>
                  <span className="metaVal">{structure.abbr}</span>
                </div>
                <div className="metaRow">
                  <span className="metaKey">SYSTEM</span>
                  <span className="metaVal">{structure.system}</span>
                </div>
                <div className="metaRow">
                  <span className="metaKey">HEMISPHERE</span>
                  <span className="metaVal">{structure.hemisphere}</span>
                </div>
              </PanelSection>

              <div className="panelDivider" />

              <PanelSection title="Morphometry">
                <div className="metaRow">
                  <span className="metaKey">VOLUME</span>
                  <span className="metaVal">{structure.volume}</span>
                </div>
                <div className="metaRow">
                  <span className="metaKey">NEURONS</span>
                  <span className="metaVal">{structure.neurons}</span>
                </div>
              </PanelSection>

              <div className="panelDivider" />

              <PanelSection title="Stereotactic Coords">
                <div className="coordBox">
                  <div className="coordCell">
                    <span className="coordAxis">X</span>
                    <span className="coordValue">{structure.coords.x.toFixed(1)}</span>
                  </div>
                  <div className="coordCell">
                    <span className="coordAxis">Y</span>
                    <span className="coordValue">{structure.coords.y.toFixed(1)}</span>
                  </div>
                  <div className="coordCell">
                    <span className="coordAxis">Z</span>
                    <span className="coordValue">{structure.coords.z.toFixed(1)}</span>
                  </div>
                </div>
              </PanelSection>

              <div className="panelDivider" />

              <PanelSection title="Function">
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {structure.function}
                </p>
              </PanelSection>

              <div className="panelDivider" />

              <PanelSection title="Tags">
                <div className="tagList">
                  {structure.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </PanelSection>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
