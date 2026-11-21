import type { KnowledgeEntity } from "../core/types";
import { createEntityId } from "../core/ids";
import type { BrainRegion } from "../../workspaces/Brain/brainData";

export function brainRegionToKnowledgeEntity(region: BrainRegion): KnowledgeEntity {
  return {
    id: createEntityId(region.id),
    kind: "anatomical-structure",
    names: [
      { value: region.label, language: "en", kind: "preferred" },
      { value: region.abbr, language: "en", kind: "abbreviation" },
    ],
  };
}
