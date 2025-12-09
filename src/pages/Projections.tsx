import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobalForecastPanel } from "@/components/projections/GlobalForecastPanel";
import { ConnectionProjectionSelector } from "@/components/projections/ConnectionProjectionSelector";
import { DualPerspectiveModeler } from "@/components/projections/DualPerspectiveModeler";
import { InstantInsightsPanel } from "@/components/projections/InstantInsightsPanel";
import { Compass, AlertCircle, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProjectionData, AnalysisResult } from "@/types/analysis";

interface Connection {
  id: string;
  person_name: string;
  analysis_data: AnalysisResult | null;
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
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('3m');
  const [projection, setProjection] = useState<ProjectionData | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('low');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPatterns, setUserPatterns] = useState<UserPatterns | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchUserPatterns();
      fetchSavedProjection();
    }
  }, [user]);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('id, person_name, analysis_data')
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

  const fetchSavedProjection = async () => {
    try {
      const { data, error } = await supabase
        .from('projections')
        .select('id, projection_data, projection_type, generated_at')
        .eq('user_id', user?.id)
        .is('connection_id', null)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const projectionData = data.projection_data as unknown as ProjectionData;
        setProjection(projectionData);
        setConfidence(projectionData.confidence || 'medium');
        setLastGeneratedAt(data.generated_at);
      }
    } catch (error) {
      console.error('Error fetching saved projection:', error);
    }
  };

  const generateProjection = async () => {
    if (connections.length === 0) {
      toast.error('No analyzed connections available for projection');
      return;
    }

    setIsGenerating(true);
    try {
      const connectionsData = selectedConnection 
        ? connections.filter(c => c.id === selectedConnection)
        : connections;

      const { data, error } = await supabase.functions.invoke('generate-projection', {
        body: {
          connections: connectionsData.map(c => ({
            person_name: c.person_name,
            analysis_data: c.analysis_data
          })),
          timeframe,
          connection_id: selectedConnection,
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
      <div className="p-6 space-y-6">
        {/* Print Header */}
        <div className="projections-print-header hidden print:block text-center mb-6 pb-4 border-b border-border">
          <h1 className="text-xl font-semibold">Connection Lens - Projection Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Future Projection Engine
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
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
              <Compass className="h-5 w-5 text-primary" />
              AI Projection
              {lastGeneratedAt && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  Last generated: {new Date(lastGeneratedAt).toLocaleDateString()}
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Generate deeper AI-powered forecasts for specific timeframes
            </p>
          </CardHeader>
          <CardContent>
            <ConnectionProjectionSelector
              connections={connections}
              selectedConnection={selectedConnection}
              onSelect={setSelectedConnection}
              onGenerate={generateProjection}
              isGenerating={isGenerating}
              disabled={!hasEnoughData}
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

          <TabsContent value="3m" className="mt-6">
            <GlobalForecastPanel 
              projection={projection} 
              timeframe="3m"
              isLoading={isGenerating}
              confidence={confidence}
            />
          </TabsContent>
          <TabsContent value="6m" className="mt-6">
            <GlobalForecastPanel 
              projection={projection} 
              timeframe="6m"
              isLoading={isGenerating}
              confidence={confidence}
            />
          </TabsContent>
          <TabsContent value="12m" className="mt-6">
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
