import { Connection, AnalysisResult } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
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
    const dateA = a.analysis_date ? new Date(a.analysis_date) : new Date(a.created_at);
    const dateB = b.analysis_date ? new Date(b.analysis_date) : new Date(b.created_at);
    return dateA.getTime() - dateB.getTime();
  });

  // Build timeline data
  const timelineData = sortedConnections.map((conn) => {
    const analysis = conn.analysis_data as AnalysisResult | null;
    const date = conn.analysis_date ? new Date(conn.analysis_date) : new Date(conn.created_at);
    
    return {
      date: format(date, "MMM d"),
      fullDate: format(date, "MMM d, yyyy"),
      personName: conn.person_name,
      healthScore: analysis?.meta?.overall_conversation_health_score || 0,
      safety: analysis?.people?.B?.scores?.safety?.score || 0,
      reciprocity: analysis?.people?.B?.scores?.reciprocity?.score || 0,
    };
  });

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
                  if (!selectedPersonName && name === "Health Score") {
                    return [`${value} (${props.payload.personName})`, name];
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
