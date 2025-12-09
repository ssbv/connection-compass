import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProbabilityGauge } from "./ProbabilityGauge";
import { TrendingUp, AlertTriangle, Shield, Heart, Clock } from "lucide-react";
import { ProjectionData } from "@/types/analysis";
import { Skeleton } from "@/components/ui/skeleton";

interface GlobalForecastPanelProps {
  projection: ProjectionData | null;
  timeframe: string;
  isLoading?: boolean;
  confidence?: 'low' | 'medium' | 'high';
}

export function GlobalForecastPanel({ projection, timeframe, isLoading, confidence }: GlobalForecastPanelProps) {
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '3m': return '3 Months';
      case '6m': return '6 Months';
      case '12m': return '12 Months';
      default: return timeframe;
    }
  };

  const getConfidenceBadge = () => {
    if (!confidence) return null;
    const colors = {
      low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[confidence]}`}>
        {confidence} confidence
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {getTimeframeLabel()} Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {getTimeframeLabel()} Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Generate a projection to see forecasted outcomes for this timeframe.
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
            <Clock className="h-5 w-5 text-primary" />
            {getTimeframeLabel()} Forecast
          </CardTitle>
          {getConfidenceBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary pl-3">
          {projection.summary}
        </p>

        {/* Likelihood Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">Risk Indicators</span>
            </div>
            <ProbabilityGauge 
              value={projection.burnout_likelihood} 
              label="Burnout Likelihood" 
              inverted 
            />
            <ProbabilityGauge 
              value={projection.inconsistency_likelihood} 
              label="Inconsistency Likelihood" 
              inverted 
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Positive Indicators</span>
            </div>
            <ProbabilityGauge 
              value={projection.secure_connection_likelihood} 
              label="Secure Connection" 
            />
            <ProbabilityGauge 
              value={projection.emotional_safety_likelihood} 
              label="Emotional Safety" 
            />
          </div>
        </div>

        {/* Long-term Viability */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Long-term Viability</span>
          </div>
          <ProbabilityGauge 
            value={projection.long_term_viability} 
            label="" 
            description="Projected sustainability of current relational patterns"
          />
        </div>
      </CardContent>
    </Card>
  );
}
