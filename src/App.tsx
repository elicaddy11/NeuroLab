import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { BrainWorkspace } from "./workspaces/Brain/BrainWorkspace";
import { SystemsWorkspace } from "./workspaces/Systems/SystemsWorkspace";
import { ActivityWorkspace } from "./workspaces/Activity/ActivityWorkspace";
import { LabWorkspace } from "./workspaces/Lab/LabWorkspace";
import type { SectionId } from "./config/navigation";
import type { SearchResult } from "./config/searchIndex";
import "./App.css";

export default function App() {
  const [active, setActive] = useState<SectionId>("brain");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);
  const [focusRegionSequence, setFocusRegionSequence] = useState(0);
  const [selectedSystemId, setSelectedSystemId] = useState("executive-control");
  const [selectedExperimentId, setSelectedExperimentId] = useState("reward-learning");
  const [selectedProtocolId, setSelectedProtocolId] = useState("resting-state");
  const [labMode, setLabMode] = useState<"models" | "protocols">("models");

  const focusBrainRegion = (regionId: string) => {
    setFocusedRegionId(regionId);
    setFocusRegionSequence((sequence) => sequence + 1);
    setActive("brain");
  };

  const selectSearchResult = (result: SearchResult) => {
    setSearchQuery("");
    setActive(result.section);

    if (result.section === "brain") {
      focusBrainRegion(result.targetId);
    } else if (result.section === "systems") {
      setSelectedSystemId(result.targetId);
    } else if (result.id.startsWith("lab-model:")) {
      setSelectedExperimentId(result.targetId);
      setLabMode("models");
    } else if (result.id.startsWith("lab-protocol:")) {
      setSelectedProtocolId(result.targetId);
      setLabMode("protocols");
    }
  };

  return (
    <div className="app">
      <Sidebar active={active} onSelect={setActive} />
      <div className="mainArea">
        <Toolbar
          active={active}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectSearchResult={selectSearchResult}
        />
        <main className="workspace">
          {active === "brain" && (
            <BrainWorkspace
              searchQuery={searchQuery}
              focusRegionId={focusedRegionId}
              focusRegionSequence={focusRegionSequence}
            />
          )}
          {active === "systems" && (
            <SystemsWorkspace
              searchQuery={searchQuery}
              selectedSystemId={selectedSystemId}
              onSelectSystem={setSelectedSystemId}
              onFocusRegion={focusBrainRegion}
            />
          )}
          {active === "activity" && (
            <ActivityWorkspace searchQuery={searchQuery} onFocusRegion={focusBrainRegion} />
          )}
          {active === "lab" && (
            <LabWorkspace
              searchQuery={searchQuery}
              mode={labMode}
              onModeChange={setLabMode}
              selectedExperimentId={selectedExperimentId}
              onSelectExperiment={setSelectedExperimentId}
              selectedProtocolId={selectedProtocolId}
              onSelectProtocol={setSelectedProtocolId}
            />
          )}
        </main>
      </div>
    </div>
  );
}
