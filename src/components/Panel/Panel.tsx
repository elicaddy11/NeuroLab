import type { ReactNode } from "react";
import "./Panel.css";

interface PanelProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, actions, children, className }: PanelProps) {
  return (
    <section className={`panel ${className ?? ""}`}>
      <div className="panelHeader">
        <span className="panelTitle">{title}</span>
        {actions && <div className="panelActions">{actions}</div>}
      </div>
      <div className="panelBody">{children}</div>
    </section>
  );
}

interface PanelSectionProps {
  title: string;
  children: ReactNode;
}

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <div className="panelSection">
      <div className="panelSectionTitle">{title}</div>
      {children}
    </div>
  );
}
