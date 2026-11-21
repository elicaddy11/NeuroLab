import { useState } from "react";
import { ChevronRightIcon } from "../../components/icons";
import { BRAIN_REGIONS, type BrainRegion } from "./brainData";
import { BRAIN_MESH_REGION_BY_ID } from "./brainVisualizationData";

interface RegionTreeProps {
  selectedId: string | null;
  searchQuery: string;
  onSelect: (region: BrainRegion) => void;
}

function filterRegions(regions: BrainRegion[], query: string): BrainRegion[] {
  return regions.reduce<BrainRegion[]>((matches, region) => {
    const matchingChildren = filterRegions(region.children ?? [], query);
    const matchesQuery = [region.label, region.abbr, region.id].some((value) =>
      value.toLowerCase().includes(query),
    );

    if (matchesQuery) {
      matches.push(region);
    } else if (matchingChildren.length > 0) {
      matches.push({ ...region, children: matchingChildren });
    }

    return matches;
  }, []);
}

export function RegionTree({ selectedId, searchQuery, onSelect }: RegionTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["cerebral-cortex", "subcortical-structures", "posterior-fossa"]),
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const regions = normalizedQuery
    ? filterRegions(BRAIN_REGIONS, normalizedQuery)
    : BRAIN_REGIONS;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRegion = (region: BrainRegion) => {
    const hasChildren = Boolean(region.children?.length);
    const isOpen = hasChildren && (
      normalizedQuery.length > 0 || expanded.has(region.id)
    );
    const isActive = selectedId === region.id;
    const meshRegion = BRAIN_MESH_REGION_BY_ID.get(region.id);

    return (
      <div key={region.id} className="regionGroup">
        <button
          type="button"
          className={`regionRow ${isActive ? "active" : ""}`}
          aria-pressed={isActive}
          aria-expanded={hasChildren ? isOpen : undefined}
          onClick={() => {
            if (hasChildren) toggle(region.id);
            if (region.details) onSelect(region);
          }}
        >
          <ChevronRightIcon
            size={12}
            className={`regionChevron ${isOpen ? "open" : ""}`}
            style={{ opacity: hasChildren ? 1 : 0 }}
          />
          <span
            className="regionDot"
            style={{ color: meshRegion?.color ?? region.color ?? "var(--text-muted)" }}
          />
          <span className="regionLabel">{region.label}</span>
          {region.details && !meshRegion && (
            <span className="regionMeshStatus" title="No independent mesh segment in this atlas">
              INFO
            </span>
          )}
          <span className="regionAbbr">{region.abbr}</span>
        </button>
        {hasChildren && isOpen && (
          <div className="regionChildren">
            {region.children?.map((child) => renderRegion(child))}
          </div>
        )}
      </div>
    );
  };

  if (regions.length === 0) {
    return <p className="treeEmpty">No matching regions.</p>;
  }

  return <div className="regionList">{regions.map((region) => renderRegion(region))}</div>;
}
