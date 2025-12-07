import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Brain, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Connection Lens</h1>
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Understand Your Relationship Dynamics
          </h2>
          <p className="text-lg text-muted-foreground">
            Upload conversation screenshots and get AI-powered insights into communication patterns, emotional dynamics, and relationship health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mt-20">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Upload Conversations</h3>
            <p className="text-sm text-muted-foreground">
              Screenshots, PDFs, or text files from any messaging platform
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Brain className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">AI Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Get detailed insights into communication styles and patterns
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Track Connections</h3>
            <p className="text-sm text-muted-foreground">
              Save and monitor relationship health over time
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
