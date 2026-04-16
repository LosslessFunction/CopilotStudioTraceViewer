import React from 'react';
import type { Activity, ComponentMap } from '../utils/types';
import { friendlyTopicName } from '../utils/componentMap';

interface OrchPanelProps {
  activities: Activity[];
  componentMap: ComponentMap;
}

interface PlanSummary {
  planId: string;
  steps: Array<{
    name: string;
    state: string;
    durationMs?: number;
    thought?: string;
  }>;
  completed: boolean;
  cancelled: boolean;
  actIdx: number;
}

export default function OrchPanel({ activities, componentMap }: OrchPanelProps) {
  const plans: PlanSummary[] = [];
  const planMap: Record<string, PlanSummary> = {};

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const vt = act.valueType || '';

    if (vt === 'DynamicPlanReceived' || vt === 'DynamicPlanReceivedDebug') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || ('plan_' + i);
      const ps: PlanSummary = { planId, steps: [], completed: false, cancelled: false, actIdx: i };
      planMap[planId] = ps;
      plans.push(ps);
    }

    if (vt === 'DynamicPlanStepTriggered') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || '';
      const ps = planMap[planId] || plans[plans.length - 1];
      if (ps) {
        const id = (v.taskDialogId as string) || '';
        ps.steps.push({
          name: friendlyTopicName(id, componentMap) || id || 'Step',
          state: 'triggered',
          thought: (v.thought as string) || '',
        });
      }
    }

    if (vt === 'DynamicPlanStepFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || '';
      const ps = planMap[planId] || plans[plans.length - 1];
      if (ps) {
        const id = (v.taskDialogId as string) || '';
        const name = friendlyTopicName(id, componentMap) || id || 'Step';
        const allMatching = ps.steps.filter(s => s.name === name && s.state === 'triggered');
        const existing = allMatching.length > 0 ? allMatching[allMatching.length - 1] : null;
        if (existing) {
          existing.state = (v.state as string) || 'completed';
          existing.durationMs = typeof v.durationInMs === 'number' ? v.durationInMs as number : undefined;
        } else {
          ps.steps.push({
            name,
            state: (v.state as string) || 'completed',
            durationMs: typeof v.durationInMs === 'number' ? v.durationInMs as number : undefined,
          });
        }
      }
    }

    if (vt === 'DynamicPlanFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || '';
      const ps = planMap[planId] || plans[plans.length - 1];
      if (ps) {
        ps.completed = true;
        ps.cancelled = !!v.wasCancelled;
      }
    }
  }

  if (plans.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        No orchestration plans found in this trace.
      </div>
    );
  }

  const stateColor: Record<string, string> = {
    completed: 'bg-emerald-500',
    triggered: 'bg-blue-500',
    failed: 'bg-red-500',
    error: 'bg-red-500',
    faulted: 'bg-red-500',
    cancelled: 'bg-yellow-500',
  };

  return (
    <div className="p-4 space-y-4">
      {plans.map((plan, pi) => (
        <div key={pi} className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              plan.cancelled ? 'bg-yellow-500' : plan.completed ? 'bg-emerald-500' : 'bg-blue-500'
            }`} />
            <span className="text-sm font-semibold text-gray-200">Plan {pi + 1}</span>
            <span className="text-xs text-gray-600">{plan.planId}</span>
            <span className={`ml-auto text-xs font-medium ${
              plan.cancelled ? 'text-yellow-400' : plan.completed ? 'text-emerald-400' : 'text-blue-400'
            }`}>
              {plan.cancelled ? 'CANCELLED' : plan.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
          <div className="p-4">
            {plan.steps.length === 0 ? (
              <div className="text-xs text-gray-600">No steps</div>
            ) : (
              <div className="space-y-2">
                {plan.steps.map((step, si) => (
                  <div key={si} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${stateColor[step.state] || 'bg-gray-600'}`} />
                      {si < plan.steps.length - 1 && <div className="w-0.5 h-5 bg-gray-700 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-200 font-medium truncate">{step.name}</span>
                        {step.durationMs !== undefined && (
                          <span className="text-xs text-gray-600 flex-shrink-0">
                            {step.durationMs >= 1000
                              ? (step.durationMs / 1000).toFixed(2) + 's'
                              : step.durationMs + 'ms'}
                          </span>
                        )}
                      </div>
                      {step.thought && (
                        <div className="text-xs text-gray-500 mt-0.5 italic truncate">{step.thought}</div>
                      )}
                    </div>
                    <span className={`text-xs flex-shrink-0 ${
                      step.state === 'completed' ? 'text-emerald-400' :
                      step.state === 'triggered' ? 'text-blue-400' :
                      step.state === 'failed' || step.state === 'error' ? 'text-red-400' :
                      'text-gray-500'
                    }`}>{step.state}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
