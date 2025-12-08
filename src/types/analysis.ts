export interface ScoreWithConfidence {
  score: number;
  confidence: "low" | "medium" | "high";
}

export interface RadarChart {
  dimensions: string[];
  values: number[];
}

export interface PersonScores {
  safety: ScoreWithConfidence;
  accountability: ScoreWithConfidence;
  emotional_availability: ScoreWithConfidence;
  reciprocity: ScoreWithConfidence;
  clarity: ScoreWithConfidence;
  boundaries: ScoreWithConfidence;
  initiation: ScoreWithConfidence;
}

export interface ExampleAttribution {
  snippet: string;
  message_index: number;
  direction: string;
  comment: string;
}

export interface Person {
  label: string;
  scores: PersonScores;
  radar_chart: RadarChart;
  narrative_summary: string;
  strengths: string[];
  risks: string[];
}

export interface InitiationBalance {
  initiated_by_A_percent: number;
  initiated_by_B_percent: number;
  confidence: "low" | "medium" | "high";
}

export interface EmotionalLabor {
  who_repairs_more: string;
  who_clarifies_more: string;
  notes: string;
}

export interface BoundaryInteraction {
  summary: string;
  flags: string[];
}

export interface EscalationPattern {
  pattern: string;
  notes: string;
}

export interface Dynamics {
  initiation_balance: InitiationBalance;
  emotional_labor: EmotionalLabor;
  boundary_interaction: BoundaryInteraction;
  escalation_pattern: EscalationPattern;
  who_carries_connection: string;
  who_adjusts_more: string;
}

export interface ExamplesByDimension {
  safety: ExampleAttribution[];
  accountability: ExampleAttribution[];
  emotional_availability: ExampleAttribution[];
  reciprocity: ExampleAttribution[];
  clarity: ExampleAttribution[];
  boundaries: ExampleAttribution[];
  initiation: ExampleAttribution[];
}

export interface ExampleAttributions {
  by_dimension: {
    A: ExamplesByDimension;
    B: ExamplesByDimension;
  };
}

export interface AnalysisResult {
  meta: {
    overall_conversation_health_score: number;
    confidence: "low" | "medium" | "high";
    summary: string;
    traffic_light: "green" | "yellow" | "red";
  };
  overall_results: {
    mutual_respect: string;
    power_balance: string;
    consistency: string;
    headline_flags: string[];
  };
  people: {
    A: Person;
    B: Person;
  };
  dynamics: Dynamics;
  example_attributions: ExampleAttributions;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  preview?: string;
  extractedText?: string;
}

export interface Snapshot {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  extracted_text: string | null;
  connection_id: string | null;
}

export interface Connection {
  id: string;
  user_id: string;
  person_name: string;
  analysis_data: AnalysisResult | null;
  notes: string | null;
  analysis_date: string | null;
  created_at: string;
  updated_at: string;
  snapshots?: Snapshot[];
}
