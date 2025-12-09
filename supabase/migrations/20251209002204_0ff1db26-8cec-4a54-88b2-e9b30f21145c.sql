-- =============================================
-- CONNECTION COMPASS: Phase 1 Database Schema
-- =============================================

-- Extended table for tracking emotional states per conversation
CREATE TABLE public.emotional_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.connections(id) ON DELETE CASCADE,
  snapshot_id uuid REFERENCES public.snapshots(id) ON DELETE CASCADE,
  state_type text NOT NULL, -- 'confusion', 'anxiety', 'safety', 'calm', 'dismissed', 'valued', 'chosen', 'unseen', 'unsafe'
  intensity integer NOT NULL DEFAULT 3 CHECK (intensity >= 1 AND intensity <= 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emotional_states ENABLE ROW LEVEL SECURITY;

-- RLS policies for emotional_states
CREATE POLICY "Users can view their own emotional states"
ON public.emotional_states FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emotional states"
ON public.emotional_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotional states"
ON public.emotional_states FOR DELETE
USING (auth.uid() = user_id);

-- Repair tracking table
CREATE TABLE public.repair_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.connections(id) ON DELETE CASCADE,
  attempt_type text NOT NULL, -- 'repair_attempted', 'repair_reciprocated', 'abandoned', 'avoidant', 'mutual_resolution'
  status text NOT NULL DEFAULT 'unresolved', -- 'repaired', 'partially_repaired', 'unresolved'
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.repair_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for repair_attempts
CREATE POLICY "Users can view their own repair attempts"
ON public.repair_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own repair attempts"
ON public.repair_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repair attempts"
ON public.repair_attempts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repair attempts"
ON public.repair_attempts FOR DELETE
USING (auth.uid() = user_id);

-- Projections table (stores AI-generated forecasts)
CREATE TABLE public.projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.connections(id) ON DELETE SET NULL, -- NULL = global projection
  projection_type text NOT NULL, -- 'global_3m', 'global_6m', 'global_12m', 'connection_3m', 'connection_6m', 'connection_12m'
  projection_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projections ENABLE ROW LEVEL SECURITY;

-- RLS policies for projections
CREATE POLICY "Users can view their own projections"
ON public.projections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projections"
ON public.projections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projections"
ON public.projections FOR DELETE
USING (auth.uid() = user_id);

-- User behavioral patterns cache (aggregated metrics)
CREATE TABLE public.user_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  initiation_ratio_user numeric DEFAULT 0,
  initiation_ratio_others numeric DEFAULT 0,
  clarity_load_user numeric DEFAULT 0,
  clarity_load_others numeric DEFAULT 0,
  repair_load_user numeric DEFAULT 0,
  repair_load_others numeric DEFAULT 0,
  emotional_labor_score numeric DEFAULT 0,
  burnout_risk_score numeric DEFAULT 0,
  pattern_data jsonb DEFAULT '{}'::jsonb, -- Additional aggregated data
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_patterns
CREATE POLICY "Users can view their own patterns"
ON public.user_patterns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patterns"
ON public.user_patterns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
ON public.user_patterns FOR UPDATE
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_emotional_states_user_id ON public.emotional_states(user_id);
CREATE INDEX idx_emotional_states_connection_id ON public.emotional_states(connection_id);
CREATE INDEX idx_emotional_states_state_type ON public.emotional_states(state_type);
CREATE INDEX idx_repair_attempts_user_id ON public.repair_attempts(user_id);
CREATE INDEX idx_repair_attempts_connection_id ON public.repair_attempts(connection_id);
CREATE INDEX idx_projections_user_id ON public.projections(user_id);
CREATE INDEX idx_projections_connection_id ON public.projections(connection_id);