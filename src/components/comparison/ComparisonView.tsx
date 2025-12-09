import { useMemo } from "react";
import { Connection, AnalysisResult } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparisonViewProps {
  connections1: Connection[];
  connections2: Connection[];
  personName1: string;
  personName2: string;
  onClose: () => void;
}

function calculateAverageScores(connections: Connection[]) {
  const dimensions = ["safety", "accountability", "emotional_availability", "reciprocity", "clarity", "boundaries", "initiation"] as const;
  
  const scores: Record<string, number> = {};
  let healthScoreSum = 0;
  let initiationSum = 0;
  let validCount = 0;

  connections.forEach(conn => {
    const analysis = conn.analysis_data as AnalysisResult | null;
    if (!analysis) return;
    
    validCount++;
    healthScoreSum += analysis.meta?.overall_conversation_health_score || 0;
    initiationSum += analysis.dynamics?.initiation_balance?.initiated_by_B_percent || 0;
    
    dimensions.forEach(dim => {
      const score = analysis.people?.B?.scores?.[dim]?.score || 0;
      scores[dim] = (scores[dim] || 0) + score;
    });
  });

  if (validCount === 0) return null;

  // Calculate averages
  dimensions.forEach(dim => {
    scores[dim] = Math.round(scores[dim] / validCount);
  });

  return {
    dimensions: scores,
    healthScore: Math.round(healthScoreSum / validCount),
    initiation: Math.round(initiationSum / validCount),
    reportCount: validCount,
  };
}

export function ComparisonView({ 
  connections1, 
  connections2, 
  personName1, 
  personName2, 
  onClose 
}: ComparisonViewProps) {
  const avg1 = useMemo(() => calculateAverageScores(connections1), [connections1]);
  const avg2 = useMemo(() => calculateAverageScores(connections2), [connections2]);

  if (!avg1 || !avg2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          One or both connections don't have analysis data.
        </CardContent>
      </Card>
    );
  }

  // Build radar chart data from averaged scores
  const dimensions = ["safety", "accountability", "emotional_availability", "reciprocity", "clarity", "boundaries", "initiation"];
  const radarData = dimensions.map(dim => ({
    dimension: dim.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
    [personName1]: avg1.dimensions[dim] || 0,
    [personName2]: avg2.dimensions[dim] || 0,
  }));

  // Compare key metrics using averaged values
  const metrics = [
    {
      label: "Avg Health Score",
      val1: avg1.healthScore,
      val2: avg2.healthScore,
    },
    {
      label: "Avg Safety",
      val1: avg1.dimensions.safety,
      val2: avg2.dimensions.safety,
    },
    {
      label: "Avg Reciprocity",
      val1: avg1.dimensions.reciprocity,
      val2: avg2.dimensions.reciprocity,
    },
    {
      label: "Avg Boundaries",
      val1: avg1.dimensions.boundaries,
      val2: avg2.dimensions.boundaries,
    },
    {
      label: "Avg Your Initiation %",
      val1: avg1.initiation,
      val2: avg2.initiation,
    },
  ];

  const getWinner = (val1: number | undefined, val2: number | undefined) => {
    if (val1 === undefined || val2 === undefined) return "-";
    const diff = val1 - val2;
    if (Math.abs(diff) < 5) return "Tie";
    if (diff > 0) return personName1;
    return personName2;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Comparing: {personName1} vs {personName2}
        </CardTitle>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-muted"
          onClick={onClose}
        >
          Close Comparison
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report counts */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{personName1}: {avg1.reportCount} report{avg1.reportCount > 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{personName2}: {avg2.reportCount} report{avg2.reportCount > 1 ? 's' : ''}</span>
        </div>

        {/* Radar Chart Comparison */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="dimension" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Radar
                name={personName1}
                dataKey={personName1}
                stroke="#2DD4BF"
                fill="#2DD4BF"
                fillOpacity={0.3}
              />
              <Radar
                name={personName2}
                dataKey={personName2}
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Comparison Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-foreground">Metric</th>
                <th className="text-center p-3 font-medium text-foreground">{personName1}</th>
                <th className="text-center p-3 font-medium text-foreground">{personName2}</th>
                <th className="text-center p-3 font-medium text-foreground">Win</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, idx) => (
                <tr key={metric.label} className={cn(idx % 2 === 0 && "bg-muted/20")}>
                  <td className="p-3 text-muted-foreground">{metric.label}</td>
                  <td className="p-3 text-center font-medium text-foreground">
                    {metric.val1 !== undefined ? metric.val1 : "-"}
                  </td>
                  <td className="p-3 text-center font-medium text-foreground">
                    {metric.val2 !== undefined ? metric.val2 : "-"}
                  </td>
                  <td className="p-3 text-center">
                    {(() => {
                      const winner = getWinner(metric.val1, metric.val2);
                      if (winner === "Tie") return <span className="text-muted-foreground">Tie</span>;
                      if (winner === "-") return "-";
                      if (winner === personName1) return <span className="text-[#2DD4BF] font-medium">{personName1}</span>;
                      return <span className="text-[#8B5CF6] font-medium">{personName2}</span>;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}