import type { Activity, ActivityClass, ComponentMap } from './types';
import { escapeHtml, truncate, getTs } from './activityClassifier';
import { friendlyTopicName } from './componentMap';
import { simpleMarkdown } from './markdown';

function renderAutoKV(obj: unknown, depth = 0): string {
  if (obj === null || obj === undefined) return '<span style="color:var(--text-muted)">(null)</span>';
  if (typeof obj !== 'object') return '<span>' + escapeHtml(String(obj)) + '</span>';
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '<span style="color:var(--text-muted)">(empty array)</span>';
    let h = '';
    obj.forEach((item, i) => {
      if (typeof item === 'object' && item !== null) {
        h += '<span style="color:#60a5fa;font-weight:600;display:block;margin-left:' + (depth*12) + 'px">[' + i + ']</span>';
        h += renderAutoKV(item, depth + 1);
      } else {
        h += '<span style="display:block;margin-left:' + (depth*12) + 'px">[' + i + '] ' + escapeHtml(String(item)) + '</span>';
      }
    });
    return h;
  }
  let h = '';
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v && typeof v === 'object') {
      h += '<span style="color:#60a5fa;font-weight:600;display:block;margin-left:' + (depth*12) + 'px">' + escapeHtml(k) + '</span>';
      h += renderAutoKV(v, depth + 1);
    } else {
      const display = v === null || v === undefined ? '(null)' : String(v);
      h += '<div style="margin-left:' + (depth*12) + 'px"><span style="color:#60a5fa;font-weight:500;margin-right:6px">' + escapeHtml(k) + ':</span><span>' + escapeHtml(display) + '</span></div>';
    }
  }
  return h;
}

export function buildDetail(act: Activity, cls: ActivityClass, componentMap: ComponentMap): string {
  const vt = act.valueType || '';
  let html = '';
  const ts = getTs(act);
  if (ts) {
    html += '<div class="detail-section"><h4>Timestamp</h4><div class="detail-content">' + escapeHtml(String(ts)) + '</div></div>';
  }
  if (act.from) {
    html += '<div class="detail-section"><h4>From</h4><div class="detail-content">';
    html += '<div class="kv-row"><span class="kv-key">Name</span><span class="kv-val">' + escapeHtml(act.from.name || '') + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Role</span><span class="kv-val">' + escapeHtml(act.from.role || '') + '</span></div>';
    html += '</div></div>';
  }
  if (act.text && (cls.cat === 'user-message' || cls.cat === 'bot-message')) {
    html += '<div class="detail-section"><h4>Message Content</h4><div class="detail-content message-text">' + simpleMarkdown(act.text as string) + '</div></div>';
  }
  if (act.speak) {
    html += '<div class="detail-section"><h4>Speak Text (TTS)</h4><div class="detail-content">' + escapeHtml(act.speak as string) + '</div></div>';
  }
  if (cls.cat === 'typing' && act.text) {
    html += '<div class="detail-section"><h4>Streaming Content</h4><div class="detail-content message-text">' + simpleMarkdown(act.text as string) + '</div></div>';
  }

  if (vt === 'DynamicPlanReceived') {
    const v = (act.value || {}) as Record<string, unknown>;
    html += '<div class="detail-section"><h4>Plan Details</h4><div class="detail-content">';
    html += '<div class="kv-row"><span class="kv-key">Plan ID</span><span class="kv-val"><code>' + escapeHtml(v.planIdentifier as string || '') + '</code></span></div>';
    html += '<div class="kv-row"><span class="kv-key">Is Final Plan</span><span class="kv-val">' + v.isFinalPlan + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Steps</span><span class="kv-val">' + escapeHtml(((v.steps as string[]) || []).join(', ')) + '</span></div>';
    if (v.parentPlanIdentifier) {
      html += '<div class="kv-row"><span class="kv-key">Parent Plan</span><span class="kv-val"><code>' + escapeHtml(v.parentPlanIdentifier as string) + '</code></span></div>';
    }
    if (v.toolDefinitions && (v.toolDefinitions as unknown[]).length) {
      html += '</div></div><div class="detail-section"><h4>Tool Definitions</h4><div class="detail-content">';
      (v.toolDefinitions as Record<string, unknown>[]).forEach((td) => {
        const kindClass = (td.toolKind === 'InvokeConnectedAgentTaskAction') ? 'connected' : (td.toolKind === 'InvokeExternalAgentTaskAction') ? 'external' : (td.toolKind === 'AdaptiveDialog') ? 'topic' : 'other';
        const kindLabel = (td.toolKind === 'InvokeConnectedAgentTaskAction') ? 'Connected Agent' : (td.toolKind === 'InvokeExternalAgentTaskAction') ? 'External Agent (Foundry)' : (td.toolKind === 'AdaptiveDialog') ? 'Topic' : (td.toolKind as string || 'Unknown');
        html += '<div style="margin-bottom:8px;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px;">';
        html += '<div class="kv-row"><span class="kv-key">Display Name</span><span class="kv-val">';
        if (td.iconUri) html += '<img style="width:18px;height:18px;border-radius:3px;vertical-align:middle;margin-right:6px;" src="' + escapeHtml(td.iconUri as string) + '" alt="" onerror="this.style.display=\'none\'">';
        html += '<strong>' + escapeHtml(td.displayName as string || '') + '</strong></span></div>';
        html += '<div class="kv-row"><span class="kv-key">Description</span><span class="kv-val">' + escapeHtml(td.description as string || '') + '</span></div>';
        html += '<div class="kv-row"><span class="kv-key">Schema</span><span class="kv-val"><code>' + escapeHtml(td.schemaName as string || '') + '</code></span></div>';
        html += '<div class="kv-row"><span class="kv-key">Kind</span><span class="kv-val"><span class="tool-kind-badge ' + kindClass + '">' + escapeHtml(kindLabel) + '</span></span></div>';
        html += '</div>';
      });
    }
    html += '</div></div>';
  }

  if (vt === 'DynamicPlanReceivedDebug') {
    const v = (act.value || {}) as Record<string, unknown>;
    html += '<div class="detail-section"><h4>Plan Debug Info</h4><div class="detail-content">';
    html += '<div class="kv-row"><span class="kv-key">User Ask</span><span class="kv-val">' + escapeHtml(v.ask as string || '') + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Summary</span><span class="kv-val">' + escapeHtml(v.summary as string || '(empty)') + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Plan ID</span><span class="kv-val"><code>' + escapeHtml(v.planIdentifier as string || '') + '</code></span></div>';
    html += '<div class="kv-row"><span class="kv-key">Is Final</span><span class="kv-val">' + v.isFinalPlan + '</span></div>';
    html += '</div></div>';
  }

  if (vt === 'DynamicPlanStepTriggered') {
    const v = (act.value || {}) as Record<string, unknown>;
    const comp = (componentMap as Record<string, unknown>)[v.taskDialogId as string] as { displayName?: string; description?: string; connectedBotSchema?: string; invocationType?: string; connectionReference?: string; triggerQueries?: string[]; actions?: { kind: string; text?: string; prompt?: string; dialog?: string; variable?: string; nested?: boolean }[] } | undefined;
    const tfm = componentMap._taskDialogFlowMap as Record<string, string> | undefined;
    const flowId = tfm?.[v.taskDialogId as string] || null;
    const flows = componentMap._flows as Record<string, { displayName: string; connectionType?: string }> | undefined;
    const flowDef = flowId && flows ? flows[flowId] : null;
    html += '<div class="detail-section"><h4>Step Details</h4><div class="detail-content">';
    if (comp?.displayName) {
      html += '<div class="kv-row"><span class="kv-key">Topic Name</span><span class="kv-val" style="font-weight:600;color:#60a5fa;">' + escapeHtml(comp.displayName) + '</span></div>';
    }
    html += '<div class="kv-row"><span class="kv-key">Task/Agent</span><span class="kv-val"><code>' + escapeHtml(v.taskDialogId as string || '') + '</code></span></div>';
    html += '<div class="kv-row"><span class="kv-key">Step ID</span><span class="kv-val"><code>' + escapeHtml(v.stepId as string || '') + '</code></span></div>';
    html += '<div class="kv-row"><span class="kv-key">State</span><span class="kv-val">' + escapeHtml(v.state as string || '') + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Plan ID</span><span class="kv-val"><code>' + escapeHtml(v.planIdentifier as string || '') + '</code></span></div>';
    if (comp?.connectedBotSchema) {
      html += '<div class="kv-row"><span class="kv-key">Connected Bot</span><span class="kv-val"><code>' + escapeHtml(comp.connectedBotSchema) + '</code></span></div>';
    }
    if (comp?.invocationType) {
      const invLabel = comp.invocationType === 'external' ? 'External Agent (Azure Foundry)' : 'Connected Agent (Copilot)';
      html += '<div class="kv-row"><span class="kv-key">Invocation Type</span><span class="kv-val"><span style="padding:2px 6px;border-radius:4px;font-size:11px;background:rgba(59,130,246,0.15);color:#60a5fa;">' + invLabel + '</span></span></div>';
    }
    if (flowDef) {
      html += '<div class="kv-row"><span class="kv-key">Flow</span><span class="kv-val"><span style="background:#7c3aed;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;">Power Automate</span> <strong>' + escapeHtml(flowDef.displayName) + '</strong></span></div>';
    }
    html += '</div></div>';
    if (v.thought) {
      html += '<div class="detail-section"><h4>AI Thought / Reasoning</h4><div class="detail-content" style="border-left:3px solid #f59e0b;padding-left:12px;font-style:italic;">' + escapeHtml(v.thought as string) + '</div></div>';
    }
    if (comp?.triggerQueries && comp.triggerQueries.length > 0) {
      html += '<div class="detail-section"><h4>Trigger Phrases</h4><div class="detail-content"><div style="display:flex;flex-wrap:wrap;gap:4px;">';
      comp.triggerQueries.forEach((tq) => { html += '<span style="padding:1px 6px;background:rgba(0,0,0,0.2);border-radius:3px;border:1px solid rgba(255,255,255,0.1);font-size:11px;">' + escapeHtml(tq) + '</span>'; });
      html += '</div></div></div>';
    }
  }

  if (vt === 'DynamicPlanStepBindUpdate') {
    const v = (act.value || {}) as Record<string, unknown>;
    const comp = (componentMap as Record<string, unknown>)[v.taskDialogId as string] as { displayName?: string } | undefined;
    const tfm = componentMap._taskDialogFlowMap as Record<string, string> | undefined;
    const flowId = tfm?.[v.taskDialogId as string] || null;
    const flows = componentMap._flows as Record<string, { displayName: string; inputs?: Record<string, { displayName?: string; type?: string; isRequired?: boolean }>; bindings?: { topic: string; inputBindings: Record<string, string> }[] }> | undefined;
    const flowDef = flowId && flows ? flows[flowId] : null;
    html += '<div class="detail-section"><h4>Binding Details</h4><div class="detail-content">';
    if (comp?.displayName) html += '<div class="kv-row"><span class="kv-key">Topic Name</span><span class="kv-val" style="font-weight:600;color:#60a5fa;">' + escapeHtml(comp.displayName) + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Task/Agent</span><span class="kv-val"><code>' + escapeHtml(v.taskDialogId as string || '') + '</code></span></div>';
    html += '<div class="kv-row"><span class="kv-key">Step ID</span><span class="kv-val"><code>' + escapeHtml(v.stepId as string || '') + '</code></span></div>';
    html += '</div></div>';
    if (v.arguments) {
      const autoFilled = (v.autoFilledArguments as string[]) || [];
      const args = v.arguments as Record<string, unknown>;
      html += '<div class="detail-section"><h4>Arguments</h4><div class="detail-content">';
      for (const [k, val] of Object.entries(args)) {
        const isAuto = autoFilled.includes(k);
        const display = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
        html += '<div class="kv-row"><span class="kv-key">' + escapeHtml(k) + '<span style="font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px;margin-left:6px;' + (isAuto ? 'background:rgba(46,160,67,0.15);color:#34d399;border:1px solid rgba(46,160,67,0.3)' : 'background:rgba(139,148,158,0.15);color:#9ca3af;border:1px solid rgba(139,148,158,0.3)') + '">' + (isAuto ? 'AUTO' : 'MANUAL') + '</span></span><span class="kv-val">' + simpleMarkdown(display) + '</span></div>';
      }
      html += '</div></div>';
    } else if (flowDef) {
      html += '<div class="detail-section"><h4>⚠️ Arguments</h4><div class="detail-content"><div style="background:rgba(69,26,26,0.5);border:1px solid #ef4444;border-radius:6px;padding:10px;color:#fca5a5;font-size:12px;">No arguments were bound. The AI model failed to extract parameters for this flow call.</div></div></div>';
    }
  }

  if (vt === 'DynamicPlanStepFinished') {
    const v = (act.value || {}) as Record<string, unknown>;
    const comp = (componentMap as Record<string, unknown>)[v.taskDialogId as string] as { displayName?: string } | undefined;
    const tfm = componentMap._taskDialogFlowMap as Record<string, string> | undefined;
    const flowId = tfm?.[v.taskDialogId as string] || null;
    const flows = componentMap._flows as Record<string, { displayName: string }> | undefined;
    const flowDef = flowId && flows ? flows[flowId] : null;
    html += '<div class="detail-section"><h4>Step Result</h4><div class="detail-content">';
    if (comp?.displayName) html += '<div class="kv-row"><span class="kv-key">Topic Name</span><span class="kv-val" style="font-weight:600;color:#60a5fa;">' + escapeHtml(comp.displayName) + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Task/Agent</span><span class="kv-val"><code>' + escapeHtml(v.taskDialogId as string || '') + '</code></span></div>';
    const state = (v.state as string) || '';
    const stateColor = state === 'completed' ? '#34d399' : (state === 'failed' || state === 'error' || state === 'faulted') ? '#f87171' : 'inherit';
    html += '<div class="kv-row"><span class="kv-key">State</span><span class="kv-val" style="color:' + stateColor + ';font-weight:600;">' + escapeHtml(state) + '</span></div>';
    if (v.executionTime) html += '<div class="kv-row"><span class="kv-key">Execution Time</span><span class="kv-val">' + escapeHtml(v.executionTime as string) + '</span></div>';
    if (flowDef) html += '<div class="kv-row"><span class="kv-key">Flow</span><span class="kv-val"><span style="background:#7c3aed;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;">Power Automate</span> <strong>' + escapeHtml(flowDef.displayName) + '</strong></span></div>';
    html += '</div></div>';
    if (v.error) {
      const err = v.error as Record<string, unknown>;
      html += '<div class="detail-section"><h4>Error</h4><div class="detail-content">';
      html += '<div class="kv-row"><span class="kv-key">Error Code</span><span class="kv-val" style="color:#f87171;font-weight:600;">' + escapeHtml(err.userErrorCode as string || '') + '</span></div>';
      html += '<div class="kv-row"><span class="kv-key">Message</span><span class="kv-val" style="color:#f87171;">' + escapeHtml(err.message as string || '') + '</span></div>';
      html += '</div></div>';
    }
    if (v.observation && typeof v.observation === 'object' && !Array.isArray(v.observation)) {
      const obs = v.observation as Record<string, unknown>;
      const filteredKeys = Object.keys(obs).filter((k) => k !== 'downloaded_files');
      if (filteredKeys.length > 0) {
        if (obs.search_result && (obs.search_result as Record<string, unknown>).search_results) {
          const results = (obs.search_result as Record<string, unknown>).search_results as Record<string, unknown>[];
          html += '<div class="detail-section"><h4>Search Results</h4><div class="detail-content">';
          results.forEach((r, i) => {
            html += '<div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:10px 12px;margin-bottom:8px;">';
            html += '<div style="font-weight:600;font-size:13px;color:#60a5fa;margin-bottom:4px;">' + (i+1) + '. ' + escapeHtml(r.Name as string || '') + '</div>';
            html += '<div style="font-size:11px;color:#6b7280;">' + escapeHtml(r.FileType as string || '') + ' — ' + escapeHtml(r.Type as string || '') + '</div>';
            html += '<div style="font-size:12px;color:#6b7280;max-height:80px;overflow:hidden;">' + escapeHtml(truncate(r.Text as string || '', 300)) + '</div>';
            html += '</div>';
          });
          html += '</div></div>';
        } else {
          html += '<div class="detail-section"><h4>Observation / Output</h4><div class="detail-content auto-kv-section">';
          html += renderAutoKV(obs);
          html += '</div></div>';
        }
      }
    }
  }

  if (vt === 'DynamicPlanFinished') {
    const v = (act.value || {}) as Record<string, unknown>;
    html += '<div class="detail-section"><h4>Plan Completion</h4><div class="detail-content">';
    html += '<div class="kv-row"><span class="kv-key">Plan ID</span><span class="kv-val"><code>' + escapeHtml(v.planId as string || '') + '</code></span></div>';
    html += '<div class="kv-row"><span class="kv-key">Cancelled</span><span class="kv-val">' + v.wasCancelled + '</span></div>';
    html += '</div></div>';
  }

  if (vt === 'UniversalSearchToolTraceData') {
    const v = (act.value || {}) as Record<string, unknown>;
    html += '<div class="detail-section"><h4>Search Trace</h4><div class="detail-content">';
    html += '<div class="kv-row"><span class="kv-key">Tool ID</span><span class="kv-val"><code>' + escapeHtml(v.toolId as string || '') + '</code></span></div>';
    html += '<div class="kv-row"><span class="kv-key">Knowledge Sources</span><span class="kv-val">' + escapeHtml(((v.knowledgeSources as string[]) || []).join(', ')) + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Output Sources</span><span class="kv-val">' + escapeHtml(((v.outputKnowledgeSources as string[]) || []).join(', ')) + '</span></div>';
    html += '</div></div>';
  }

  if (vt === 'AIBuilderTraceData') {
    const v = (act.value || {}) as Record<string, unknown>;
    html += '<div class="detail-section"><h4>🧠 AI Builder Action</h4><div class="detail-content">';
    html += '<div class="kv-row"><span class="kv-key">Action ID</span><span class="kv-val"><code>' + escapeHtml(v.actionId as string || '') + '</code></span></div>';
    const topicFriendly = friendlyTopicName(v.topicSchemaName as string || '', componentMap);
    html += '<div class="kv-row"><span class="kv-key">Topic</span><span class="kv-val">' + (topicFriendly ? '<strong style="color:#60a5fa;">' + escapeHtml(topicFriendly) + '</strong>' : '<code>' + escapeHtml(v.topicSchemaName as string || '') + '</code>') + '</span></div>';
    html += '</div></div>';
    if (v.outputText) {
      html += '<div class="detail-section"><h4>Generated Text</h4><div class="detail-content message-text">' + simpleMarkdown(v.outputText as string) + '</div></div>';
    }
  }

  if (vt === 'DialogTracingInfo') {
    const actions = (act.value && (act.value as Record<string, unknown>).actions as Record<string, unknown>[]) || [];
    if (actions.length) {
      html += '<div class="detail-section"><h4>Dialog Actions (' + actions.length + ')</h4><div class="detail-content">';
      actions.forEach((a) => {
        html += '<div style="margin-bottom:8px;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px;">';
        html += '<div class="kv-row"><span class="kv-key">Action</span><span class="kv-val"><strong>' + escapeHtml(a.actionType as string || '') + '</strong></span></div>';
        html += '<div class="kv-row"><span class="kv-key">Action ID</span><span class="kv-val"><code>' + escapeHtml(a.actionId as string || '') + '</code></span></div>';
        const topicFriendly = friendlyTopicName(a.topicId as string || '', componentMap);
        html += '<div class="kv-row"><span class="kv-key">Topic</span><span class="kv-val">' + (topicFriendly ? '<strong style="color:#60a5fa;">' + escapeHtml(topicFriendly) + '</strong> <code style="font-size:10px;color:#6b7280;">' + escapeHtml(a.topicId as string || '') + '</code>' : '<code>' + escapeHtml(a.topicId as string || '') + '</code>') + '</span></div>';
        if (a.exception) {
          if (a.actionType === 'InvokeAIBuilderModelAction') {
            html += '<div style="margin-top:4px;padding:8px;background:rgba(236,72,153,0.06);border:1px solid rgba(236,72,153,0.2);border-radius:6px;">';
            html += '<div style="font-size:11px;font-weight:600;color:#ec4899;margin-bottom:4px;">🧠 AI Builder Validation Error</div>';
            html += '<div style="color:#f87171;font-size:12px;">' + escapeHtml(a.exception as string) + '</div>';
            html += '</div>';
          } else {
            html += '<div class="kv-row"><span class="kv-key" style="color:#f87171;">Exception</span><span class="kv-val" style="color:#f87171;">' + escapeHtml(a.exception as string) + '</span></div>';
          }
        }
        if (a.variableState) {
          const vs = a.variableState as Record<string, Record<string, unknown>>;
          const ds = vs.dialogState || {};
          if (ds.aib_Output && typeof ds.aib_Output === 'object') {
            const out = ds.aib_Output as Record<string, unknown>;
            html += '<div style="margin-top:6px;padding:8px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:6px;">';
            html += '<div style="font-size:11px;font-weight:600;color:#a78bfa;margin-bottom:4px;">🧠 AI Builder Output</div>';
            if (out.modelName) html += '<div class="kv-row"><span class="kv-key">Model</span><span class="kv-val"><code>' + escapeHtml(out.modelName as string) + '</code></span></div>';
            if (out.finishReason) html += '<div class="kv-row"><span class="kv-key">Finish Reason</span><span class="kv-val">' + escapeHtml(out.finishReason as string) + '</span></div>';
            if (out.totalTokens) html += '<div class="kv-row"><span class="kv-key">Tokens</span><span class="kv-val">' + (out.promptTokens || 0) + ' + ' + (out.completionTokens || 0) + ' = <strong>' + out.totalTokens + '</strong></span></div>';
            if (out.text) html += '<div style="margin-top:6px;">' + simpleMarkdown(out.text as string) + '</div>';
            html += '</div>';
          }
        }
        html += '</div>';
      });
      html += '</div></div>';
    }
  }

  if ((vt === 'GenerativeAnswersSupportData' || act.name === 'GenerativeAnswersSupportData') && act.value) {
    const v = act.value as Record<string, unknown>;
    html += '<div class="detail-section"><h4>Generative Answers Debug</h4><div class="detail-content">';
    html += '<div class="kv-row"><span class="kv-key">GPT Answer State</span><span class="kv-val">' + escapeHtml(v.gptAnswerState as string || '') + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Completion State</span><span class="kv-val">' + escapeHtml(v.completionState as string || '') + '</span></div>';
    html += '<div class="kv-row"><span class="kv-key">Triggered Fallback</span><span class="kv-val">' + v.triggeredGptFallback + '</span></div>';
    html += '</div></div>';
  }

  if (act.entities) {
    const citations: { name: string; url: string }[] = [];
    (act.entities as Record<string, unknown>[]).forEach((ent) => {
      if (ent.citation) {
        (ent.citation as Record<string, unknown>[]).forEach((c) => {
          const app = c.appearance as Record<string, unknown> | undefined;
          if (app) citations.push({ name: app.name as string || '', url: app.url as string || '' });
        });
      }
    });
    if (citations.length) {
      html += '<div class="detail-section"><h4>Citations</h4><div class="detail-content">';
      citations.forEach((c) => {
        html += '<div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:8px 12px;margin-bottom:6px;">';
        html += '<div style="font-weight:600;color:#60a5fa;">' + escapeHtml(c.name) + '</div>';
        if (c.url) html += '<div style="font-size:11px;color:#6b7280;">' + escapeHtml(truncate(c.url, 100)) + '</div>';
        html += '</div>';
      });
      html += '</div></div>';
    }
  }

  const knownVTs = ['DynamicPlanReceived','DynamicPlanReceivedDebug','DynamicPlanStepTriggered','DynamicPlanStepBindUpdate','DynamicPlanStepFinished','DynamicPlanFinished','UniversalSearchToolTraceData','DialogTracingInfo','GenerativeAnswersSupportData','AIBuilderTraceData'];
  if (act.type === 'event' && act.value && typeof act.value === 'object' && !knownVTs.includes(vt) && vt !== '') {
    html += '<div class="detail-section"><h4>Event Data (' + escapeHtml(vt) + ')</h4><div class="detail-content auto-kv-section">';
    html += renderAutoKV(act.value);
    html += '</div></div>';
  }

  html += '<div class="detail-section"><h4 style="cursor:pointer;" data-toggle-json="true">▶ Raw JSON (click to expand)</h4><div class="detail-content json-tree-root" style="display:none;max-height:400px;overflow:auto;"></div></div>';

  return html;
}

export function buildJsonTree(val: unknown, depth = 0): string {
  const maxAutoExpand = 2;
  if (val === null) return '<span class="jt-null">null</span>';
  if (val === undefined) return '<span class="jt-null">undefined</span>';
  if (typeof val === 'string') return '<span class="jt-str">&quot;' + escapeHtml(val.length > 500 ? val.substring(0,500) + '...' : val) + '&quot;</span>';
  if (typeof val === 'number') return '<span class="jt-num">' + val + '</span>';
  if (typeof val === 'boolean') return '<span class="jt-bool">' + val + '</span>';
  const isArr = Array.isArray(val);
  const entries: [string | number, unknown][] = isArr ? (val as unknown[]).map((v, i) => [i, v]) : Object.entries(val as Record<string, unknown>);
  if (entries.length === 0) return isArr ? '<span class="jt-null">[]</span>' : '<span class="jt-null">{}</span>';
  const collapsed = depth >= maxAutoExpand ? ' jt-collapsed' : ' jt-expanded';
  let html = '<div class="jt-node' + collapsed + '">';
  html += '<span class="jt-toggle">' + (isArr ? '[' + entries.length + ']' : '{' + entries.length + '}') + '</span>';
  html += '<div class="jt-children">';
  entries.forEach(([k, v]) => {
    html += '<div class="jt-entry"><span class="jt-key">' + escapeHtml(String(k)) + '</span>: ';
    html += buildJsonTree(v, depth + 1);
    html += '</div>';
  });
  html += '</div>';
  if (depth >= maxAutoExpand) html += '<span class="jt-ellipsis">...</span>';
  html += '</div>';
  return html;
}
