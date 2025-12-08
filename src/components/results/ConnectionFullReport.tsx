import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { AnalysisResult, Person, ExamplesByDimension } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface ConnectionFullReportProps {
  analysis: AnalysisResult;
}

function PersonPanelStandalone({
  person,
  examples,
  title,
}: {
  person: Person;
  examples: ExamplesByDimension;
  title: "Them" | "You";
}) {
  const [showExamples, setShowExamples] = useState(false);

  const radarData = person.radar_chart.dimensions.map((dim, i) => ({
    dimension: dim.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: person.radar_chart.values[i],
    fullMark: 100,
  }));

  const getAllExamples = () => {
    const allExamples: { dimension: string; snippet: string; comment: string; direction: string }[] = [];
    Object.entries(examples).forEach(([dimension, items]) => {
      items.forEach((item) => {
        allExamples.push({ dimension, ...item });
      });
    });
    return allExamples;
  };

  return (
    <div className="bg-card rounded-lg p-4 relative flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showExamples ? "Results" : "Examples"}
        </button>
      </div>

      {showExamples ? (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {getAllExamples().length > 0 ? (
            getAllExamples().map((example, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg border",
                  example.direction.includes("increases") ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
                )}
              >
                <span className="text-xs font-medium text-muted-foreground capitalize block mb-1">
                  {example.dimension.replace("_", " ")}
                </span>
                <p className="text-sm italic text-foreground">"{example.snippet}"</p>
                <p className="text-xs text-muted-foreground mt-1">{example.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No specific examples available.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 7, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  name={title}
                  dataKey="value"
                  stroke="hsl(var(--teal-dark))"
                  fill="hsl(var(--teal))"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-foreground">{person.narrative_summary}</p>
          {person.strengths.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-muted-foreground">Strengths</span>
              <ul className="mt-0.5 space-y-0.5">
                {person.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-success mt-0.5 text-[10px]">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {person.risks.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-muted-foreground">Risks</span>
              <ul className="mt-0.5 space-y-0.5">
                {person.risks.map((r, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-warning mt-0.5 text-[10px]">⚠</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConnectionFullReport({ analysis }: ConnectionFullReportProps) {
  const [showOverallExamples, setShowOverallExamples] = useState(false);
  const [showDynamicsExamples, setShowDynamicsExamples] = useState(false);

  const { meta, overall_results, people, dynamics, example_attributions } = analysis;

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

  const formatLabel = (value: string) => {
    if (!value) return "Unclear";
    return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getOverallExamples = () => {
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

  const getDynamicsExamples = () => {
    const examples: { person: string; dimension: string; snippet: string; comment: string; direction: string }[] = [];
    ["boundaries", "initiation"].forEach((dim) => {
      const dimKey = dim as keyof typeof example_attributions.by_dimension.A;
      example_attributions.by_dimension.A[dimKey]?.forEach((item) => {
        examples.push({ person: "Them", dimension: dim, ...item });
      });
      example_attributions.by_dimension.B[dimKey]?.forEach((item) => {
        examples.push({ person: "You", dimension: dim, ...item });
      });
    });
    return examples.slice(0, 6);
  };

  return (
    <div className="space-y-4">
      {/* Overall Results */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-2">Overall Results</h2>
        <div className="bg-card rounded-lg p-4 relative">
          <button
            onClick={() => setShowOverallExamples(!showOverallExamples)}
            className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showOverallExamples ? "Results" : "Examples"}
          </button>

          {showOverallExamples ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Supporting Examples</h3>
              {getOverallExamples().map((example, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border",
                    example.direction.includes("increases") ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {example.person} • {example.dimension.replace("_", " ")}
                  </span>
                  <p className="text-sm italic text-foreground">"{example.snippet}"</p>
                  <p className="text-xs text-muted-foreground mt-1">{example.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">{meta.overall_conversation_health_score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
                <div className={cn("w-3 h-3 rounded-full", getTrafficLightColor(meta.traffic_light))} />
              </div>
              <p className="text-foreground text-xs">{meta.summary}</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground">Mutual Respect</span>
                  <p className="text-xs font-medium text-foreground capitalize">{overall_results.mutual_respect}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Power Balance</span>
                  <p className="text-xs font-medium text-foreground capitalize">{overall_results.power_balance.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Consistency</span>
                  <p className="text-xs font-medium text-foreground capitalize">{overall_results.consistency}</p>
                </div>
              </div>
              {overall_results.headline_flags.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Key Patterns</span>
                  <ul className="mt-1 space-y-1">
                    {overall_results.headline_flags.map((flag, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-teal-dark">•</span>
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

      {/* Them & You */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-foreground">Them</h2>
          <h2 className="text-sm font-medium text-foreground">You</h2>
        </div>
        <div className="flex gap-3 flex-col md:flex-row">
          <PersonPanelStandalone
            person={people.A}
            examples={example_attributions.by_dimension.A}
            title="Them"
          />
          <PersonPanelStandalone
            person={people.B}
            examples={example_attributions.by_dimension.B}
            title="You"
          />
        </div>
      </section>

      {/* Dynamics */}
      <section>
        <h2 className="text-sm font-medium text-foreground mb-2">Dynamics</h2>
        <div className="bg-card rounded-lg p-4 relative">
          <button
            onClick={() => setShowDynamicsExamples(!showDynamicsExamples)}
            className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDynamicsExamples ? "Results" : "Examples"}
          </button>

          {showDynamicsExamples ? (
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Supporting Examples</h3>
              {getDynamicsExamples().length > 0 ? (
                getDynamicsExamples().map((example, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border",
                      example.direction.includes("increases") ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
                    )}
                  >
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {example.person} • {example.dimension.replace("_", " ")}
                    </span>
                    <p className="text-sm italic text-foreground">"{example.snippet}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{example.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No specific examples available.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-foreground mb-1">Initiation Balance</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal h-full transition-all"
                      style={{ width: `${dynamics.initiation_balance.initiated_by_A_percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Them: {dynamics.initiation_balance.initiated_by_A_percent}% • You: {dynamics.initiation_balance.initiated_by_B_percent}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-foreground mb-1">Emotional Labor</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Who repairs more?</span>
                    <p className="text-xs font-medium text-foreground">{formatLabel(dynamics.emotional_labor.who_repairs_more)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Who clarifies more?</span>
                    <p className="text-xs font-medium text-foreground">{formatLabel(dynamics.emotional_labor.who_clarifies_more)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-foreground mb-1">Boundary Interaction</h4>
                <p className="text-xs text-foreground">{dynamics.boundary_interaction.summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-foreground mb-1">Escalation Pattern</h4>
                <p className="text-xs text-foreground">{dynamics.escalation_pattern.pattern}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground">Who carries connection?</span>
                  <p className="text-xs font-medium text-foreground">{formatLabel(dynamics.who_carries_connection)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Conflict handling</span>
                  <p className="text-xs font-medium text-foreground">{formatLabel(dynamics.emotional_labor.who_repairs_more)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Safety</span>
                  <p className="text-xs font-medium text-foreground truncate">{dynamics.boundary_interaction.summary.substring(0, 25)}...</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Who adjusts more?</span>
                  <p className="text-xs font-medium text-foreground">{formatLabel(dynamics.who_adjusts_more)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}