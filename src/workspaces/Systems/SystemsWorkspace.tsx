import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { NEURAL_SYSTEMS, NETWORK_EDGES, NETWORK_NODES } from "./systemsData";
import { findBrainRegion } from "../Brain/brainData";
import "./SystemsWorkspace.css";

interface SystemsWorkspaceProps {
  searchQuery: string;
  selectedSystemId: string;
  onSelectSystem: (systemId: string) => void;
  onFocusRegion: (regionId: string) => void;
}

export function SystemsWorkspace({
  searchQuery,
  selectedSystemId,
  onSelectSystem,
  onFocusRegion,
}: SystemsWorkspaceProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<[string, string] | null>(null);
  const selectedSystem = NEURAL_SYSTEMS.find((system) => system.id === selectedSystemId) ?? NEURAL_SYSTEMS[0];

  useEffect(() => {
    setSelectedRegionId(null);
    setSelectedConnection(null);
  }, [selectedSystemId]);

  const visibleSystems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query
      ? NEURAL_SYSTEMS.filter((system) =>
          [
            system.name,
            system.overview,
            ...system.functions,
            ...system.regions.map((id) => findBrainRegion(id)?.region.label ?? id),
            ...system.interactions.map((id) => NEURAL_SYSTEMS.find((item) => item.id === id)?.name ?? id),
          ].some((value) => value.toLowerCase().includes(query)),
        )
      : NEURAL_SYSTEMS;
  }, [searchQuery]);
  const nodeById = new Map(NETWORK_NODES.map((node) => [node.id, node]));
  const activeRegions = new Set(selectedSystem.regions);
  const selectedRegion = selectedRegionId ? findBrainRegion(selectedRegionId)?.region : null;
  const selectedRegionDetails = selectedRegion?.details;
  const selectedLink = selectedConnection
    ? NETWORK_EDGES.find(([from, to]) => from === selectedConnection[0] && to === selectedConnection[1])
    : null;
  const selectedLinkRegions = selectedLink
    ? selectedLink.flatMap((id) => {
        const region = findBrainRegion(id)?.region;
        return region?.details ? [region] : [];
      })
    : [];
  const sharedSystems = selectedLinkRegions[0]?.details?.systems.filter((system) =>
    selectedLinkRegions[1]?.details?.systems.includes(system),
  ) ?? [];

  const selectRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    setSelectedConnection(null);
  };

  return (
    <div className="systemsWorkspace">
      <header className="systemsHeader">
        <div>
          <div className="eyebrow"><span className="liveIndicator" /> NETWORK ATLAS <span className="eyebrowDivider">/</span> 08 SYSTEMS</div>
          <h1>Neural systems</h1>
          <p>Explore interacting circuits across the brain, from regions to distributed function.</p>
        </div>
        <div className="systemsHeaderMeta"><span className="metaDot" /> INTERACTIVE CONNECTOME <span className="metaSeparator">·</span> INTRODUCTORY MODEL</div>
      </header>

      <div className="systemsLayout">
        <aside className="systemIndex">
          <div className="sectionLabel">FUNCTIONAL SYSTEMS <span>08</span></div>
          <nav aria-label="Neural systems">
            {visibleSystems.map((system, index) => (
              <button
                type="button"
                key={system.id}
                className={`systemIndexItem ${selectedSystemId === system.id ? "selected" : ""}`}
                style={{ "--system-color": system.color } as CSSProperties}
                onClick={() => onSelectSystem(system.id)}
                aria-pressed={selectedSystemId === system.id}
              >
                <span className="systemIndexNumber">{String(index + 1).padStart(2, "0")}</span>
                <span className="systemIndexName">{system.name}</span>
                <span className="systemIndexMark" />
              </button>
            ))}
            {visibleSystems.length === 0 && <p className="systemsNoResults">No systems match this search.</p>}
          </nav>
          <div className="indexFootnote">System boundaries are approximate; networks overlap and reconfigure with task and state.</div>
        </aside>

        <main className="systemDetail">
          <div className="detailHeading">
            <div className="systemNumber" style={{ color: selectedSystem.color }}>{String(NEURAL_SYSTEMS.findIndex((item) => item.id === selectedSystemId) + 1).padStart(2, "0")}</div>
            <div>
              <span className="detailEyebrow" style={{ color: selectedSystem.color }}>FUNCTIONAL SYSTEM</span>
              <h2>{selectedSystem.name}</h2>
            </div>
            <span className="regionCount">{selectedSystem.regions.length} NODES IN VIEW</span>
          </div>

          <section className="networkPanel" aria-label={`${selectedSystem.name} network visualization`}>
            <div className="networkPanelTop">
              <span>REGIONAL INTERACTIONS</span>
              <span className="networkHint">SELECT A NODE TO OPEN ANATOMY <span>↗</span></span>
            </div>
            <svg className="networkDiagram" viewBox="0 0 760 430" role="img" aria-label="Interactive diagram of brain region relationships">
              <defs>
                <radialGradient id="networkGlow">
                  <stop offset="0%" stopColor={selectedSystem.color} stopOpacity=".17" />
                  <stop offset="100%" stopColor={selectedSystem.color} stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="378" cy="218" rx="300" ry="190" fill="url(#networkGlow)" />
              <path className="networkOutline" d="M75 199 C78 119 133 63 231 63 C283 30 380 47 438 70 C523 57 642 90 675 161 C710 235 650 309 609 341 C546 399 430 405 366 374 C283 408 188 375 146 341 C91 311 60 255 75 199Z" />
              {NETWORK_EDGES.map(([from, to]) => {
                const start = nodeById.get(from);
                const end = nodeById.get(to);
                if (!start || !end) return null;
                const isActive = activeRegions.has(from) && activeRegions.has(to);
                const isSelected = selectedConnection?.[0] === from && selectedConnection[1] === to;
                return (
                  <g
                    key={`${from}-${to}`}
                    className="networkConnection"
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect relationship between ${start.label} and ${end.label}`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedConnection([from, to]);
                      setSelectedRegionId(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedConnection([from, to]);
                        setSelectedRegionId(null);
                      }
                    }}
                  >
                    <line className="networkEdgeHit" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      className={`networkEdge ${isActive ? "edgeActive" : ""} ${isSelected ? "edgeSelected" : ""}`}
                      style={{ "--system-color": selectedSystem.color } as CSSProperties}
                    />
                  </g>
                );
              })}
              {NETWORK_NODES.map((node) => {
                const isActive = activeRegions.has(node.id);
                const isSelected = selectedRegionId === node.id;
                return (
                  <g
                    key={node.id}
                    className={`networkNode ${isActive ? "nodeActive" : ""} ${isSelected ? "nodeSelected" : ""}`}
                    transform={`translate(${node.x} ${node.y})`}
                    style={{ "--system-color": selectedSystem.color } as CSSProperties}
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect ${node.label}`}
                    aria-pressed={isSelected}
                    onClick={() => selectRegion(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectRegion(node.id);
                      }
                    }}
                  >
                    <circle className="nodeHalo" r={isActive || isSelected ? 27 : 20} />
                    <circle className="nodeCircle" r={isActive || isSelected ? 7 : 5} />
                    <text className="nodeLabel" y={isActive ? 25 : 21}>{node.label}</text>
                  </g>
                );
              })}
              <text className="networkOrientation" x="30" y="24">ANTERIOR</text>
              <text className="networkOrientation" x="665" y="24">POSTERIOR</text>
            </svg>
            <div className="networkLegend"><span className="legendNode" /> SYSTEM-ASSOCIATED REGION <span className="legendLine" /> SELECT A LINK OR REGION TO INSPECT IT</div>
          </section>

          <section className="networkSelectionPanel" aria-live="polite">
            {selectedRegion && selectedRegionDetails ? (
              <>
                <div className="networkSelectionCopy">
                  <span className="detailEyebrow">BRAIN REGION · {selectedRegion.abbr}</span>
                  <h3>{selectedRegion.label}</h3>
                  <p>{selectedRegionDetails.description}</p>
                  <span className="selectionMeta">{selectedRegionDetails.location}</span>
                </div>
                <div className="networkSelectionActions">
                  <div className="selectionConnections">
                    {selectedRegionDetails.connections.map((id) => {
                      const connection = findBrainRegion(id)?.region;
                      return connection ? (
                        <button type="button" className="connectionMiniChip" key={id} onClick={() => selectRegion(id)}>
                          {connection.label}
                        </button>
                      ) : null;
                    })}
                  </div>
                  <button type="button" className="openBrainButton" onClick={() => onFocusRegion(selectedRegion.id)}>
                    Open in Brain <span>↗</span>
                  </button>
                </div>
              </>
            ) : selectedLink ? (
              <>
                <div className="networkSelectionCopy">
                  <span className="detailEyebrow">MODELED RELATIONSHIP</span>
                  <h3>{selectedLinkRegions[0]?.label} <span>↔</span> {selectedLinkRegions[1]?.label}</h3>
                  <div className="linkRegionPair">
                    {selectedLinkRegions.map((region) => (
                      <p key={region.id}><b>{region.label}:</b> {region.details?.description}</p>
                    ))}
                  </div>
                  {sharedSystems.length > 0 && <span className="selectionMeta">Shared systems: {sharedSystems.join(" · ")}</span>}
                  <span className="selectionMeta">This line is a conceptual relationship, not a measured pathway or claim of direct structural connectivity.</span>
                </div>
                <div className="networkSelectionActions">
                  {selectedLinkRegions.map((region) => (
                    <button type="button" className="openBrainButton" key={region.id} onClick={() => onFocusRegion(region.id)}>
                      Open {region.label} in Brain <span>↗</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="networkSelectionCopy selectionEmpty">
                <span className="detailEyebrow">INTERACTIVE CONNECTOME</span>
                <p>Select any node to inspect its anatomy or a link to inspect the modeled relationship. Associated regions are highlighted for {selectedSystem.name.toLowerCase()}.</p>
              </div>
            )}
          </section>

          <section className="systemOverview">
            <div className="overviewColumn">
              <div className="sectionLabel">OVERVIEW</div>
              <p>{selectedSystem.overview}</p>
              <div className="cautionNote"><span>i</span> These systems are useful functional models, not isolated modules or one-region explanations of behavior.</div>
            </div>
            <div className="overviewColumn">
              <div className="sectionLabel">CORE FUNCTIONS</div>
              <ul className="systemFunctionList">{selectedSystem.functions.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </section>

          <section className="associatedRegions">
            <div className="sectionLabel">ASSOCIATED BRAIN REGIONS</div>
            <div className="linkedSystemRow">
              {selectedSystem.regions.map((id) => {
                const region = findBrainRegion(id)?.region;
                return region ? (
                  <button type="button" className="associatedRegion" key={id} onClick={() => onFocusRegion(id)}>
                    <span>{region.abbr}</span>{region.label}<span className="linkedArrow">↗</span>
                  </button>
                ) : null;
              })}
            </div>
          </section>

          <section className="linkedSystems">
            <div className="sectionLabel">INTERACTS WITH</div>
            <div className="linkedSystemRow">
              {selectedSystem.interactions.map((id) => {
                const system = NEURAL_SYSTEMS.find((item) => item.id === id);
                return system ? <button type="button" className="linkedSystem" key={id} onClick={() => onSelectSystem(id)}><span style={{ background: system.color }} />{system.name}<span className="linkedArrow">↗</span></button> : null;
              })}
            </div>
          </section>
          <div className="systemsFooter">NETWORK RELATIONSHIPS ARE SCHEMATIC · NOT A CONNECTIVITY MEASUREMENT</div>
        </main>
      </div>
    </div>
  );
}
