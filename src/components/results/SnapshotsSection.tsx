import { useAnalysis } from "@/contexts/AnalysisContext";

export function SnapshotsSection() {
  const { reportSnapshots } = useAnalysis();

  if (reportSnapshots.length === 0) return null;

  return (
    <section id="snapshots" className="animate-fade-in">
      <h2 className="text-lg font-medium text-foreground mb-4">Snapshots</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {reportSnapshots.map((file) => (
          <div
            key={file.id}
            className="aspect-square rounded-xl bg-panel border border-border/50 overflow-hidden"
          >
            {file.preview ? (
              <img
                src={file.preview}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2">
                <span className="text-xs text-muted-foreground text-center truncate">
                  {file.name}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
