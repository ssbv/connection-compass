import { useAnalysis } from "@/contexts/AnalysisContext";
import { PersonPanel } from "./PersonPanel";

export function ThemYouSection() {
  const { analysisResult } = useAnalysis();

  if (!analysisResult) return null;

  const { people, example_attributions } = analysisResult;

  return (
    <section id="them-you" className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-foreground">Them</h2>
        <h2 className="text-lg font-medium text-foreground">You</h2>
      </div>
      <div className="flex gap-4 flex-col md:flex-row">
        <PersonPanel
          person={people.A}
          examples={example_attributions.by_dimension.A}
          title="Them"
        />
        <PersonPanel
          person={people.B}
          examples={example_attributions.by_dimension.B}
          title="You"
        />
      </div>
    </section>
  );
}
