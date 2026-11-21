import { describe, expect, it } from "vitest";
import { BRAIN_REGIONS, findBrainRegion, getBrainStructure } from "../../workspaces/Brain/brainData";
import { brainRegionToKnowledgeEntity } from "./brainRegionAdapter";

function flattenRegions(
  regions: typeof BRAIN_REGIONS,
): (typeof BRAIN_REGIONS)[number][] {
  return regions.flatMap((region) => [region, ...flattenRegions(region.children ?? [])]);
}

describe("brainRegionToKnowledgeEntity", () => {
  it("preserves every existing Brain region ID and preferred display name", () => {
    const regions = flattenRegions(BRAIN_REGIONS);

    for (const region of regions) {
      const converted = brainRegionToKnowledgeEntity(region);

      expect(converted.id).toBe(region.id);
      expect(converted.kind).toBe("anatomical-structure");
      expect(converted.names).toContainEqual({
        value: region.label,
        language: "en",
        kind: "preferred",
      });
      expect(converted.names).toContainEqual({
        value: region.abbr,
        language: "en",
        kind: "abbreviation",
      });
    }
  });

  it("leaves existing Brain lookups available for all detailed structures", () => {
    const structures = flattenRegions(BRAIN_REGIONS).filter((region) => region.details);

    expect(structures.length).toBeGreaterThan(0);
    for (const structure of structures) {
      expect(findBrainRegion(structure.id)?.region).toBe(structure);
      expect(getBrainStructure(structure.id)).toBe(structure);
      expect(brainRegionToKnowledgeEntity(structure).id).toBe(structure.id);
    }
  });
});
