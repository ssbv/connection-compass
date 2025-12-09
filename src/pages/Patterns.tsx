import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Connection, AnalysisResult, TimeSeriesPoint } from "@/types/analysis";
import { InitiationTrendsChart } from "@/components/patterns/InitiationTrendsChart";
import { ClarificationRepairPanel } from "@/components/patterns/ClarificationRepairPanel";
import { EmotionalLaborEngine } from "@/components/patterns/EmotionalLaborEngine";
import { EmotionalStateHeatMap } from "@/components/patterns/EmotionalStateHeatMap";
import { ConnectionFilter } from "@/components/patterns/ConnectionFilter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Patterns() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [compareConnectionId, setCompareConnectionId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"all" | "30d">("all");

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .eq("user_id", user?.id)
        .order("analysis_date", { ascending: true });

      if (error) throw error;
      
      const typedData = (data || []).map(conn => ({
        ...conn,
        analysis_data: conn.analysis_data as unknown as AnalysisResult | null
      }));
      
      setConnections(typedData);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const filteredConnections = connections.filter(conn => {
      if (!conn.analysis_data) return false;
      if (selectedConnectionId && conn.id !== selectedConnectionId) return false;
      
      if (timeRange === "30d" && conn.analysis_date) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(conn.analysis_date) >= thirtyDaysAgo;
      }
      return true;
    });

    if (filteredConnections.length === 0) {
      return null;
    }

    // Aggregate initiation balance
    let totalInitiationUser = 0;
    let totalInitiationOthers = 0;
    let clarityUser = 0;
    let clarityOthers = 0;
    let repairUser = 0;
    let repairOthers = 0;
    let count = 0;

    const timeSeries: TimeSeriesPoint[] = [];

    filteredConnections.forEach(conn => {
      const data = conn.analysis_data;
      if (!data) return;

      const initA = data.dynamics.initiation_balance.initiated_by_A_percent;
      const initB = data.dynamics.initiation_balance.initiated_by_B_percent;
      
      totalInitiationOthers += initA;
      totalInitiationUser += initB;

      // Track who clarifies/repairs more
      if (data.dynamics.emotional_labor.who_clarifies_more === "B") clarityUser++;
      else if (data.dynamics.emotional_labor.who_clarifies_more === "A") clarityOthers++;
      
      if (data.dynamics.emotional_labor.who_repairs_more === "B") repairUser++;
      else if (data.dynamics.emotional_labor.who_repairs_more === "A") repairOthers++;

      // Build time series
      if (conn.analysis_date) {
        timeSeries.push({
          date: conn.analysis_date,
          initiation_user: initB,
          initiation_others: initA,
          connection_id: conn.id
        });
      }

      count++;
    });

    const avgInitiationUser = count > 0 ? totalInitiationUser / count : 0;
    const avgInitiationOthers = count > 0 ? totalInitiationOthers / count : 0;

    // Calculate burnout risk based on emotional labor distribution
    const laborImbalance = Math.abs(clarityUser - clarityOthers) + Math.abs(repairUser - repairOthers);
    const burnoutRisk = Math.min(100, laborImbalance * 10 + (clarityUser > clarityOthers ? 20 : 0) + (repairUser > repairOthers ? 20 : 0));

    return {
      avgInitiationUser,
      avgInitiationOthers,
      clarityUser,
      clarityOthers,
      repairUser,
      repairOthers,
      burnoutRisk,
      timeSeries: timeSeries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      connectionCount: count
    };
  }, [connections, selectedConnectionId, timeRange]);

  // Get emotional states for heat map
  const emotionalStatesData = useMemo(() => {
    const stateMap: Record<string, Record<string, number>> = {};
    
    connections.forEach(conn => {
      const data = conn.analysis_data;
      if (!data?.emotional_extraction?.user_states) return;
      
      if (!stateMap[conn.id]) {
        stateMap[conn.id] = {
          confusion: 0,
          anxiety: 0,
          safety: 0,
          calm: 0,
          dismissed: 0,
          valued: 0,
          chosen: 0,
          unseen: 0,
          unsafe: 0
        };
      }
      
      data.emotional_extraction.user_states.forEach(state => {
        if (stateMap[conn.id][state] !== undefined) {
          stateMap[conn.id][state]++;
        }
      });
    });

    return {
      byConnection: stateMap,
      connections: connections.filter(c => c.analysis_data?.emotional_extraction?.user_states)
    };
  }, [connections]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Global Pattern Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your behavioral patterns across all connections over time
            </p>
          </div>
          
          <ConnectionFilter
            connections={connections}
            selectedId={selectedConnectionId}
            compareId={compareConnectionId}
            onSelectConnection={setSelectedConnectionId}
            onCompareConnection={setCompareConnectionId}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>

        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">
              No connections analyzed yet. Start by uploading a conversation on the Dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Initiation Trends Chart */}
            <InitiationTrendsChart
              timeSeries={aggregatedMetrics?.timeSeries || []}
              avgUser={aggregatedMetrics?.avgInitiationUser || 0}
              avgOthers={aggregatedMetrics?.avgInitiationOthers || 0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clarification & Repair Load */}
              <ClarificationRepairPanel
                clarityUser={aggregatedMetrics?.clarityUser || 0}
                clarityOthers={aggregatedMetrics?.clarityOthers || 0}
                repairUser={aggregatedMetrics?.repairUser || 0}
                repairOthers={aggregatedMetrics?.repairOthers || 0}
              />

              {/* Emotional Labor Engine */}
              <EmotionalLaborEngine
                burnoutRisk={aggregatedMetrics?.burnoutRisk || 0}
                clarityUser={aggregatedMetrics?.clarityUser || 0}
                clarityOthers={aggregatedMetrics?.clarityOthers || 0}
                repairUser={aggregatedMetrics?.repairUser || 0}
                repairOthers={aggregatedMetrics?.repairOthers || 0}
                connectionCount={aggregatedMetrics?.connectionCount || 0}
              />
            </div>

            {/* Emotional State Heat Map */}
            <EmotionalStateHeatMap
              statesByConnection={emotionalStatesData.byConnection}
              connections={emotionalStatesData.connections}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
