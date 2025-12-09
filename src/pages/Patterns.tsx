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
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface GroupedConnection {
  person_name: string;
  connections: Connection[];
  latest_updated_at: string;
}

export default function Patterns() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonName, setSelectedPersonName] = useState<string | null>(null);
  const [comparePersonName, setComparePersonName] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"all" | "30d">("all");

  useEffect(() => {
    if (user) {
      fetchConnections();
      
      // Set up real-time subscription for new connections
      const channel = supabase
        .channel('patterns-connections')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Connection changed, refetching...');
            fetchConnections();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  // Group connections by person_name for unique dropdown
  const groupedConnections = useMemo(() => {
    const groups: Record<string, GroupedConnection> = {};
    
    connections.forEach(conn => {
      if (!groups[conn.person_name]) {
        groups[conn.person_name] = {
          person_name: conn.person_name,
          connections: [],
          latest_updated_at: conn.updated_at
        };
      }
      groups[conn.person_name].connections.push(conn);
      
      if (conn.updated_at > groups[conn.person_name].latest_updated_at) {
        groups[conn.person_name].latest_updated_at = conn.updated_at;
      }
    });
    
    return Object.values(groups);
  }, [connections]);

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const filteredConnections = connections.filter(conn => {
      if (!conn.analysis_data) return false;
      if (selectedPersonName && conn.person_name !== selectedPersonName) return false;
      
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
  }, [connections, selectedPersonName, timeRange]);

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

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Print Header */}
        <div className="patterns-print-header hidden print:block text-center mb-6 pb-4 border-b border-border">
          <h1 className="text-xl font-semibold">Connection Lens - Pattern Analysis Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Global Pattern Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your behavioral patterns across all connections over time
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {connections.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
            )}
          </div>
        </div>

        <div className="print:hidden">
          <ConnectionFilter
            groupedConnections={groupedConnections}
            selectedPerson={selectedPersonName}
            comparePerson={comparePersonName}
            onSelectConnection={setSelectedPersonName}
            onCompareConnection={setComparePersonName}
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
