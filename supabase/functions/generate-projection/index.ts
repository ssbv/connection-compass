import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectionData {
  person_name: string;
  analysis_data: {
    meta?: { overall_health_score?: number };
    dynamics?: {
      initiation_balance?: { person_a_pct?: number; person_b_pct?: number };
      emotional_labor?: { apologizes_repairs_more?: string; clarifies_more?: string };
    };
    emotional_extraction?: {
      user_states?: string[];
      user_intensity?: number;
      repair_signals?: { type: string; initiated_by: string; was_reciprocated: boolean }[];
      closure_indicators?: { type: string; confidence: string }[];
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { connections, timeframe, connection_id, user_id } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Build context from connections
    const connectionSummaries = (connections as ConnectionData[]).map((conn) => {
      const health = conn.analysis_data?.meta?.overall_health_score ?? 'unknown';
      const initiation = conn.analysis_data?.dynamics?.initiation_balance;
      const emotionalLabor = conn.analysis_data?.dynamics?.emotional_labor;
      const emotionalStates = conn.analysis_data?.emotional_extraction?.user_states ?? [];
      const repairSignals = conn.analysis_data?.emotional_extraction?.repair_signals ?? [];
      
      return `
Connection with ${conn.person_name}:
- Health Score: ${health}
- Initiation Balance: User ${initiation?.person_b_pct ?? 50}% vs Other ${initiation?.person_a_pct ?? 50}%
- Who repairs more: ${emotionalLabor?.apologizes_repairs_more ?? 'unknown'}
- Who clarifies more: ${emotionalLabor?.clarifies_more ?? 'unknown'}
- User emotional states detected: ${emotionalStates.join(', ') || 'none'}
- Repair attempts: ${repairSignals.length} (reciprocated: ${repairSignals.filter(r => r.was_reciprocated).length})
      `.trim();
    }).join('\n\n');

    const systemPrompt = `You are a relationship dynamics forecaster. Based on behavioral patterns observed in conversations, generate probability-based projections.

CRITICAL RULES:
1. Use probabilistic language ONLY: "likelihood", "tendency", "may", "could potentially"
2. NEVER diagnose or label attachment styles
3. Frame insights as patterns, not identity
4. Provide empowerment over determinism
5. Include confidence levels (low/medium/high) based on data availability
6. Be compassionate and non-judgmental

You must return ONLY valid JSON in this exact format:
{
  "burnout_likelihood": <0-100>,
  "inconsistency_likelihood": <0-100>,
  "secure_connection_likelihood": <0-100>,
  "emotional_safety_likelihood": <0-100>,
  "long_term_viability": <0-100>,
  "confidence": "low" | "medium" | "high",
  "summary": "<2-3 sentence probability-based summary>",
  "scenarios": {
    "both_unchanged": "<What may happen if both continue current patterns>",
    "user_changes": "<What may shift if only the user adjusts their approach>",
    "other_changes": "<What may shift if only the other person adjusts>",
    "both_improve": "<Potential outcomes if both work on the relationship>"
  }
}`;

    const userPrompt = `Generate a ${timeframe} projection based on these relationship patterns:

${connectionSummaries}

${connection_id ? `Focus specifically on the connection with ID: ${connection_id}` : 'Generate a global projection across all connections.'}

Consider:
- Current trajectory based on observed patterns
- Emotional labor distribution sustainability
- Repair pattern effectiveness
- Safety and consistency trends

Return ONLY the JSON object, no additional text.`;

    console.log('Generating projection for timeframe:', timeframe);
    console.log('Number of connections:', connections?.length ?? 0);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse JSON from:', content);
      throw new Error('Invalid JSON in AI response');
    }

    const projection = JSON.parse(jsonMatch[0]);
    const generated_at = new Date().toISOString();
    
    console.log('Projection generated successfully');

    // Save projection to database if user_id is provided
    if (user_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/projections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id,
            connection_id: connection_id || null,
            projection_type: connection_id ? 'per_connection' : 'global',
            projection_data: projection,
            generated_at
          })
        });
        
        if (!saveResponse.ok) {
          console.error('Failed to save projection:', await saveResponse.text());
        } else {
          console.log('Projection saved to database');
        }
      } catch (saveError) {
        console.error('Error saving projection:', saveError);
      }
    }

    return new Response(JSON.stringify({ 
      projection,
      timeframe,
      generated_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-projection:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
