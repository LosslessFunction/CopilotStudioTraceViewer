import type { ComponentEntry, ComponentMap, ActionSummary, FlowEntry } from './types';

export function extractActionSummary(actions: Record<string, unknown>[]): ActionSummary[] {
  const result: ActionSummary[] = [];
  if (!Array.isArray(actions)) return result;
  actions.forEach((a) => {
    const kind = (a.kind as string) || '';
    const summary: ActionSummary = { kind };
    if (kind === 'SendActivity') {
      const msg = a.activity;
      if (typeof msg === 'string') summary.text = msg.substring(0, 80);
      else if (msg && typeof msg === 'object' && (msg as Record<string, unknown>).text) {
        const t = (msg as Record<string, unknown>).text;
        summary.text = (Array.isArray(t) ? t[0] : t as string).substring(0, 80);
      }
    }
    if (kind === 'Question') {
      summary.variable = (a.variable as string) || '';
      summary.prompt = ((a.prompt as string) || '').substring(0, 80);
      summary.entity = (a.entity as string) || '';
    }
    if (kind === 'SetVariable' || kind === 'SetTextVariable') {
      summary.variable = (a.variable as string) || '';
    }
    if (kind === 'BeginDialog' || kind === 'ReplaceDialog') {
      summary.dialog = (a.dialog as string) || '';
    }
    if (kind === 'ConditionGroup') {
      summary.conditionCount = ((a.conditions as unknown[]) || []).length;
    }
    if (kind === 'SearchAndSummarizeContent') {
      summary.text = 'Search & Summarize';
    }
    result.push(summary);
    if (a.conditions) {
      (a.conditions as Record<string, unknown>[]).forEach((c) => {
        if (c.actions) result.push(...extractActionSummary(c.actions as Record<string, unknown>[]).map((s) => ({ ...s, nested: true })));
      });
    }
    if (a.elseActions) {
      result.push(...extractActionSummary(a.elseActions as Record<string, unknown>[]).map((s) => ({ ...s, nested: true })));
    }
  });
  return result;
}

export function extractFlowBindings(actions: Record<string, unknown>[], topicSchema: string, map: ComponentMap): void {
  if (!Array.isArray(actions)) return;
  actions.forEach((a) => {
    if (a.kind === 'InvokeFlowAction' && a.flowId) {
      const flows = map._flows as Record<string, FlowEntry> | undefined;
      const flow = flows && flows[a.flowId as string];
      if (flow) {
        if (!flow.bindings) flow.bindings = [];
        const binding = { topic: topicSchema, inputBindings: {} as Record<string, string>, outputBindings: {} as Record<string, string> };
        if (a.input && typeof a.input === 'object' && (a.input as Record<string, unknown>).binding) {
          const b = (a.input as Record<string, unknown>).binding as Record<string, string>;
          Object.keys(b).forEach((k) => { binding.inputBindings[k] = b[k]; });
        }
        if (a.output && typeof a.output === 'object' && (a.output as Record<string, unknown>).binding) {
          const b = (a.output as Record<string, unknown>).binding as Record<string, string>;
          Object.keys(b).forEach((k) => { binding.outputBindings[k] = b[k]; });
        }
        flow.bindings.push(binding);
      }
    }
    if (a.conditions) (a.conditions as Record<string, unknown>[]).forEach((c) => { if (c.actions) extractFlowBindings(c.actions as Record<string, unknown>[], topicSchema, map); });
    if (a.elseActions) extractFlowBindings(a.elseActions as Record<string, unknown>[], topicSchema, map);
    if (a.actions) extractFlowBindings(a.actions as Record<string, unknown>[], topicSchema, map);
  });
}

export function buildComponentMap(parsed: Record<string, unknown> | null): ComponentMap {
  const map: ComponentMap = {};
  if (!parsed) return map;

  const entity = parsed.entity as Record<string, unknown> | undefined;
  map._entity = {
    schemaName: (entity?.schemaName as string) || '',
    cdsBotId: (entity?.cdsBotId as string) || '',
    authenticationMode: (entity?.authenticationMode as string) || '',
    language: (entity?.language as string) || '',
    template: (entity?.template as string) || '',
  };
  if (entity?.configuration) {
    const cfg = entity.configuration as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entityRecord = map._entity as any;
    entityRecord.aiSettings = cfg.aISettings || {};
    entityRecord.settings = cfg.settings || {};
    entityRecord.recognizer = cfg.recognizer || {};
  }

  const components = (parsed.components as Record<string, unknown>[]) || [];
  components.forEach((comp) => {
    const entry: ComponentEntry = {
      kind: (comp.kind as string) || '',
      displayName: (comp.displayName as string) || '',
      description: (comp.description as string) || '',
      schemaName: (comp.schemaName as string) || '',
      id: (comp.id as string) || '',
      state: (comp.state as string) || '',
      triggerQueries: [],
      actions: [],
      inputs: [],
      outputs: [],
      instructions: '',
      modelDescription: '',
      connectedBotSchema: '',
    };

    if (comp.kind === 'GptComponent' && comp.metadata) {
      const meta = comp.metadata as Record<string, unknown>;
      entry.instructions = (meta.instructions as string) || '';
      if (meta.gptCapabilities) entry.gptCapabilities = meta.gptCapabilities as Record<string, boolean>;
      if (meta.aISettings) entry.aiModelSettings = meta.aISettings as Record<string, unknown>;
      map._gptComponent = entry;
    }

    if (comp.kind === 'GlobalVariableComponent') {
      const vt = comp.variableType as Record<string, unknown> | undefined;
      entry.variableType = (vt?.type as string) || 'Unknown';
      entry.scope = (comp.scope as string) || 'Conversation';
    }

    if (comp.dialog) {
      const dlg = comp.dialog as Record<string, unknown>;
      entry.modelDescription = (dlg.modelDescription as string) || '';

      if (dlg.kind === 'TaskDialog' && dlg.action) {
        const act = dlg.action as Record<string, unknown>;
        if (act.kind === 'InvokeConnectedAgentTaskAction') {
          entry.connectedBotSchema = (act.botSchemaName as string) || '';
          entry.invocationType = 'connected';
        } else if (act.kind === 'InvokeExternalAgentTaskAction') {
          entry.connectionReference = (act.connectionReference as string) || '';
          entry.invocationType = 'external';
        }
      }

      if (dlg.inputs) {
        (dlg.inputs as Record<string, unknown>[]).forEach((inp) => {
          entry.inputs.push({
            name: (inp.propertyName as string) || (inp.name as string) || '',
            description: (inp.description as string) || '',
            kind: (inp.kind as string) || '',
            shouldPromptUser: !!inp.shouldPromptUser,
          });
        });
      }
      if (dlg.inputType && (dlg.inputType as Record<string, unknown>).properties) {
        const props = (dlg.inputType as Record<string, unknown>).properties as Record<string, Record<string, unknown>>;
        Object.keys(props).forEach((k) => {
          const p = props[k] as Record<string, unknown>;
          const existing = entry.inputs.find((i) => i.name === k);
          if (existing) {
            existing.type = (p.type as string) || '';
            if (!existing.description) existing.description = (p.description as string) || '';
          } else {
            entry.inputs.push({ name: k, type: (p.type as string) || '', description: (p.description as string) || '' });
          }
        });
      }
      if (dlg.outputType && (dlg.outputType as Record<string, unknown>).properties) {
        const props = (dlg.outputType as Record<string, unknown>).properties as Record<string, Record<string, unknown>>;
        Object.keys(props).forEach((k) => {
          const p = props[k] as Record<string, unknown>;
          entry.outputs.push({ name: k, type: (p.type as string) || '', description: (p.description as string) || '' });
        });
      }

      const bd = dlg.beginDialog as Record<string, unknown> | undefined;
      if (bd) {
        if (bd.intent && (bd.intent as Record<string, unknown>).triggerQueries) {
          entry.triggerQueries = (bd.intent as Record<string, unknown>).triggerQueries as string[];
        }
        if (bd.actions) {
          entry.actions = extractActionSummary(bd.actions as Record<string, unknown>[]);
        }
      }
    }

    if (entry.schemaName) {
      (map as Record<string, unknown>)[entry.schemaName] = entry;
    }
  });

  if (parsed.connectionReferences) map._connectionReferences = parsed.connectionReferences;
  if (parsed.connectorDefinitions) {
    map._connectorDefinitions = (parsed.connectorDefinitions as Record<string, unknown>[]).map((cd) => ({
      displayName: (cd.displayName as string) || '',
      description: ((cd.description as string) || '').substring(0, 200),
      isCustom: !!cd.isCustom,
      operationCount: ((cd.operations as unknown[]) || []).length,
    }));
  }

  const flows = (parsed.flows as Record<string, unknown>[]) || [];
  const flowMap: Record<string, FlowEntry> = {};
  flows.forEach((flow) => {
    const flowEntry: FlowEntry = {
      displayName: (flow.displayName as string) || '',
      workflowId: (flow.workflowId as string) || '',
      isEnabled: flow.isEnabled !== false,
      triggerType: (flow.triggerType as string) || '',
      connectionType: (flow.connectionType as string) || '',
      inputs: {},
      outputs: {},
    };
    if (flow.inputType && (flow.inputType as Record<string, unknown>).properties) {
      const props = ((flow.inputType as Record<string, unknown>).properties) as Record<string, Record<string, unknown>>;
      Object.keys(props).forEach((k) => {
        const p = props[k] as Record<string, unknown>;
        flowEntry.inputs[k] = {
          displayName: (p.displayName as string) || k,
          type: (p.type as string) || 'Unknown',
          description: (p.description as string) || '',
          isRequired: !!(p.isRequired),
        };
      });
    }
    if (flow.outputType && (flow.outputType as Record<string, unknown>).properties) {
      const props = ((flow.outputType as Record<string, unknown>).properties) as Record<string, Record<string, unknown>>;
      Object.keys(props).forEach((k) => {
        const p = props[k] as Record<string, unknown>;
        flowEntry.outputs[k] = {
          displayName: (p.displayName as string) || k,
          type: (p.type as string) || 'Unknown',
          description: (p.description as string) || '',
        };
      });
    }
    flowMap[(flow.workflowId as string)] = flowEntry;
  });
  map._flows = flowMap;

  map._taskDialogFlowMap = {};
  components.forEach((comp) => {
    if (comp.dialog) {
      const dlg = comp.dialog as Record<string, unknown>;
      if (dlg.kind === 'TaskDialog' && dlg.action) {
        const act = dlg.action as Record<string, unknown>;
        if ((act.kind === 'InvokeFlowTaskAction' || act.kind === 'InvokeFlowAction') && act.flowId) {
          (map._taskDialogFlowMap as Record<string, string>)[(comp.schemaName as string) || ''] = act.flowId as string;
        }
      }
    }
  });

  components.forEach((comp) => {
    if (comp.dialog) {
      const dlg = comp.dialog as Record<string, unknown>;
      const bd = dlg.beginDialog as Record<string, unknown> | undefined;
      if (bd?.actions) {
        extractFlowBindings(bd.actions as Record<string, unknown>[], (comp.schemaName as string) || '', map);
      }
    }
  });

  return map;
}

export function friendlyTopicName(schemaName: string, map: ComponentMap): string {
  if (!schemaName) return '';
  const comp = (map as Record<string, unknown>)[schemaName] as ComponentEntry | undefined;
  if (comp && comp.displayName) return comp.displayName;
  return schemaName.split('.').pop() || schemaName;
}
