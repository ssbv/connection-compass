import { Connection } from "@/types/analysis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface GroupedConnection {
  person_name: string;
  connections: Connection[];
  latest_updated_at: string;
}

interface ConnectionFilterProps {
  groupedConnections: GroupedConnection[];
  selectedPerson: string | null;
  comparePerson: string | null;
  onSelectConnection: (personName: string | null) => void;
  onCompareConnection: (personName: string | null) => void;
  timeRange: "all" | "30d";
  onTimeRangeChange: (range: "all" | "30d") => void;
}

export function ConnectionFilter({
  groupedConnections,
  selectedPerson,
  comparePerson,
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
        value={selectedPerson || "all"}
        onValueChange={(val) => onSelectConnection(val === "all" ? null : val)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Connections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Connections</SelectItem>
          {groupedConnections.map(group => (
            <SelectItem key={group.person_name} value={group.person_name}>
              {group.person_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Compare (optional) */}
      {selectedPerson && (
        <Select
          value={comparePerson || "none"}
          onValueChange={(val) => onCompareConnection(val === "none" ? null : val)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Compare with..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Comparison</SelectItem>
            {groupedConnections
              .filter(group => group.person_name !== selectedPerson)
              .map(group => (
                <SelectItem key={group.person_name} value={group.person_name}>
                  {group.person_name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
