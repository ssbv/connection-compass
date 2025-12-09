import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeriesPoint } from "@/types/analysis";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { format } from "date-fns";

interface InitiationTrendsChartProps {
  timeSeries: TimeSeriesPoint[];
  avgUser: number;
  avgOthers: number;
}

export function InitiationTrendsChart({
  timeSeries,
  avgUser,
  avgOthers
}: InitiationTrendsChartProps) {
  const chartData = timeSeries.map(point => ({
    date: point.date,
    displayDate: format(new Date(point.date), "MMM d"),
    you: Math.round(point.initiation_user),
    them: Math.round(point.initiation_others)
  }));

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Initiation Trends Over Time</CardTitle>
        <p className="text-xs text-muted-foreground">
          Who starts conversations more often
        </p>
      </CardHeader>
      <CardContent className="pt-3">
        {timeSeries.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            Not enough data points to show trends
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">Your Average</p>
                <p className="text-xl font-semibold text-primary">
                  {Math.round(avgUser)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">Their Average</p>
                <p className="text-xl font-semibold text-foreground">
                  {Math.round(avgOthers)}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="you"
                    name="You"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="them"
                    name="Them"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
