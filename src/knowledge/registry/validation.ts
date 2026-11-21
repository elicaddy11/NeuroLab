import type { ScientificReviewStatus, ScientificStatus } from "../core/types";

export interface RecordValidation {
  valid: boolean;
  issues: string[];
}

const SCIENTIFIC_STATUSES: ScientificStatus[] = [
  "established",
  "simplified",
  "hypothetical",
  "simulated",
];
const REVIEW_STATUSES: ScientificReviewStatus[] = [
  "unreviewed",
  "source-checked",
  "expert-reviewed",
];
const CONFIDENCE_LEVELS = ["high", "moderate", "limited", "unknown"];
const NAME_KINDS = ["preferred", "abbreviation", "synonym"];
const RELATIONSHIP_DIRECTIONS = ["directed", "undirected"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isNonEmptyString);

function isOptionalStringList(value: unknown): boolean {
  return value === undefined || isStringList(value);
}

function isConfidence(value: unknown): boolean {
  return isRecord(value) &&
    CONFIDENCE_LEVELS.includes(String(value.level)) &&
    isNonEmptyString(value.description);
}

function isSpeciesContext(value: unknown): boolean {
  return isRecord(value) &&
    ["taxonId", "scientificName", "commonName"].some((key) => isNonEmptyString(value[key])) &&
    ["taxonId", "scientificName", "commonName"].every(
      (key) => value[key] === undefined || isNonEmptyString(value[key]),
    );
}

function isExperimentalContext(value: unknown): boolean {
  const keys = ["method", "paradigm", "population", "conditions", "description"];
  return isRecord(value) &&
    keys.some((key) => isNonEmptyString(value[key])) &&
    keys.every((key) => value[key] === undefined || isNonEmptyString(value[key]));
}

function isStatus(value: unknown): value is ScientificStatus {
  return typeof value === "string" && SCIENTIFIC_STATUSES.includes(value as ScientificStatus);
}

function isReviewStatus(value: unknown): value is ScientificReviewStatus {
  return typeof value === "string" &&
    REVIEW_STATUSES.includes(value as ScientificReviewStatus);
}

function isId(value: unknown): value is string {
  return isNonEmptyString(value);
}

function result(issues: string[]): RecordValidation {
  return { valid: issues.length === 0, issues };
}

function validateIdentity(record: Record<string, unknown>): string[] {
  return isId(record.id) ? [] : ["id must be a non-empty string."];
}

function validateMetadata(record: Record<string, unknown>): string[] {
  const issues: string[] = [];
  if (record.species !== undefined &&
      (!Array.isArray(record.species) || !record.species.every(isSpeciesContext))) {
    issues.push("species must contain valid species contexts.");
  }
  if (record.experimentalContext !== undefined &&
      (!Array.isArray(record.experimentalContext) ||
       !record.experimentalContext.every(isExperimentalContext))) {
    issues.push("experimentalContext must contain valid contexts.");
  }
  if (!isOptionalStringList(record.limitations)) {
    issues.push("limitations must contain non-empty strings.");
  }
  return issues;
}

function validateScientificStatement(record: Record<string, unknown>): string[] {
  const issues: string[] = [];
  if (!isStatus(record.status)) {
    issues.push("status must be established, simplified, hypothetical, or simulated.");
  }
  if (!isReviewStatus(record.reviewStatus)) {
    issues.push("reviewStatus must be unreviewed, source-checked, or expert-reviewed.");
  }
  if (record.reviewer !== undefined && !isNonEmptyString(record.reviewer)) {
    issues.push("reviewer must be a non-empty string when provided.");
  }
  if (record.reviewedAt !== undefined &&
      (!isNonEmptyString(record.reviewedAt) || Number.isNaN(Date.parse(record.reviewedAt)))) {
    issues.push("reviewedAt must be a valid date when provided.");
  }
  if (record.reviewStatus === "expert-reviewed" &&
      (!isNonEmptyString(record.reviewer) ||
       !isNonEmptyString(record.reviewedAt) ||
       Number.isNaN(Date.parse(record.reviewedAt)))) {
    issues.push("expert-reviewed records require a reviewer and valid reviewedAt date.");
  }
  if (!isConfidence(record.confidence)) {
    issues.push("confidence must have a supported level and non-empty description.");
  }
  if (!Array.isArray(record.evidenceIds) || !record.evidenceIds.every(isId)) {
    issues.push("evidenceIds must contain non-empty IDs.");
  }
  return [...issues, ...validateMetadata(record)];
}

export function validateKnowledgeEntity(value: unknown): RecordValidation {
  if (!isRecord(value)) return result(["entity must be an object."]);
  const issues = validateIdentity(value);
  if (!isNonEmptyString(value.kind)) issues.push("kind must be a non-empty string.");
  if (!Array.isArray(value.names) || value.names.length === 0) {
    issues.push("names must contain at least one localized name.");
  } else {
    if (!value.names.some((name) => isRecord(name) && name.kind === "preferred")) {
      issues.push("names must contain a preferred name.");
    }
    if (!value.names.every((name) =>
      isRecord(name) &&
      isNonEmptyString(name.value) &&
      isNonEmptyString(name.language) &&
      NAME_KINDS.includes(String(name.kind)),
    )) {
      issues.push("names must contain valid values, languages, and kinds.");
    }
  }
  return result(issues);
}

export function validateScientificClaim(value: unknown): RecordValidation {
  if (!isRecord(value)) return result(["claim must be an object."]);
  const issues = validateIdentity(value);
  if (!isId(value.subjectId)) issues.push("subjectId must be a non-empty ID.");
  if (!isNonEmptyString(value.predicate)) issues.push("predicate must be a non-empty string.");
  if (value.objectId !== undefined && !isId(value.objectId)) {
    issues.push("objectId must be a non-empty ID when provided.");
  }
  if (value.value !== undefined &&
      !(typeof value.value === "string" || typeof value.value === "boolean" ||
        (typeof value.value === "number" && Number.isFinite(value.value)))) {
    issues.push("value must be a finite number, string, or boolean.");
  }
  return result([...issues, ...validateScientificStatement(value)]);
}

export function validateKnowledgeRelationship(value: unknown): RecordValidation {
  if (!isRecord(value)) return result(["relationship must be an object."]);
  const issues = validateIdentity(value);
  if (!isId(value.subjectId)) issues.push("subjectId must be a non-empty ID.");
  if (!isNonEmptyString(value.predicate)) issues.push("predicate must be a non-empty string.");
  if (!isId(value.objectId)) issues.push("objectId must be a non-empty ID.");
  if (!RELATIONSHIP_DIRECTIONS.includes(String(value.direction))) {
    issues.push("direction must be directed or undirected.");
  }
  return result([...issues, ...validateScientificStatement(value)]);
}

export function validateKnowledgeSource(value: unknown): RecordValidation {
  if (!isRecord(value)) return result(["source must be an object."]);
  const issues = validateIdentity(value);
  if (!isNonEmptyString(value.title)) issues.push("title must be a non-empty string.");
  if (value.authors !== undefined && !isStringList(value.authors)) {
    issues.push("authors must contain non-empty strings.");
  }
  if (value.year !== undefined &&
      (typeof value.year !== "number" || !Number.isInteger(value.year) || value.year < 1)) {
    issues.push("year must be a positive integer.");
  }
  for (const field of [
    "containerTitle",
    "volume",
    "issue",
    "pages",
    "doi",
    "url",
    "publisher",
  ]) {
    if (value[field] !== undefined && !isNonEmptyString(value[field])) {
      issues.push(`${field} must be a non-empty string when provided.`);
    }
  }
  return result(issues);
}

export function validateScientificEvidence(value: unknown): RecordValidation {
  if (!isRecord(value)) return result(["evidence must be an object."]);
  const issues = validateIdentity(value);
  if (!Array.isArray(value.sourceIds) || !value.sourceIds.every(isId)) {
    issues.push("sourceIds must contain non-empty IDs.");
  }
  if (!isNonEmptyString(value.evidenceType)) {
    issues.push("evidenceType must be a non-empty string.");
  }
  if (!isConfidence(value.confidence)) {
    issues.push("confidence must have a supported level and non-empty description.");
  }
  return result([...issues, ...validateMetadata(value)]);
}
