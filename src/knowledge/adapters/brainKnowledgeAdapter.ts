import { BRAIN_REGIONS, type BrainRegion } from "../../workspaces/Brain/brainData";
import {
  BRAIN_MESH_REGIONS,
  type BrainMeshRegion,
} from "../../workspaces/Brain/brainVisualizationData";
import { createEntityId } from "../core/ids";
import type {
  KnowledgeEntity,
  KnowledgeRelationship,
  ScientificClaim,
} from "../core/types";
import {
  OCCIPITAL_LOBE_CLAIMS,
  OCCIPITAL_LOBE_EVIDENCE,
  OCCIPITAL_LOBE_RELATIONSHIPS,
  OCCIPITAL_LOBE_SOURCES,
} from "../anatomy/occipitalLobe";
import type { ScientificEvidence } from "../evidence/scientificEvidence";
import type { KnowledgeSource } from "../evidence/sources";
import { KnowledgeRegistry } from "../registry/KnowledgeRegistry";
import { brainRegionToKnowledgeEntity } from "./brainRegionAdapter";

export interface BrainRegionKnowledge {
  entity: KnowledgeEntity;
  region: BrainRegion;
  legacyDetails: NonNullable<BrainRegion["details"]>;
  claims: ScientificClaim[];
  relationships: KnowledgeRelationship[];
  relatedEntities: KnowledgeEntity[];
  evidence: ScientificEvidence[];
  sources: KnowledgeSource[];
}

export interface BrainAtlasKnowledgeCoverage {
  meshRegionIds: string[];
  mappedMeshRegionIds: string[];
  unmatchedMeshRegionIds: string[];
  knowledgeEntityIdsWithoutMesh: string[];
}

function flattenRegions(regions: BrainRegion[]): BrainRegion[] {
  return regions.flatMap((region) => [
    region,
    ...flattenRegions(region.children ?? []),
  ]);
}

const brainRegionsById = new Map(
  flattenRegions(BRAIN_REGIONS).map((region) => [region.id, region]),
);

function createBrainRegistry(): KnowledgeRegistry {
  const registry = new KnowledgeRegistry();
  for (const region of brainRegionsById.values()) {
    if (!region.details) continue;

    const result = registry.registerEntity(brainRegionToKnowledgeEntity(region));
    if (!result.ok) {
      throw new Error(
        `Unable to register Brain knowledge entity "${region.id}": ${result.reason}.`,
      );
    }
  }
  for (const source of OCCIPITAL_LOBE_SOURCES) {
    const result = registry.registerSource(source);
    if (!result.ok) {
      throw new Error(
        `Unable to register Brain knowledge source "${source.id}": ${result.reason}.`,
      );
    }
  }
  for (const evidence of OCCIPITAL_LOBE_EVIDENCE) {
    const result = registry.registerEvidence(evidence);
    if (!result.ok) {
      throw new Error(
        `Unable to register Brain scientific evidence "${evidence.id}": ${result.reason}.`,
      );
    }
  }
  for (const claim of OCCIPITAL_LOBE_CLAIMS) {
    const result = registry.registerClaim(claim);
    if (!result.ok) {
      throw new Error(
        `Unable to register Brain scientific claim "${claim.id}": ${result.reason}.`,
      );
    }
  }
  for (const relationship of OCCIPITAL_LOBE_RELATIONSHIPS) {
    const result = registry.registerRelationship(relationship);
    if (!result.ok) {
      throw new Error(
        `Unable to register Brain knowledge relationship "${relationship.id}": ${result.reason}.`,
      );
    }
  }
  return registry;
}

const brainRegistry = createBrainRegistry();

export function findBrainRegionKnowledge(
  regionId: string,
): BrainRegionKnowledge | undefined {
  if (!regionId.trim()) return undefined;
  const entity = brainRegistry.getEntity(createEntityId(regionId));
  if (!entity) return undefined;

  const region = brainRegionsById.get(regionId);
  if (!region?.details) return undefined;

  const claims = brainRegistry.findClaims({ subjectId: entity.id });
  const relationships = brainRegistry.findRelationships({ subjectId: entity.id });
  const relatedEntities = relationships
    .map(({ objectId }) => brainRegistry.getEntity(objectId))
    .filter((related): related is KnowledgeEntity => related !== undefined);
  const evidenceIds = new Set([
    ...claims.flatMap(({ evidenceIds: ids }) => ids),
    ...relationships.flatMap(({ evidenceIds: ids }) => ids),
  ]);
  const evidence = [...evidenceIds]
    .map((id) => brainRegistry.getEvidence(id))
    .filter((item): item is ScientificEvidence => item !== undefined);
  const sourceIds = new Set(
    evidence.flatMap(({ sourceIds: ids }) => ids),
  );
  const sources = [...sourceIds]
    .map((id) => brainRegistry.getSource(id))
    .filter((source): source is KnowledgeSource => source !== undefined);

  return {
    entity,
    region,
    legacyDetails: region.details,
    claims,
    relationships,
    relatedEntities,
    evidence,
    sources,
  };
}

export function getBrainAtlasKnowledgeCoverage(): BrainAtlasKnowledgeCoverage {
  const meshRegionIds = BRAIN_MESH_REGIONS.map(({ id }) => id);
  const mappedMeshRegionIds = meshRegionIds.filter((id) =>
    brainRegistry.getEntity(createEntityId(id)),
  );
  const mappedIds = new Set(mappedMeshRegionIds);
  const knowledgeEntityIdsWithoutMesh = [...brainRegionsById.values()]
    .filter((region) => region.details && !mappedIds.has(region.id))
    .map(({ id }) => id);

  return {
    meshRegionIds,
    mappedMeshRegionIds,
    unmatchedMeshRegionIds: meshRegionIds.filter((id) => !mappedIds.has(id)),
    knowledgeEntityIdsWithoutMesh,
  };
}

export function findBrainMeshKnowledge(
  meshRegion: BrainMeshRegion,
): KnowledgeEntity | undefined {
  return brainRegistry.getEntity(createEntityId(meshRegion.id));
}
