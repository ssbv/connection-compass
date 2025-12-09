import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Connection {
  id: string;
  person_name: string;
}

interface ConnectionProjectionSelectorProps {
  connections: Connection[];
  selectedConnection: string | null;
  onSelect: (connectionId: string | null) => void;
}

export function ConnectionProjectionSelector({
  connections,
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
        {connections.map((conn) => (
          <SelectItem key={conn.id} value={conn.id}>
            {conn.person_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
