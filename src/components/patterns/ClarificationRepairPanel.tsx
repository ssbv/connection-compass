import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface ClarificationRepairPanelProps {
  clarityUser: number;
  clarityOthers: number;
  repairUser: number;
  repairOthers: number;
}

export function ClarificationRepairPanel({
  clarityUser,
  clarityOthers,
  repairUser,
  repairOthers
}: ClarificationRepairPanelProps) {
  const data = [
    {
      name: "Clarification",
      you: clarityUser,
      them: clarityOthers,
    },
    {
      name: "Repair",
      you: repairUser,
      them: repairOthers,
    }
  ];

  const totalClarity = clarityUser + clarityOthers;
  const totalRepair = repairUser + repairOthers;

  const clarityPercent = totalClarity > 0 ? Math.round((clarityUser / totalClarity) * 100) : 50;
  const repairPercent = totalRepair > 0 ? Math.round((repairUser / totalRepair) * 100) : 50;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Clarification & Repair Load</CardTitle>
        <p className="text-sm text-muted-foreground">
          Who asks for clarity and repairs misunderstandings more
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Clarity Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Who Clarifies More</span>
              <span className="font-medium">
                {clarityPercent > 60 ? "You" : clarityPercent < 40 ? "Them" : "Balanced"}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${clarityPercent}%` }}
              />
              <div
                className="bg-muted-foreground/30 h-full transition-all"
                style={{ width: `${100 - clarityPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>You ({clarityUser})</span>
              <span>Them ({clarityOthers})</span>
            </div>
          </div>

          {/* Repair Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Who Repairs More</span>
              <span className="font-medium">
                {repairPercent > 60 ? "You" : repairPercent < 40 ? "Them" : "Balanced"}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${repairPercent}%` }}
              />
              <div
                className="bg-muted-foreground/30 h-full transition-all"
                style={{ width: `${100 - repairPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>You ({repairUser})</span>
              <span>Them ({repairOthers})</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-40 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="you" name="You" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="them" name="Them" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
