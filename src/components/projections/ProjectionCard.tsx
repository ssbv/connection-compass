import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ProjectionCardProps {
  title: string;
  content: string;
  icon?: LucideIcon;
  variant?: 'default' | 'positive' | 'warning' | 'neutral';
}

export function ProjectionCard({ title, content, icon: Icon, variant = 'default' }: ProjectionCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'positive':
        return "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20";
      case 'warning':
        return "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20";
      case 'neutral':
        return "border-muted bg-muted/30";
      default:
        return "border-border bg-card";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'positive':
        return "text-green-600";
      case 'warning':
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("transition-all", getVariantStyles())}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {Icon && <Icon className={cn("h-4 w-4", getIconColor())} />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}
