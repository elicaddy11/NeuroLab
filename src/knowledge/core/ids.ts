type BrandedId<Kind extends string> = string & { readonly __idKind: Kind };

export type EntityId = BrandedId<"EntityId">;
export type ClaimId = BrandedId<"ClaimId">;
export type RelationshipId = BrandedId<"RelationshipId">;
export type SourceId = BrandedId<"SourceId">;
export type EvidenceId = BrandedId<"EvidenceId">;

function createId<Kind extends string>(value: string, kind: Kind): BrandedId<Kind> {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${kind} must not be empty.`);
  }
  return value as BrandedId<Kind>;
}

export const createEntityId = (value: string): EntityId => createId(value, "EntityId");
export const createClaimId = (value: string): ClaimId => createId(value, "ClaimId");
export const createRelationshipId = (value: string): RelationshipId =>
  createId(value, "RelationshipId");
export const createSourceId = (value: string): SourceId => createId(value, "SourceId");
export const createEvidenceId = (value: string): EvidenceId => createId(value, "EvidenceId");
