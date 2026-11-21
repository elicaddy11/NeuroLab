export interface BrainMeshRegion {
  id: string;
  label: string;
  color: string;
  meshIds: string[];
  sourceComponents: string[];
  surface: boolean;
  coverageNote: string;
}

export const BRAIN_MODEL_URL = "/models/brain/bodyparts3d-atlas.glb";

export const BRAIN_MESH_REGIONS: BrainMeshRegion[] = [
  {
    id: "frontal-lobe",
    label: "Frontal lobe",
    color: "#4fd9d4",
    meshIds: ["FJ1833", "FJ1834", "FJ1787", "FJ1788", "FJ1744", "FJ1745", "FJ1800", "FJ1801", "FJ1793", "FJ1794"],
    sourceComponents: ["Superior, middle, and inferior frontal gyri", "Precentral gyrus", "Orbital gyrus"],
    surface: true,
    coverageNote: "Grouped source-segmented gyri; this is not a complete frontal-lobe surface mask.",
  },
  {
    id: "parietal-lobe",
    label: "Parietal lobe",
    color: "#5c9fff",
    meshIds: ["FJ1797", "FJ1798", "FJ1841", "FJ1842", "FJ1732", "FJ1733", "FJ1835", "FJ1836"],
    sourceComponents: ["Postcentral gyrus", "Supramarginal gyrus", "Angular gyrus", "Superior parietal lobule"],
    surface: true,
    coverageNote: "Grouped source-segmented gyri; this is not a complete parietal-lobe surface mask.",
  },
  {
    id: "temporal-lobe",
    label: "Temporal lobe",
    color: "#9b7cff",
    meshIds: ["FJ1789", "FJ1790", "FJ1746", "FJ1747", "FJ1783", "FJ1784", "FJ1785", "FJ1786", "FJ1837", "FJ1838", "FJ1839", "FJ1840"],
    sourceComponents: ["Superior, middle, and inferior temporal gyri", "Fusiform gyrus", "Parahippocampal gyrus"],
    surface: true,
    coverageNote: "Grouped source-segmented gyri; this is not a complete temporal-lobe surface mask.",
  },
  {
    id: "occipital-lobe",
    label: "Occipital lobe",
    color: "#e9ae5d",
    meshIds: ["FJ1791", "FJ1792"],
    sourceComponents: ["Left and right occipital lobe"],
    surface: true,
    coverageNote: "Left and right occipital-lobe segments from the source atlas.",
  },
  {
    id: "cerebellum",
    label: "Cerebellum",
    color: "#83b78f",
    meshIds: ["FJ1781", "FJ1830"],
    sourceComponents: ["Left and right cerebellum"],
    surface: false,
    coverageNote: "Left and right cerebellar segments from the source atlas.",
  },
  {
    id: "brainstem",
    label: "Brainstem",
    color: "#d67f7e",
    meshIds: ["FJ1770", "FJ1817", "FJ1775", "FJ1822", "FJ1769", "FJ1831", "FJ1774", "FJ1821"],
    sourceComponents: ["Midbrain", "Pons", "Medulla oblongata", "Cerebral peduncles"],
    surface: false,
    coverageNote: "Grouped source segments for the midbrain, pons, medulla, and cerebral peduncles.",
  },
  {
    id: "hippocampus",
    label: "Hippocampus",
    color: "#c096ff",
    meshIds: ["FJ1759", "FJ1807"],
    sourceComponents: ["Left and right hippocampus"],
    surface: false,
    coverageNote: "Left and right hippocampal segments from the source atlas.",
  },
  {
    id: "amygdala",
    label: "Amygdala",
    color: "#f19a68",
    meshIds: ["FJ1753", "FJ1829"],
    sourceComponents: ["Left and right amygdala"],
    surface: false,
    coverageNote: "Left and right amygdalar segments from the source atlas.",
  },
  {
    id: "hypothalamus",
    label: "Hypothalamus",
    color: "#c877a6",
    meshIds: ["FJ1760", "FJ1808"],
    sourceComponents: ["Left and right hypothalamus"],
    surface: false,
    coverageNote: "Left and right hypothalamic segments from the source atlas.",
  },
  {
    id: "thalamus",
    label: "Thalamus",
    color: "#8fc9e8",
    meshIds: ["FJ1782", "FJ1827"],
    sourceComponents: ["Left and right thalamus"],
    surface: false,
    coverageNote: "Left and right thalamic segments from the source atlas.",
  },
  {
    id: "basal-ganglia",
    label: "Basal ganglia",
    color: "#91a4b7",
    meshIds: ["FJ1754", "FJ1802", "FJ1776", "FJ1823", "FJ1757", "FJ1805"],
    sourceComponents: ["Caudate nuclei", "Putamina", "Globus pallidus"],
    surface: false,
    coverageNote: "Grouped caudate, putamen, and globus pallidus meshes; other basal-ganglia nuclei are not included.",
  },
];

export const BRAIN_MESH_REGION_BY_ID = new Map(
  BRAIN_MESH_REGIONS.map((region) => [region.id, region]),
);

export const BRAIN_DEEP_REGION_IDS = new Set([
  "hippocampus",
  "amygdala",
  "hypothalamus",
  "thalamus",
  "basal-ganglia",
]);

export const BRAIN_COLOR_LEGEND = BRAIN_MESH_REGIONS.map(({ id, label, color }) => ({
  id,
  label,
  color,
}));
