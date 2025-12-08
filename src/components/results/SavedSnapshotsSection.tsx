import { Snapshot } from "@/types/analysis";

interface SavedSnapshotsSectionProps {
  snapshots: Snapshot[];
}

export function SavedSnapshotsSection({ snapshots }: SavedSnapshotsSectionProps) {
  if (!snapshots || snapshots.length === 0) return null;

  const textSnapshots = snapshots.filter((s) => s.file_type === "text/plain");
  const fileSnapshots = snapshots.filter((s) => s.file_type !== "text/plain");

  return (
    <section className="mb-6">
      <h3 className="text-lg font-medium text-foreground mb-3">Snapshots</h3>

      {/* File thumbnails */}
      {fileSnapshots.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {fileSnapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="w-28 h-28 rounded-xl bg-card border border-border/50 overflow-hidden shrink-0 flex items-center justify-center"
            >
              {snapshot.file_url && snapshot.file_type.startsWith("image/") ? (
                <img
                  src={snapshot.file_url}
                  alt={snapshot.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground text-center px-2 truncate">
                  {snapshot.file_name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Text input display */}
      {textSnapshots.map((snapshot) => (
        <div
          key={snapshot.id}
          className="bg-card rounded-xl p-4 mt-3 max-h-48 overflow-y-auto border border-border/50"
        >
          <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-sans">
            {snapshot.extracted_text}
          </pre>
        </div>
      ))}
    </section>
  );
}
