import React from 'react';
import type { Activity, ComponentMap } from '../utils/types';
import { friendlyTopicName } from '../utils/componentMap';

interface ToolsPanelProps {
  activities: Activity[];
  componentMap: ComponentMap;
}

export default function ToolsPanel({ activities, componentMap }: ToolsPanelProps) {
  const toolEvents: Array<{
    name: string;
    type: string;
    args?: Record<string, unknown>;
    result?: string;
    state: string;
    actIdx: number;
    durationMs?: number;
  }> = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const vt = act.valueType || '';
    if (vt === 'DynamicPlanStepFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      const id = (v.taskDialogId as string) || '';
      const name = friendlyTopicName(id, componentMap) || id || 'Step';
      toolEvents.push({
        name,
        type: 'step',
        state: (v.state as string) || 'unknown',
        actIdx: i,
        durationMs: typeof v.durationInMs === 'number' ? v.durationInMs as number : undefined,
      });
    }
    if (vt === 'DynamicPlanStepBindUpdate') {
      const v = (act.value || {}) as Record<string, unknown>;
      const id = (v.taskDialogId as string) || '';
      const name = friendlyTopicName(id, componentMap) || id || 'Step';
      const args = v.bindingArgs as Record<string, unknown> | undefined;
      toolEvents.push({
        name,
        type: 'bind',
        args: args || {},
        state: 'bound',
        actIdx: i,
      });
    }
    if (vt === 'AIBuilderTraceData') {
      const v = (act.value || {}) as Record<string, unknown>;
      toolEvents.push({
        name: 'AI Builder',
        type: 'ai-builder',
        state: 'completed',
        result: (v.outputText as string) || '',
        actIdx: i,
      });
    }
  }

  if (toolEvents.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        No tool invocations found in this trace.
      </div>
    );
  }

  const stateColors: Record<string, string> = {
    completed: 'text-emerald-400',
    failed: 'text-red-400',
    error: 'text-red-400',
    faulted: 'text-red-400',
    cancelled: 'text-yellow-400',
    bound: 'text-amber-400',
    unknown: 'text-gray-500',
  };

  return (
    <div className="p-4 space-y-2">
      {toolEvents.map((evt, i) => (
        <div key={i} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 uppercase">{evt.type}</span>
            <span className="text-sm text-gray-200 font-medium flex-1 truncate">{evt.name}</span>
            <span className={`text-xs font-medium ${stateColors[evt.state] || 'text-gray-500'}`}>{evt.state}</span>
            {evt.durationMs !== undefined && (
              <span className="text-xs text-gray-600">
                {evt.durationMs >= 1000 ? (evt.durationMs / 1000).toFixed(2) + 's' : evt.durationMs + 'ms'}
              </span>
            )}
            <span className="text-xs text-gray-700">#{evt.actIdx + 1}</span>
          </div>
          {evt.args && Object.keys(evt.args).length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {Object.entries(evt.args).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 text-xs">
                  <span className="text-blue-400 font-medium flex-shrink-0">{k}:</span>
                  <span className="text-gray-400 truncate">{v === null ? '(null)' : String(v)}</span>
                </div>
              ))}
            </div>
          )}
          {evt.result && (
            <div className="mt-1.5 text-xs text-gray-400 line-clamp-2">{evt.result}</div>
          )}
        </div>
      ))}
    </div>
  );
}
