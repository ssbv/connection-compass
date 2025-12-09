import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ImprintStatCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  variant: 'positive' | 'negative' | 'neutral';
  connections?: string[];
}

export function ImprintStatCard({ label, count, icon: Icon, variant, connections = [] }: ImprintStatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'positive':
        return "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20";
      case 'negative':
        return "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20";
      default:
        return "border-border bg-card";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'positive':
        return "text-green-600";
      case 'negative':
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getCountColor = () => {
    switch (variant) {
      case 'positive':
        return "text-green-700 dark:text-green-400";
      case 'negative':
        return "text-red-700 dark:text-red-400";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", getVariantStyles())}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", getIconColor())} />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold", getCountColor())}>{count}</p>
            {connections.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {connections.slice(0, 3).join(', ')}
                {connections.length > 3 && ` +${connections.length - 3} more`}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
