import { useMemo } from "react";
import { Connection, AnalysisResult } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitCompare, X } from "lucide-react";

interface UniquePersonData {
  person_name: string;
  connections: Connection[];
  avgScore: number;
  reportCount: number;
}

interface ConnectionCompareSelectorProps {
  connections: Connection[];
  selectedIds: [string | null, string | null];
  onSelect: (index: 0 | 1, personName: string | null) => void;
  onCompare: () => void;
  onClear: () => void;
}

export function ConnectionCompareSelector({
  connections,
  selectedIds,
  onSelect,
  onCompare,
  onClear,
}: ConnectionCompareSelectorProps) {
  const hasSelection = selectedIds[0] || selectedIds[1];
  const canCompare = selectedIds[0] && selectedIds[1] && selectedIds[0] !== selectedIds[1];

  // Group connections by person_name and calculate average scores
  const uniquePersons = useMemo(() => {
    const personMap: Record<string, UniquePersonData> = {};

    connections.forEach(conn => {
      const analysis = conn.analysis_data as AnalysisResult | null;
      const score = analysis?.meta?.overall_conversation_health_score || 0;
      
      if (!personMap[conn.person_name]) {
        personMap[conn.person_name] = {
          person_name: conn.person_name,
          connections: [],
          avgScore: 0,
          reportCount: 0
        };
      }
      personMap[conn.person_name].connections.push(conn);
      personMap[conn.person_name].reportCount++;
    });

    // Calculate average scores
    Object.values(personMap).forEach(person => {
      const totalScore = person.connections.reduce((sum, conn) => {
        const analysis = conn.analysis_data as AnalysisResult | null;
        return sum + (analysis?.meta?.overall_conversation_health_score || 0);
      }, 0);
      person.avgScore = Math.round(totalScore / person.reportCount);
    });

    return Object.values(personMap);
  }, [connections]);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <GitCompare className="h-4 w-4 text-teal" />
        <h3 className="text-sm font-medium text-foreground">Compare Connections</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <Select
            value={selectedIds[0] || ""}
            onValueChange={(val) => onSelect(0, val || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select first person" />
            </SelectTrigger>
            <SelectContent>
              {uniquePersons.map((person) => (
                <SelectItem key={person.person_name} value={person.person_name}>
                  {person.person_name} ({person.avgScore})
                  {person.reportCount > 1 && ` · ${person.reportCount} reports`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-muted-foreground text-sm">vs</span>

        <div className="flex-1 w-full sm:w-auto">
          <Select
            value={selectedIds[1] || ""}
            onValueChange={(val) => onSelect(1, val || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select second person" />
            </SelectTrigger>
            <SelectContent>
              {uniquePersons.map((person) => (
                <SelectItem key={person.person_name} value={person.person_name}>
                  {person.person_name} ({person.avgScore})
                  {person.reportCount > 1 && ` · ${person.reportCount} reports`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onCompare}
            disabled={!canCompare}
            className="bg-teal hover:bg-teal-hover"
          >
            Compare
          </Button>
          {hasSelection && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}