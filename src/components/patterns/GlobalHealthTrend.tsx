import { Connection, AnalysisResult } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GlobalHealthTrendProps {
  connections: Connection[];
  selectedPersonName?: string | null;
}

export function GlobalHealthTrend({ connections, selectedPersonName }: GlobalHealthTrendProps) {
  // Filter by person if selected
  const filteredConnections = selectedPersonName 
    ? connections.filter(c => c.person_name === selectedPersonName)
    : connections;

  // Sort connections by date
  const sortedConnections = [...filteredConnections].sort((a, b) => {
    const dateA = a.analysis_date ? parseISO(a.analysis_date) : new Date(a.created_at);
    const dateB = b.analysis_date ? parseISO(b.analysis_date) : new Date(b.created_at);
    return dateA.getTime() - dateB.getTime();
  });

  // Build timeline data with aggregation for same dates
  const dateMap = new Map<string, {
    healthScores: number[];
    safetyScores: number[];
    reciprocityScores: number[];
    personNames: string[];
    fullDate: string;
  }>();

  sortedConnections.forEach((conn) => {
    const analysis = conn.analysis_data as AnalysisResult | null;
    const date = conn.analysis_date 
      ? parseISO(conn.analysis_date) 
      : new Date(conn.created_at);
    const dateKey = format(date, "MMM d");
    const fullDate = format(date, "MMM d, yyyy");
    
    const existing = dateMap.get(dateKey) || {
      healthScores: [],
      safetyScores: [],
      reciprocityScores: [],
      personNames: [],
      fullDate,
    };
    
    existing.healthScores.push(analysis?.meta?.overall_conversation_health_score || 0);
    existing.safetyScores.push(analysis?.people?.B?.scores?.safety?.score || 0);
    existing.reciprocityScores.push(analysis?.people?.B?.scores?.reciprocity?.score || 0);
    existing.personNames.push(conn.person_name);
    
    dateMap.set(dateKey, existing);
  });

  // Convert to array and calculate averages
  const timelineData = Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    fullDate: data.fullDate,
    personName: data.personNames.join(", "),
    healthScore: Math.round(data.healthScores.reduce((a, b) => a + b, 0) / data.healthScores.length),
    safety: Math.round(data.safetyScores.reduce((a, b) => a + b, 0) / data.safetyScores.length),
    reciprocity: Math.round(data.reciprocityScores.reduce((a, b) => a + b, 0) / data.reciprocityScores.length),
    reportCount: data.healthScores.length,
  }));

  // Calculate trend
  const getTrend = () => {
    if (timelineData.length < 2) return "neutral";
    const first = timelineData[0].healthScore;
    const last = timelineData[timelineData.length - 1].healthScore;
    const diff = last - first;
    if (Math.abs(diff) < 5) return "neutral";
    return diff > 0 ? "up" : "down";
  };

  const trend = getTrend();

  const TrendIcon = trend === "up" 
    ? TrendingUp 
    : trend === "down" 
    ? TrendingDown 
    : Minus;

  const trendColor = trend === "up" 
    ? "text-success" 
    : trend === "down" 
    ? "text-danger" 
    : "text-muted-foreground";

  const trendText = trend === "up" 
    ? "Improving" 
    : trend === "down" 
    ? "Declining" 
    : "Stable";

  const title = selectedPersonName 
    ? `Health Trend: ${selectedPersonName}`
    : "Health Trend: All Connections";

  if (timelineData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal" />
            {title}
          </CardTitle>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{trendText}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {sortedConnections.length} report{sortedConnections.length > 1 ? "s" : ""} over time
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string, props: any) => {
                  const { reportCount, personName } = props.payload;
                  if (reportCount > 1 && name === "Health Score") {
                    return [`${value} (Avg of ${reportCount}: ${personName})`, name];
                  }
                  if (!selectedPersonName && name === "Health Score") {
                    return [`${value} (${personName})`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: "11px" }}
              />
              <Line
                type="monotone"
                dataKey="healthScore"
                name="Health Score"
                stroke="hsl(var(--teal))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--teal))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="safety"
                name="Safety"
                stroke="hsl(var(--success))"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="reciprocity"
                name="Reciprocity"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
