import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProbabilityGauge } from "./ProbabilityGauge";
import { Activity, Users, TrendingUp, AlertTriangle, Shield, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

interface ConnectionData {
  id: string;
  person_name: string;
  analysis_data: {
    meta?: { overall_conversation_health_score?: number };
    dynamics?: {
      initiation_balance?: { initiated_by_A_percent?: number; initiated_by_B_percent?: number };
    };
    people?: {
      B?: { 
        scores?: { 
          safety?: { score?: number }; 
          reciprocity?: { score?: number }; 
        }; 
      }; 
    };
  } | null;
}

interface InstantInsightsPanelProps {
  connections: ConnectionData[];
  userPatterns: UserPatterns | null;
  isLoading?: boolean;
}

export function InstantInsightsPanel({ connections, userPatterns, isLoading }: InstantInsightsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Instant Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics from connections
  const totalConnections = connections.length;
  const healthScores = connections
    .map(c => c.analysis_data?.meta?.overall_conversation_health_score)
    .filter((s): s is number => s !== undefined && s !== null);
  
  const averageHealth = healthScores.length > 0 
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : null;
  
  const connectionsNeedingAttention = healthScores.filter(s => s < 50).length;

  // Calculate average safety from connections
  const safetyScores = connections
    .map(c => c.analysis_data?.people?.B?.scores?.safety?.score)
    .filter((s): s is number => s !== undefined && s !== null);
  
  const averageSafety = safetyScores.length > 0
    ? Math.round(safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length)
    : null;

  // Calculate average reciprocity
  const reciprocityScores = connections
    .map(c => c.analysis_data?.people?.B?.scores?.reciprocity?.score)
    .filter((s): s is number => s !== undefined && s !== null);
  
  const averageReciprocity = reciprocityScores.length > 0
    ? Math.round(reciprocityScores.reduce((a, b) => a + b, 0) / reciprocityScores.length)
    : null;

  // Use user patterns if available, otherwise derive from connections
  const burnoutRisk = userPatterns?.burnout_risk_score ?? 
    (averageReciprocity !== null ? Math.max(0, 100 - averageReciprocity) : null);
  
  const emotionalLaborScore = userPatterns?.emotional_labor_score ?? null;
  const initiationRatioUser = userPatterns?.initiation_ratio_user ?? null;

  // Calculate inconsistency risk from variation in health scores
  const healthVariance = healthScores.length > 1
    ? Math.round(Math.sqrt(
        healthScores.reduce((sum, s) => sum + Math.pow(s - (averageHealth || 0), 2), 0) / healthScores.length
      ))
    : null;
  
  const inconsistencyRisk = healthVariance !== null 
    ? Math.min(100, healthVariance * 2)
    : null;

  if (totalConnections === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Instant Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Analyze some conversations to see instant insights about your relational patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Instant Insights
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Based on {totalConnections} connection{totalConnections !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time metrics from your analyzed connections
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl font-semibold">{totalConnections}</p>
            <p className="text-xs text-muted-foreground">Total Connections</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Activity className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-2xl font-semibold">{averageHealth ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Avg Health Score</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Shield className="h-5 w-5 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-semibold">{averageSafety ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Avg Safety Score</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <AlertTriangle className={`h-5 w-5 mx-auto mb-2 ${connectionsNeedingAttention > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <p className="text-2xl font-semibold">{connectionsNeedingAttention}</p>
            <p className="text-xs text-muted-foreground">Need Attention</p>
          </div>
        </div>

        {/* Risk & Positive Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">Risk Indicators</span>
            </div>
            {burnoutRisk !== null && (
              <ProbabilityGauge 
                value={burnoutRisk} 
                label="Burnout Risk" 
                inverted 
              />
            )}
            {inconsistencyRisk !== null && (
              <ProbabilityGauge 
                value={inconsistencyRisk} 
                label="Inconsistency Risk" 
                inverted 
              />
            )}
            {burnoutRisk === null && inconsistencyRisk === null && (
              <p className="text-sm text-muted-foreground">More data needed</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Positive Indicators</span>
            </div>
            {averageSafety !== null && (
              <ProbabilityGauge 
                value={averageSafety} 
                label="Emotional Safety" 
              />
            )}
            {averageReciprocity !== null && (
              <ProbabilityGauge 
                value={averageReciprocity} 
                label="Reciprocity" 
              />
            )}
            {averageSafety === null && averageReciprocity === null && (
              <p className="text-sm text-muted-foreground">More data needed</p>
            )}
          </div>
        </div>

        {/* Initiation Balance */}
        {initiationRatioUser !== null && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Your Initiation Pattern</p>
            <div className="flex items-center gap-2">
              <span className="text-sm">You initiate</span>
              <span className="font-semibold text-primary">{Math.round(initiationRatioUser)}%</span>
              <span className="text-sm text-muted-foreground">of conversations</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
