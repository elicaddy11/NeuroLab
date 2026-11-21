import {
  createClaimId,
  createEntityId,
  createEvidenceId,
  createRelationshipId,
  createSourceId,
} from "../core/ids";
import type {
  KnowledgeRelationship,
  ScientificClaim,
} from "../core/types";
import type { ScientificEvidence } from "../evidence/scientificEvidence";
import type { KnowledgeSource } from "../evidence/sources";

const occipitalLobeId = createEntityId("occipital-lobe");
const parietalLobeId = createEntityId("parietal-lobe");
const temporalLobeId = createEntityId("temporal-lobe");

const grillSpectorSourceId = createSourceId("grill-spector-malach-2004");
const wandellSourceId = createSourceId("wandell-dumoulin-brewer-2007");
const kravitzSourceId = createSourceId("kravitz-saleem-baker-mishkin-2011");

const humanVisualCortexEvidenceId = createEvidenceId(
  "occipital-human-visual-cortex-review",
);
const humanVisualMapsEvidenceId = createEvidenceId(
  "occipital-human-visual-maps-review",
);
const visuospatialPathwaysEvidenceId = createEvidenceId(
  "occipital-visuospatial-pathways-review",
);

const humanSpecies = [{ taxonId: "9606", scientificName: "Homo sapiens", commonName: "human" }];

export const OCCIPITAL_LOBE_SOURCES: KnowledgeSource[] = [
  {
    id: grillSpectorSourceId,
    title: "The human visual cortex",
    authors: ["Kalanit Grill-Spector", "Rafael Malach"],
    year: 2004,
    containerTitle: "Annual Review of Neuroscience",
    volume: "27",
    pages: "649-677",
    doi: "10.1146/annurev.neuro.27.070203.144220",
    url: "https://doi.org/10.1146/annurev.neuro.27.070203.144220",
    publisher: "Annual Reviews",
  },
  {
    id: wandellSourceId,
    title: "Visual field maps in human cortex",
    authors: ["Brian A. Wandell", "Serge O. Dumoulin", "Alyssa A. Brewer"],
    year: 2007,
    containerTitle: "Neuron",
    volume: "56",
    issue: "2",
    pages: "366-383",
    doi: "10.1016/j.neuron.2007.10.012",
    url: "https://doi.org/10.1016/j.neuron.2007.10.012",
    publisher: "Cell Press",
  },
  {
    id: kravitzSourceId,
    title: "A new neural framework for visuospatial processing",
    authors: [
      "Dwight J. Kravitz",
      "Kadharbatcha S. Saleem",
      "Chris I. Baker",
      "Mortimer Mishkin",
    ],
    year: 2011,
    containerTitle: "Nature Reviews Neuroscience",
    volume: "12",
    issue: "4",
    pages: "217-230",
    doi: "10.1038/nrn3008",
    url: "https://doi.org/10.1038/nrn3008",
    publisher: "Springer Nature",
  },
];

export const OCCIPITAL_LOBE_EVIDENCE: ScientificEvidence[] = [
  {
    id: humanVisualCortexEvidenceId,
    sourceIds: [grillSpectorSourceId],
    evidenceType: "peer-reviewed review article",
    confidence: {
      level: "moderate",
      description: "A review synthesizes human visual-cortex research on functional specialization and hierarchical processing.",
    },
    species: humanSpecies,
    experimentalContext: [{
      method: "Review of human visual neuroscience literature",
      description: "Review synthesis; not a new experiment.",
    }],
    limitations: ["The article is a review and reflects the evidence available through its publication date."],
  },
  {
    id: humanVisualMapsEvidenceId,
    sourceIds: [wandellSourceId],
    evidenceType: "peer-reviewed review article",
    confidence: {
      level: "moderate",
      description: "The review summarizes human visual-field mapping studies, including functional MRI evidence.",
    },
    species: humanSpecies,
    experimentalContext: [{
      method: "Review of human retinotopic mapping studies, including functional MRI",
      description: "The source discusses multiple mapped regions and identifies some functional assignments as hypotheses.",
    }],
    limitations: [
      "The review notes that additional maps and their functional relationships remain under investigation.",
    ],
  },
  {
    id: visuospatialPathwaysEvidenceId,
    sourceIds: [kravitzSourceId],
    evidenceType: "peer-reviewed review article",
    confidence: {
      level: "moderate",
      description: "The review synthesizes evidence for dorsal and ventral cortical visual pathways and their contributions.",
    },
    experimentalContext: [{
      method: "Review of visual pathway anatomy and visuospatial-processing studies",
      population: "The review discusses human and non-human animal research.",
    }],
    limitations: [
      "The pathway framework is distributed; the review does not attribute these functions to the occipital lobe alone.",
    ],
  },
];

function claim(
  id: string,
  predicate: string,
  value: string,
  status: ScientificClaim["status"],
  evidenceIds: ScientificClaim["evidenceIds"],
  confidenceDescription: string,
  options: Pick<ScientificClaim, "species" | "experimentalContext" | "limitations"> = {},
): ScientificClaim {
  return {
    id: createClaimId(`occipital-lobe:${id}`),
    subjectId: occipitalLobeId,
    predicate,
    value,
    status,
    reviewStatus: "source-checked",
    evidenceIds,
    confidence: { level: "moderate", description: confidenceDescription },
    ...options,
  };
}

export const OCCIPITAL_LOBE_CLAIMS: ScientificClaim[] = [
  claim(
    "beginner-explanation",
    "beginner-explanation",
    "The occipital lobe includes cortical areas that process visual input. Visual perception depends on several specialized areas working as a broader network, not on one isolated spot.",
    "simplified",
    [humanVisualCortexEvidenceId, humanVisualMapsEvidenceId],
    "This introductory summary is supported by reviews of human visual-cortex organization and intentionally omits area-level detail.",
    {
      species: humanSpecies,
      limitations: [
        "Educational simplification: visual processing is distributed and not exclusive to the occipital lobe.",
      ],
    },
  ),
  claim(
    "advanced-explanation",
    "advanced-explanation",
    "Human visual cortex contains multiple retinotopic maps in medial, lateral, ventral, and dorsal occipital regions, with additional maps in posterior parietal cortex. These maps are associated with functional and perceptual properties, although some map assignments and relationships remain hypotheses.",
    "established",
    [humanVisualMapsEvidenceId],
    "The broad presence and distribution of human visual-field maps is supported by a review of mapping studies; exact functional assignments are not all settled.",
    {
      species: humanSpecies,
      experimentalContext: [{
        method: "Human retinotopic mapping, including functional MRI",
      }],
      limitations: [
        "The source explicitly notes that some maps and functional relationships remain hypotheses or require further measurement.",
      ],
    },
  ),
  claim(
    "retinotopic-maps",
    "function",
    "Visual-field maps represent nearby visual-field locations in nearby cortical locations; multiple such maps have been identified in occipital visual cortex.",
    "established",
    [humanVisualMapsEvidenceId],
    "A review of human mapping studies describes multiple visual-field maps, while noting that their number and functional relations continue to be studied.",
    {
      species: humanSpecies,
      experimentalContext: [{
        method: "Human functional MRI retinotopic mapping studies reviewed in the source",
      }],
      limitations: [
        "This describes cortical visual areas and does not imply every occipital region has the same map or role.",
      ],
    },
  ),
  claim(
    "specialization-and-hierarchy",
    "function",
    "Human visual cortical areas show functional specialization and hierarchical processing related to visual perception.",
    "established",
    [humanVisualCortexEvidenceId],
    "The cited review synthesizes evidence for functional specialization and hierarchical processing in human visual cortex.",
    {
      species: humanSpecies,
      limitations: [
        "Processing is distributed across visual cortical areas; this should not be read as a single lobe performing the entire task.",
      ],
    },
  ),
  claim(
    "visual-perception",
    "cognitive-contribution",
    "Visual cortical organization is related to visual perception.",
    "established",
    [humanVisualCortexEvidenceId],
    "The cited review explicitly examines the relation between human visual-cortex organization and visual perception.",
    { species: humanSpecies },
  ),
  claim(
    "visuospatial-processing",
    "cognitive-contribution",
    "Distributed visual pathways contribute to visuospatial processing, including spatial working memory, visually guided action, and navigation; these contributions are not attributable to the occipital lobe alone.",
    "established",
    [visuospatialPathwaysEvidenceId],
    "A pathway review describes these functions as supported by distributed pathways emerging from the cortical visual system.",
    {
      limitations: [
        "The cited review describes distributed pathway contributions, not functions localized exclusively to the occipital lobe.",
      ],
    },
  ),
];

function pathwayRelationship(
  id: string,
  objectId: ReturnType<typeof createEntityId>,
  predicate: string,
): KnowledgeRelationship {
  return {
    id: createRelationshipId(`occipital-lobe:${id}`),
    subjectId: occipitalLobeId,
    predicate,
    objectId,
    direction: "directed",
    status: "established",
    reviewStatus: "source-checked",
    evidenceIds: [visuospatialPathwaysEvidenceId],
    confidence: {
      level: "moderate",
      description: "A review supports cortical visual pathways extending from visual cortex toward distributed downstream areas.",
    },
    experimentalContext: [{
      method: "Review of cortical visual pathway anatomy",
    }],
    limitations: [
      "Pathway-level association only; this does not assert a direct projection between every part of these lobes or imply that the target region acts alone.",
    ],
  };
}

export const OCCIPITAL_LOBE_RELATIONSHIPS: KnowledgeRelationship[] = [
  pathwayRelationship(
    "dorsal-visual-pathway-to-parietal",
    parietalLobeId,
    "dorsal-visual-pathway-extends-to",
  ),
  pathwayRelationship(
    "ventral-visual-pathway-to-temporal",
    temporalLobeId,
    "ventral-visual-pathway-extends-to",
  ),
];
