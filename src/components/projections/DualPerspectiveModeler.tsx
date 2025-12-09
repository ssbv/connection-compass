import { ProjectionCard } from "./ProjectionCard";
import { Users, User, UserCheck, Sparkles } from "lucide-react";

interface DualPerspectiveModelerProps {
  scenarios?: {
    both_unchanged: string;
    user_changes: string;
    other_changes: string;
    both_improve: string;
  };
}

export function DualPerspectiveModeler({ scenarios }: DualPerspectiveModelerProps) {
  if (!scenarios) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Generate a projection to see scenario modeling.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ProjectionCard
        title="If Both Continue Unchanged"
        content={scenarios.both_unchanged}
        icon={Users}
        variant="warning"
      />
      <ProjectionCard
        title="If Only You Change"
        content={scenarios.user_changes}
        icon={User}
        variant="neutral"
      />
      <ProjectionCard
        title="If Only They Change"
        content={scenarios.other_changes}
        icon={UserCheck}
        variant="neutral"
      />
      <ProjectionCard
        title="If Both Improve"
        content={scenarios.both_improve}
        icon={Sparkles}
        variant="positive"
      />
    </div>
  );
}
