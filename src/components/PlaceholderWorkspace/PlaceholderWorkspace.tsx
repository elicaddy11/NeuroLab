import type { ReactNode } from "react";
import "./PlaceholderWorkspace.css";

interface PlaceholderWorkspaceProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function PlaceholderWorkspace({ icon, title, description }: PlaceholderWorkspaceProps) {
  return (
    <div className="placeholderWorkspace">
      <span className="cornerMarker tl" />
      <span className="cornerMarker tr" />
      <span className="cornerMarker bl" />
      <span className="cornerMarker br" />

      <div className="placeholderContent">
        <div className="placeholderIcon">{icon}</div>
        <h2 className="placeholderTitle">{title}</h2>
        <p className="placeholderDesc">{description}</p>
        <span className="placeholderTag">
          <span className="placeholderTagDot" />
          Module in development
        </span>
      </div>
    </div>
  );
}
