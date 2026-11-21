import type { EvidenceId, SourceId } from "../core/ids";
import type {
  ConfidenceDescription,
  ExperimentalContext,
  SpeciesContext,
} from "../core/types";

export interface ScientificEvidence {
  id: EvidenceId;
  sourceIds: SourceId[];
  evidenceType: string;
  confidence: ConfidenceDescription;
  species?: SpeciesContext[];
  experimentalContext?: ExperimentalContext[];
  limitations?: string[];
}
