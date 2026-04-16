import React, { useMemo } from 'react';
import type { Activity, ComponentMap } from '../utils/types';
import { getTs, formatTime } from '../utils/activityClassifier';
import { friendlyTopicName } from '../utils/componentMap';

interface WaterfallPanelProps {
  activities: Activity[];
  componentMap: ComponentMap;
}

interface WaterfallRow {
  label: string;
  startMs: number;
  durationMs: number;
  type: string;
  actIdx: number;
}

export default function WaterfallPanel({ activities, componentMap }: WaterfallPanelProps) {
  const rows = useMemo<WaterfallRow[]>(() => {
    const result: WaterfallRow[] = [];
    let baseMs: number | null = null;

    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      const vt = act.valueType || '';
      const ts = getTs(act);
      let tsMs = 0;

      if (ts) {
        try {
          tsMs = new Date(ts).getTime();
          if (baseMs === null) baseMs = tsMs;
        } catch { /* ignore */ }
      }

      if (vt === 'DynamicPlanStepFinished') {
        const v = (act.value || {}) as Record<string, unknown>;
        const name = friendlyTopicName((v.taskDialogId as string) || '', componentMap) || (v.taskDialogId as string) || 'Step';
        const dur = typeof v.durationInMs === 'number' ? (v.durationInMs as number) : 0;
        const startMs = baseMs !== null ? tsMs - baseMs - dur : 0;
        result.push({
          label: name,
          startMs: Math.max(0, startMs),
          durationMs: dur || 100,
          type: (v.state as string) || 'completed',
          actIdx: i,
        });
      } else if (vt === 'UniversalSearchToolTraceData') {
        result.push({
          label: 'Search',
          startMs: baseMs !== null ? tsMs - baseMs : 0,
          durationMs: 200,
          type: 'search',
          actIdx: i,
        });
      } else if (act.type === 'message' && act.from?.role === 'bot' && act.text) {
        result.push({
          label: 'Bot Response',
          startMs: baseMs !== null ? tsMs - baseMs : 0,
          durationMs: 50,
          type: 'bot-message',
          actIdx: i,
        });
      }
    }

    return result;
  }, [activities, componentMap]);

  if (rows.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm text-center">
        No timing data available. Step duration information is needed for waterfall view.
      </div>
    );
  }

  const maxMs = Math.max(...rows.map(r => r.startMs + r.durationMs));

  const typeColor: Record<string, string> = {
    completed: 'bg-emerald-600',
    failed: 'bg-red-600',
    error: 'bg-red-600',
    faulted: 'bg-red-600',
    cancelled: 'bg-yellow-600',
    search: 'bg-cyan-600',
    'bot-message': 'bg-violet-600',
  };

  return (
    <div className="p-4 overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Step Waterfall</h3>
      <div className="space-y-1 min-w-[500px]">
        {rows.map((row, i) => {
          const startPct = maxMs > 0 ? (row.startMs / maxMs) * 100 : 0;
          const widthPct = maxMs > 0 ? Math.max((row.durationMs / maxMs) * 100, 0.5) : 0.5;
          const color = typeColor[row.type] || 'bg-indigo-600';
          return (
            <div key={i} className="flex items-center gap-2 group">
              <span className="text-xs text-gray-400 w-36 truncate flex-shrink-0 text-right" title={row.label}>{row.label}</span>
              <div className="flex-1 h-5 bg-gray-800 rounded relative overflow-hidden">
                <div
                  className={`absolute top-0 h-full ${color} rounded opacity-80 group-hover:opacity-100 transition-opacity`}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 flex-shrink-0 text-right">
                {row.durationMs >= 1000
                  ? (row.durationMs / 1000).toFixed(2) + 's'
                  : row.durationMs + 'ms'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>Total span: {(maxMs / 1000).toFixed(2)}s</span>
        <div className="flex items-center gap-3">
          {[['completed', 'Completed'], ['failed', 'Failed'], ['search', 'Search']].map(([k, l]) => (
            <div key={k} className="flex items-center gap-1">
              <div className={`w-3 h-2 rounded-sm ${typeColor[k]}`} />
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
