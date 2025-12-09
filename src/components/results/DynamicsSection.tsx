import { useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { cn } from "@/lib/utils";

export function DynamicsSection() {
  const { analysisResult } = useAnalysis();
  const [showExamples, setShowExamples] = useState(false);

  if (!analysisResult) return null;

  const { dynamics, example_attributions } = analysisResult;

  const getAllDynamicsExamples = () => {
    const examples: { person: string; dimension: string; snippet: string; comment: string; direction: string }[] = [];
    
    // Get examples related to dynamics (boundaries, initiation)
    ["boundaries", "initiation"].forEach((dim) => {
      const dimKey = dim as keyof typeof example_attributions.by_dimension.A;
      const itemsA = example_attributions?.by_dimension?.A?.[dimKey];
      const itemsB = example_attributions?.by_dimension?.B?.[dimKey];
      
      if (Array.isArray(itemsA)) {
        itemsA.forEach((item) => {
          examples.push({ person: "Them", dimension: dim, ...item });
        });
      }
      if (Array.isArray(itemsB)) {
        itemsB.forEach((item) => {
          examples.push({ person: "You", dimension: dim, ...item });
        });
      }
    });

    return examples.slice(0, 6);
  };

  const formatLabel = (value: string) => {
    if (!value) return "Unclear";
    return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <section id="dynamics" className="animate-fade-in print-keep-together">
      <h2 className="text-lg font-medium text-foreground mb-4">Dynamic</h2>
      <div className="bg-panel rounded-xl p-6 relative">
        {/* Toggle button */}
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors no-print"
        >
          {showExamples ? "Results" : "Examples"}
        </button>

        {showExamples ? (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Supporting Examples</h3>
            <div className="space-y-3">
              {getAllDynamicsExamples().length > 0 ? (
                getAllDynamicsExamples().map((example, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border",
                      example.direction.includes("increases") ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {example.person} • {example.dimension.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm italic text-foreground">"{example.snippet}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{example.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific examples available.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Initiation Balance */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Initiation vs. Reaction Balance</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-teal h-full transition-all"
                    style={{ width: `${dynamics.initiation_balance.initiated_by_A_percent}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  Them: {dynamics.initiation_balance.initiated_by_A_percent}% • You: {dynamics.initiation_balance.initiated_by_B_percent}%
                </span>
              </div>
            </div>

            {/* Emotional Labor */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Emotional Labor Balance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Who apologizes / repairs more?</span>
                  <p className="text-sm font-medium text-foreground">{formatLabel(dynamics.emotional_labor.who_repairs_more)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Who clarifies more?</span>
                  <p className="text-sm font-medium text-foreground">{formatLabel(dynamics.emotional_labor.who_clarifies_more)}</p>
                </div>
              </div>
              {dynamics.emotional_labor.notes && (
                <p className="text-sm text-muted-foreground mt-2">{dynamics.emotional_labor.notes}</p>
              )}
            </div>

            {/* Boundary Interaction */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Boundary Interaction</h4>
              <p className="text-sm text-foreground">{dynamics.boundary_interaction.summary}</p>
              {Array.isArray(dynamics.boundary_interaction.flags) && dynamics.boundary_interaction.flags.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {dynamics.boundary_interaction.flags.map((flag, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-warning mt-0.5">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Escalation Pattern */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Escalation Pattern</h4>
              <p className="text-sm text-foreground">{dynamics.escalation_pattern.pattern}</p>
              {dynamics.escalation_pattern.notes && (
                <p className="text-sm text-muted-foreground mt-1">{dynamics.escalation_pattern.notes}</p>
              )}
            </div>

            {/* Sub-sections */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <span className="text-xs text-muted-foreground">Who carries the connection?</span>
                <p className="text-sm font-medium text-foreground">{formatLabel(dynamics.who_carries_connection)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">How conflict is handled</span>
                <p className="text-sm font-medium text-foreground">{formatLabel(dynamics.emotional_labor.who_repairs_more)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">How safety is maintained</span>
                <p className="text-sm font-medium text-foreground">{dynamics.boundary_interaction.summary.substring(0, 30)}...</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Who adjusts more?</span>
                <p className="text-sm font-medium text-foreground">{formatLabel(dynamics.who_adjusts_more)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
