import React, { useState } from 'react';
import type { ComponentMap, ComponentEntry, EntityInfo } from '../utils/types';

interface AgentDefPanelProps {
  componentMap: ComponentMap;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/30 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-300">{title}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="border-t border-gray-700/40 px-4 py-3">{children}</div>}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="flex items-start gap-3 py-1">
      <span className="text-xs text-gray-500 w-32 flex-shrink-0">{k}</span>
      <span className="text-xs text-gray-300 break-all">{v}</span>
    </div>
  );
}

export default function AgentDefPanel({ componentMap }: AgentDefPanelProps) {
  const entity = componentMap._entity as EntityInfo | undefined;
  const gpt = componentMap._gptComponent as ComponentEntry | undefined;
  const flows = componentMap._flows as Record<string, { displayName: string; isEnabled: boolean; triggerType: string }> | undefined;
  const connectors = componentMap._connectorDefinitions as Array<{ displayName: string; description: string; isCustom: boolean; operationCount: number }> | undefined;

  const topics: ComponentEntry[] = [];
  for (const [key, val] of Object.entries(componentMap)) {
    if (key.startsWith('_')) continue;
    const comp = val as ComponentEntry;
    if (comp && comp.kind && comp.kind !== 'GlobalVariableComponent') {
      topics.push(comp);
    }
  }

  if (!entity && !gpt && topics.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        No agent definition loaded. Include a botContent.yml in your ZIP file.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {entity && (
        <Section title="Agent Info">
          <KV k="Schema Name" v={entity.schemaName} />
          <KV k="Language" v={entity.language} />
          <KV k="Auth Mode" v={entity.authenticationMode} />
          <KV k="Template" v={entity.template} />
          <KV k="Bot ID" v={entity.cdsBotId} />
        </Section>
      )}

      {gpt && (
        <Section title="AI Settings">
          {gpt.instructions && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Instructions</div>
              <div className="text-xs text-gray-300 bg-gray-900/60 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {gpt.instructions}
              </div>
            </div>
          )}
          {gpt.gptCapabilities && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Capabilities</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(gpt.gptCapabilities).map(([k, v]) => (
                  <span key={k} className={`text-xs px-2 py-0.5 rounded border ${
                    v ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                      : 'bg-gray-700/50 text-gray-500 border-gray-600/50'
                  }`}>{k}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {topics.length > 0 && (
        <Section title={`Topics & Actions (${topics.length})`}>
          <div className="space-y-2">
            {topics.map((t, i) => (
              <div key={i} className="border border-gray-700/40 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 uppercase text-[10px] font-semibold">{t.kind}</span>
                  <span className="text-sm text-gray-200 font-medium truncate">{t.displayName || t.schemaName}</span>
                </div>
                {t.description && <div className="text-xs text-gray-500 mb-1.5 line-clamp-2">{t.description}</div>}
                {t.triggerQueries && t.triggerQueries.length > 0 && (
                  <div className="mt-1.5">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Triggers</div>
                    <div className="flex flex-wrap gap-1">
                      {t.triggerQueries.slice(0, 4).map((q, qi) => (
                        <span key={qi} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 border border-gray-600/30">{q}</span>
                      ))}
                      {t.triggerQueries.length > 4 && (
                        <span className="text-[10px] text-gray-600">+{t.triggerQueries.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}
                {t.inputs && t.inputs.length > 0 && (
                  <div className="mt-1.5 text-[10px] text-gray-500">
                    Inputs: {t.inputs.map(i => i.name).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {flows && Object.keys(flows).length > 0 && (
        <Section title={`Power Automate Flows (${Object.keys(flows).length})`}>
          <div className="space-y-1.5">
            {Object.entries(flows).map(([id, f]) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.isEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                <span className="text-gray-300 truncate flex-1">{f.displayName || id}</span>
                <span className="text-xs text-gray-600 flex-shrink-0">{f.triggerType}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {connectors && connectors.length > 0 && (
        <Section title={`Connectors (${connectors.length})`}>
          <div className="space-y-1.5">
            {connectors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-gray-300 truncate flex-1">{c.displayName}</span>
                {c.isCustom && <span className="text-xs text-purple-400 flex-shrink-0">custom</span>}
                <span className="text-xs text-gray-600 flex-shrink-0">{c.operationCount} ops</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
