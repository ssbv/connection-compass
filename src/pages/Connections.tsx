import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Connection, AnalysisResult } from "@/types/analysis";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Connections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("connections").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete connection.",
        variant: "destructive",
      });
    } else {
      setConnections(connections.filter((c) => c.id !== id));
      if (selectedConnection?.id === id) {
        setSelectedConnection(null);
      }
      toast({
        title: "Deleted",
        description: "Connection removed successfully.",
      });
    }
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

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Connections</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : connections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No saved connections yet. Analyze a conversation and save it to see it here.
            </p>
          </div>
        ) : (
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* List */}
            <div className="lg:w-1/3 space-y-3">
              {connections.map((conn) => {
                const analysis = conn.analysis_data as AnalysisResult | null;
                return (
                  <div
                    key={conn.id}
                    onClick={() => setSelectedConnection(conn)}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-colors",
                      selectedConnection?.id === conn.id
                        ? "bg-panel border-teal"
                        : "bg-card border-border hover:bg-panel"
                    )}
                  >
                    <div className="flex items-center justify-between">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conn.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail View */}
            <div className="lg:w-2/3">
              {selectedConnection ? (
                <div className="bg-panel rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-medium text-foreground">
                    {selectedConnection.person_name}
                  </h2>

                  {selectedConnection.analysis_date && (
                    <p className="text-sm text-muted-foreground">
                      Analysis date: {selectedConnection.analysis_date}
                    </p>
                  )}

                  {selectedConnection.notes && (
                    <div>
                      <span className="text-xs text-muted-foreground">Notes</span>
                      <p className="text-sm text-foreground mt-1">{selectedConnection.notes}</p>
                    </div>
                  )}

                  {selectedConnection.analysis_data && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-foreground">
                          {(selectedConnection.analysis_data as AnalysisResult).meta.overall_conversation_health_score}
                        </span>
                        <span className="text-sm text-muted-foreground">Health Score</span>
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full ml-2",
                            getTrafficLightColor((selectedConnection.analysis_data as AnalysisResult).meta.traffic_light)
                          )}
                        />
                      </div>
                      <p className="text-sm text-foreground">
                        {(selectedConnection.analysis_data as AnalysisResult).meta.summary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-panel rounded-xl p-6 text-center">
                  <p className="text-muted-foreground">
                    Select a connection to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
