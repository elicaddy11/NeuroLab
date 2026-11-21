import type {
  ClaimId,
  EntityId,
  EvidenceId,
  RelationshipId,
  SourceId,
} from "../core/ids";
import type {
  KnowledgeEntity,
  KnowledgeRelationship,
  ScientificClaim,
  ScientificStatus,
} from "../core/types";
import type { KnowledgeSource } from "../evidence/sources";
import type { ScientificEvidence } from "../evidence/scientificEvidence";
import {
  validateKnowledgeEntity,
  validateKnowledgeRelationship,
  validateKnowledgeSource,
  validateScientificClaim,
  validateScientificEvidence,
} from "./validation";

export type RegistrationResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      reason: "duplicate-id" | "missing-reference" | "invalid-record";
      id: string;
      missingIds?: string[];
      issues?: string[];
    };

export interface RelationshipQuery {
  subjectId?: EntityId;
  objectId?: EntityId;
  predicate?: string;
  status?: ScientificStatus;
}

export interface ClaimQuery {
  subjectId?: EntityId;
  predicate?: string;
  status?: ScientificStatus;
}

export class KnowledgeRegistry {
  private readonly entities = new Map<EntityId, KnowledgeEntity>();
  private readonly claims = new Map<ClaimId, ScientificClaim>();
  private readonly relationships = new Map<RelationshipId, KnowledgeRelationship>();
  private readonly sources = new Map<SourceId, KnowledgeSource>();
  private readonly evidence = new Map<EvidenceId, ScientificEvidence>();

  registerEntity(entity: KnowledgeEntity): RegistrationResult<KnowledgeEntity> {
    const validation = validateKnowledgeEntity(entity);
    if (!validation.valid) return this.invalidRecord(entity, validation.issues);
    return this.register(this.entities, entity);
  }

  registerClaim(claim: ScientificClaim): RegistrationResult<ScientificClaim> {
    const validation = validateScientificClaim(claim);
    if (!validation.valid) return this.invalidRecord(claim, validation.issues);
    const duplicate = this.checkDuplicate(this.claims, claim.id);
    if (duplicate) return duplicate;

    const missingIds = this.missingReferences(
      [claim.subjectId, ...(claim.objectId ? [claim.objectId] : [])],
      claim.evidenceIds,
    );
    if (missingIds.length > 0) {
      return { ok: false, reason: "missing-reference", id: claim.id, missingIds };
    }

    this.claims.set(claim.id, claim);
    return { ok: true, value: claim };
  }

  registerRelationship(
    relationship: KnowledgeRelationship,
  ): RegistrationResult<KnowledgeRelationship> {
    const validation = validateKnowledgeRelationship(relationship);
    if (!validation.valid) return this.invalidRecord(relationship, validation.issues);
    const duplicate = this.checkDuplicate(this.relationships, relationship.id);
    if (duplicate) return duplicate;

    const missingIds = this.missingReferences(
      [relationship.subjectId, relationship.objectId],
      relationship.evidenceIds,
    );
    if (missingIds.length > 0) {
      return { ok: false, reason: "missing-reference", id: relationship.id, missingIds };
    }

    this.relationships.set(relationship.id, relationship);
    return { ok: true, value: relationship };
  }

  registerSource(source: KnowledgeSource): RegistrationResult<KnowledgeSource> {
    const validation = validateKnowledgeSource(source);
    if (!validation.valid) return this.invalidRecord(source, validation.issues);
    return this.register(this.sources, source);
  }

  registerEvidence(item: ScientificEvidence): RegistrationResult<ScientificEvidence> {
    const validation = validateScientificEvidence(item);
    if (!validation.valid) return this.invalidRecord(item, validation.issues);
    const duplicate = this.checkDuplicate(this.evidence, item.id);
    if (duplicate) return duplicate;

    const missingIds = item.sourceIds.filter((id) => !this.sources.has(id));
    if (missingIds.length > 0) {
      return { ok: false, reason: "missing-reference", id: item.id, missingIds };
    }

    this.evidence.set(item.id, item);
    return { ok: true, value: item };
  }

  getEntity(id: EntityId): KnowledgeEntity | undefined {
    return this.entities.get(id);
  }

  getClaim(id: ClaimId): ScientificClaim | undefined {
    return this.claims.get(id);
  }

  getRelationship(id: RelationshipId): KnowledgeRelationship | undefined {
    return this.relationships.get(id);
  }

  getSource(id: SourceId): KnowledgeSource | undefined {
    return this.sources.get(id);
  }

  getEvidence(id: EvidenceId): ScientificEvidence | undefined {
    return this.evidence.get(id);
  }

  findClaims(query: ClaimQuery = {}): ScientificClaim[] {
    return [...this.claims.values()].filter((claim) =>
      (query.subjectId === undefined || claim.subjectId === query.subjectId) &&
      (query.predicate === undefined || claim.predicate === query.predicate) &&
      (query.status === undefined || claim.status === query.status),
    );
  }

  findRelationships(query: RelationshipQuery = {}): KnowledgeRelationship[] {
    return [...this.relationships.values()].filter((relationship) =>
      (query.subjectId === undefined || relationship.subjectId === query.subjectId) &&
      (query.objectId === undefined || relationship.objectId === query.objectId) &&
      (query.predicate === undefined || relationship.predicate === query.predicate) &&
      (query.status === undefined || relationship.status === query.status),
    );
  }

  findRelatedEntities(id: EntityId, predicate?: string): KnowledgeEntity[] {
    const relatedIds = new Set<EntityId>();
    for (const relationship of this.findRelationships({ predicate })) {
      if (relationship.subjectId === id) relatedIds.add(relationship.objectId);
      if (relationship.objectId === id) relatedIds.add(relationship.subjectId);
    }
    return [...relatedIds]
      .map((relatedId) => this.entities.get(relatedId))
      .filter((entity): entity is KnowledgeEntity => entity !== undefined);
  }

  private register<Id extends string, Value extends { id: Id }>(
    collection: Map<Id, Value>,
    value: Value,
  ): RegistrationResult<Value> {
    const duplicate = this.checkDuplicate(collection, value.id);
    if (duplicate) return duplicate;
    collection.set(value.id, value);
    return { ok: true, value };
  }

  private checkDuplicate<Id extends string, Value>(
    collection: Map<Id, Value>,
    id: Id,
  ): RegistrationResult<never> | undefined {
    return collection.has(id)
      ? { ok: false, reason: "duplicate-id", id }
      : undefined;
  }

  private missingReferences(entityIds: EntityId[], evidenceIds: EvidenceId[]): string[] {
    return [
      ...entityIds.filter((id) => !this.entities.has(id)),
      ...evidenceIds.filter((id) => !this.evidence.has(id)),
    ];
  }

  private invalidRecord<T>(record: unknown, issues: string[]): RegistrationResult<T> {
    const id = typeof record === "object" && record !== null && "id" in record &&
      typeof record.id === "string"
      ? record.id
      : "";
    return { ok: false, reason: "invalid-record", id, issues };
  }
}
