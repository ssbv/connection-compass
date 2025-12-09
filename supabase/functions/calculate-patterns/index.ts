import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Calculating patterns for user: ${user_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all connections with analysis data for this user
    const { data: connections, error: connectionsError } = await supabase
      .from("connections")
      .select("*")
      .eq("user_id", user_id);

    if (connectionsError) {
      console.error("Error fetching connections:", connectionsError);
      throw connectionsError;
    }

    if (!connections || connections.length === 0) {
      console.log("No connections found for user");
      return new Response(
        JSON.stringify({ message: "No connections to analyze" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate metrics from all connections
    let totalInitiationUser = 0;
    let totalInitiationOthers = 0;
    let clarityLoadUser = 0;
    let clarityLoadOthers = 0;
    let repairLoadUser = 0;
    let repairLoadOthers = 0;
    let emotionalLaborScore = 0;
    let count = 0;

    for (const conn of connections) {
      const data = conn.analysis_data;
      if (!data || !data.dynamics) continue;

      // Initiation balance
      const initA = data.dynamics.initiation_balance?.initiated_by_A_percent || 0;
      const initB = data.dynamics.initiation_balance?.initiated_by_B_percent || 0;
      totalInitiationOthers += initA;
      totalInitiationUser += initB;

      // Clarity load (who clarifies more)
      if (data.dynamics.emotional_labor?.who_clarifies_more === "B") {
        clarityLoadUser++;
      } else if (data.dynamics.emotional_labor?.who_clarifies_more === "A") {
        clarityLoadOthers++;
      }

      // Repair load (who repairs more)
      if (data.dynamics.emotional_labor?.who_repairs_more === "B") {
        repairLoadUser++;
      } else if (data.dynamics.emotional_labor?.who_repairs_more === "A") {
        repairLoadOthers++;
      }

      // Emotional labor score from individual analysis
      if (data.person_B?.scores?.Reciprocity !== undefined) {
        emotionalLaborScore += 100 - data.person_B.scores.Reciprocity;
      }

      count++;
    }

    if (count === 0) {
      console.log("No valid analysis data found");
      return new Response(
        JSON.stringify({ message: "No valid analysis data to calculate patterns" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate averages and ratios
    const avgInitiationUser = totalInitiationUser / count;
    const avgInitiationOthers = totalInitiationOthers / count;

    // Calculate burnout risk based on imbalances
    const laborImbalance = Math.abs(clarityLoadUser - clarityLoadOthers) + Math.abs(repairLoadUser - repairLoadOthers);
    const burnoutRisk = Math.min(100, 
      laborImbalance * 10 + 
      (clarityLoadUser > clarityLoadOthers ? 20 : 0) + 
      (repairLoadUser > repairLoadOthers ? 20 : 0)
    );

    const avgEmotionalLabor = emotionalLaborScore / count;

    const patternData = {
      user_id,
      initiation_ratio_user: avgInitiationUser,
      initiation_ratio_others: avgInitiationOthers,
      clarity_load_user: clarityLoadUser,
      clarity_load_others: clarityLoadOthers,
      repair_load_user: repairLoadUser,
      repair_load_others: repairLoadOthers,
      emotional_labor_score: avgEmotionalLabor,
      burnout_risk_score: burnoutRisk,
      last_calculated_at: new Date().toISOString(),
      pattern_data: {
        connection_count: count,
        calculated_at: new Date().toISOString()
      }
    };

    console.log("Pattern data calculated:", patternData);

    // Upsert the pattern data
    const { error: upsertError } = await supabase
      .from("user_patterns")
      .upsert(patternData, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Error upserting patterns:", upsertError);
      throw upsertError;
    }

    console.log("Patterns calculated and saved successfully");

    return new Response(
      JSON.stringify({ success: true, patterns: patternData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error calculating patterns:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
