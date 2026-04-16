import React from 'react';
import type { Activity } from '../utils/types';

interface CitationPanelProps {
  activities: Activity[];
}

interface CitationEntry {
  name: string;
  url: string;
  abstract: string;
  actIdx: number;
}

export default function CitationPanel({ activities }: CitationPanelProps) {
  const citations: CitationEntry[] = [];

  activities.forEach((act, i) => {
    const entities = act.entities as Array<{ citation?: Array<{ appearance?: Record<string, string> }> }> | undefined;
    if (!entities) return;
    for (const ent of entities) {
      if (!ent.citation) continue;
      for (const c of ent.citation) {
        const app = c.appearance || {};
        citations.push({
          name: app.name || '(no name)',
          url: app.url || '',
          abstract: app.abstractText || app.abstract || '',
          actIdx: i,
        });
      }
    }
  });

  if (citations.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        No citations found in this conversation.
      </div>
    );
  }

  // Deduplicate by url
  const seen = new Set<string>();
  const unique = citations.filter(c => {
    const key = c.url || c.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{unique.length} unique source{unique.length > 1 ? 's' : ''}</div>
      {unique.map((c, i) => (
        <div key={i} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-900/50 border border-blue-700/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              {c.url ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors block truncate"
                  title={c.url}
                >
                  {c.name}
                </a>
              ) : (
                <div className="text-sm font-medium text-gray-300 truncate">{c.name}</div>
              )}
              {c.url && (
                <div className="text-xs text-gray-600 truncate mt-0.5">{c.url}</div>
              )}
              {c.abstract && (
                <div className="text-xs text-gray-500 mt-1.5 line-clamp-3">{c.abstract}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
