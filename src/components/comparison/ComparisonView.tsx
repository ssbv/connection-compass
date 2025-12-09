import { Connection, AnalysisResult } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  connection1: Connection;
  connection2: Connection;
  onClose: () => void;
}

export function ComparisonView({ connection1, connection2, onClose }: ComparisonViewProps) {
  const analysis1 = connection1.analysis_data as AnalysisResult | null;
  const analysis2 = connection2.analysis_data as AnalysisResult | null;

  if (!analysis1 || !analysis2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          One or both connections don't have analysis data.
        </CardContent>
      </Card>
    );
  }

  // Build radar chart data
  const dimensions = ["safety", "accountability", "emotional_availability", "reciprocity", "clarity", "boundaries", "initiation"];
  const radarData = dimensions.map(dim => {
    const dimKey = dim as keyof typeof analysis1.people.B.scores;
    return {
      dimension: dim.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      [connection1.person_name]: analysis1.people?.B?.scores?.[dimKey]?.score || 0,
      [connection2.person_name]: analysis2.people?.B?.scores?.[dimKey]?.score || 0,
    };
  });

  // Compare key metrics
  const metrics = [
    {
      label: "Health Score",
      val1: analysis1.meta?.overall_conversation_health_score,
      val2: analysis2.meta?.overall_conversation_health_score,
    },
    {
      label: "Safety",
      val1: analysis1.people?.B?.scores?.safety?.score,
      val2: analysis2.people?.B?.scores?.safety?.score,
    },
    {
      label: "Reciprocity",
      val1: analysis1.people?.B?.scores?.reciprocity?.score,
      val2: analysis2.people?.B?.scores?.reciprocity?.score,
    },
    {
      label: "Boundaries",
      val1: analysis1.people?.B?.scores?.boundaries?.score,
      val2: analysis2.people?.B?.scores?.boundaries?.score,
    },
    {
      label: "Your Initiation %",
      val1: analysis1.dynamics?.initiation_balance?.initiated_by_B_percent,
      val2: analysis2.dynamics?.initiation_balance?.initiated_by_B_percent,
    },
  ];

  const getDiffIcon = (val1: number | undefined, val2: number | undefined) => {
    if (val1 === undefined || val2 === undefined) return null;
    const diff = val1 - val2;
    if (Math.abs(diff) < 5) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (diff > 0) return <TrendingUp className="h-3 w-3 text-success" />;
    return <TrendingDown className="h-3 w-3 text-danger" />;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Comparing: {connection1.person_name} vs {connection2.person_name}
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
                name={connection1.person_name}
                dataKey={connection1.person_name}
                stroke="hsl(var(--teal))"
                fill="hsl(var(--teal))"
                fillOpacity={0.3}
              />
              <Radar
                name={connection2.person_name}
                dataKey={connection2.person_name}
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
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
                <th className="text-center p-3 font-medium text-foreground">{connection1.person_name}</th>
                <th className="text-center p-3 font-medium text-foreground">{connection2.person_name}</th>
                <th className="text-center p-3 font-medium text-foreground">Diff</th>
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
                  <td className="p-3 text-center flex justify-center">
                    {getDiffIcon(metric.val1, metric.val2)}
                    {metric.val1 !== undefined && metric.val2 !== undefined && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {Math.abs(metric.val1 - metric.val2)}
                      </span>
                    )}
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
