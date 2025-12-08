import { useCallback, useState } from "react";
import { Upload, Loader2, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { UploadedFile } from "@/types/analysis";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function UploadCard() {
  const { uploadedFiles, setUploadedFiles, setAnalysisResult, isAnalyzing, setIsAnalyzing } = useAnalysis();
  const { toast } = useToast();
  
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [conversationText, setConversationText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
      setIsDragOver(false);
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
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
    if (uploadedFiles.length === 0 && !conversationText.trim()) {
      toast({
        title: "No content to analyze",
        description: "Please upload a file or type your conversation.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Get the first image file for vision analysis
      const imageFile = uploadedFiles.find((f) => f.type.startsWith("image/"));
      let imageBase64: string | undefined;

      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile.file);
      }

      // Use typed text in text mode, or extracted text from files
      const textToAnalyze = inputMode === 'text' 
        ? conversationText 
        : uploadedFiles.map((f) => f.extractedText).filter(Boolean).join("\n\n");

      const { data, error } = await supabase.functions.invoke("analyze-conversation", {
        body: {
          conversationText: textToAnalyze || "Please extract and analyze the conversation from the uploaded image.",
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
    <div className="flex flex-col flex-1">
      <button
        type="button"
        onClick={() => setInputMode(inputMode === 'upload' ? 'text' : 'upload')}
        className="text-sm text-muted-foreground hover:text-teal transition-colors mb-2 underline text-left w-fit"
      >
        {inputMode === 'upload' ? 'Or write it in' : 'Or upload a file'}
      </button>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-[3px] border-dashed rounded-full px-6 py-4 flex items-center justify-between gap-4 bg-card transition-colors flex-1",
          isDragOver || isFocused
            ? "border-teal"
            : "border-muted-foreground/40 hover:border-teal"
        )}
      >
        <div className="flex items-center gap-4 flex-1">
          {inputMode === 'upload' ? (
            <>
              <Upload className="h-10 w-10 text-muted-foreground/50 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">Upload png, jpeg, pdf, doc.</p>
                <input
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </>
          ) : (
            <>
              <PenLine className="h-10 w-10 text-muted-foreground/50 flex-shrink-0" />
              <textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Paste or type your conversation here..."
                className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[40px] max-h-[80px] text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}
        </div>
        <Button
          onClick={handleRun}
          disabled={isAnalyzing || (uploadedFiles.length === 0 && !conversationText.trim())}
          className="bg-teal hover:bg-teal-hover text-primary-foreground font-medium px-8 rounded-full"
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
    </div>
  );
}
