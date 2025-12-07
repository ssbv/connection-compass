import { Link } from "react-router-dom";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
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
      <main className="flex-1 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Upload Card */}
          <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
            <CloudUpload className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">
              Upload png, jpeg, pdf, doc.
            </p>
            
            {/* Run Button */}
            <div className="absolute bottom-6 right-6">
              <Link to="/auth">
                <Button className="bg-teal-500 hover:bg-teal-600 text-white px-8">
                  Run
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
