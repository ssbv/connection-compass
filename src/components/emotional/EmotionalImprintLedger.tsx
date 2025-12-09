import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImprintStatCard } from "./ImprintStatCard";
import { 
  ThumbsDown, 
  AlertTriangle, 
  EyeOff, 
  Heart, 
  CheckCircle,
  BookOpen
} from "lucide-react";

interface EmotionalImprint {
  dismissed: { count: number; connections: string[] };
  unsafe: { count: number; connections: string[] };
  unseen: { count: number; connections: string[] };
  valued: { count: number; connections: string[] };
  chosen: { count: number; connections: string[] };
}

interface EmotionalImprintLedgerProps {
  imprints: EmotionalImprint;
}

export function EmotionalImprintLedger({ imprints }: EmotionalImprintLedgerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Emotional Imprint Ledger
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Patterns of how you've felt across your connections
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <ImprintStatCard
            label="Felt Dismissed"
            count={imprints.dismissed.count}
            icon={ThumbsDown}
            variant="negative"
            connections={imprints.dismissed.connections}
          />
          <ImprintStatCard
            label="Felt Unsafe"
            count={imprints.unsafe.count}
            icon={AlertTriangle}
            variant="negative"
            connections={imprints.unsafe.connections}
          />
          <ImprintStatCard
            label="Felt Unseen"
            count={imprints.unseen.count}
            icon={EyeOff}
            variant="negative"
            connections={imprints.unseen.connections}
          />
          <ImprintStatCard
            label="Felt Valued"
            count={imprints.valued.count}
            icon={Heart}
            variant="positive"
            connections={imprints.valued.connections}
          />
          <ImprintStatCard
            label="Felt Chosen"
            count={imprints.chosen.count}
            icon={CheckCircle}
            variant="positive"
            connections={imprints.chosen.connections}
          />
        </div>
      </CardContent>
    </Card>
  );
}
