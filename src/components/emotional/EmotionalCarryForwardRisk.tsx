import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, AlertTriangle, TrendingUp, Shield } from "lucide-react";

interface CarryForwardRisk {
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  patterns: {
    from_connection: string;
    to_connection: string;
    pattern_type: string;
  }[];
  recommendations: string[];
}

interface EmotionalCarryForwardRiskProps {
  risk: CarryForwardRisk;
}

export function EmotionalCarryForwardRisk({ risk }: EmotionalCarryForwardRiskProps) {
  const getRiskBadge = () => {
    const colors = {
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return (
      <Badge className={cn("text-xs", colors[risk.riskLevel])}>
        {risk.riskLevel.toUpperCase()} RISK
      </Badge>
    );
  };

  const getRiskIcon = () => {
    switch (risk.riskLevel) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Shield className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            {getRiskIcon()}
            Emotional Carry-Forward Risk
          </CardTitle>
          {getRiskBadge()}
        </div>
        <p className="text-sm text-muted-foreground">
          Analysis of emotional residue transferring between connections
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-foreground">{risk.summary}</p>
        </div>

        {/* Pattern Flows */}
        {risk.patterns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Detected Patterns</h4>
            <div className="space-y-2">
              {risk.patterns.map((pattern, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2 rounded border border-border bg-card text-sm"
                >
                  <span className="text-muted-foreground">{pattern.from_connection}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{pattern.to_connection}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {pattern.pattern_type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {risk.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Recommendations</h4>
            <ul className="space-y-1">
              {risk.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
