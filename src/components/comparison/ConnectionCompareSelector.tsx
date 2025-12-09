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

interface ConnectionCompareSelectorProps {
  connections: Connection[];
  selectedIds: [string | null, string | null];
  onSelect: (index: 0 | 1, connectionId: string | null) => void;
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
              <SelectValue placeholder="Select first connection" />
            </SelectTrigger>
            <SelectContent>
              {connections.map((conn) => {
                const analysis = conn.analysis_data as AnalysisResult | null;
                return (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.person_name} {analysis?.meta?.overall_conversation_health_score ? `(${analysis.meta.overall_conversation_health_score})` : ""}
                  </SelectItem>
                );
              })}
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
              <SelectValue placeholder="Select second connection" />
            </SelectTrigger>
            <SelectContent>
              {connections.map((conn) => {
                const analysis = conn.analysis_data as AnalysisResult | null;
                return (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.person_name} {analysis?.meta?.overall_conversation_health_score ? `(${analysis.meta.overall_conversation_health_score})` : ""}
                  </SelectItem>
                );
              })}
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
