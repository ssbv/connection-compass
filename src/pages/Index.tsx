import { useCallback } from "react";
import { Link } from "react-router-dom";
import { CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { UploadedFile } from "@/types/analysis";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileTiles } from "@/components/upload/FileTiles";
import { OverallResultsSection } from "@/components/results/OverallResultsSection";
import { ThemYouSection } from "@/components/results/ThemYouSection";
import { DynamicsSection } from "@/components/results/DynamicsSection";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
      <aside className="w-40 bg-sidebar flex flex-col border-r border-border">
        <div className="p-4">
          <span className="text-sm font-medium text-sidebar-foreground">LOGO</span>
        </div>
        <div className="mt-auto p-4">
          <Link 
            to="/auth" 
            className="text-sm text-sidebar-foreground hover:text-foreground transition-colors"
          >
            Log In
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Upload Card */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative border-2 border-dashed border-muted-foreground/30 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px] transition-colors hover:border-muted-foreground/50 cursor-pointer"
          >
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <CloudUpload className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">
              Upload png, jpeg, pdf, doc.
            </p>
          </div>
          
          {/* Run Button - Outside the upload card to prevent click interference */}
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleRun}
              disabled={isAnalyzing || uploadedFiles.length === 0}
              className="bg-teal-500 hover:bg-teal-600 text-white px-8"
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

          {/* File Tiles */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <FileTiles />
            </div>
          )}

          {/* Results Section */}
          {hasResults && (
            <div className="mt-8 space-y-8">
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  <Link to="/auth" className="text-accent hover:underline font-medium">
                    Log in
                  </Link>{" "}
                  to save these results to your connections.
                </p>
              </div>
              <OverallResultsSection />
              <ThemYouSection />
              <DynamicsSection />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
