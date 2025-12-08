import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Connection, AnalysisResult } from "@/types/analysis";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { ConnectionFullReport } from "@/components/results/ConnectionFullReport";

export default function Connections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
    } else {
      setConnections((data || []) as unknown as Connection[]);
    }
    setLoading(false);
  };

  // Group connections by person name and sort each group by date (newest first)
  const groupedConnections = useMemo(() => {
    const groups: Record<string, Connection[]> = {};
    connections.forEach((conn) => {
      if (!groups[conn.person_name]) {
        groups[conn.person_name] = [];
      }
      groups[conn.person_name].push(conn);
    });
    
    // Sort each person's reports by date (analysis_date takes priority, fallback to created_at)
    Object.keys(groups).forEach((personName) => {
      groups[personName].sort((a, b) => {
        const dateA = a.analysis_date ? new Date(a.analysis_date) : new Date(a.created_at);
        const dateB = b.analysis_date ? new Date(b.analysis_date) : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime(); // Descending (newest first)
      });
    });
    
    return groups;
  }, [connections]);

  const personNames = useMemo(() => Object.keys(groupedConnections), [groupedConnections]);

  // Check if any person has multiple reports
  const hasAnyMultipleReports = useMemo(() => {
    return personNames.some((name) => groupedConnections[name].length > 1);
  }, [personNames, groupedConnections]);

  // Auto-select first person's latest report on load
  useEffect(() => {
    if (connections.length > 0 && !selectedConnection && personNames.length > 0) {
      const firstPersonName = personNames[0];
      setSelectedPerson(firstPersonName);
      setSelectedConnection(groupedConnections[firstPersonName][0]);
    }
  }, [connections, personNames, groupedConnections, selectedConnection]);


  const getTrafficLightColor = (light?: string) => {
    switch (light) {
      case "green":
        return "bg-success";
      case "yellow":
        return "bg-warning";
      case "red":
        return "bg-danger";
      default:
        return "bg-muted";
    }
  };

  const handlePersonClick = (personName: string) => {
    setSelectedPerson(personName);
    // Auto-select first connection for this person
    const personConnections = groupedConnections[personName];
    if (personConnections && personConnections.length > 0) {
      setSelectedConnection(personConnections[0]);
    }
  };

  const handleConnectionClick = (conn: Connection) => {
    setSelectedConnection(conn);
  };

  // For single reports layout (no person has multiple reports)
  const handleSingleReportClick = (conn: Connection) => {
    setSelectedPerson(conn.person_name);
    setSelectedConnection(conn);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Connections</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : connections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No saved connections yet. Analyze a conversation and save it to see it here.
            </p>
          </div>
        ) : hasAnyMultipleReports ? (
          /* 3-Column Layout when any person has multiple reports */
          <div className="flex gap-4">
            {/* Column 1: Person names */}
            <div className="w-40 shrink-0 space-y-2">
              {personNames.map((personName) => {
                const personConnections = groupedConnections[personName];
                const latestAnalysis = personConnections[0]?.analysis_data as AnalysisResult | null;
                return (
                  <div
                    key={personName}
                    onClick={() => handlePersonClick(personName)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-colors",
                      selectedPerson === personName
                        ? "bg-teal/10 border-teal"
                        : "bg-card border-border hover:bg-panel"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {latestAnalysis?.meta?.traffic_light && (
                          <div
                            className={cn(
                              "w-2.5 h-2.5 rounded-full shrink-0",
                              getTrafficLightColor(latestAnalysis.meta.traffic_light)
                            )}
                          />
                        )}
                        <p className="font-medium text-foreground text-sm truncate">{personName}</p>
                      </div>
                      {latestAnalysis?.meta?.overall_conversation_health_score !== undefined && (
                        <span className="text-xs font-semibold text-foreground shrink-0 pl-2 mr-1">
                          {latestAnalysis.meta.overall_conversation_health_score} / 100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {personConnections.length} report{personConnections.length > 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Column 2: Report instances for selected person */}
            <div className="w-44 shrink-0">
              {selectedPerson && groupedConnections[selectedPerson] ? (
                <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  {groupedConnections[selectedPerson].map((conn) => {
                    const analysis = conn.analysis_data as AnalysisResult | null;
                    const displayDate = conn.analysis_date
                      ? format(new Date(conn.analysis_date), "MMM d, yyyy")
                      : format(new Date(conn.created_at), "MMM d, yyyy");
                    return (
                      <div
                        key={conn.id}
                        onClick={() => handleConnectionClick(conn)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-colors relative group",
                          selectedConnection?.id === conn.id
                            ? "bg-teal/20 border-teal"
                            : "bg-card border-border hover:bg-panel"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{displayDate}</p>
                          {analysis?.meta && (
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  getTrafficLightColor(analysis.meta.traffic_light)
                                )}
                              />
                              <span className="text-sm font-semibold text-foreground">
                                {analysis.meta.overall_conversation_health_score}/100
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-panel rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">Select a person</p>
                </div>
              )}
            </div>

            {/* Column 3: Full Report */}
            <div className="flex-1 min-w-0">
              {selectedConnection?.analysis_data ? (
                <div className="bg-panel rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-foreground">
                      {selectedConnection.person_name}
                    </h2>
                    {selectedConnection.analysis_date && (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedConnection.analysis_date), "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  {selectedConnection.notes && (
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      "{selectedConnection.notes}"
                    </p>
                  )}
                  <ConnectionFullReport analysis={selectedConnection.analysis_data as AnalysisResult} />
                </div>
              ) : (
                <div className="bg-panel rounded-xl p-6 text-center h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 2-Column Layout when all persons have single reports */
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* List */}
            <div className="lg:w-1/3 space-y-3">
              {connections.map((conn) => {
                const analysis = conn.analysis_data as AnalysisResult | null;
                return (
                  <div
                    key={conn.id}
                    onClick={() => handleSingleReportClick(conn)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-colors",
                      selectedConnection?.id === conn.id
                        ? "bg-panel border-teal"
                        : "bg-card border-border hover:bg-panel"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {analysis?.meta?.traffic_light && (
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              getTrafficLightColor(analysis.meta.traffic_light)
                            )}
                          />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{conn.person_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conn.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {analysis?.meta?.overall_conversation_health_score !== undefined && (
                        <span className="text-sm font-semibold text-foreground ml-auto pl-4 mr-1">
                          {analysis.meta.overall_conversation_health_score} / 100
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full Report View */}
            <div className="lg:w-2/3">
              {selectedConnection?.analysis_data ? (
                <div className="bg-panel rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-foreground">
                      {selectedConnection.person_name}
                    </h2>
                    {selectedConnection.analysis_date && (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedConnection.analysis_date), "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  {selectedConnection.notes && (
                    <p className="text-sm text-muted-foreground mb-4 italic">
                      "{selectedConnection.notes}"
                    </p>
                  )}
                  <ConnectionFullReport analysis={selectedConnection.analysis_data as AnalysisResult} />
                </div>
              ) : (
                <div className="bg-panel rounded-xl p-6 text-center">
                  <p className="text-muted-foreground">Select a connection to view full report</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}