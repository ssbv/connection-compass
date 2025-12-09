import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Connection } from "@/types/analysis";
import { ConnectionCompareSelector } from "@/components/comparison/ConnectionCompareSelector";
import { ComparisonView } from "@/components/comparison/ComparisonView";

export default function Compare() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
      setLoading(false);
      return;
    }

    setConnections((data || []) as unknown as Connection[]);
    setLoading(false);
  };

  const handleCompareSelect = (index: 0 | 1, personName: string | null) => {
    setCompareIds(prev => {
      const newIds = [...prev] as [string | null, string | null];
      newIds[index] = personName;
      return newIds;
    });
  };

  const handleCompare = () => {
    if (compareIds[0] && compareIds[1]) {
      setShowComparison(true);
    }
  };

  const handleClearComparison = () => {
    setCompareIds([null, null]);
    setShowComparison(false);
  };

  // Get all connections for each selected person
  const compareConnections1 = connections.filter(c => c.person_name === compareIds[0]);
  const compareConnections2 = connections.filter(c => c.person_name === compareIds[1]);

  return (
    <AppLayout>
      <AuthGate>
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Compare Connections
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare analysis results between two people side-by-side
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : connections.length < 2 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              You need at least 2 saved connections to compare. Analyze more conversations first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ConnectionCompareSelector
              connections={connections}
              selectedIds={compareIds}
              onSelect={handleCompareSelect}
              onCompare={handleCompare}
              onClear={handleClearComparison}
            />

            {showComparison && compareConnections1.length > 0 && compareConnections2.length > 0 && (
              <ComparisonView
                connections1={compareConnections1}
                connections2={compareConnections2}
                personName1={compareIds[0]!}
                personName2={compareIds[1]!}
                onClose={handleClearComparison}
              />
            )}
          </div>
        )}
      </div>
      </AuthGate>
    </AppLayout>
  );
}