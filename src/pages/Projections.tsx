import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "lucide-react";

export default function Projections() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Future Projection Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered relational forecasts based on your behavioral patterns
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The Future Projection Engine will analyze your connection patterns 
              and generate probability-based forecasts including:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• 3, 6, and 12-month relational experience forecasts</li>
              <li>• Likelihood of emotional burnout or secure connection</li>
              <li>• Per-connection future scenarios</li>
              <li>• Dual-perspective modeling (if both/one/neither party changes)</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Continue analyzing conversations to build enough data for accurate projections.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
