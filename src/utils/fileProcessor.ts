import { extractFromZip, extractBotContentFromZip } from './zipParser';
import { parseYaml } from './yamlParser';
import { buildComponentMap } from './componentMap';
import { classifyActivity } from './activityClassifier';
import type { DialogData, ComponentMap, Activity, BatchResult, Issue } from './types';

export async function processZipFile(file: File): Promise<{ dialogData: DialogData; componentMap: ComponentMap }> {
  const buf = await file.arrayBuffer();
  const { jsonText, ymlText } = await extractFromZip(buf);

  let dialogData: DialogData = { activities: [] };
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      dialogData = { activities: parsed };
    } else if (parsed && Array.isArray(parsed.activities)) {
      dialogData = { activities: parsed.activities };
    } else {
      dialogData = { activities: [] };
    }
  } catch {
    throw new Error('Failed to parse dialog.json from ZIP');
  }

  let componentMap: ComponentMap = {};
  if (ymlText) {
    try {
      const parsed = parseYaml(ymlText) as Record<string, unknown>;
      componentMap = buildComponentMap(parsed);
    } catch {
      // ignore YAML parse errors
    }
  }

  return { dialogData, componentMap };
}

export async function processJsonFile(file: File): Promise<{ dialogData: DialogData; componentMap: ComponentMap }> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file');
  }

  let dialogData: DialogData = { activities: [] };
  if (Array.isArray(parsed)) {
    dialogData = { activities: parsed as Activity[] };
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).activities)) {
    dialogData = { activities: (parsed as Record<string, unknown>).activities as Activity[] };
  } else {
    throw new Error('JSON file does not contain an activities array');
  }

  return { dialogData, componentMap: {} };
}

export async function processBotContentFile(file: File, existingMap?: ComponentMap): Promise<ComponentMap> {
  const text = await file.text();
  try {
    const parsed = parseYaml(text) as Record<string, unknown>;
    return buildComponentMap(parsed);
  } catch {
    return existingMap || {};
  }
}

export function detectFileType(file: File): 'zip' | 'json' | 'yaml' | 'unknown' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.zip')) return 'zip';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'yaml';
  return 'unknown';
}

export function analyzeForBatch(dialogData: DialogData, componentMap: ComponentMap): {
  issueCount: number;
  errorCount: number;
  stepCount: number;
  userTurns: number;
  hasCancelled: boolean;
} {
  const acts = dialogData.activities;
  let issueCount = 0;
  let errorCount = 0;
  let stepCount = 0;
  let userTurns = 0;
  let hasCancelled = false;

  for (const act of acts) {
    const vt = act.valueType || '';
    const cls = classifyActivity(act);

    if (cls.cat === 'user-message') userTurns++;
    if (vt === 'DynamicPlanStepFinished') {
      stepCount++;
      const v = (act.value || {}) as Record<string, unknown>;
      const state = (v.state as string) || '';
      if (state === 'failed' || state === 'error' || state === 'faulted') {
        errorCount++;
        issueCount++;
      }
    }
    if (vt === 'DynamicPlanFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      if (v.wasCancelled) hasCancelled = true;
    }
    if (vt === 'DialogTracingInfo') {
      const actions = (act.value && (act.value as Record<string, unknown>).actions as Record<string, unknown>[]) || [];
      const hasError = actions.some(a => a.exception);
      if (hasError) issueCount++;
    }
  }

  return { issueCount, errorCount, stepCount, userTurns, hasCancelled };
}

export function detectIssues(acts: Activity[]): Issue[] {
  const issues: Issue[] = [];
  acts.forEach((act, idx) => {
    const vt = act.valueType || '';
    if (vt === 'DynamicPlanStepFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      const state = (v.state as string) || '';
      if (state === 'failed' || state === 'error' || state === 'faulted') {
        const err = v.error as Record<string, unknown> | undefined;
        issues.push({
          type: 'error',
          title: (err?.message as string) || 'Step failed',
          stepIndex: idx,
          activityRef: act,
        });
      }
    }
    if (vt === 'DynamicPlanFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      if (v.wasCancelled) {
        issues.push({ type: 'cancelled', title: 'Plan was cancelled', stepIndex: idx, activityRef: act });
      }
    }
    if (vt === 'DialogTracingInfo') {
      const actions = (act.value && (act.value as Record<string, unknown>).actions as Record<string, unknown>[]) || [];
      actions.forEach(a => {
        if (a.exception) {
          issues.push({
            type: 'error',
            title: (a.exception as string) || 'Dialog trace exception',
            stepIndex: idx,
            activityRef: act,
          });
        }
      });
    }
  });
  return issues;
}
