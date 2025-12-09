import { cn } from "@/lib/utils";

interface ProbabilityGaugeProps {
  value: number;
  label: string;
  description?: string;
  inverted?: boolean; // true if lower is better (e.g., burnout)
}

export function ProbabilityGauge({ value, label, description, inverted = false }: ProbabilityGaugeProps) {
  const getColor = () => {
    const effectiveValue = inverted ? 100 - value : value;
    if (effectiveValue >= 70) return "bg-green-500";
    if (effectiveValue >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    const effectiveValue = inverted ? 100 - value : value;
    if (effectiveValue >= 70) return "text-green-600";
    if (effectiveValue >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn("text-sm font-bold", getTextColor())}>{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getColor())}
          style={{ width: `${value}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
