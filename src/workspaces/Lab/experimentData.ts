export interface ExperimentPhase {
  label: string;
  duration: number;
  description: string;
  color: string;
}

export interface ExperimentTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  protocol: string;
  phases: ExperimentPhase[];
}

export interface LearningExperiment {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export const LEARNING_EXPERIMENTS: LearningExperiment[] = [
  {
    id: "reward-learning",
    name: "Reward prediction and learning",
    description: "Compare expected and observed outcomes to explore a simple prediction-error update.",
    keywords: ["reward", "prediction", "prediction error", "expected outcome", "actual outcome", "error", "learning rate", "reinforcement"],
  },
  {
    id: "memory-formation",
    name: "Memory formation",
    description: "Adjust encoding, consolidation, and retrieval delay in a conceptual retention model.",
    keywords: ["memory", "encoding", "consolidation", "retrieval", "retention", "forgetting"],
  },
  {
    id: "stress-performance",
    name: "Stress and cognitive performance",
    description: "Explore a simplified inverted-U relationship between arousal, attention, and working memory.",
    keywords: ["stress", "arousal", "attention", "working memory", "cognitive performance"],
  },
];

export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  {
    id: "resting-state",
    code: "RS-01",
    name: "Resting state",
    category: "BASELINE",
    description: "A simple eyes-open baseline sequence illustrating the structure of a resting-state recording session.",
    protocol: "Resting baseline · eyes open",
    phases: [
      { label: "Setup", duration: 0.15, description: "Establish a stable baseline.", color: "#3b82f6" },
      { label: "Baseline", duration: 0.65, description: "Maintain relaxed visual fixation.", color: "#22d3ee" },
      { label: "Wrap-up", duration: 0.2, description: "End the illustrative run.", color: "#8b5cf6" },
    ],
  },
  {
    id: "oddball",
    code: "OD-02",
    name: "Auditory oddball",
    category: "SENSORY",
    description: "A schematic frequent/rare event sequence for exploring stimulus timing and attention.",
    protocol: "Auditory events · frequent / rare",
    phases: [
      { label: "Instructions", duration: 0.2, description: "Introduce the event sequence.", color: "#3b82f6" },
      { label: "Frequent tones", duration: 0.5, description: "Present the standard event stream.", color: "#22d3ee" },
      { label: "Rare tones", duration: 0.2, description: "Interleave infrequent target events.", color: "#f59e0b" },
      { label: "Recovery", duration: 0.1, description: "Close the protocol.", color: "#8b5cf6" },
    ],
  },
  {
    id: "working-memory",
    code: "WM-03",
    name: "Working memory",
    category: "COGNITION",
    description: "A conceptual block design for a working-memory task; no stimuli or participant responses are collected.",
    protocol: "Memory task · alternating blocks",
    phases: [
      { label: "Instructions", duration: 0.16, description: "Set up the task context.", color: "#3b82f6" },
      { label: "Control block", duration: 0.28, description: "Attend to the comparison sequence.", color: "#34d399" },
      { label: "Memory block", duration: 0.4, description: "Maintain and update task information.", color: "#a78bfa" },
      { label: "Rest", duration: 0.16, description: "Return to a neutral interval.", color: "#22d3ee" },
    ],
  },
];
