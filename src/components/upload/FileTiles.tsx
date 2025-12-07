import { X } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { cn } from "@/lib/utils";

export function FileTiles() {
  const { uploadedFiles, setUploadedFiles } = useAnalysis();

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
  };

  if (uploadedFiles.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {uploadedFiles.map((file) => (
        <div
          key={file.id}
          className={cn(
            "relative flex-shrink-0 w-28 h-28 rounded-xl bg-panel flex flex-col items-center justify-center",
            "border border-border/50 group"
          )}
        >
          {file.preview ? (
            <img
              src={file.preview}
              alt={file.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-2">
              <span className="text-xs text-muted-foreground text-center truncate w-full">
                {file.name}
              </span>
            </div>
          )}
          <button
            onClick={() => removeFile(file.id)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
              Uploaded File
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
