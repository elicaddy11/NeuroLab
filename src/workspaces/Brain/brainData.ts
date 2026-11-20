export interface BrainRegion {
  id: string;
  label: string;
  abbr: string;
  count: number;
  color?: string;
  children?: BrainRegion[];
}

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: "telencephalon",
    label: "Telencephalon",
    abbr: "TEL",
    count: 42,
    color: "var(--accent-cyan)",
    children: [
      { id: "cortex", label: "Cerebral Cortex", abbr: "CTX", count: 36 },
      { id: "hippocampus", label: "Hippocampal Formation", abbr: "HPF", count: 12 },
      { id: "amygdala", label: "Amygdaloid Complex", abbr: "AMY", count: 8 },
      { id: "basal-ganglia", label: "Basal Ganglia", abbr: "BGI", count: 14 },
    ],
  },
  {
    id: "diencephalon",
    label: "Diencephalon",
    abbr: "DIE",
    count: 18,
    color: "var(--accent-blue)",
    children: [
      { id: "thalamus", label: "Thalamus", abbr: "THA", count: 10 },
      { id: "hypothalamus", label: "Hypothalamus", abbr: "HY", count: 8 },
    ],
  },
  {
    id: "mesencephalon",
    label: "Mesencephalon",
    abbr: "MES",
    count: 11,
    color: "var(--accent-violet)",
    children: [
      { id: "midbrain", label: "Midbrain Tegmentum", abbr: "MBT", count: 6 },
      { id: "tectum", label: "Tectum", abbr: "TCT", count: 5 },
    ],
  },
  {
    id: "rhombencephalon",
    label: "Rhombencephalon",
    abbr: "RHO",
    count: 22,
    color: "var(--accent-amber)",
    children: [
      { id: "pons", label: "Pons", abbr: "PNS", count: 7 },
      { id: "cerebellum", label: "Cerebellum", abbr: "CB", count: 10 },
      { id: "medulla", label: "Medulla Oblongata", abbr: "MO", count: 5 },
    ],
  },
];

export interface StructureInfo {
  id: string;
  name: string;
  abbr: string;
  system: string;
  hemisphere: string;
  volume: string;
  neurons: string;
  function: string;
  coords: { x: number; y: number; z: number };
  tags: string[];
}

export const SAMPLE_STRUCTURE: StructureInfo = {
  id: "cortex",
  name: "Cerebral Cortex",
  abbr: "CTX",
  system: "Telencephalon",
  hemisphere: "Bilateral",
  volume: "≈ 450 cm³",
  neurons: "≈ 16 billion",
  function: "Higher cognition, perception, motor planning",
  coords: { x: 2.4, y: 18.1, z: 32.7 },
  tags: ["gray-matter", "lamellar", "associative"],
};
