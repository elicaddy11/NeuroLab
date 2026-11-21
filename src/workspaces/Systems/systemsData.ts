export interface NeuralSystem {
  id: string;
  name: string;
  shortName: string;
  color: string;
  overview: string;
  functions: string[];
  regions: string[];
  interactions: string[];
}

export const NEURAL_SYSTEMS: NeuralSystem[] = [
  {
    id: "executive-control",
    name: "Executive control",
    shortName: "Executive",
    color: "#22d3ee",
    overview: "Distributed frontoparietal circuits support goal-directed behavior by maintaining task context, selecting relevant information, and adapting actions.",
    functions: ["Goal maintenance and planning", "Working-memory-guided behavior", "Flexible allocation of attention"],
    regions: ["prefrontal-cortex", "frontal-lobe", "parietal-lobe", "thalamus"],
    interactions: ["salience-network", "default-mode", "memory", "motor-control"],
  },
  {
    id: "reward-motivation",
    name: "Reward and motivation",
    shortName: "Reward",
    color: "#f59e0b",
    overview: "Cortical and subcortical pathways evaluate outcomes, update predictions, and help translate motivational state into behavior.",
    functions: ["Reward learning and outcome evaluation", "Motivational vigor and action selection", "Value-guided decisions"],
    regions: ["prefrontal-cortex", "basal-ganglia", "amygdala", "hypothalamus"],
    interactions: ["executive-control", "memory", "salience-network", "motor-control"],
  },
  {
    id: "memory",
    name: "Memory",
    shortName: "Memory",
    color: "#a78bfa",
    overview: "Memory depends on coordinated medial temporal, cortical, and subcortical circuits that encode, consolidate, and retrieve different kinds of information.",
    functions: ["Episodic and relational memory", "Learning and consolidation", "Retrieval guided by current goals"],
    regions: ["hippocampus", "temporal-lobe", "prefrontal-cortex", "thalamus"],
    interactions: ["default-mode", "executive-control", "reward-motivation", "threat-processing"],
  },
  {
    id: "sensory-processing",
    name: "Sensory processing",
    shortName: "Sensory",
    color: "#38bdf8",
    overview: "Sensory pathways transform incoming signals through interacting subcortical relays and specialized cortical regions, with attention and context shaping perception.",
    functions: ["Feature extraction and perceptual integration", "Multisensory and spatial processing", "Context-sensitive sensory selection"],
    regions: ["thalamus", "parietal-lobe", "temporal-lobe", "occipital-lobe"],
    interactions: ["salience-network", "executive-control", "motor-control"],
  },
  {
    id: "motor-control",
    name: "Motor control",
    shortName: "Motor",
    color: "#34d399",
    overview: "Movement emerges from loops linking cortical motor areas, basal ganglia, cerebellum, thalamus, and brainstem—not from a single control center.",
    functions: ["Movement planning and execution", "Coordination, timing, and error correction", "Action selection and motor learning"],
    regions: ["frontal-lobe", "basal-ganglia", "cerebellum", "thalamus", "brainstem"],
    interactions: ["executive-control", "reward-motivation", "sensory-processing"],
  },
  {
    id: "threat-processing",
    name: "Threat and defensive processing",
    shortName: "Threat",
    color: "#fb7185",
    overview: "Defensive responses reflect coordinated evaluation of cues, context, internal state, and available actions across distributed circuits.",
    functions: ["Learning about threat predictors", "Contextual evaluation and memory", "Coordinating autonomic and behavioral responses"],
    regions: ["amygdala", "hippocampus", "hypothalamus", "brainstem", "prefrontal-cortex"],
    interactions: ["salience-network", "memory", "reward-motivation", "executive-control"],
  },
  {
    id: "default-mode",
    name: "Default mode network",
    shortName: "Default mode",
    color: "#c084fc",
    overview: "A set of interacting association regions often engaged during internally oriented cognition; its activity varies with task, state, and network coupling.",
    functions: ["Autobiographical and episodic retrieval", "Self-referential and social cognition", "Constructing or imagining event contexts"],
    regions: ["prefrontal-cortex", "hippocampus", "temporal-lobe", "parietal-lobe"],
    interactions: ["executive-control", "salience-network", "memory"],
  },
  {
    id: "salience-network",
    name: "Salience network",
    shortName: "Salience",
    color: "#f472b6",
    overview: "A distributed network involved in detecting behaviorally relevant internal and external events and coordinating changes in processing priorities.",
    functions: ["Detecting relevant or unexpected events", "Integrating interoceptive and sensory signals", "Coordinating shifts in network engagement"],
    regions: ["amygdala", "prefrontal-cortex", "parietal-lobe", "thalamus"],
    interactions: ["executive-control", "default-mode", "threat-processing", "sensory-processing"],
  },
];

export const NETWORK_NODES = [
  { id: "prefrontal-cortex", label: "Prefrontal cortex", x: 170, y: 112 },
  { id: "frontal-lobe", label: "Frontal lobe", x: 310, y: 82 },
  { id: "parietal-lobe", label: "Parietal lobe", x: 485, y: 130 },
  { id: "temporal-lobe", label: "Temporal lobe", x: 392, y: 286 },
  { id: "occipital-lobe", label: "Occipital lobe", x: 638, y: 186 },
  { id: "hippocampus", label: "Hippocampus", x: 258, y: 278 },
  { id: "amygdala", label: "Amygdala", x: 132, y: 258 },
  { id: "hypothalamus", label: "Hypothalamus", x: 205, y: 370 },
  { id: "thalamus", label: "Thalamus", x: 420, y: 185 },
  { id: "basal-ganglia", label: "Basal ganglia", x: 310, y: 190 },
  { id: "cerebellum", label: "Cerebellum", x: 590, y: 350 },
  { id: "brainstem", label: "Brainstem", x: 470, y: 366 },
];

export const NETWORK_EDGES = [
  ["prefrontal-cortex", "frontal-lobe"], ["prefrontal-cortex", "parietal-lobe"],
  ["prefrontal-cortex", "hippocampus"], ["prefrontal-cortex", "thalamus"],
  ["frontal-lobe", "parietal-lobe"], ["frontal-lobe", "basal-ganglia"],
  ["parietal-lobe", "occipital-lobe"], ["parietal-lobe", "thalamus"],
  ["temporal-lobe", "hippocampus"], ["temporal-lobe", "amygdala"],
  ["temporal-lobe", "occipital-lobe"], ["hippocampus", "amygdala"],
  ["amygdala", "hypothalamus"], ["hypothalamus", "brainstem"],
  ["basal-ganglia", "thalamus"], ["thalamus", "brainstem"],
  ["thalamus", "cerebellum"], ["cerebellum", "brainstem"],
  ["parietal-lobe", "temporal-lobe"], ["frontal-lobe", "thalamus"],
];
