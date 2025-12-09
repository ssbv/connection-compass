import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function EmotionalGrowth() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Emotional Imprint & Growth
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track emotional residue, closure, healing, and self-stability
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The Emotional Growth page will provide insights into:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Emotional Imprint Ledger</strong> – Where you felt dismissed, unsafe, valued, or chosen</li>
              <li>• <strong>Repair Completion Tracker</strong> – Status of closure per connection</li>
              <li>• <strong>Self-Stabilization Indicators</strong> – Patterns of self-soothing, over-explaining, or withdrawal</li>
              <li>• <strong>Emotional Carry-Forward Risk</strong> – Whether residue from one connection bleeds into others</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Continue analyzing conversations to build your emotional growth profile.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
