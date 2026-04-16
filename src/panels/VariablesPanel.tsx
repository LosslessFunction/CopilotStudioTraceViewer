import React, { useMemo } from 'react';
import type { Activity, ComponentMap } from '../utils/types';

interface VariablesPanelProps {
  activities: Activity[];
  componentMap: ComponentMap;
}

interface VarEvent {
  name: string;
  value: string;
  actIdx: number;
  action: string;
}

export default function VariablesPanel({ activities, componentMap }: VariablesPanelProps) {
  const events = useMemo<VarEvent[]>(() => {
    const result: VarEvent[] = [];
    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      if (act.valueType === 'DynamicPlanStepBindUpdate') {
        const v = (act.value || {}) as Record<string, unknown>;
        const args = v.bindingArgs as Record<string, unknown> | undefined;
        if (args) {
          for (const [k, val] of Object.entries(args)) {
            result.push({
              name: k,
              value: val === null || val === undefined ? '(null)' : typeof val === 'object' ? JSON.stringify(val) : String(val),
              actIdx: i,
              action: 'bound',
            });
          }
        }
      }
      if (act.valueType === 'DialogTracingInfo') {
        const actions = (act.value && (act.value as Record<string, unknown>).actions as Record<string, unknown>[]) || [];
        for (const a of actions) {
          if ((a.actionType === 'SetVariableAction' || a.actionType === 'SetVariable') && a.variable) {
            result.push({
              name: a.variable as string,
              value: a.value !== undefined ? String(a.value) : '(set)',
              actIdx: i,
              action: 'set',
            });
          }
        }
      }
    }
    return result;
  }, [activities]);

  // Global variables from componentMap
  const globalVars: Array<{ name: string; type: string; scope: string }> = [];
  for (const [key, val] of Object.entries(componentMap)) {
    if (key.startsWith('_')) continue;
    const comp = val as Record<string, unknown>;
    if (comp && comp.kind === 'GlobalVariableComponent') {
      globalVars.push({
        name: (comp.displayName as string) || key,
        type: (comp.variableType as string) || 'Unknown',
        scope: (comp.scope as string) || 'Conversation',
      });
    }
  }

  return (
    <div className="p-4 space-y-5">
      {globalVars.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Global Variables (from agent definition)</h3>
          <div className="space-y-1.5">
            {globalVars.map((v, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-blue-300 font-medium w-40 truncate flex-shrink-0">{v.name}</span>
                <span className="text-gray-500 text-xs">{v.type}</span>
                <span className="text-gray-600 text-xs">{v.scope}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 ? (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Variable Events in Trace</h3>
          <div className="space-y-1.5">
            {events.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs border-b border-gray-700/30 pb-1.5">
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                  e.action === 'bound' ? 'bg-amber-900/50 text-amber-300' : 'bg-blue-900/50 text-blue-300'
                }`}>{e.action}</span>
                <span className="text-gray-300 font-medium min-w-0 truncate">{e.name}</span>
                <span className="text-gray-500 ml-auto flex-shrink-0 max-w-[200px] truncate text-right">{e.value}</span>
                <span className="text-gray-700 flex-shrink-0">#{e.actIdx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">
          No variable binding events found in this trace.
        </div>
      )}
    </div>
  );
}
