import type { Activity, ActivityClass, ComponentMap } from './types';
import { friendlyTopicName } from './componentMap';

export function isUserMsg(act: Activity): boolean {
  if (!act || act.type !== 'message' || !act.from) return false;
  if (act.from.role === 'user') return true;
  if (act.from.role === 'bot' || act.from.role === 'debug') return false;
  return true;
}

export function classifyActivity(act: Activity): ActivityClass {
  if (act.type === 'message') {
    if (isUserMsg(act)) return { cat: 'user-message', badge: 'User Message', badgeCls: 'badge-user' };
    if (act.from && act.from.role === 'bot') return { cat: 'bot-message', badge: 'Bot Response', badgeCls: 'badge-bot' };
    if (act.from && act.from.role === 'debug') return { cat: 'info', badge: 'Debug', badgeCls: 'badge-info' };
    return { cat: 'bot-message', badge: 'Message', badgeCls: 'badge-bot' };
  }
  if (act.type === 'typing') return { cat: 'typing', badge: 'Typing/Stream', badgeCls: 'badge-typing' };
  if (act.type === 'event') {
    const vt = act.valueType || act.name || '';
    if (vt === 'DynamicPlanReceived' || vt === 'DynamicPlanReceivedDebug') return { cat: 'plan', badge: 'Plan', badgeCls: 'badge-plan' };
    if (vt === 'DynamicPlanStepTriggered') return { cat: 'thought', badge: 'Step Triggered', badgeCls: 'badge-thought' };
    if (vt === 'DynamicPlanStepBindUpdate') return { cat: 'tool', badge: 'Arguments Bound', badgeCls: 'badge-tool' };
    if (vt === 'DynamicPlanStepFinished') return { cat: 'tool', badge: 'Step Finished', badgeCls: 'badge-tool' };
    if (vt === 'DynamicPlanFinished') return { cat: 'plan', badge: 'Plan Complete', badgeCls: 'badge-plan' };
    if (vt === 'UniversalSearchToolTraceData') return { cat: 'search', badge: 'Search', badgeCls: 'badge-search' };
    if (vt === 'AIBuilderTraceData') return { cat: 'tool', badge: 'AI Builder', badgeCls: 'badge-tool' };
    if (vt === 'DialogTracingInfo') return { cat: 'info', badge: 'Dialog Trace', badgeCls: 'badge-info' };
    if (vt === 'GenerativeAnswersSupportData' || act.name === 'GenerativeAnswersSupportData') return { cat: 'info', badge: 'Gen Answers', badgeCls: 'badge-info' };
    return { cat: 'info', badge: vt || 'Event', badgeCls: 'badge-info' };
  }
  return { cat: 'info', badge: act.type || 'Unknown', badgeCls: 'badge-info' };
}

export function buildTitle(act: Activity, cls: ActivityClass, componentMap: ComponentMap): string {
  const vt = act.valueType || '';
  if (cls.cat === 'user-message') return (act.text as string) || 'User message';
  if (cls.cat === 'bot-message') return truncate((act.text as string) || '', 120) || 'Bot response';
  if (cls.cat === 'typing') {
    if (act.text) return truncate(act.text as string, 120);
    return 'Typing indicator';
  }
  if (vt === 'DynamicPlanReceived') {
    const v = (act.value || {}) as Record<string, unknown>;
    const steps = ((v.steps as string[]) || []).map((s) => friendlyTopicName(s, componentMap) || s).join(', ');
    return 'Plan received: ' + (steps || 'no steps') + (v.isFinalPlan ? ' (final)' : '');
  }
  if (vt === 'DynamicPlanReceivedDebug') {
    const v = (act.value || {}) as Record<string, unknown>;
    return 'Plan debug — Ask: ' + truncate((v.ask as string) || '', 80);
  }
  if (vt === 'DynamicPlanStepTriggered') {
    const v = (act.value || {}) as Record<string, unknown>;
    const name = friendlyTopicName((v.taskDialogId as string) || '', componentMap) || (v.taskDialogId as string) || 'Step';
    return name + ' — ' + truncate((v.thought as string) || '', 100);
  }
  if (vt === 'DynamicPlanStepBindUpdate') {
    const v = (act.value || {}) as Record<string, unknown>;
    const name = friendlyTopicName((v.taskDialogId as string) || '', componentMap) || (v.taskDialogId as string) || 'step';
    return 'Bind arguments for ' + name;
  }
  if (vt === 'DynamicPlanStepFinished') {
    const v = (act.value || {}) as Record<string, unknown>;
    const name = friendlyTopicName((v.taskDialogId as string) || '', componentMap) || (v.taskDialogId as string) || 'Step';
    const state = (v.state as string) || '';
    if ((state === 'failed' || state === 'error' || state === 'faulted') && v.error) {
      const err = v.error as Record<string, unknown>;
      return name + ' ❌ ' + ((err.userErrorCode as string) || state) + ': ' + truncate((err.message as string) || '', 60);
    }
    return name + ' finished (' + state + ')';
  }
  if (vt === 'DynamicPlanFinished') {
    const v = (act.value || {}) as Record<string, unknown>;
    return 'Plan ' + ((v.planId as string) || '') + ' ' + (v.wasCancelled ? 'CANCELLED' : 'completed');
  }
  if (vt === 'UniversalSearchToolTraceData') {
    const v = (act.value || {}) as Record<string, unknown>;
    const count = ((v.fullResults as unknown[]) || []).length ||
      (((v.outputKnowledgeSources as unknown[]) || []).length ? 'sources: ' + (v.outputKnowledgeSources as unknown[]).length : '0 results');
    return 'Search executed — ' + count;
  }
  if (vt === 'DialogTracingInfo') {
    const actions = (act.value && (act.value as Record<string, unknown>).actions as Record<string, unknown>[]) || [];
    if (actions.length === 0) return 'Dialog trace (no actions)';
    const hasAibError = actions.some((a) => a.actionType === 'InvokeAIBuilderModelAction' && a.exception);
    if (hasAibError) {
      const aibAction = actions.find((a) => a.actionType === 'InvokeAIBuilderModelAction' && a.exception);
      return '🧠 AI Builder ❌ ' + truncate((aibAction!.exception as string) || '', 80);
    }
    return 'Dialog trace: ' + actions.map((a) => (a.actionType as string) + ' (' + (friendlyTopicName((a.topicId as string) || '', componentMap) || String(a.topicId || '').split('.').pop()) + ')').join(', ');
  }
  if (vt === 'AIBuilderTraceData') {
    const v = (act.value || {}) as Record<string, unknown>;
    const out = (v.outputText as string) || '';
    return 'AI Builder' + (out ? ' — ' + truncate(out, 80) : '');
  }
  if (act.name === 'GenerativeAnswersSupportData') {
    const v = (act.value || {}) as Record<string, unknown>;
    return 'Generative answers: ' + ((v.gptAnswerState as string) || (v.completionState as string) || 'unknown');
  }
  return vt || act.name || act.type || 'Activity';
}

export function getTs(act: Activity): string {
  const cd = act.channelData as Record<string, unknown> | undefined;
  return act.timestamp || act.localTimestamp || (cd && cd['webchat:internal:received-at'] as string) || '';
}

export function formatTime(ts: string): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return ''; }
}

export function truncate(s: string, len: number): string {
  if (!s) return '';
  if (s.length <= len) return s;
  return s.substring(0, len) + '...';
}

export function escapeHtml(s: unknown): string {
  if (s === null || s === undefined) return '';
  const str = typeof s !== 'string' ? String(s) : s;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
