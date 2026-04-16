import React from 'react';
import type { Activity } from '../utils/types';
import { escapeHtml } from '../utils/activityClassifier';

interface KnowledgePanelProps {
  activities: Activity[];
}

interface SearchResult {
  query?: string;
  title?: string;
  url?: string;
  snippet?: string;
}

export default function KnowledgePanel({ activities }: KnowledgePanelProps) {
  const searches: Array<{ query: string; results: SearchResult[]; actIdx: number }> = [];

  activities.forEach((act, i) => {
    if (act.valueType === 'UniversalSearchToolTraceData') {
      const v = (act.value || {}) as Record<string, unknown>;
      const query = (v.query as string) || (v.searchQuery as string) || '';
      const fullResults = ((v.fullResults as Record<string, unknown>[]) || []);
      const outputSources = ((v.outputKnowledgeSources as Record<string, unknown>[]) || []);
      const allResults: SearchResult[] = [];

      for (const r of fullResults) {
        allResults.push({
          title: (r.title as string) || (r.name as string) || '',
          url: (r.url as string) || (r.link as string) || '',
          snippet: (r.snippet as string) || (r.description as string) || '',
        });
      }
      for (const s of outputSources) {
        const name = (s.name as string) || (s.title as string) || '';
        const url = (s.url as string) || '';
        if (name && !allResults.some(r => r.title === name)) {
          allResults.push({ title: name, url });
        }
      }

      searches.push({ query, results: allResults, actIdx: i });
    }
  });

  if (searches.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        No knowledge search events found in this trace.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {searches.map((s, si) => (
        <div key={si} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-3">
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">Search query</div>
              <div className="text-sm font-medium text-gray-200">{s.query || '(no query)'}</div>
            </div>
            <span className="text-xs text-gray-600">#{s.actIdx + 1}</span>
          </div>
          {s.results.length > 0 ? (
            <div className="space-y-2 mt-3 border-t border-gray-700/40 pt-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{s.results.length} result{s.results.length > 1 ? 's' : ''}</div>
              {s.results.map((r, ri) => (
                <div key={ri} className="border-l-2 border-cyan-700/50 pl-3">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                      {r.title || r.url}
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-cyan-300">{r.title || '(no title)'}</div>
                  )}
                  {r.snippet && (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.snippet}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-600 mt-2">No results returned</div>
          )}
        </div>
      ))}
    </div>
  );
}
