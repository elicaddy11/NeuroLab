import type {
  ClaimId,
  EntityId,
  EvidenceId,
  RelationshipId,
} from "./ids";

export type ScientificStatus = "established" | "simplified" | "hypothetical" | "simulated";
export type ScientificReviewStatus = "unreviewed" | "source-checked" | "expert-reviewed";

export type KnowledgeEntityKind =
  | "anatomical-structure"
  | "biological-mechanism"
  | "neural-circuit"
  | "cognitive-process"
  | "investigation"
  | (string & {});

export interface LocalizedName {
  value: string;
  language: string;
  kind: "preferred" | "abbreviation" | "synonym";
}

export interface KnowledgeEntity {
  id: EntityId;
  kind: KnowledgeEntityKind;
  names: LocalizedName[];
}

export interface SpeciesContext {
  taxonId?: string;
  scientificName?: string;
  commonName?: string;
}

export interface ExperimentalContext {
  method?: string;
  paradigm?: string;
  population?: string;
  conditions?: string;
  description?: string;
}

export interface ConfidenceDescription {
  level: "high" | "moderate" | "limited" | "unknown";
  description: string;
}

export interface ScientificClaim {
  id: ClaimId;
  subjectId: EntityId;
  predicate: string;
  objectId?: EntityId;
  value?: string | number | boolean;
  status: ScientificStatus;
  reviewStatus: ScientificReviewStatus;
  reviewer?: string;
  reviewedAt?: string;
  evidenceIds: EvidenceId[];
  confidence: ConfidenceDescription;
  species?: SpeciesContext[];
  experimentalContext?: ExperimentalContext[];
  limitations?: string[];
}

export interface KnowledgeRelationship {
  id: RelationshipId;
  subjectId: EntityId;
  predicate: string;
  objectId: EntityId;
  direction: "directed" | "undirected";
  status: ScientificStatus;
  reviewStatus: ScientificReviewStatus;
  reviewer?: string;
  reviewedAt?: string;
  evidenceIds: EvidenceId[];
  confidence: ConfidenceDescription;
  species?: SpeciesContext[];
  experimentalContext?: ExperimentalContext[];
  limitations?: string[];
}
