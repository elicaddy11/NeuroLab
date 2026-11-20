import { useState } from "react";
import { ChevronRightIcon } from "../../components/icons";
import { BRAIN_REGIONS, type BrainRegion } from "./brainData";

interface RegionTreeProps {
  selectedId: string | null;
  onSelect: (region: BrainRegion) => void;
}

export function RegionTree({ selectedId, onSelect }: RegionTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["telencephalon"]));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderRegion = (region: BrainRegion, depth: number = 0) => {
    const isOpen = expanded.has(region.id);
    const hasChildren = region.children && region.children.length > 0;
    const isActive = selectedId === region.id;

    return (
      <div key={region.id} className="regionGroup">
        <div
          className={`regionRow ${isActive ? "active" : ""}`}
          style={{ paddingLeft: depth > 0 ? 0 : undefined }}
          onClick={() => {
            if (hasChildren) toggle(region.id);
            onSelect(region);
          }}
          role="button"
          tabIndex={0}
        >
          <ChevronRightIcon
            size={12}
            className={`regionChevron ${isOpen ? "open" : ""}`}
            style={{ opacity: hasChildren ? 1 : 0 }}
          />
          <span className="regionDot" style={{ color: region.color ?? "var(--text-muted)" }} />
          <span className="regionLabel">{region.label}</span>
          <span className="regionCount">{region.count}</span>
        </div>
        {hasChildren && isOpen && (
          <div className="regionChildren">
            {region.children!.map((child) => renderRegion(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return <div className="regionList">{BRAIN_REGIONS.map((r) => renderRegion(r))}</div>;
}
