export interface ActivityFrom {
  id?: string;
  name?: string;
  role?: string;
}

export interface ActivityConversation {
  id?: string;
}

export interface Activity {
  id?: string;
  type: string;
  valueType?: string;
  name?: string;
  from?: ActivityFrom;
  text?: string;
  speak?: string;
  value?: Record<string, unknown>;
  timestamp?: string;
  localTimestamp?: string;
  channelId?: string;
  channelData?: Record<string, unknown>;
  conversation?: ActivityConversation;
  entities?: Array<{ citation?: Citation[] }>;
  [key: string]: unknown;
}

export interface Citation {
  appearance?: {
    name?: string;
    url?: string;
    abstractText?: string;
    abstract?: string;
  };
}

export interface DialogData {
  activities: Activity[];
}

export interface ComponentEntry {
  kind: string;
  displayName: string;
  description: string;
  schemaName: string;
  id?: string;
  state?: string;
  triggerQueries: string[];
  actions: ActionSummary[];
  inputs: IOParam[];
  outputs: IOParam[];
  instructions: string;
  modelDescription: string;
  connectedBotSchema: string;
  invocationType?: string;
  connectionReference?: string;
  variableType?: string;
  scope?: string;
  gptCapabilities?: Record<string, boolean>;
  aiModelSettings?: Record<string, unknown>;
}

export interface ActionSummary {
  kind: string;
  text?: string;
  variable?: string;
  prompt?: string;
  entity?: string;
  dialog?: string;
  conditionCount?: number;
  nested?: boolean;
}

export interface IOParam {
  name: string;
  type?: string;
  description?: string;
  kind?: string;
  shouldPromptUser?: boolean;
  propertyName?: string;
  isRequired?: boolean;
  displayName?: string;
}

export interface EntityInfo {
  schemaName: string;
  cdsBotId: string;
  authenticationMode: string;
  language: string;
  template: string;
  aiSettings?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  recognizer?: Record<string, unknown>;
}

export interface FlowEntry {
  displayName: string;
  workflowId: string;
  isEnabled: boolean;
  triggerType: string;
  connectionType: string;
  inputs: Record<string, FlowParam>;
  outputs: Record<string, FlowParam>;
  bindings?: FlowBinding[];
}

export interface FlowParam {
  displayName: string;
  type: string;
  description: string;
  isRequired?: boolean;
}

export interface FlowBinding {
  topic: string;
  inputBindings: Record<string, string>;
  outputBindings: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentMap = Record<string, any>;

export interface ConnectorDef {
  displayName: string;
  description: string;
  isCustom: boolean;
  operationCount: number;
}

export interface ActivityClass {
  cat: string;
  badge: string;
  badgeCls: string;
}

export interface Issue {
  type: 'error' | 'warning' | 'cancelled';
  title: string;
  stepIndex: number;
  activityRef: Activity;
}

export interface BatchResult {
  name: string;
  fileName: string;
  data?: DialogData;
  dialogData?: DialogData;
  acts?: Activity[];
  componentMap?: ComponentMap;
  error?: string;
  issueCount: number;
  errorCount: number;
  stepCount: number;
  userTurns: number;
  hasCancelled: boolean;
}

export interface PlanInfo {
  displayName: string;
  parentPlanId: string | null;
  parentStepId: string | null;
  steps: string[];
  colorIndex: number;
  depth: number;
}

export interface PlanRegistry {
  [planId: string]: PlanInfo;
}
