import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Connections from "./pages/Connections";
import Settings from "./pages/Settings";
import Patterns from "./pages/Patterns";
import Projections from "./pages/Projections";
import EmotionalGrowth from "./pages/EmotionalGrowth";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/patterns" element={<Patterns />} />
      <Route path="/projections" element={<Projections />} />
      <Route path="/emotional-growth" element={<EmotionalGrowth />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnalysisProvider>
            <AppRoutes />
          </AnalysisProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
