import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Connection, AnalysisResult, Snapshot } from "@/types/analysis";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { ConnectionFullReport } from "@/components/results/ConnectionFullReport";
import { SavedSnapshotsSection } from "@/components/results/SavedSnapshotsSection";
import { Button } from "@/components/ui/button";
import { Trash2, Download } from "lucide-react";
import { toast } from "sonner";
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

    const { data: connectionsData, error } = await supabase
      .from("connections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
      setLoading(false);
      return;
    }

    const connectionIds = (connectionsData || []).map((c) => c.id);

    // Fetch all snapshots for these connections
    const { data: snapshotsData } = await supabase
      .from("snapshots")
      .select("*")
      .in("connection_id", connectionIds);

    // Map snapshots to their connections
    const connectionsWithSnapshots = (connectionsData || []).map((conn) => ({
      ...conn,
      snapshots: (snapshotsData || []).filter((s) => s.connection_id === conn.id) as Snapshot[],
    }));

    setConnections(connectionsWithSnapshots as unknown as Connection[]);
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

  // Calculate average health score for a person's reports
  const calculateAverageScore = (personConnections: Connection[]) => {
    const scores = personConnections
      .map((conn) => (conn.analysis_data as AnalysisResult | null)?.meta?.overall_conversation_health_score)
      .filter((score): score is number => score !== undefined);
    
    if (scores.length === 0) return undefined;
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  // Determine traffic light color based on average score
  const getTrafficLightForScore = (score: number | undefined) => {
    if (score === undefined) return undefined;
    if (score >= 70) return "green";
    if (score >= 40) return "yellow";
    return "red";
  };

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

  const handleDeleteReport = async (connectionId: string) => {
    if (!user) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this report? This action cannot be undone.");
    if (!confirmed) return;
    
    // Delete associated snapshots first
    await supabase.from("snapshots").delete().eq("connection_id", connectionId);
    
    // Delete the connection
    const { error } = await supabase.from("connections").delete().eq("id", connectionId);
    
    if (error) {
      console.error("Error deleting connection:", error);
      toast.error("Failed to delete report");
      return;
    }
    
    toast.success("Report deleted successfully");
    
    // Update local state
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    
    // Clear selection if deleted report was selected
    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(null);
      setSelectedPerson(null);
    }
  };

  const getExportFilename = () => {
    if (!selectedConnection) return "";
    const reportDate = selectedConnection.analysis_date 
      ? format(new Date(selectedConnection.analysis_date), "yyyy-MM-dd")
      : format(new Date(selectedConnection.created_at), "yyyy-MM-dd");
    return `${selectedConnection.person_name} - ${reportDate}`;
  };

  const handleExportPDF = () => {
    if (!selectedConnection) return;
    
    const pdfTitle = getExportFilename();
    const originalTitle = document.title;
    
    // Use beforeprint/afterprint events for better timing
    const handleBeforePrint = () => {
      document.title = pdfTitle;
    };
    
    const handleAfterPrint = () => {
      document.title = originalTitle;
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    
    // Also set title immediately
    document.title = pdfTitle;
    
    window.print();
  };

  return (
    <AppLayout>
      <div className="fixed inset-0 left-44 flex flex-col bg-background">
        <div className="flex-1 flex flex-col p-6 lg:p-10 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
        <h1 className="text-xl font-semibold text-foreground mb-4 shrink-0 connections-title">Connections</h1>

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
          <div className="flex gap-3 flex-1 min-h-0">
            {/* Column 1: Person names */}
            <div className="w-40 shrink-0 space-y-1.5 overflow-y-auto connections-person-list">
              {personNames.map((personName) => {
                const personConnections = groupedConnections[personName];
                const averageScore = calculateAverageScore(personConnections);
                const averageTrafficLight = getTrafficLightForScore(averageScore);
                return (
                  <div
                    key={personName}
                    onClick={() => handlePersonClick(personName)}
                    className={cn(
                      "p-2 rounded-lg border cursor-pointer transition-colors",
                      selectedPerson === personName
                        ? "bg-teal/10 border-teal"
                        : "bg-card border-border hover:bg-panel"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {averageTrafficLight && (
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              getTrafficLightColor(averageTrafficLight)
                            )}
                          />
                        )}
                        <p className="font-medium text-foreground text-xs truncate">{personName}</p>
                      </div>
                      {averageScore !== undefined && (
                        <span className="text-[10px] font-semibold text-foreground shrink-0">
                          {averageScore}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {personConnections.length} report{personConnections.length > 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Column 2: Report instances for selected person */}
            <div className="w-32 shrink-0 overflow-y-auto connections-report-list">
              {selectedPerson && groupedConnections[selectedPerson] ? (
                <div className="space-y-1.5">
                  {groupedConnections[selectedPerson].map((conn) => {
                    const analysis = conn.analysis_data as AnalysisResult | null;
                    const displayDate = conn.analysis_date
                      ? format(new Date(conn.analysis_date), "MMM d")
                      : format(new Date(conn.created_at), "MMM d");
                    return (
                      <div
                        key={conn.id}
                        onClick={() => handleConnectionClick(conn)}
                        className={cn(
                          "p-2 rounded-lg border cursor-pointer transition-colors",
                          selectedConnection?.id === conn.id
                            ? "bg-teal/20 border-teal"
                            : "bg-card border-border hover:bg-panel"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-medium text-foreground">{displayDate}</p>
                          {analysis?.meta && (
                            <div className="flex items-center gap-1">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  getTrafficLightColor(analysis.meta.traffic_light)
                                )}
                              />
                              <span className="text-xs font-semibold text-foreground">
                                {analysis.meta.overall_conversation_health_score}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-panel rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Select a person</p>
                </div>
              )}
            </div>

            {/* Column 3: Full Report */}
            <div className="flex-1 min-w-0 flex flex-col connections-report-column">
              {selectedConnection?.analysis_data ? (
                <>
                  <div className="flex justify-end mb-2 no-print shrink-0">
                    <Button 
                      onClick={handleExportPDF} 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Download className="w-3 h-3" />
                      Export PDF
                    </Button>
                  </div>
                  {/* Fixed: Header + Snapshots */}
                  <div className="bg-panel rounded-lg rounded-b-none p-4 pb-3 shrink-0">
                    {/* Print-only header */}
                    <div className="hidden connections-print-header">
                      <h1 className="text-xl font-semibold">Connection Lens Analysis Report</h1>
                      <p className="text-sm text-muted-foreground mt-1">{selectedConnection.person_name}</p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Save as: "{getExportFilename()}.pdf"
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-3 no-print">
                      <h2 className="text-base font-medium text-foreground">
                        {selectedConnection.person_name}
                      </h2>
                      {selectedConnection.analysis_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedConnection.analysis_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    {selectedConnection.notes && (
                      <p className="text-xs text-muted-foreground mb-3 italic">
                        "{selectedConnection.notes}"
                      </p>
                    )}
                    {selectedConnection.snapshots && selectedConnection.snapshots.length > 0 && (
                      <SavedSnapshotsSection snapshots={selectedConnection.snapshots} />
                    )}
                  </div>
                  
                  {/* Report content - no scrolling */}
                  <div className="flex-1">
                    <div className="bg-panel rounded-lg rounded-t-none p-4 pt-2">
                      <ConnectionFullReport analysis={selectedConnection.analysis_data as AnalysisResult} />
                      <div className="flex justify-end mt-4 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(selectedConnection.id)}
                          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-panel rounded-lg p-4 text-center h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 2-Column Layout when all persons have single reports */
          <div className="flex gap-6 flex-col lg:flex-row flex-1 min-h-0">
            {/* List */}
            <div className="lg:w-1/3 space-y-3 overflow-y-auto connections-person-list">
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
            <div className="lg:w-2/3 flex flex-col connections-report-column">
              {selectedConnection?.analysis_data ? (
                <>
                  <div className="flex justify-end mb-4 no-print shrink-0">
                    <Button 
                      onClick={handleExportPDF} 
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </Button>
                  </div>
                  {/* Fixed: Header + Snapshots */}
                  <div className="bg-panel rounded-xl rounded-b-none p-6 pb-4 shrink-0">
                    {/* Print-only header */}
                    <div className="hidden connections-print-header">
                      <h1 className="text-xl font-semibold">Connection Lens Analysis Report</h1>
                      <p className="text-sm text-muted-foreground mt-1">{selectedConnection.person_name}</p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Save as: "{getExportFilename()}.pdf"
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-4 no-print">
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
                    {selectedConnection.snapshots && selectedConnection.snapshots.length > 0 && (
                      <SavedSnapshotsSection snapshots={selectedConnection.snapshots} />
                    )}
                  </div>
                  
                  {/* Report content - no scrolling */}
                  <div className="flex-1">
                    <div className="bg-panel rounded-xl rounded-t-none p-6 pt-2">
                      <ConnectionFullReport analysis={selectedConnection.analysis_data as AnalysisResult} />
                      <div className="flex justify-end mt-6 pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(selectedConnection.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-panel rounded-xl p-6 text-center">
                  <p className="text-muted-foreground">Select a connection to view full report</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}