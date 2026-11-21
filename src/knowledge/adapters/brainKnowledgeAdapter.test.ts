import { describe, expect, it } from "vitest";
import {
  BRAIN_REGIONS,
  findBrainRegion,
  getBrainStructure,
} from "../../workspaces/Brain/brainData";
import {
  BRAIN_MESH_REGIONS,
  BRAIN_MODEL_URL,
} from "../../workspaces/Brain/brainVisualizationData";
import {
  findBrainMeshKnowledge,
  findBrainRegionKnowledge,
  getBrainAtlasKnowledgeCoverage,
} from "./brainKnowledgeAdapter";

describe("Brain knowledge adapter", () => {
  it("maps every BodyParts3D display group to a same-ID knowledge entity", () => {
    const coverage = getBrainAtlasKnowledgeCoverage();

    expect(coverage.meshRegionIds).toHaveLength(BRAIN_MESH_REGIONS.length);
    expect(coverage.mappedMeshRegionIds).toEqual(coverage.meshRegionIds);
    expect(coverage.unmatchedMeshRegionIds).toEqual([]);
    for (const meshRegion of BRAIN_MESH_REGIONS) {
      expect(findBrainMeshKnowledge(meshRegion)?.id).toBe(meshRegion.id);
      expect(findBrainRegionKnowledge(meshRegion.id)?.entity.id).toBe(meshRegion.id);
    }
  });

  it("retrieves a selected region's identity through knowledge and preserves legacy details", () => {
    const legacyRegion = getBrainStructure("occipital-lobe");
    const selected = findBrainRegionKnowledge("occipital-lobe");

    expect(legacyRegion).not.toBeNull();
    expect(selected?.entity.names).toContainEqual({
      value: legacyRegion?.label,
      language: "en",
      kind: "preferred",
    });
    expect(selected?.legacyDetails).toBe(legacyRegion?.details);
    expect(selected?.entity.id).toBe("occipital-lobe");
  });

  it("retrieves source-checked occipital claims with resolved evidence and bibliography", () => {
    const profile = findBrainRegionKnowledge("occipital-lobe");

    expect(profile?.claims.map(({ predicate }) => predicate)).toEqual(
      expect.arrayContaining([
        "beginner-explanation",
        "advanced-explanation",
        "function",
        "cognitive-contribution",
      ]),
    );
    expect(profile?.claims.length).toBeGreaterThanOrEqual(6);
    expect(profile?.claims.find(({ predicate }) => predicate === "beginner-explanation"))
      .toMatchObject({ status: "simplified", reviewStatus: "source-checked" });
    expect(profile?.claims.find(({ predicate }) => predicate === "advanced-explanation"))
      .toMatchObject({ status: "established", reviewStatus: "source-checked" });
    for (const claim of profile?.claims ?? []) {
      expect(claim.evidenceIds.length).toBeGreaterThan(0);
      expect(claim.reviewStatus).toBe("source-checked");
      expect(profile?.evidence.map(({ id }) => id)).toEqual(
        expect.arrayContaining(claim.evidenceIds),
      );
    }

    expect(profile?.evidence.length).toBeGreaterThan(0);
    for (const evidence of profile?.evidence ?? []) {
      expect(evidence.sourceIds.length).toBeGreaterThan(0);
      expect(profile?.sources.map(({ id }) => id)).toEqual(
        expect.arrayContaining(evidence.sourceIds),
      );
    }
    expect(profile?.sources).toHaveLength(3);
    expect(profile?.sources.every(({ doi, url, authors, year }) =>
      Boolean(doi && url && authors?.length && year),
    )).toBe(true);
  });

  it("provides evidence-backed pathway relationships without treating old connections as migrated", () => {
    const profile = findBrainRegionKnowledge("occipital-lobe");

    expect(profile?.relationships.map(({ objectId }) => objectId)).toEqual([
      "parietal-lobe",
      "temporal-lobe",
    ]);
    expect(profile?.relationships.every(({ evidenceIds, reviewStatus }) =>
      evidenceIds.length > 0 && reviewStatus === "source-checked",
    )).toBe(true);
    expect(profile?.legacyDetails.connections).toEqual([
      "temporal-lobe",
      "parietal-lobe",
      "thalamus",
    ]);
  });

  it("uses legacy content as the fallback for regions without migrated claims", () => {
    const legacyRegion = getBrainStructure("frontal-lobe");
    const profile = findBrainRegionKnowledge("frontal-lobe");

    expect(profile?.claims).toEqual([]);
    expect(profile?.relationships).toEqual([]);
    expect(profile?.sources).toEqual([]);
    expect(profile?.legacyDetails).toBe(legacyRegion?.details);
  });

  it("reports the existing information-only structure without assigning it a mesh", () => {
    const coverage = getBrainAtlasKnowledgeCoverage();

    expect(coverage.knowledgeEntityIdsWithoutMesh).toEqual(["prefrontal-cortex"]);
    expect(findBrainRegionKnowledge("prefrontal-cortex")?.entity.id)
      .toBe("prefrontal-cortex");
    expect(BRAIN_MESH_REGIONS.some(({ id }) => id === "prefrontal-cortex"))
      .toBe(false);
  });

  it("does not register organizational headings or fabricate missing selections", () => {
    expect(findBrainRegionKnowledge("cerebral-cortex")).toBeUndefined();
    expect(findBrainRegionKnowledge("not-a-region")).toBeUndefined();
    expect(findBrainRegionKnowledge("")).toBeUndefined();
    expect(findBrainRegion("cerebral-cortex")?.region).toBe(BRAIN_REGIONS[0]);
  });

  it("keeps the existing BodyParts3D asset and legacy lookup behavior", () => {
    expect(BRAIN_MODEL_URL).toBe("/models/brain/bodyparts3d-atlas.glb");
    for (const meshRegion of BRAIN_MESH_REGIONS) {
      expect(findBrainRegion(meshRegion.id)?.region.id).toBe(meshRegion.id);
      expect(getBrainStructure(meshRegion.id)?.id).toBe(meshRegion.id);
    }
  });
});
