import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Person, ExamplesByDimension } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface PersonPanelProps {
  person: Person;
  examples: ExamplesByDimension;
  title: "Them" | "You";
}

export function PersonPanel({ person, examples, title }: PersonPanelProps) {
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
    <div className="bg-panel rounded-xl p-6 relative flex-1 min-w-0 print-keep-together">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">{title}</h3>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors no-print"
        >
          {showExamples ? "Results" : "Examples"}
        </button>
      </div>

      {showExamples ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
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
        <div className="space-y-4">
          {/* Radar Chart */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
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

          {/* Narrative Summary */}
          <p className="text-sm text-foreground">{person.narrative_summary}</p>

          {/* Strengths */}
          {person.strengths.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Strengths</span>
              <ul className="mt-1 space-y-1">
                {person.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {person.risks.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Risks / Watch-outs</span>
              <ul className="mt-1 space-y-1">
                {person.risks.map((r, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-warning mt-0.5">⚠</span>
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
