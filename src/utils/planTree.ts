import type { Activity, PlanRegistry, PlanInfo } from './types';
import { classifyActivity } from './activityClassifier';

export interface TreeItem {
  act: Activity;
  index: number;
  depth: number;
  planId: string | null;
  isInPlan: boolean;
  isStep: boolean;
  planGroupId: string | null;
}

const PLAN_COLORS = [
  'border-violet-500/60',
  'border-blue-500/60',
  'border-emerald-500/60',
  'border-amber-500/60',
  'border-rose-500/60',
  'border-cyan-500/60',
  'border-fuchsia-500/60',
  'border-orange-500/60',
];

export function buildPlanRegistry(activities: Activity[]): PlanRegistry {
  const registry: PlanRegistry = {};
  let colorIndex = 0;
  const planStack: string[] = [];

  for (const act of activities) {
    const vt = act.valueType || '';
    if (vt === 'DynamicPlanReceived' || vt === 'DynamicPlanReceivedDebug') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || ('plan_' + Object.keys(registry).length);
      const parentPlanId = planStack.length > 0 ? planStack[planStack.length - 1] : null;
      const depth = planStack.length;
      registry[planId] = {
        displayName: 'Plan ' + (Object.keys(registry).length + 1),
        parentPlanId,
        parentStepId: null,
        steps: [],
        colorIndex: colorIndex % PLAN_COLORS.length,
        depth,
      };
      colorIndex++;
    }
    if (vt === 'DynamicPlanStepTriggered') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || '';
      if (planId && registry[planId]) {
        const stepId = (v.taskDialogId as string) || '';
        if (stepId) registry[planId].steps.push(stepId);
        planStack.push(planId);
      }
    }
    if (vt === 'DynamicPlanStepFinished') {
      if (planStack.length > 0) planStack.pop();
    }
    if (vt === 'DynamicPlanFinished') {
      // plan finished
    }
  }

  return registry;
}

export function buildTreeItems(activities: Activity[]): TreeItem[] {
  const items: TreeItem[] = [];
  const planStack: string[] = [];
  const planIdMap: Record<number, string> = {};

  // First pass: assign planIds from DynamicPlanReceived
  let planCounter = 0;
  const actPlanIds: (string | null)[] = activities.map(() => null);
  const tempStack: string[] = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const vt = act.valueType || '';
    if (vt === 'DynamicPlanReceived' || vt === 'DynamicPlanReceivedDebug') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || ('__plan__' + planCounter++);
      planIdMap[i] = planId;
      actPlanIds[i] = planId;
      tempStack.push(planId);
    } else if (vt === 'DynamicPlanFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      const planId = (v.planId as string) || (tempStack.length > 0 ? tempStack[tempStack.length - 1] : null);
      actPlanIds[i] = planId;
      if (tempStack.length > 0) tempStack.pop();
    } else if (tempStack.length > 0) {
      actPlanIds[i] = tempStack[tempStack.length - 1];
    }
  }

  // Build tree items with depth
  const depthStack: string[] = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const vt = act.valueType || '';
    const cls = classifyActivity(act);
    const isStep = vt === 'DynamicPlanStepTriggered';
    const isPlanStart = vt === 'DynamicPlanReceived' || vt === 'DynamicPlanReceivedDebug';
    const isPlanEnd = vt === 'DynamicPlanFinished';

    if (isPlanStart) {
      const planId = actPlanIds[i];
      if (planId) depthStack.push(planId);
    }

    const depth = depthStack.length;
    const currentPlanId = depthStack.length > 0 ? depthStack[depthStack.length - 1] : null;

    items.push({
      act,
      index: i,
      depth: depth,
      planId: currentPlanId,
      isInPlan: depthStack.length > 0,
      isStep,
      planGroupId: isPlanStart ? actPlanIds[i] : null,
    });

    if (isPlanEnd && depthStack.length > 0) {
      depthStack.pop();
    }
  }

  return items;
}

export function getPlanColor(colorIndex: number): string {
  return PLAN_COLORS[colorIndex % PLAN_COLORS.length];
}

export function getPlanBgColor(colorIndex: number): string {
  const bgColors = [
    'bg-violet-500/5',
    'bg-blue-500/5',
    'bg-emerald-500/5',
    'bg-amber-500/5',
    'bg-rose-500/5',
    'bg-cyan-500/5',
    'bg-fuchsia-500/5',
    'bg-orange-500/5',
  ];
  return bgColors[colorIndex % bgColors.length];
}
