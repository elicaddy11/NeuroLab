export interface BrainRegionDetails {
  location: string;
  description: string;
  functions: string[];
  connections: string[];
  systems: string[];
}

export interface BrainRegion {
  id: string;
  label: string;
  abbr: string;
  color?: string;
  details?: BrainRegionDetails;
  children?: BrainRegion[];
}

const structure = (
  id: string,
  label: string,
  abbr: string,
  details: BrainRegionDetails,
): BrainRegion => ({ id, label, abbr, details });

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: "cerebral-cortex",
    label: "Cerebral cortex",
    abbr: "CTX",
    color: "var(--accent-cyan)",
    children: [
      structure("frontal-lobe", "Frontal lobe", "FL", {
        location: "Anterior portion of each cerebral hemisphere, in front of the central sulcus.",
        description:
          "A large cortical lobe containing motor, premotor, and association areas. Its subdivisions contribute to action, language, and goal-directed behavior.",
        functions: ["Voluntary movement", "Planning and flexible behavior", "Speech production in the dominant hemisphere"],
        connections: ["prefrontal-cortex", "parietal-lobe", "temporal-lobe", "basal-ganglia", "thalamus"],
        systems: ["Executive control", "Motor control", "Sensory processing"],
      }),
      structure("prefrontal-cortex", "Prefrontal cortex", "PFC", {
        location: "Association cortex at the front of the frontal lobes, anterior to premotor regions.",
        description:
          "A set of interconnected association areas that help use goals and context to guide thought and action; it operates within distributed networks.",
        functions: ["Working memory and goal maintenance", "Planning and decision-making", "Cognitive control and social behavior"],
        connections: ["frontal-lobe", "parietal-lobe", "thalamus", "basal-ganglia", "hippocampus"],
        systems: ["Executive control", "Reward and motivation", "Default mode network", "Salience network"],
      }),
      structure("parietal-lobe", "Parietal lobe", "PL", {
        location: "Upper rear portion of each cerebral hemisphere, behind the central sulcus.",
        description:
          "A cortical lobe that integrates bodily sensation with spatial and multisensory information.",
        functions: ["Touch and body-sensation processing", "Spatial attention and body representation", "Multisensory integration"],
        connections: ["frontal-lobe", "prefrontal-cortex", "temporal-lobe", "thalamus"],
        systems: ["Sensory processing", "Executive control", "Motor control", "Salience network"],
      }),
      structure("temporal-lobe", "Temporal lobe", "TL", {
        location: "Lateral and inferior cerebral cortex, beneath the lateral sulcus.",
        description:
          "A cortical lobe involved in auditory processing and recognition, with medial temporal structures supporting memory.",
        functions: ["Auditory perception", "Language comprehension in the dominant hemisphere", "Object and face recognition"],
        connections: ["frontal-lobe", "parietal-lobe", "hippocampus", "amygdala", "thalamus"],
        systems: ["Sensory processing", "Memory", "Threat and defensive processing", "Default mode network"],
      }),
      structure("occipital-lobe", "Occipital lobe", "OL", {
        location: "Posterior part of the cerebral hemispheres.",
        description:
          "Cortical regions that perform early and higher-order processing of visual information.",
        functions: ["Visual feature processing", "Motion and form perception", "Visual integration with other cortical areas"],
        connections: ["temporal-lobe", "parietal-lobe", "thalamus"],
        systems: ["Sensory processing", "Salience network"],
      }),
    ],
  },
  {
    id: "subcortical-structures",
    label: "Subcortical structures",
    abbr: "SUB",
    color: "var(--accent-violet)",
    children: [
      structure("hippocampus", "Hippocampus", "HPC", {
        location: "Medial temporal lobe, along the floor of each temporal horn of the lateral ventricle.",
        description:
          "A paired medial temporal structure important for forming and organizing episodic and spatial memories.",
        functions: ["Episodic memory formation", "Relational and spatial learning", "Context-dependent memory retrieval"],
        connections: ["temporal-lobe", "prefrontal-cortex", "amygdala", "thalamus"],
        systems: ["Memory", "Default mode network", "Threat and defensive processing"],
      }),
      structure("amygdala", "Amygdala", "AMY", {
        location: "Medial temporal lobe, anterior to the hippocampal formation.",
        description:
          "A group of nuclei that helps evaluate biologically relevant cues and coordinate learning and responses with other brain systems.",
        functions: ["Learning about emotional significance", "Modulating memory for salient events", "Coordinating context-sensitive responses"],
        connections: ["temporal-lobe", "hippocampus", "prefrontal-cortex", "hypothalamus", "thalamus"],
        systems: ["Threat and defensive processing", "Reward and motivation", "Salience network", "Memory"],
      }),
      structure("hypothalamus", "Hypothalamus", "HY", {
        location: "Ventral diencephalon, below the thalamus and adjacent to the third ventricle.",
        description:
          "A small collection of nuclei that links neural, endocrine, and autonomic regulation to internal bodily state.",
        functions: ["Homeostatic regulation", "Autonomic and endocrine coordination", "Sleep-wake and motivated behavior regulation"],
        connections: ["thalamus", "amygdala", "hippocampus", "brainstem"],
        systems: ["Reward and motivation", "Threat and defensive processing", "Salience network"],
      }),
      structure("thalamus", "Thalamus", "THA", {
        location: "Paired gray-matter structures in the diencephalon, flanking the third ventricle.",
        description:
          "A set of nuclei that relay and transform much sensory and motor information and participate in recurrent cortical communication.",
        functions: ["Sensory relay (with olfaction as a notable exception)", "Cortical-state regulation", "Motor and cognitive circuit coordination"],
        connections: ["prefrontal-cortex", "parietal-lobe", "temporal-lobe", "occipital-lobe", "basal-ganglia", "brainstem"],
        systems: ["Sensory processing", "Motor control", "Executive control"],
      }),
      structure("basal-ganglia", "Basal ganglia", "BG", {
        location: "Deep forebrain nuclei, including the striatum, globus pallidus, and associated nuclei.",
        description:
          "Interconnected subcortical nuclei that participate in parallel loops with cortex and thalamus.",
        functions: ["Action selection and movement regulation", "Habit and reinforcement learning", "Cognitive and motivational control"],
        connections: ["prefrontal-cortex", "frontal-lobe", "thalamus", "hypothalamus"],
        systems: ["Motor control", "Reward and motivation", "Executive control"],
      }),
    ],
  },
  {
    id: "posterior-fossa",
    label: "Posterior fossa",
    abbr: "PF",
    color: "var(--accent-amber)",
    children: [
      structure("cerebellum", "Cerebellum", "CBL", {
        location: "Posterior cranial fossa, behind the pons and medulla and below the occipital lobes.",
        description:
          "A highly organized structure that compares intended and ongoing activity to support adaptive coordination across motor and nonmotor domains.",
        functions: ["Movement coordination and error correction", "Motor learning and timing", "Contributions to cognitive and affective processing"],
        connections: ["brainstem", "thalamus", "frontal-lobe", "parietal-lobe"],
        systems: ["Motor control", "Executive control", "Sensory processing"],
      }),
      structure("brainstem", "Brainstem", "BS", {
        location: "Between the diencephalon and spinal cord; comprises the midbrain, pons, and medulla.",
        description:
          "A collection of pathways and nuclei essential for communication with the spinal cord and regulation of vital functions.",
        functions: ["Breathing and cardiovascular regulation", "Arousal and sleep-wake regulation", "Cranial nerve functions and ascending/descending pathways"],
        connections: ["thalamus", "hypothalamus", "cerebellum"],
        systems: ["Motor control", "Sensory processing", "Threat and defensive processing"],
      }),
    ],
  },
];

export interface BrainRegionEntry {
  region: BrainRegion;
  parent: BrainRegion | null;
}

export function findBrainRegion(id: string): BrainRegionEntry | null {
  const findIn = (
    regions: BrainRegion[],
    parent: BrainRegion | null,
  ): BrainRegionEntry | null => {
    for (const region of regions) {
      if (region.id === id) return { region, parent };
      const match = findIn(region.children ?? [], region);
      if (match) return match;
    }
    return null;
  };

  return findIn(BRAIN_REGIONS, null);
}

export function getBrainStructure(id: string): BrainRegion | null {
  return findBrainRegion(id)?.region.details ? findBrainRegion(id)?.region ?? null : null;
}
