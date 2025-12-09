import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  ChevronDown, 
  Play, 
  Pause, 
  Square, 
  AlertCircle, 
  CheckCircle, 
  Shield,
  Lightbulb
} from "lucide-react";
import { useState } from "react";
import { ReflectionOutput } from "@/types/analysis";

interface ReflectionSectionProps {
  reflection: ReflectionOutput | undefined;
}

export function ReflectionSection({ reflection }: ReflectionSectionProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!reflection) {
    return null;
  }

  const renderList = (items: string[], icon: React.ReactNode, variant: 'risk' | 'benefit' | 'neutral') => {
    const colorClass = {
      risk: 'text-red-600 dark:text-red-400',
      benefit: 'text-green-600 dark:text-green-400',
      neutral: 'text-muted-foreground'
    };

    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    return (
      <ul className="space-y-1 mt-2">
        {items.map((item, index) => (
          <li key={index} className={cn("text-sm flex items-start gap-2", colorClass[variant])}>
            {icon}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  const PathCard = ({ 
    path, 
    title, 
    icon, 
    data 
  }: { 
    path: string; 
    title: string; 
    icon: React.ReactNode; 
    data: { risks: string[]; benefits: string[]; boundary_consequences: string[] };
  }) => (
    <Collapsible 
      open={openSection === path} 
      onOpenChange={(open) => setOpenSection(open ? path : null)}
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between text-left h-auto py-3"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            openSection === path && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        <div>
          <Badge variant="outline" className="text-red-600 border-red-200 dark:border-red-800 mb-2">
            Risks
          </Badge>
          {renderList(data.risks, <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />, 'risk')}
        </div>
        <div>
          <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800 mb-2">
            Benefits
          </Badge>
          {renderList(data.benefits, <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />, 'benefit')}
        </div>
        <div>
          <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-800 mb-2">
            Boundary Consequences
          </Badge>
          {renderList(data.boundary_consequences, <Shield className="h-3 w-3 mt-0.5 shrink-0" />, 'neutral')}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Card id="reflection">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Reflection
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          What this conversation reveals and possible next steps
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* What Just Happened */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">What Just Happened</h4>
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary pl-3">
            {reflection.what_just_happened}
          </p>
        </div>

        {/* Pattern Suggestion */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">What This Pattern May Suggest</h4>
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-yellow-500 pl-3">
            {reflection.pattern_suggestion}
          </p>
        </div>

        {/* Next Step Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Next-Step Options</h4>
          <div className="space-y-2">
            <PathCard 
              path="continue"
              title="Continue as-is"
              icon={<Play className="h-4 w-4 text-green-600" />}
              data={reflection.next_step_options.continue}
            />
            <PathCard 
              path="pause"
              title="Pause and reassess"
              icon={<Pause className="h-4 w-4 text-yellow-600" />}
              data={reflection.next_step_options.pause}
            />
            <PathCard 
              path="close"
              title="Close or step back"
              icon={<Square className="h-4 w-4 text-red-600" />}
              data={reflection.next_step_options.close}
            />
          </div>
        </div>

        {/* Reflection Prompts */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Questions for Reflection
          </h4>
          <ul className="space-y-2">
            {Array.isArray(reflection.reflection_prompts) && reflection.reflection_prompts.map((prompt, index) => (
              <li 
                key={index}
                className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50 border border-border italic"
              >
                "{prompt}"
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
