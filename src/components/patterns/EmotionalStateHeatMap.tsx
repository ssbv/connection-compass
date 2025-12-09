import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Connection, EmotionalStateType } from "@/types/analysis";

interface EmotionalStateHeatMapProps {
  statesByConnection: Record<string, Record<string, number>>;
  connections: Connection[];
}

const EMOTIONAL_STATES: EmotionalStateType[] = [
  'safety', 'calm', 'valued', 'chosen',
  'confusion', 'anxiety', 'dismissed', 'unseen', 'unsafe'
];

const STATE_LABELS: Record<EmotionalStateType, string> = {
  safety: "Safe",
  calm: "Calm",
  valued: "Valued",
  chosen: "Chosen",
  confusion: "Confused",
  anxiety: "Anxious",
  dismissed: "Dismissed",
  unseen: "Unseen",
  unsafe: "Unsafe"
};

const getStateColor = (state: EmotionalStateType, intensity: number) => {
  const positiveStates = ['safety', 'calm', 'valued', 'chosen'];
  const isPositive = positiveStates.includes(state);
  
  if (intensity === 0) return "bg-muted/30";
  
  if (isPositive) {
    if (intensity >= 3) return "bg-green-500/80";
    if (intensity >= 2) return "bg-green-500/50";
    return "bg-green-500/30";
  } else {
    if (intensity >= 3) return "bg-destructive/80";
    if (intensity >= 2) return "bg-destructive/50";
    return "bg-destructive/30";
  }
};

export function EmotionalStateHeatMap({
  statesByConnection,
  connections
}: EmotionalStateHeatMapProps) {
  // Calculate global totals
  const globalTotals: Record<string, number> = {};
  EMOTIONAL_STATES.forEach(state => {
    globalTotals[state] = 0;
  });
  
  Object.values(statesByConnection).forEach(states => {
    EMOTIONAL_STATES.forEach(state => {
      globalTotals[state] += states[state] || 0;
    });
  });

  const maxGlobalValue = Math.max(...Object.values(globalTotals), 1);

  if (connections.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Emotional State Map</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track where you feel different emotions across connections
          </p>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No emotional data available yet. Run analyses to see your emotional patterns.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Emotional State Map</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track where you feel different emotions across connections
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Summary */}
        <div>
          <h4 className="text-sm font-medium mb-3">Global Emotional Residue</h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {EMOTIONAL_STATES.map(state => {
              const value = globalTotals[state];
              const normalizedIntensity = Math.ceil((value / maxGlobalValue) * 3);
              
              return (
                <div key={state} className="text-center">
                  <div
                    className={`aspect-square rounded-lg flex items-center justify-center ${getStateColor(state, normalizedIntensity)}`}
                  >
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {STATE_LABELS[state]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-Connection Fingerprints */}
        <div>
          <h4 className="text-sm font-medium mb-3">Per-Connection Emotional Fingerprint</h4>
          <div className="space-y-4">
            {connections.slice(0, 5).map(conn => {
              // Use person_name as the lookup key instead of conn.id
              const states = statesByConnection[conn.person_name] || {};
              const maxValue = Math.max(...Object.values(states), 1);
              
              return (
                <div key={conn.person_name} className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-sm font-medium mb-2">{conn.person_name}</p>
                  <div className="grid grid-cols-9 gap-1">
                    {EMOTIONAL_STATES.map(state => {
                      const value = states[state] || 0;
                      const normalizedIntensity = Math.ceil((value / maxValue) * 3);
                      
                      return (
                        <div
                          key={state}
                          className={`aspect-square rounded ${getStateColor(state, value > 0 ? normalizedIntensity : 0)}`}
                          title={`${STATE_LABELS[state]}: ${value}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/60" />
            <span className="text-xs text-muted-foreground">Positive states</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/60" />
            <span className="text-xs text-muted-foreground">Challenging states</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted/30" />
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
