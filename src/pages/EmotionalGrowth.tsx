import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGate } from "@/components/auth/AuthGate";
import { EmotionalImprintLedger } from "@/components/emotional/EmotionalImprintLedger";
import { RepairCompletionTracker } from "@/components/emotional/RepairCompletionTracker";
import { SelfStabilizationIndicators } from "@/components/emotional/SelfStabilizationIndicators";
import { EmotionalCarryForwardRisk } from "@/components/emotional/EmotionalCarryForwardRisk";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, AlertCircle, Loader2, FileDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AnalysisResult, EmotionalStateType } from "@/types/analysis";

interface Connection {
  id: string;
  person_name: string;
  analysis_data: AnalysisResult | null;
}

export default function EmotionalGrowth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const [populatingProgress, setPopulatingProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (user) {
      fetchConnections();

      // Set up real-time subscription for connection changes
      const channel = supabase
        .channel('emotional-growth-connections')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Connection changed, refetching emotional growth data...');
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
    } finally {
      setIsLoading(false);
    }
  };

  // Detect connections missing emotional_extraction data
  const connectionsNeedingUpdate = useMemo(() => {
    return connections.filter(conn => 
      !conn.analysis_data?.emotional_extraction?.user_states?.length
    );
  }, [connections]);

  const handlePopulateData = async () => {
    if (connectionsNeedingUpdate.length === 0) return;

    setIsPopulating(true);
    setPopulatingProgress({ current: 0, total: connectionsNeedingUpdate.length });

    toast({
      title: "Populating emotional data",
      description: `Processing ${connectionsNeedingUpdate.length} connections...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < connectionsNeedingUpdate.length; i++) {
      const conn = connectionsNeedingUpdate[i];
      setPopulatingProgress({ current: i + 1, total: connectionsNeedingUpdate.length });

      try {
        // Fetch snapshots for this connection
        const { data: snapshots, error: snapshotsError } = await supabase
          .from('snapshots')
          .select('extracted_text, file_url, file_type')
          .eq('connection_id', conn.id);

        if (snapshotsError) throw snapshotsError;

        let conversationText = '';
        let imageBase64 = '';

        for (const snapshot of snapshots || []) {
          if (snapshot.extracted_text) {
            conversationText += snapshot.extracted_text + '\n\n';
          } else if (snapshot.file_url && snapshot.file_type?.startsWith('image/')) {
            // Convert image URL to base64
            try {
              const response = await fetch(snapshot.file_url);
              const blob = await response.blob();
              const reader = new FileReader();
              imageBase64 = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              console.error('Error converting image:', e);
            }
          }
        }

        if (!conversationText && !imageBase64) {
          console.log(`Skipping ${conn.person_name}: no content found`);
          continue;
        }

        // Call the analyze-conversation edge function
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-conversation', {
          body: { 
            conversationText: conversationText || undefined, 
            imageBase64: imageBase64 || undefined 
          }
        });

        if (analysisError) throw analysisError;

        // Update the connection with new analysis data
        const { error: updateError } = await supabase
          .from('connections')
          .update({ analysis_data: analysisData })
          .eq('id', conn.id);

        if (updateError) throw updateError;

        // Persist emotional states and repair attempts
        if (analysisData?.emotional_extraction) {
          const { user_states, repair_signals } = analysisData.emotional_extraction;

          if (user_states?.length) {
            const emotionalStatesData = user_states.map((state: string) => ({
              user_id: user?.id,
              connection_id: conn.id,
              state_type: state,
              intensity: 3
            }));

            await supabase.from('emotional_states').insert(emotionalStatesData);
          }

          if (repair_signals?.length) {
            const repairAttemptsData = repair_signals.map((signal: { type: string; was_reciprocated: boolean }) => ({
              user_id: user?.id,
              connection_id: conn.id,
              attempt_type: signal.type,
              status: signal.was_reciprocated ? 'repaired' : 'unresolved'
            }));

            await supabase.from('repair_attempts').insert(repairAttemptsData);
          }
        }

        // Update local state
        setConnections(prev => prev.map(c => 
          c.id === conn.id ? { ...c, analysis_data: analysisData } : c
        ));

        successCount++;
      } catch (error) {
        console.error(`Error processing ${conn.person_name}:`, error);
        errorCount++;
      }
    }

    setIsPopulating(false);

    toast({
      title: "Population complete",
      description: `Successfully updated ${successCount} connections${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  // Calculate emotional imprints from analysis data
  const imprints = useMemo(() => {
    const result = {
      dismissed: { count: 0, connections: [] as string[] },
      unsafe: { count: 0, connections: [] as string[] },
      unseen: { count: 0, connections: [] as string[] },
      valued: { count: 0, connections: [] as string[] },
      chosen: { count: 0, connections: [] as string[] }
    };

    connections.forEach(conn => {
      const states = conn.analysis_data?.emotional_extraction?.user_states || [];
      const stateMap: Record<EmotionalStateType, keyof typeof result> = {
        dismissed: 'dismissed',
        unsafe: 'unsafe',
        unseen: 'unseen',
        valued: 'valued',
        chosen: 'chosen',
        confusion: 'unseen',
        anxiety: 'unsafe',
        safety: 'valued',
        calm: 'valued'
      };

      states.forEach(state => {
        const key = stateMap[state as EmotionalStateType];
        if (key && result[key]) {
          result[key].count++;
          if (!result[key].connections.includes(conn.person_name)) {
            result[key].connections.push(conn.person_name);
          }
        }
      });
    });

    return result;
  }, [connections]);

  // Calculate repair statuses from analysis data - grouped by person name
  const repairs = useMemo(() => {
    type RepairStatusType = 'repaired' | 'partially_repaired' | 'abandoned' | 'avoidant' | 'mutual_resolution';
    
    const repairMap: Record<string, {
      connection_name: string;
      statuses: RepairStatusType[];
      notes: string[];
    }> = {};

    connections.forEach(conn => {
      const closure = conn.analysis_data?.emotional_extraction?.closure_indicators?.[0];
      const repairSignals = conn.analysis_data?.emotional_extraction?.repair_signals || [];
      
      let status: RepairStatusType = 'partially_repaired';
      
      if (closure) {
        if (closure.type === 'full_closure') status = 'repaired';
        else if (closure.type === 'partial_closure') status = 'partially_repaired';
        else if (closure.type === 'avoidant_exit') status = 'avoidant';
        else if (closure.type === 'open') {
          const hasReciprocated = repairSignals.some(r => r.was_reciprocated);
          status = hasReciprocated ? 'mutual_resolution' : 'abandoned';
        }
      }

      if (!repairMap[conn.person_name]) {
        repairMap[conn.person_name] = {
          connection_name: conn.person_name,
          statuses: [],
          notes: []
        };
      }
      repairMap[conn.person_name].statuses.push(status);
      if (closure?.notes) repairMap[conn.person_name].notes.push(closure.notes);
    });

    // Aggregate to single status per person (priority: most concerning status)
    const aggregateStatus = (statuses: RepairStatusType[]): RepairStatusType => {
      const priority: RepairStatusType[] = ['abandoned', 'avoidant', 'partially_repaired', 'mutual_resolution', 'repaired'];
      for (const status of priority) {
        if (statuses.includes(status)) return status;
      }
      return 'partially_repaired';
    };

    return Object.values(repairMap).map(group => ({
      connection_name: group.connection_name,
      status: aggregateStatus(group.statuses),
      notes: group.notes.length > 0 ? group.notes.join('; ') : undefined
    }));
  }, [connections]);

  // Calculate self-stabilization indicators
  const indicators = useMemo(() => {
    let totalClarity = 0;
    let totalRepairs = 0;
    let overExplainCount = 0;
    let withdrawCount = 0;

    connections.forEach(conn => {
      const dynamics = conn.analysis_data?.dynamics;
      const emotionalLabor = dynamics?.emotional_labor;
      
      if (emotionalLabor?.who_clarifies_more === 'Person B') {
        totalClarity++;
      }
      if (emotionalLabor?.who_repairs_more === 'Person B') {
        totalRepairs++;
      }

      // Check for over-explaining patterns in person B
      const personB = conn.analysis_data?.people?.B;
      if (personB?.scores?.clarity?.score && personB.scores.clarity.score > 70) {
        overExplainCount++;
      }
      if (personB?.scores?.initiation?.score && personB.scores.initiation.score < 30) {
        withdrawCount++;
      }
    });

    const total = connections.length || 1;

    return [
      {
        label: 'Self-soothing appropriately',
        score: Math.round(100 - (totalRepairs / total) * 50),
        description: 'Ability to regulate without over-reaching to others',
        isPositive: true
      },
      {
        label: 'Seeks clarity appropriately',
        score: Math.round((totalClarity / total) * 100),
        description: 'Tendency to ask clarifying questions when needed',
        isPositive: true
      },
      {
        label: 'Over-explains tendency',
        score: Math.round((overExplainCount / total) * 100),
        description: 'Pattern of excessive justification or explanation',
        isPositive: false
      },
      {
        label: 'Withdraws prematurely',
        score: Math.round((withdrawCount / total) * 100),
        description: 'Tendency to disengage before resolution',
        isPositive: false
      }
    ];
  }, [connections]);

  // Calculate carry-forward risk - use Sets for unique person names
  const carryForwardRisk = useMemo(() => {
    const anxietyConnectionsSet = new Set<string>();
    const dismissedConnectionsSet = new Set<string>();

    connections.forEach(conn => {
      const states = conn.analysis_data?.emotional_extraction?.user_states || [];
      if (states.includes('anxiety')) anxietyConnectionsSet.add(conn.person_name);
      if (states.includes('dismissed')) dismissedConnectionsSet.add(conn.person_name);
    });

    const anxietyConnections = Array.from(anxietyConnectionsSet);
    const dismissedConnections = Array.from(dismissedConnectionsSet);

    const patterns: { from_connection: string; to_connection: string; pattern_type: string }[] = [];
    
    // Detect patterns between connections
    if (anxietyConnections.length > 1) {
      patterns.push({
        from_connection: anxietyConnections[0],
        to_connection: anxietyConnections[1],
        pattern_type: 'Anxiety persistence'
      });
    }
    if (dismissedConnections.length > 1) {
      patterns.push({
        from_connection: dismissedConnections[0],
        to_connection: dismissedConnections[1],
        pattern_type: 'Dismissal sensitivity'
      });
    }

    const riskLevel = patterns.length > 2 ? 'high' : patterns.length > 0 ? 'medium' : 'low';

    return {
      riskLevel: riskLevel as 'low' | 'medium' | 'high',
      summary: riskLevel === 'low' 
        ? 'Your emotional experiences appear contained to individual connections without significant bleed-over.'
        : riskLevel === 'medium'
        ? 'Some emotional patterns may be carrying forward between connections. Consider whether past experiences are influencing current perceptions.'
        : 'Significant emotional residue detected across multiple connections. Professional support may be beneficial.',
      patterns,
      recommendations: riskLevel === 'low' ? [] : [
        'Take time between intense conversations to process emotions',
        'Journal about each connection separately to maintain boundaries',
        'Notice when reactions feel disproportionate to the current situation'
      ]
    };
  }, [connections]);

  const hasData = connections.length > 0;

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <AppLayout>
      <AuthGate>
      {isLoading ? (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <div className="p-4 space-y-4">
        {/* Print Header */}
        <div className="emotional-print-header hidden print:block text-center mb-4 pb-3 border-b border-border">
          <h1 className="text-lg font-semibold">Connection Lens - Emotional Growth Report</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Emotional Imprint & Growth
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track emotional residue, closure, healing, and self-stability
            </p>
          </div>

          {hasData && (
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

        {/* Banner for connections needing emotional data */}
        {connectionsNeedingUpdate.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 print:hidden">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {connectionsNeedingUpdate.length} connection{connectionsNeedingUpdate.length !== 1 ? 's' : ''} missing emotional data
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                      Re-analyze to populate emotional insights for older connections.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handlePopulateData}
                  disabled={isPopulating}
                  size="sm"
                  className="gap-2 shrink-0"
                >
                  {isPopulating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {populatingProgress.current}/{populatingProgress.total}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Populate Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasData && (
          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    No Emotional Data Yet
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Continue analyzing conversations to build your emotional growth profile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasData && (
          <>
            <EmotionalImprintLedger imprints={imprints} />
            <RepairCompletionTracker repairs={repairs} />
            <SelfStabilizationIndicators indicators={indicators} />
            <EmotionalCarryForwardRisk risk={carryForwardRisk} />
          </>
        )}
      </div>
      )}
      </AuthGate>
    </AppLayout>
  );
}
