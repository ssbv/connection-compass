import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wrench, CheckCircle, AlertCircle, XCircle, MinusCircle, Handshake } from "lucide-react";

interface RepairStatus {
  connection_name: string;
  status: 'repaired' | 'partially_repaired' | 'abandoned' | 'avoidant' | 'mutual_resolution';
  notes?: string;
}

interface RepairCompletionTrackerProps {
  repairs: RepairStatus[];
}

export function RepairCompletionTracker({ repairs }: RepairCompletionTrackerProps) {
  const getStatusIcon = (status: RepairStatus['status']) => {
    switch (status) {
      case 'repaired':
      case 'mutual_resolution':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partially_repaired':
        return <MinusCircle className="h-4 w-4 text-yellow-600" />;
      case 'abandoned':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'avoidant':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusLabel = (status: RepairStatus['status']) => {
    switch (status) {
      case 'repaired':
        return 'Repaired';
      case 'mutual_resolution':
        return 'Mutual Resolution';
      case 'partially_repaired':
        return 'Partially Repaired';
      case 'abandoned':
        return 'Abandoned';
      case 'avoidant':
        return 'Avoidant Exit';
    }
  };

  const getStatusBadgeVariant = (status: RepairStatus['status']) => {
    switch (status) {
      case 'repaired':
      case 'mutual_resolution':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'partially_repaired':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'abandoned':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'avoidant':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  if (repairs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Repair Completion Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No repair attempts tracked yet. Continue analyzing conversations to build your repair history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Repair Completion Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Status of closure and repair per connection
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {repairs.map((repair, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(repair.status)}
                <div>
                  <p className="font-medium text-sm">{repair.connection_name}</p>
                  {repair.notes && (
                    <p className="text-xs text-muted-foreground">{repair.notes}</p>
                  )}
                </div>
              </div>
              <Badge className={cn("text-xs", getStatusBadgeVariant(repair.status))}>
                {getStatusLabel(repair.status)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
