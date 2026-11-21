import { beforeEach, describe, expect, it } from "vitest";
import {
  createClaimId,
  createEntityId,
  createEvidenceId,
  createRelationshipId,
  createSourceId,
} from "../core/ids";
import type {
  KnowledgeEntity,
  KnowledgeRelationship,
  ScientificClaim,
  ScientificStatus,
} from "../core/types";
import { KnowledgeRegistry } from "./KnowledgeRegistry";

const confidence = { level: "moderate", description: "Test confidence." } as const;

function entity(id: string): KnowledgeEntity {
  return {
    id: createEntityId(id),
    kind: "anatomical-structure",
    names: [{ value: id, language: "en", kind: "preferred" }],
  };
}

function relationship(
  id: string,
  subjectId: string,
  objectId: string,
  overrides: Partial<KnowledgeRelationship> = {},
): KnowledgeRelationship {
  return {
    id: createRelationshipId(id),
    subjectId: createEntityId(subjectId),
    predicate: "related-to",
    objectId: createEntityId(objectId),
    direction: "undirected",
    status: "simplified",
    reviewStatus: "unreviewed",
    evidenceIds: [],
    confidence,
    ...overrides,
  };
}

describe("KnowledgeRegistry", () => {
  let registry: KnowledgeRegistry;

  beforeEach(() => {
    registry = new KnowledgeRegistry();
  });

  it("registers and retrieves entities, and safely returns undefined for missing IDs", () => {
    const region = entity("hippocampus");

    expect(registry.registerEntity(region)).toEqual({ ok: true, value: region });
    expect(registry.getEntity(region.id)).toBe(region);
    expect(registry.getEntity(createEntityId("missing"))).toBeUndefined();
  });

  it("rejects duplicate entity IDs without replacing the original", () => {
    const original = entity("hippocampus");
    const duplicate = { ...original, names: [{ value: "Replacement", language: "en", kind: "preferred" as const }] };

    expect(registry.registerEntity(original).ok).toBe(true);
    expect(registry.registerEntity(duplicate)).toMatchObject({
      ok: false,
      reason: "duplicate-id",
      id: original.id,
    });
    expect(registry.getEntity(original.id)).toBe(original);
  });

  it("finds related entities and filters relationship queries", () => {
    const hippocampus = entity("hippocampus");
    const cortex = entity("cerebral-cortex");
    const thalamus = entity("thalamus");
    registry.registerEntity(hippocampus);
    registry.registerEntity(cortex);
    registry.registerEntity(thalamus);

    const relation = relationship("hippocampus-cortex", hippocampus.id, cortex.id);
    registry.registerRelationship(relation);
    registry.registerRelationship(
      relationship("hippocampus-thalamus", hippocampus.id, thalamus.id, {
        predicate: "projects-to",
        direction: "directed",
        status: "established",
      }),
    );

    expect(registry.findRelatedEntities(hippocampus.id)).toEqual([cortex, thalamus]);
    expect(registry.findRelatedEntities(hippocampus.id, "projects-to")).toEqual([thalamus]);
    expect(registry.findRelationships({
      subjectId: hippocampus.id,
      predicate: "projects-to",
      status: "established",
    })).toHaveLength(1);
    expect(registry.findRelationships({ objectId: thalamus.id })).toHaveLength(1);
  });

  it("retrieves claims by entity and predicate", () => {
    const subject = entity("claim-subject");
    registry.registerEntity(subject);
    const claim: ScientificClaim = {
      id: createClaimId("visual-function"),
      subjectId: subject.id,
      predicate: "function",
      value: "A reviewed test statement.",
      status: "established",
      reviewStatus: "source-checked",
      evidenceIds: [],
      confidence,
    };
    registry.registerClaim(claim);

    expect(registry.findClaims({ subjectId: subject.id })).toEqual([claim]);
    expect(registry.findClaims({ predicate: "function" })).toEqual([claim]);
    expect(registry.findClaims({ predicate: "missing" })).toEqual([]);
  });

  it("requires reviewer metadata before accepting an expert-reviewed relationship", () => {
    const source = entity("review-source");
    const target = entity("review-target");
    registry.registerEntity(source);
    registry.registerEntity(target);
    const reviewed = relationship("expert-reviewed-relation", source.id, target.id, {
      reviewStatus: "expert-reviewed",
      reviewer: "Neuroscience reviewer",
      reviewedAt: "2026-11-21T00:00:00Z",
    });

    expect(registry.registerRelationship(reviewed).ok).toBe(true);
  });

  it("rejects relationships with missing endpoints without registering them", () => {
    const hippocampus = entity("hippocampus");
    registry.registerEntity(hippocampus);
    const invalid = relationship("missing-target", hippocampus.id, "not-registered");

    expect(registry.registerRelationship(invalid)).toMatchObject({
      ok: false,
      reason: "missing-reference",
      missingIds: ["not-registered"],
    });
    expect(registry.getRelationship(invalid.id)).toBeUndefined();
    expect(registry.findRelatedEntities(hippocampus.id)).toEqual([]);
  });

  it("rejects a repeated relationship ID", () => {
    const first = entity("first");
    const second = entity("second");
    registry.registerEntity(first);
    registry.registerEntity(second);
    const relation = relationship("same-id", first.id, second.id);

    expect(registry.registerRelationship(relation).ok).toBe(true);
    expect(registry.registerRelationship(relation)).toMatchObject({
      ok: false,
      reason: "duplicate-id",
    });
    expect(registry.findRelationships()).toHaveLength(1);
  });

  it.each<ScientificStatus>(["established", "simplified", "hypothetical", "simulated"])(
    "accepts the %s scientific status",
    (status) => {
      const sourceEntity = entity("source-entity");
      const targetEntity = entity("target-entity");
      registry.registerEntity(sourceEntity);
      registry.registerEntity(targetEntity);

      expect(registry.registerRelationship(
        relationship(`relation-${status}`, sourceEntity.id, targetEntity.id, { status }),
      ).ok).toBe(true);
    },
  );

  it("rejects invalid status, confidence, direction, and malformed entity records", () => {
    const first = entity("first");
    const second = entity("second");
    registry.registerEntity(first);
    registry.registerEntity(second);

    const badStatus = relationship("bad-status", first.id, second.id, {
      status: "unreviewed" as ScientificStatus,
    });
    const badConfidence = relationship("bad-confidence", first.id, second.id, {
      confidence: { level: "certain", description: "Not a supported level." } as unknown as typeof confidence,
    });
    const badDirection = relationship("bad-direction", first.id, second.id, {
      direction: "sideways" as KnowledgeRelationship["direction"],
    });
    const badReviewStatus = relationship("bad-review-status", first.id, second.id, {
      reviewStatus: "peer-reviewed" as KnowledgeRelationship["reviewStatus"],
    });
    const expertWithoutReviewer = relationship(
      "expert-without-reviewer",
      first.id,
      second.id,
      { reviewStatus: "expert-reviewed" },
    );
    const malformedEntity = {
      ...entity("bad-name"),
      names: [{ value: "", language: "en", kind: "preferred" }],
    } as KnowledgeEntity;

    expect(registry.registerRelationship(badStatus)).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
    expect(registry.registerRelationship(badConfidence)).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
    expect(registry.registerRelationship(badDirection)).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
    expect(registry.registerRelationship(badReviewStatus)).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
    expect(registry.registerRelationship(expertWithoutReviewer)).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
    expect(registry.registerEntity(malformedEntity)).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
    expect(registry.getEntity(malformedEntity.id)).toBeUndefined();
  });

  it("accepts valid confidence levels and optional species and experimental context", () => {
    const subject = entity("subject");
    registry.registerEntity(subject);
    const claim: ScientificClaim = {
      id: createClaimId("contextual-claim"),
      subjectId: subject.id,
      predicate: "illustrates",
      status: "hypothetical",
      reviewStatus: "unreviewed",
      evidenceIds: [],
      confidence: { level: "limited", description: "Illustrative test record." },
      species: [{ scientificName: "Homo sapiens", commonName: "human" }],
      experimentalContext: [{ method: "test fixture", conditions: "unit test" }],
      limitations: ["No scientific inference is intended."],
    };

    expect(registry.registerClaim(claim).ok).toBe(true);
    expect(registry.getClaim(claim.id)).toEqual(claim);

    const withoutOptionalContext = {
      ...claim,
      id: createClaimId("claim-without-context"),
      species: undefined,
      experimentalContext: undefined,
    };
    expect(registry.registerClaim(withoutOptionalContext).ok).toBe(true);
  });

  it("validates source and evidence references before registering claims", () => {
    const subject = entity("subject");
    registry.registerEntity(subject);
    const sourceId = createSourceId("source-1");
    const evidenceId = createEvidenceId("evidence-1");
    const evidence = {
      id: evidenceId,
      sourceIds: [sourceId],
      evidenceType: "review",
      confidence: { level: "high" as const, description: "Evidence record test." },
      species: [{ taxonId: "test-taxon" }],
      experimentalContext: [{ paradigm: "test paradigm" }],
    };
    const claim: ScientificClaim = {
      id: createClaimId("claim-with-evidence"),
      subjectId: subject.id,
      predicate: "supported-by",
      status: "established",
      reviewStatus: "source-checked",
      evidenceIds: [evidenceId],
      confidence,
    };

    expect(registry.registerEvidence(evidence)).toMatchObject({
      ok: false,
      reason: "missing-reference",
      missingIds: [sourceId],
    });
    expect(registry.registerClaim(claim)).toMatchObject({
      ok: false,
      reason: "missing-reference",
      missingIds: [evidenceId],
    });

    const source = {
      id: sourceId,
      title: "Test source",
      authors: ["A. Author"],
      year: 2024,
      containerTitle: "Test Journal",
      volume: "1",
      issue: "2",
      pages: "3-4",
    };
    expect(registry.registerSource(source).ok).toBe(true);
    expect(registry.registerEvidence(evidence).ok).toBe(true);
    expect(registry.registerClaim(claim).ok).toBe(true);
    expect(registry.getSource(sourceId)).toEqual(source);
    expect(registry.getEvidence(evidenceId)).toEqual(evidence);
  });

  it("rejects malformed claims and sources", () => {
    const subject = entity("subject");
    registry.registerEntity(subject);
    const malformedClaim = {
      id: createClaimId("bad-claim"),
      subjectId: subject.id,
      predicate: "invalid-value",
      status: "established",
      reviewStatus: "unreviewed",
      evidenceIds: [],
      confidence: { level: "unknown", description: "" },
      value: Number.NaN,
    } as ScientificClaim;

    expect(registry.registerClaim(malformedClaim)).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
    expect(registry.registerSource({ id: createSourceId("bad-source"), title: "" })).toMatchObject({
      ok: false,
      reason: "invalid-record",
    });
  });
});
