import type { SectionId } from "./navigation";
import { BRAIN_REGIONS, findBrainRegion, type BrainRegion } from "../workspaces/Brain/brainData";
import { NEURAL_SYSTEMS } from "../workspaces/Systems/systemsData";
import { EXPERIMENT_TEMPLATES, LEARNING_EXPERIMENTS } from "../workspaces/Lab/experimentData";

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  section: SectionId;
  targetId: string;
  searchText: string;
}

function flattenRegions(regions: BrainRegion[]): BrainRegion[] {
  return regions.flatMap((region) => [region, ...flattenRegions(region.children ?? [])]);
}

const brainRegions = flattenRegions(BRAIN_REGIONS)
  .filter((region) => region.details)
  .map((region): SearchResult => ({
    id: `brain:${region.id}`,
    title: region.label,
    category: "Brain anatomy",
    description: region.details?.location ?? "Anatomical structure",
    section: "brain",
    targetId: region.id,
    searchText: [
      region.label,
      region.abbr,
      region.details?.location,
      region.details?.description,
      ...(region.details?.functions ?? []),
      ...(region.details?.systems ?? []),
    ].join(" ").toLowerCase(),
  }));

const systems = NEURAL_SYSTEMS.map((system): SearchResult => ({
  id: `systems:${system.id}`,
  title: system.name,
  category: "Neural system",
  description: system.overview,
  section: "systems",
  targetId: system.id,
  searchText: [
    system.name,
    system.shortName,
    system.overview,
    ...system.functions,
    ...system.regions,
    ...system.regions.map((id) => findBrainRegion(id)?.region.label ?? id),
    ...system.interactions,
  ].join(" ").toLowerCase(),
}));

const learningExperiments = LEARNING_EXPERIMENTS.map((experiment): SearchResult => ({
  id: `lab-model:${experiment.id}`,
  title: experiment.name,
  category: "Learning model",
  description: experiment.description,
  section: "lab",
  targetId: experiment.id,
  searchText: [experiment.name, experiment.description, ...experiment.keywords].join(" ").toLowerCase(),
}));

const protocols = EXPERIMENT_TEMPLATES.map((template): SearchResult => ({
  id: `lab-protocol:${template.id}`,
  title: template.name,
  category: "Protocol preview",
  description: template.description,
  section: "lab",
  targetId: template.id,
  searchText: [
    template.name,
    template.protocol,
    template.category,
    template.code,
    template.description,
  ].join(" ").toLowerCase(),
}));

const activity: SearchResult = {
  id: "activity:overview",
  title: "Illustrative brain activity",
  category: "Activity",
  description: "Synthetic activity indicators, network connections, and multichannel traces.",
  section: "activity",
  targetId: "activity",
  searchText: "activity activation signal synthetic waveform network connections intensity brain dynamics",
};

const SEARCH_INDEX = [...brainRegions, ...systems, ...learningExperiments, ...protocols, activity];

export function searchNeuroLab(query: string, limit = 7): SearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return SEARCH_INDEX
    .map((result, index) => {
      if (!terms.every((term) => result.searchText.includes(term))) {
        return { result, index, score: -1 };
      }
      const score = terms.reduce(
        (total, term) => total + (result.title.toLowerCase().startsWith(term) ? 3 : 1),
        0,
      );
      return { result, index, score };
    })
    .filter((item) => item.score >= 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ result }) => result);
}
