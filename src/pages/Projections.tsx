import { useState, useEffect, useRef, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobalForecastPanel } from "@/components/projections/GlobalForecastPanel";
import { ConnectionProjectionSelector } from "@/components/projections/ConnectionProjectionSelector";
import { DualPerspectiveModeler } from "@/components/projections/DualPerspectiveModeler";
import { InstantInsightsPanel } from "@/components/projections/InstantInsightsPanel";
import { Compass, AlertCircle, FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProjectionData, AnalysisResult } from "@/types/analysis";

interface Connection {
  id: string;
  person_name: string;
  analysis_data: AnalysisResult | null;
  updated_at: string;
}

interface GroupedConnection {
  person_name: string;
  connections: Connection[];
  latest_updated_at: string;
}

interface UserPatterns {
  burnout_risk_score: number | null;
  emotional_labor_score: number | null;
  initiation_ratio_user: number | null;
  initiation_ratio_others: number | null;
  repair_load_user: number | null;
  repair_load_others: number | null;
  clarity_load_user: number | null;
  clarity_load_others: number | null;
}

interface SavedProjection {
  id: string;
  projection_data: ProjectionData;
  projection_type: string;
  generated_at: string;
}

export default function Projections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null); // Now stores person_name
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('3m');
  const [projection, setProjection] = useState<ProjectionData | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('low');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPatterns, setUserPatterns] = useState<UserPatterns | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  const previousConnectionRef = useRef<string | null>(null);

  // Group connections by person_name for unique dropdown entries
  const groupedConnections = useMemo<GroupedConnection[]>(() => {
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
      
      // Track the most recent update
      if (conn.updated_at > groups[conn.person_name].latest_updated_at) {
        groups[conn.person_name].latest_updated_at = conn.updated_at;
      }
    });
    
    return Object.values(groups);
  }, [connections]);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchUserPatterns();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchUserPatterns();
    }
  }, [user]);

  // Auto-generate or load cached projection when connections load or selection changes
  useEffect(() => {
    if (!isLoading && connections.length > 0 && !isGenerating) {
      handleProjectionLoad();
    }
  }, [isLoading, connections.length, selectedConnection]);

  const handleProjectionLoad = async () => {
    // Check if selection actually changed
    if (previousConnectionRef.current === selectedConnection && projection) {
      return;
    }
    previousConnectionRef.current = selectedConnection;

    // Fetch saved projection for current selection (by person_name)
    const savedProjection = await fetchSavedProjection(selectedConnection);
    
    if (savedProjection) {
      // Check if connection data has been updated since projection was generated
      const selectedGroup = selectedConnection 
        ? groupedConnections.find(g => g.person_name === selectedConnection)
        : null;
      
      if (selectedGroup) {
        const latestUpdatedAt = new Date(selectedGroup.latest_updated_at).getTime();
        const projectionGeneratedAt = new Date(savedProjection.generated_at).getTime();
        
        if (latestUpdatedAt > projectionGeneratedAt) {
          // Connection has newer data, regenerate
          generateProjection();
          return;
        }
      }
      
      // Use cached projection
      setProjection(savedProjection.projection_data);
      setConfidence(savedProjection.projection_data.confidence || 'medium');
      setLastGeneratedAt(savedProjection.generated_at);
    } else {
      // No saved projection, generate new one
      generateProjection();
    }
  };

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('id, person_name, analysis_data, updated_at')
        .eq('user_id', user?.id)
        .not('analysis_data', 'is', null);

      if (error) throw error;
      setConnections((data || []).map(conn => ({
        ...conn,
        analysis_data: conn.analysis_data as unknown as AnalysisResult | null
      })));
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('user_patterns')
        .select('burnout_risk_score, emotional_labor_score, initiation_ratio_user, initiation_ratio_others, repair_load_user, repair_load_others, clarity_load_user, clarity_load_others')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUserPatterns(data as UserPatterns);
      }
    } catch (error) {
      console.error('Error fetching user patterns:', error);
    }
  };

  const fetchSavedProjection = async (personName: string | null): Promise<SavedProjection | null> => {
    try {
      // For per-person projections, we need to get any connection_id for that person
      // or query by person_name if stored differently
      let query = supabase
        .from('projections')
        .select('id, projection_data, projection_type, generated_at')
        .eq('user_id', user?.id)
        .order('generated_at', { ascending: false })
        .limit(1);

      if (personName) {
        // Get any connection_id for this person to find their projection
        const personConnections = connections.filter(c => c.person_name === personName);
        if (personConnections.length > 0) {
          query = query.in('connection_id', personConnections.map(c => c.id));
        } else {
          return null;
        }
      } else {
        query = query.is('connection_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (data) {
        return {
          ...data,
          projection_data: data.projection_data as unknown as ProjectionData
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching saved projection:', error);
      return null;
    }
  };

  const generateProjection = async () => {
    if (connections.length === 0) {
      toast.error('No analyzed connections available for projection');
      return;
    }

    setIsGenerating(true);
    try {
      // Get all connections for the selected person (combines all their reports)
      const connectionsData = selectedConnection 
        ? connections.filter(c => c.person_name === selectedConnection)
        : connections;

      // Use the first connection_id for storage (represents the person)
      const connectionIdForStorage = selectedConnection && connectionsData.length > 0
        ? connectionsData[0].id
        : null;

      const { data, error } = await supabase.functions.invoke('generate-projection', {
        body: {
          connections: connectionsData.map(c => ({
            person_name: c.person_name,
            analysis_data: c.analysis_data
          })),
          timeframe,
          connection_id: connectionIdForStorage,
          user_id: user?.id
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setProjection(data.projection);
      setConfidence(data.projection.confidence || 'medium');
      setLastGeneratedAt(data.generated_at);
      toast.success('Projection generated successfully');
    } catch (error) {
      console.error('Error generating projection:', error);
      toast.error('Failed to generate projection');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasEnoughData = connections.length >= 1;

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        {/* Print Header */}
        <div className="projections-print-header hidden print:block text-center mb-4 pb-3 border-b border-border">
          <h1 className="text-lg font-semibold">Connection Lens - Projection Report</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Future Projection Engine
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-powered relational forecasts based on your behavioral patterns
            </p>
          </div>

          {projection && (
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

        {!hasEnoughData && (
          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Insufficient Data for Projections
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Continue analyzing conversations to build enough data for accurate projections.
                    We recommend at least 3 analyzed conversations for meaningful forecasts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instant Insights - Always visible */}
        <InstantInsightsPanel 
          connections={connections as any}
          userPatterns={userPatterns}
          isLoading={isLoading}
        />

        {/* Connection Selector */}
        <Card>
        <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              {isGenerating ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Compass className="h-5 w-5 text-primary" />
              )}
              AI Projection
              {isGenerating && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  Generating...
                </span>
              )}
              {!isGenerating && lastGeneratedAt && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  Last generated: {new Date(lastGeneratedAt).toLocaleDateString()}
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-powered forecasts for specific timeframes
            </p>
          </CardHeader>
          <CardContent>
            <ConnectionProjectionSelector
              groupedConnections={groupedConnections}
              selectedConnection={selectedConnection}
              onSelect={setSelectedConnection}
            />
          </CardContent>
        </Card>

        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="3m">3 Months</TabsTrigger>
            <TabsTrigger value="6m">6 Months</TabsTrigger>
            <TabsTrigger value="12m">12 Months</TabsTrigger>
          </TabsList>

          <TabsContent value="3m" className="mt-4">
            <GlobalForecastPanel 
              projection={projection} 
              timeframe="3m"
              isLoading={isGenerating}
              confidence={confidence}
            />
          </TabsContent>
          <TabsContent value="6m" className="mt-4">
            <GlobalForecastPanel 
              projection={projection} 
              timeframe="6m"
              isLoading={isGenerating}
              confidence={confidence}
            />
          </TabsContent>
          <TabsContent value="12m" className="mt-4">
            <GlobalForecastPanel 
              projection={projection} 
              timeframe="12m"
              isLoading={isGenerating}
              confidence={confidence}
            />
          </TabsContent>
        </Tabs>

        {/* Dual-Perspective Modeling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Scenario Modeling
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              What may happen under different circumstances
            </p>
          </CardHeader>
          <CardContent>
            <DualPerspectiveModeler scenarios={projection?.scenarios} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
