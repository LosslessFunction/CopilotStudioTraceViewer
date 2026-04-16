import React, { useState } from 'react';
import type { Issue } from '../utils/types';

interface ErrorBannerProps {
  issues: Issue[];
  onJumpTo: (index: number) => void;
}

export default function ErrorBanner({ issues, onJumpTo }: ErrorBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (issues.length === 0) return null;

  const errorCount = issues.filter(i => i.type === 'error').length;
  const cancelCount = issues.filter(i => i.type === 'cancelled').length;

  return (
    <div className="border border-red-700/50 bg-red-950/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 transition-colors"
      >
        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm font-semibold text-red-300 flex-1 text-left">
          {issues.length} issue{issues.length > 1 ? 's' : ''} detected
        </span>
        <div className="flex gap-2 text-xs">
          {errorCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/50">{errorCount} error{errorCount > 1 ? 's' : ''}</span>
          )}
          {cancelCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-yellow-900/60 text-yellow-300 border border-yellow-700/50">{cancelCount} cancelled</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-red-700/30 px-4 py-3 space-y-2">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`flex-shrink-0 mt-0.5 ${
                issue.type === 'error' ? 'text-red-400' :
                issue.type === 'cancelled' ? 'text-yellow-400' :
                'text-orange-400'
              }`}>
                {issue.type === 'error' ? '✕' : issue.type === 'cancelled' ? '⊘' : '⚠'}
              </span>
              <span className="flex-1 text-gray-300">{issue.title}</span>
              <button
                onClick={() => onJumpTo(issue.stepIndex)}
                className="flex-shrink-0 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Jump →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
