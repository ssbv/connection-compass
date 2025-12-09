import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Log In to see this page</h2>
        <p className="text-muted-foreground">Sign in to access your saved connections and insights.</p>
        <Button asChild className="bg-teal-500 hover:bg-teal-600">
          <Link to="/auth">Log In</Link>
        </Button>
      </div>
    );
  }
  
  return <>{children}</>;
}
