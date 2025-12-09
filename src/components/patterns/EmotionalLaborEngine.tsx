import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface EmotionalLaborEngineProps {
  burnoutRisk: number;
  clarityUser: number;
  clarityOthers: number;
  repairUser: number;
  repairOthers: number;
  connectionCount: number;
}

export function EmotionalLaborEngine({
  burnoutRisk,
  clarityUser,
  clarityOthers,
  repairUser,
  repairOthers,
  connectionCount
}: EmotionalLaborEngineProps) {
  const getBurnoutLevel = () => {
    if (burnoutRisk >= 70) return { label: "High", color: "text-destructive", icon: AlertTriangle };
    if (burnoutRisk >= 40) return { label: "Moderate", color: "text-yellow-600", icon: AlertCircle };
    return { label: "Low", color: "text-green-600", icon: CheckCircle };
  };

  const burnoutLevel = getBurnoutLevel();
  const BurnoutIcon = burnoutLevel.icon;

  const totalLabor = clarityUser + clarityOthers + repairUser + repairOthers;
  const userLabor = clarityUser + repairUser;
  const laborPercent = totalLabor > 0 ? Math.round((userLabor / totalLabor) * 100) : 50;

  const isOverextended = laborPercent > 65;
  const isReciprocal = laborPercent >= 40 && laborPercent <= 60;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Emotional Labor Engine</CardTitle>
        <p className="text-sm text-muted-foreground">
          Burnout risk and labor distribution across {connectionCount} connections
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Burnout Risk Score */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Burnout Risk Score</span>
            <div className={`flex items-center gap-1.5 ${burnoutLevel.color}`}>
              <BurnoutIcon className="h-4 w-4" />
              <span className="font-medium">{burnoutLevel.label}</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-semibold">{Math.round(burnoutRisk)}</span>
            <span className="text-muted-foreground mb-1">/ 100</span>
          </div>
          <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                burnoutRisk >= 70
                  ? "bg-destructive"
                  : burnoutRisk >= 40
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${burnoutRisk}%` }}
            />
          </div>
        </div>

        {/* Overextension Warning */}
        <div className={`p-3 rounded-lg flex items-start gap-3 ${
          isOverextended 
            ? "bg-destructive/10 border border-destructive/20" 
            : "bg-green-500/10 border border-green-500/20"
        }`}>
          {isOverextended ? (
            <>
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Overextension Warning</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're carrying {laborPercent}% of the emotional labor across your connections.
                  Consider setting clearer boundaries.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700">Balanced Load</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your emotional labor distribution appears {isReciprocal ? "reciprocal" : "manageable"}.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">Who Reassures More</p>
            <p className="text-sm font-medium mt-1">
              {repairUser > repairOthers ? "You" : repairUser < repairOthers ? "Them" : "Balanced"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">Who Explains More</p>
            <p className="text-sm font-medium mt-1">
              {clarityUser > clarityOthers ? "You" : clarityUser < clarityOthers ? "Them" : "Balanced"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">Labor Distribution</p>
            <p className="text-sm font-medium mt-1">{laborPercent}% You</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">Reciprocity</p>
            <p className="text-sm font-medium mt-1">
              {isReciprocal ? "Consistent" : laborPercent > 60 ? "Uneven" : "Variable"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
