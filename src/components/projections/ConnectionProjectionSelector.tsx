import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GroupedConnection {
  person_name: string;
  latest_updated_at: string;
}

interface ConnectionProjectionSelectorProps {
  groupedConnections: GroupedConnection[];
  selectedConnection: string | null;
  onSelect: (personName: string | null) => void;
}

export function ConnectionProjectionSelector({
  groupedConnections,
  selectedConnection,
  onSelect
}: ConnectionProjectionSelectorProps) {
  return (
    <Select 
      value={selectedConnection || 'all'} 
      onValueChange={(value) => onSelect(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-full sm:w-[240px]">
        <SelectValue placeholder="Select connection" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Connections (Global)</SelectItem>
        {groupedConnections.map((group) => (
          <SelectItem key={group.person_name} value={group.person_name}>
            {group.person_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
