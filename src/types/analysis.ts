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

// New Phase 2 Types - Emotional States
export type EmotionalStateType = 
  | 'confusion' | 'anxiety' | 'safety' | 'calm' | 'dismissed' 
  | 'valued' | 'chosen' | 'unseen' | 'unsafe';

export interface EmotionalState {
  id: string;
  user_id: string;
  connection_id?: string;
  snapshot_id?: string;
  state_type: EmotionalStateType;
  intensity: number;
  created_at: string;
}

// Repair Attempts
export type RepairAttemptType = 
  | 'repair_attempted' | 'repair_reciprocated' | 'abandoned' 
  | 'avoidant' | 'mutual_resolution';

export type RepairStatus = 'repaired' | 'partially_repaired' | 'unresolved';

export interface RepairAttempt {
  id: string;
  user_id: string;
  connection_id?: string;
  attempt_type: RepairAttemptType;
  status: RepairStatus;
  notes?: string;
  created_at: string;
}

// Projections
export interface ProjectionData {
  burnout_likelihood: number;
  inconsistency_likelihood: number;
  secure_connection_likelihood: number;
  emotional_safety_likelihood: number;
  long_term_viability: number;
  confidence?: 'low' | 'medium' | 'high';
  summary: string;
  scenarios?: {
    both_unchanged: string;
    user_changes: string;
    other_changes: string;
    both_improve: string;
  };
}

export interface Projection {
  id: string;
  user_id: string;
  connection_id?: string;
  projection_type: 'global_3m' | 'global_6m' | 'global_12m' | 'connection_specific';
  projection_data: ProjectionData;
  generated_at: string;
}

// User Patterns
export interface TimeSeriesPoint {
  date: string;
  initiation_user: number;
  initiation_others: number;
  connection_id?: string;
}

export interface EmotionalFingerprint {
  connection_id: string;
  person_name: string;
  states: Record<EmotionalStateType, number>;
}

export interface PatternData {
  time_series: TimeSeriesPoint[];
  emotional_fingerprints: Record<string, EmotionalFingerprint>;
}

export interface UserPatterns {
  id: string;
  user_id: string;
  initiation_ratio_user: number;
  initiation_ratio_others: number;
  clarity_load_user: number;
  clarity_load_others: number;
  repair_load_user: number;
  repair_load_others: number;
  emotional_labor_score: number;
  burnout_risk_score: number;
  pattern_data: PatternData;
  last_calculated_at: string;
}

// Enhanced Analysis with Emotional Extraction
export interface RepairSignal {
  type: RepairAttemptType;
  initiated_by: 'A' | 'B';
  snippet: string;
  was_reciprocated: boolean;
}

export interface ClosureIndicator {
  type: 'open' | 'partial_closure' | 'full_closure' | 'avoidant_exit';
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}

export interface EmotionalExtraction {
  user_states: EmotionalStateType[];
  user_intensity: number;
  repair_signals: RepairSignal[];
  closure_indicators: ClosureIndicator[];
}

export interface ReflectionOutput {
  what_just_happened: string;
  pattern_suggestion: string;
  next_step_options: {
    continue: { risks: string[]; benefits: string[]; boundary_consequences: string[] };
    pause: { risks: string[]; benefits: string[]; boundary_consequences: string[] };
    close: { risks: string[]; benefits: string[]; boundary_consequences: string[] };
  };
  reflection_prompts: string[];
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
  emotional_extraction?: EmotionalExtraction;
  reflection?: ReflectionOutput;
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
