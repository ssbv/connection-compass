import { useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { cn } from "@/lib/utils";

export function OverallResultsSection() {
  const { analysisResult } = useAnalysis();
  const [showExamples, setShowExamples] = useState(false);

  if (!analysisResult) return null;

  const { meta, overall_results, example_attributions } = analysisResult;

  const getTrafficLightColor = (light: string) => {
    switch (light) {
      case "green":
        return "bg-success";
      case "yellow":
        return "bg-warning";
      case "red":
        return "bg-danger";
      default:
        return "bg-muted";
    }
  };

  const getAllExamples = () => {
    const examples: { person: string; dimension: string; snippet: string; comment: string; direction: string }[] = [];
    
    Object.entries(example_attributions.by_dimension.A).forEach(([dimension, items]) => {
      items.forEach((item) => {
        examples.push({ person: "Them", dimension, ...item });
      });
    });
    
    Object.entries(example_attributions.by_dimension.B).forEach(([dimension, items]) => {
      items.forEach((item) => {
        examples.push({ person: "You", dimension, ...item });
      });
    });

    return examples.slice(0, 6);
  };

  return (
    <section id="overall-results" className="animate-fade-in print-keep-together">
      <h2 className="text-lg font-medium text-foreground mb-4">Overall Results</h2>
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
              {getAllExamples().map((example, i) => (
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
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Health Score */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">
                  {meta.overall_conversation_health_score}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className={cn("w-4 h-4 rounded-full", getTrafficLightColor(meta.traffic_light))} />
              <span className="text-sm text-muted-foreground capitalize">
                {meta.traffic_light === "green" && "Healthy patterns"}
                {meta.traffic_light === "yellow" && "Mixed / Needs attention"}
                {meta.traffic_light === "red" && "Concerning patterns"}
              </span>
            </div>

            {/* Summary */}
            <p className="text-foreground">{meta.summary}</p>

            {/* Dynamic Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Mutual Respect</span>
                <p className="text-sm font-medium text-foreground capitalize">
                  {overall_results.mutual_respect}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Power Balance</span>
                <p className="text-sm font-medium text-foreground capitalize">
                  {overall_results.power_balance.replace(/_/g, " ")}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Consistency</span>
                <p className="text-sm font-medium text-foreground capitalize">
                  {overall_results.consistency}
                </p>
              </div>
            </div>

            {/* Headline Flags */}
            {overall_results.headline_flags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Key Patterns</span>
                <ul className="space-y-1">
                  {overall_results.headline_flags.map((flag, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-teal-dark mt-1">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
