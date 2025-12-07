import { createContext, useContext, useState, ReactNode } from "react";
import { AnalysisResult, UploadedFile } from "@/types/analysis";

interface AnalysisContextType {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  hasResults: boolean;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasResults = analysisResult !== null;

  return (
    <AnalysisContext.Provider
      value={{
        uploadedFiles,
        setUploadedFiles,
        analysisResult,
        setAnalysisResult,
        isAnalyzing,
        setIsAnalyzing,
        hasResults,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
