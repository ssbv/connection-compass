import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Connection, AnalysisResult } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface SaveConnectionDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SaveConnectionDrawer({ open, onClose }: SaveConnectionDrawerProps) {
  const { analysisResult, uploadedFiles, conversationText, inputMode } = useAnalysis();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isExisting, setIsExisting] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedPersonName, setSelectedPersonName] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Get unique person names for the dropdown
  const uniquePersonNames = useMemo(() => {
    const names = new Set(connections.map(c => c.person_name));
    return Array.from(names);
  }, [connections]);

  useEffect(() => {
    if (open && user) {
      fetchConnections();
    }
  }, [open, user]);

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
      return;
    }

    setConnections((data || []) as unknown as Connection[]);
  };

  const saveEmotionalData = async (connectionId: string) => {
    if (!user || !analysisResult?.emotional_extraction) return;

    try {
      const { user_states, user_intensity, repair_signals } = analysisResult.emotional_extraction;

      // Save emotional states
      if (user_states && user_states.length > 0) {
        const emotionalStateRecords = user_states.map(state => ({
          user_id: user.id,
          connection_id: connectionId,
          state_type: state,
          intensity: user_intensity || 3
        }));

        await supabase.from("emotional_states").insert(emotionalStateRecords);
      }

      // Save repair attempts
      if (repair_signals && repair_signals.length > 0) {
        const repairRecords = repair_signals.map(signal => ({
          user_id: user.id,
          connection_id: connectionId,
          attempt_type: signal.type,
          status: signal.was_reciprocated ? 'repaired' : 'unresolved',
          notes: signal.snippet
        }));

        await supabase.from("repair_attempts").insert(repairRecords);
      }
    } catch (error) {
      console.error("Error saving emotional data:", error);
    }
  };

  const saveSnapshots = async (connectionId: string) => {
    if (!user) return;

    try {
      if (inputMode === 'text' && conversationText.trim()) {
        // Save text input as a snapshot
        await supabase.from("snapshots").insert([{
          user_id: user.id,
          connection_id: connectionId,
          file_name: "Text Input",
          file_type: "text/plain",
          extracted_text: conversationText,
        }]);
      } else if (uploadedFiles.length > 0) {
        // Upload files and create snapshot records
        for (const uploadedFile of uploadedFiles) {
          const filePath = `${user.id}/${connectionId}/${uploadedFile.id}-${uploadedFile.name}`;
          
          // Upload file to storage
          const { error: uploadError } = await supabase.storage
            .from("conversation-files")
            .upload(filePath, uploadedFile.file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("conversation-files")
            .getPublicUrl(filePath);

          // Create snapshot record
          await supabase.from("snapshots").insert([{
            user_id: user.id,
            connection_id: connectionId,
            file_name: uploadedFile.name,
            file_type: uploadedFile.type,
            file_url: urlData.publicUrl,
            extracted_text: uploadedFile.extractedText || null,
          }]);
        }
      }
    } catch (error) {
      console.error("Error saving snapshots:", error);
      // Don't throw - snapshots are secondary to the main connection save
    }
  };

  const handleSave = async () => {
    if (!user || !analysisResult) return;

    if (!isExisting && !userName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this connection.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      let connectionId: string;

      if (isExisting && selectedPersonName) {
        // Insert a NEW record with the same person_name (preserves history!)
        const { data, error } = await supabase.from("connections").insert([{
          user_id: user.id,
          person_name: selectedPersonName,
          analysis_data: JSON.parse(JSON.stringify(analysisResult)),
          notes: notes || null,
          analysis_date: date || null,
        }]).select('id').single();

        if (error) throw error;
        connectionId = data.id;

      // Save snapshots
        await saveSnapshots(connectionId);

        // Save emotional states and repair attempts
        await saveEmotionalData(connectionId);

        toast({
          title: "Analysis saved",
          description: "A new analysis has been added to this connection.",
        });
      } else {
        // Create new connection
        const { data, error } = await supabase.from("connections").insert([{
          user_id: user.id,
          person_name: userName.trim(),
          analysis_data: JSON.parse(JSON.stringify(analysisResult)),
          notes: notes || null,
          analysis_date: date || null,
        }]).select('id').single();

        if (error) throw error;
        connectionId = data.id;

        // Save snapshots
        await saveSnapshots(connectionId);

        // Save emotional states and repair attempts
        await saveEmotionalData(connectionId);

        toast({
          title: "Connection saved",
          description: "Your new connection has been saved successfully.",
        });
      }

      onClose();
      setUserName("");
      setDate("");
      setNotes("");
      setSelectedPersonName("");
    } catch (error) {
      console.error("Error saving connection:", error);
      toast({
        title: "Error saving",
        description: "Failed to save the connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-xl z-50",
          "animate-slide-in-right"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-foreground">Save Connection</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-6">
            <Label htmlFor="existing-toggle" className="text-sm text-foreground">
              Existing
            </Label>
            <Switch
              id="existing-toggle"
              checked={isExisting}
              onCheckedChange={setIsExisting}
            />
          </div>

          {/* Form */}
          <div className="flex-1 space-y-4">
            {isExisting ? (
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Person:</Label>
                <Select value={selectedPersonName} onValueChange={setSelectedPersonName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniquePersonNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm text-foreground">User Name:</Label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm text-foreground">Date (optional):</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-foreground">Notes (optional):</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={4}
              />
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving || (!isExisting && !userName.trim()) || (isExisting && !selectedPersonName)}
            className="w-full bg-teal hover:bg-teal-hover text-primary-foreground mt-6"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </>
  );
}
