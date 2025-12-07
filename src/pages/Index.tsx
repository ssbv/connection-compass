import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { UploadedFile } from "@/types/analysis";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OverallResultsSection } from "@/components/results/OverallResultsSection";
import { ThemYouSection } from "@/components/results/ThemYouSection";
import { DynamicsSection } from "@/components/results/DynamicsSection";
import { SnapshotsSection } from "@/components/results/SnapshotsSection";
import { SaveConnectionDrawer } from "@/components/drawer/SaveConnectionDrawer";
import { useAuth } from "@/hooks/useAuth";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const navItems = [
  { label: "Snapshots", sectionId: "snapshots" },
  { label: "Overall Results", sectionId: "overall-results" },
  { label: "Them & You", sectionId: "them-you" },
  { label: "Dynamics", sectionId: "dynamics" },
];

const Index = () => {
  const { 
    uploadedFiles, 
    setUploadedFiles, 
    analysisResult,
    setAnalysisResult, 
    isAnalyzing, 
    setIsAnalyzing,
    hasResults 
  } = useAnalysis();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saveDrawerOpen, setSaveDrawerOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter((f) => ACCEPTED_TYPES.includes(f.type));

      if (validFiles.length !== files.length) {
        toast({
          title: "Invalid file type",
          description: "Only PNG, JPEG, PDF, and DOC files are accepted.",
          variant: "destructive",
        });
      }

      const newUploadedFiles: UploadedFile[] = await Promise.all(
        validFiles.map(async (file) => {
          const id = crypto.randomUUID();
          let preview: string | undefined;

          if (file.type.startsWith("image/")) {
            preview = URL.createObjectURL(file);
          }

          return {
            id,
            file,
            name: file.name,
            type: file.type,
            preview,
          };
        })
      );

      setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);
    },
    [uploadedFiles, setUploadedFiles, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const input = document.createElement("input");
      input.type = "file";
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;

      const event = { target: input } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    },
    [handleFileChange]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleRun = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files uploaded",
        description: "Please upload at least one conversation file.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const imageFile = uploadedFiles.find((f) => f.type.startsWith("image/"));
      let imageBase64: string | undefined;

      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile.file);
      }

      const conversationText = uploadedFiles
        .map((f) => f.extractedText)
        .filter(Boolean)
        .join("\n\n");

      const { data, error } = await supabase.functions.invoke("analyze-conversation", {
        body: {
          conversationText: conversationText || "Please extract and analyze the conversation from the uploaded image.",
          imageBase64,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysisResult(data);
      toast({
        title: "Analysis complete",
        description: "Your conversation has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside className="w-48 bg-sidebar flex flex-col border-r border-border">
        <div className="p-4">
          <span className="text-sm font-medium text-sidebar-foreground">LOGO</span>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.sectionId}
              onClick={() => scrollToSection(item.sectionId)}
              className="w-full text-left px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* Bottom Links */}
        <div className="p-4 space-y-2 border-t border-border">
          <Link 
            to="/settings" 
            className="block text-sm text-sidebar-foreground hover:text-foreground transition-colors"
          >
            Settings
          </Link>
          {user ? (
            <button 
              onClick={() => supabase.auth.signOut()}
              className="block text-sm text-sidebar-foreground hover:text-foreground transition-colors"
            >
              Log Out
            </button>
          ) : (
            <Link 
              to="/auth" 
              className="block text-sm text-sidebar-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header with Save Connection Button */}
          <div className="flex justify-end mb-6">
            <Button 
              onClick={() => setSaveDrawerOpen(true)}
              disabled={!user || !hasResults}
              className="bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50"
            >
              Save Connection
            </Button>
          </div>

          {/* Upload Card - Horizontal Pill Shape */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative border-2 border-dashed border-muted-foreground/30 rounded-full px-6 py-4 flex items-center gap-4 transition-colors hover:border-muted-foreground/50"
          >
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ clipPath: 'inset(0 120px 0 0)' }}
            />
            <CloudUpload className="w-8 h-8 text-muted-foreground/50 flex-shrink-0" />
            <p className="text-muted-foreground text-sm flex-1">
              Upload png, jpeg, pdf, doc.
            </p>
            <Button 
              onClick={handleRun}
              disabled={isAnalyzing || uploadedFiles.length === 0}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 flex-shrink-0 z-10"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                "Run"
              )}
            </Button>
          </div>

          {/* Snapshots Section - Shows uploaded files */}
          {uploadedFiles.length > 0 && (
            <div id="snapshots" className="mt-8">
              <SnapshotsSection />
            </div>
          )}

          {/* Results Sections */}
          {hasResults && (
            <div className="mt-8 space-y-8">
              {!user && (
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-muted-foreground">
                    <Link to="/auth" className="text-accent hover:underline font-medium">
                      Log in
                    </Link>{" "}
                    to save these results to your connections.
                  </p>
                </div>
              )}
              <div id="overall-results">
                <OverallResultsSection />
              </div>
              <div id="them-you">
                <ThemYouSection />
              </div>
              <div id="dynamics">
                <DynamicsSection />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Save Connection Drawer */}
      <SaveConnectionDrawer 
        open={saveDrawerOpen} 
        onClose={() => setSaveDrawerOpen(false)} 
      />
    </div>
  );
};

export default Index;
