import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface Connection {
  id: string;
  person_name: string;
}

interface ConnectionProjectionSelectorProps {
  connections: Connection[];
  selectedConnection: string | null;
  onSelect: (connectionId: string | null) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

export function ConnectionProjectionSelector({
  connections,
  selectedConnection,
  onSelect,
  onGenerate,
  isGenerating,
  disabled
}: ConnectionProjectionSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
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

      <Button 
        onClick={onGenerate}
        disabled={isGenerating || disabled}
        className="bg-primary hover:bg-primary/90"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Projection
          </>
        )}
      </Button>
    </div>
  );
}
