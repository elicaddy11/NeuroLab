import {
  BrainIcon,
  SystemsIcon,
  ActivityIcon,
  LabIcon,
  SettingsIcon,
  CubeIcon,
} from "../icons";
import { NAV_SECTIONS, type SectionId } from "../../config/navigation";
import "./Sidebar.css";

interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

const SECTION_ICONS: Record<SectionId, typeof BrainIcon> = {
  brain: BrainIcon,
  systems: SystemsIcon,
  activity: ActivityIcon,
  lab: LabIcon,
};

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand" title="NeuroLab">
        <CubeIcon size={20} />
        <span>NeuroLab</span>
      </div>

      <nav className="nav">
        {NAV_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              className={`navItem ${isActive ? "active" : ""}`}
              onClick={() => onSelect(section.id)}
              aria-label={section.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} />
              <span className="navLabel">{section.label}</span>
              <span className="tooltip">
                <span className="tooltipTitle">{section.label}</span>
                <span className="tooltipSub">{section.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="navBottom">
        <button className="navItem" aria-label="Settings">
          <SettingsIcon size={18} />
          <span className="statusDot" />
        </button>
      </div>
    </aside>
  );
}
