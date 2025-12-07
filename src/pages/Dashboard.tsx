import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UploadCard } from "@/components/upload/UploadCard";
import { FileTiles } from "@/components/upload/FileTiles";
import { OverallResultsSection } from "@/components/results/OverallResultsSection";
import { ThemYouSection } from "@/components/results/ThemYouSection";
import { DynamicsSection } from "@/components/results/DynamicsSection";
import { SnapshotsSection } from "@/components/results/SnapshotsSection";
import { SaveConnectionDrawer } from "@/components/drawer/SaveConnectionDrawer";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { hasResults, isAnalyzing } = useAnalysis();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
        {/* Upload Card Row */}
        <div className="flex items-center gap-4">
          <UploadCard />
          {hasResults && (
            <Button
              onClick={() => setDrawerOpen(true)}
              className="bg-teal hover:bg-teal-hover text-primary-foreground rounded-full px-6"
            >
              Save Connection
            </Button>
          )}
        </div>

        {/* File Tiles */}
        <FileTiles />

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-teal" />
            <p className="text-muted-foreground">Analyzing your conversation...</p>
          </div>
        )}

        {/* Results Sections */}
        {hasResults && !isAnalyzing && (
          <div className="space-y-10">
            <SnapshotsSection />
            <OverallResultsSection />
            <ThemYouSection />
            <DynamicsSection />
          </div>
        )}

        {/* Empty State */}
        {!hasResults && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">
              Upload conversation screenshots and click "Run" to analyze relationship dynamics.
            </p>
          </div>
        )}
      </div>

      {/* Save Connection Drawer */}
      <SaveConnectionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </AppLayout>
  );
}
