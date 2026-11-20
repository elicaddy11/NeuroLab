import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { BrainWorkspace } from "./workspaces/Brain/BrainWorkspace";
import { PlaceholderWorkspace } from "./components/PlaceholderWorkspace/PlaceholderWorkspace";
import { SystemsIcon, ActivityIcon, LabIcon } from "./components/icons";
import type { SectionId } from "./config/navigation";
import "./App.css";

export default function App() {
  const [active, setActive] = useState<SectionId>("brain");

  return (
    <div className="app">
      <Sidebar active={active} onSelect={setActive} />
      <div className="mainArea">
        <Toolbar active={active} />
        <main className="workspace">
          {active === "brain" && <BrainWorkspace />}
          {active === "systems" && (
            <PlaceholderWorkspace
              icon={<SystemsIcon size={36} />}
              title="Neural Systems"
              description="Cross-regional circuit maps, pathway tracing, and functional connectivity between neural systems will be explored here."
            />
          )}
          {active === "activity" && (
            <PlaceholderWorkspace
              icon={<ActivityIcon size={36} />}
              title="Neural Activity"
              description="Real-time signal visualization, waveform analysis, and network dynamics tooling will be available in this workspace."
            />
          )}
          {active === "lab" && (
            <PlaceholderWorkspace
              icon={<LabIcon size={36} />}
              title="Experimental Lab"
              description="Interactive simulations, paradigm builders, and experiment recording tools will live here in future phases."
            />
          )}
        </main>
      </div>
    </div>
  );
}
