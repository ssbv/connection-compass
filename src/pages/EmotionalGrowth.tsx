import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmotionalImprintLedger } from "@/components/emotional/EmotionalImprintLedger";
import { RepairCompletionTracker } from "@/components/emotional/RepairCompletionTracker";
import { SelfStabilizationIndicators } from "@/components/emotional/SelfStabilizationIndicators";
import { EmotionalCarryForwardRisk } from "@/components/emotional/EmotionalCarryForwardRisk";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, AlertCircle, Loader2, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AnalysisResult, EmotionalStateType } from "@/types/analysis";

interface Connection {
  id: string;
  person_name: string;
  analysis_data: AnalysisResult | null;
}

export default function EmotionalGrowth() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConnections();
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

  // Calculate repair statuses from analysis data
  const repairs = useMemo(() => {
    return connections.map(conn => {
      const closure = conn.analysis_data?.emotional_extraction?.closure_indicators?.[0];
      const repairSignals = conn.analysis_data?.emotional_extraction?.repair_signals || [];
      
      let status: 'repaired' | 'partially_repaired' | 'abandoned' | 'avoidant' | 'mutual_resolution' = 'partially_repaired';
      
      if (closure) {
        if (closure.type === 'full_closure') status = 'repaired';
        else if (closure.type === 'partial_closure') status = 'partially_repaired';
        else if (closure.type === 'avoidant_exit') status = 'avoidant';
        else if (closure.type === 'open') {
          const hasReciprocated = repairSignals.some(r => r.was_reciprocated);
          status = hasReciprocated ? 'mutual_resolution' : 'abandoned';
        }
      }

      return {
        connection_name: conn.person_name,
        status,
        notes: closure?.notes
      };
    }).filter(r => r.connection_name);
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

  // Calculate carry-forward risk
  const carryForwardRisk = useMemo(() => {
    const anxietyConnections: string[] = [];
    const dismissedConnections: string[] = [];

    connections.forEach(conn => {
      const states = conn.analysis_data?.emotional_extraction?.user_states || [];
      if (states.includes('anxiety')) anxietyConnections.push(conn.person_name);
      if (states.includes('dismissed')) dismissedConnections.push(conn.person_name);
    });

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Print Header */}
        <div className="emotional-print-header hidden print:block text-center mb-6 pb-4 border-b border-border">
          <h1 className="text-xl font-semibold">Connection Lens - Emotional Growth Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Emotional Imprint & Growth
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
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
    </AppLayout>
  );
}
