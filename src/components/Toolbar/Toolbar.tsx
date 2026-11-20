import { useState } from "react";
import {
  SearchIcon,
  GridIcon,
  LayersIcon,
  MaximizeIcon,
} from "../icons";
import { NAV_SECTIONS, type SectionId } from "../../config/navigation";
import "./Toolbar.css";

interface ToolbarProps {
  active: SectionId;
}

export function Toolbar({ active }: ToolbarProps) {
  const [view, setView] = useState<"grid" | "layers" | "max">("grid");
  const [query, setQuery] = useState("");

  const section = NAV_SECTIONS.find((s) => s.id === active)!;

  return (
    <header className="toolbar">
      <div className="context">
        <span className="contextSection">{section.label}</span>
        <span className="contextDivider">/</span>
        <span className="contextSub">{section.description}</span>
      </div>

      <div className="searchWrap">
        <SearchIcon size={15} className="searchIcon" />
        <input
          className="searchInput"
          type="text"
          placeholder="Search structures, regions, references…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Global search"
        />
        <span className="searchHint">⌘K</span>
      </div>

      <div className="viewControls" role="group" aria-label="View controls">
        <button
          className={`vcBtn ${view === "grid" ? "active" : ""}`}
          onClick={() => setView("grid")}
          aria-label="Grid view"
          aria-pressed={view === "grid"}
        >
          <GridIcon size={15} />
        </button>
        <button
          className={`vcBtn ${view === "layers" ? "active" : ""}`}
          onClick={() => setView("layers")}
          aria-label="Layers view"
          aria-pressed={view === "layers"}
        >
          <LayersIcon size={15} />
        </button>
        <div className="vcDivider" />
        <button
          className={`vcBtn ${view === "max" ? "active" : ""}`}
          onClick={() => setView("max")}
          aria-label="Fullscreen"
          aria-pressed={view === "max"}
        >
          <MaximizeIcon size={15} />
        </button>
      </div>

      <div className="systemStatus">
        <div className="statItem">
          <span className="statDot" style={{ background: "var(--status-online)", boxShadow: "0 0 6px var(--status-online)" }} />
          <span className="statLabel">SYS</span>
          <span className="statValue">ONLINE</span>
        </div>
        <div className="statItem">
          <span className="statLabel">RENDER</span>
          <span className="statValue">60Hz</span>
        </div>
        <div className="statItem">
          <span className="statLabel">MEM</span>
          <span className="statValue">1.2GB</span>
        </div>
      </div>
    </header>
  );
}
