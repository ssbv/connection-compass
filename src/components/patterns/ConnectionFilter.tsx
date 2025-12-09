import { Connection } from "@/types/analysis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ConnectionFilterProps {
  connections: Connection[];
  selectedId: string | null;
  compareId: string | null;
  onSelectConnection: (id: string | null) => void;
  onCompareConnection: (id: string | null) => void;
  timeRange: "all" | "30d";
  onTimeRangeChange: (range: "all" | "30d") => void;
}

export function ConnectionFilter({
  connections,
  selectedId,
  compareId,
  onSelectConnection,
  onCompareConnection,
  timeRange,
  onTimeRangeChange
}: ConnectionFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Time Range Buttons */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <Button
          variant={timeRange === "all" ? "secondary" : "ghost"}
          size="sm"
          className="rounded-none border-0"
          onClick={() => onTimeRangeChange("all")}
        >
          All Time
        </Button>
        <Button
          variant={timeRange === "30d" ? "secondary" : "ghost"}
          size="sm"
          className="rounded-none border-0 border-l border-border"
          onClick={() => onTimeRangeChange("30d")}
        >
          Last 30 Days
        </Button>
      </div>

      {/* Connection Filter */}
      <Select
        value={selectedId || "all"}
        onValueChange={(val) => onSelectConnection(val === "all" ? null : val)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Connections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Connections</SelectItem>
          {connections.map(conn => (
            <SelectItem key={conn.id} value={conn.id}>
              {conn.person_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Compare (optional) */}
      {selectedId && (
        <Select
          value={compareId || "none"}
          onValueChange={(val) => onCompareConnection(val === "none" ? null : val)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Compare with..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Comparison</SelectItem>
            {connections
              .filter(conn => conn.id !== selectedId)
              .map(conn => (
                <SelectItem key={conn.id} value={conn.id}>
                  {conn.person_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
