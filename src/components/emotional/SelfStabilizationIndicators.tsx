import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Gauge, Check, AlertTriangle } from "lucide-react";

interface Indicator {
  label: string;
  score: number; // 0-100
  description: string;
  isPositive: boolean; // true if high score is good
}

interface SelfStabilizationIndicatorsProps {
  indicators: Indicator[];
}

export function SelfStabilizationIndicators({ indicators }: SelfStabilizationIndicatorsProps) {
  const getScoreColor = (score: number, isPositive: boolean) => {
    const effectiveScore = isPositive ? score : 100 - score;
    if (effectiveScore >= 70) return "text-green-600";
    if (effectiveScore >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number, isPositive: boolean) => {
    const effectiveScore = isPositive ? score : 100 - score;
    if (effectiveScore >= 70) return "bg-green-500";
    if (effectiveScore >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getIndicatorIcon = (score: number, isPositive: boolean) => {
    const effectiveScore = isPositive ? score : 100 - score;
    if (effectiveScore >= 60) {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Self-Stabilization Indicators
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Patterns of self-soothing, clarity-seeking, and adjustment behaviors
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {indicators.map((indicator, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIndicatorIcon(indicator.score, indicator.isPositive)}
                  <span className="text-sm font-medium">{indicator.label}</span>
                </div>
                <span className={cn("text-sm font-bold", getScoreColor(indicator.score, indicator.isPositive))}>
                  {indicator.score}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getProgressColor(indicator.score, indicator.isPositive))}
                  style={{ width: `${indicator.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{indicator.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
