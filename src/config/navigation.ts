export type SectionId = "brain" | "systems" | "activity" | "lab";

export interface NavSection {
  id: SectionId;
  label: string;
  abbr: string;
  description: string;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "brain",
    label: "Brain",
    abbr: "BR",
    description: "3D anatomical exploration",
  },
  {
    id: "systems",
    label: "Systems",
    abbr: "SY",
    description: "Neural systems & circuits",
  },
  {
    id: "activity",
    label: "Activity",
    abbr: "AC",
    description: "Signal & network dynamics",
  },
  {
    id: "lab",
    label: "Lab",
    abbr: "LB",
    description: "Experiments & simulations",
  },
];
