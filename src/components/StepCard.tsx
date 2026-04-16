import React, { useState, useRef, useCallback } from 'react';
import type { Activity, ComponentMap, ActivityClass } from '../utils/types';
import { classifyActivity, buildTitle, formatTime, getTs } from '../utils/activityClassifier';
import { buildDetail } from '../utils/detailBuilder';

const BADGE_STYLES: Record<string, string> = {
  'badge-user': 'bg-violet-800/80 text-violet-200 border-violet-600/50',
  'badge-bot': 'bg-emerald-900/80 text-emerald-200 border-emerald-700/50',
  'badge-plan': 'bg-blue-900/80 text-blue-200 border-blue-700/50',
  'badge-thought': 'bg-purple-900/80 text-purple-200 border-purple-700/50',
  'badge-tool': 'bg-amber-900/80 text-amber-200 border-amber-700/50',
  'badge-search': 'bg-cyan-900/80 text-cyan-200 border-cyan-700/50',
  'badge-typing': 'bg-gray-700/80 text-gray-200 border-gray-600/50',
  'badge-info': 'bg-gray-800/80 text-gray-300 border-gray-700/50',
};

const LEFT_BORDER: Record<string, string> = {
  'user-message': 'border-l-violet-500',
  'bot-message': 'border-l-emerald-500',
  'plan': 'border-l-blue-500',
  'thought': 'border-l-purple-500',
  'tool': 'border-l-amber-500',
  'search': 'border-l-cyan-500',
  'typing': 'border-l-gray-500',
  'info': 'border-l-gray-600',
};

interface StepCardProps {
  act: Activity;
  index: number;
  componentMap: ComponentMap;
  isExpanded: boolean;
  onToggle: () => void;
  isHighlighted?: boolean;
  searchTerm?: string;
  depth?: number;
  onDoubleClick?: (index: number) => void;
}

function highlight(text: string, term: string): string {
  if (!term) return text;
  try {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return text.replace(re, m => `<mark class="search-highlight">${m}</mark>`);
  } catch {
    return text;
  }
}

export default function StepCard({
  act,
  index,
  componentMap,
  isExpanded,
  onToggle,
  isHighlighted = false,
  searchTerm = '',
  depth = 0,
  onDoubleClick,
}: StepCardProps) {
  const cls = classifyActivity(act);
  const title = buildTitle(act, cls, componentMap);
  const ts = getTs(act);
  const time = formatTime(ts);
  const badgeStyle = BADGE_STYLES[cls.badgeCls] || BADGE_STYLES['badge-info'];
  const borderStyle = LEFT_BORDER[cls.cat] || 'border-l-gray-600';
  const [copied, setCopied] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [title]);

  const handleCopyJson = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(JSON.stringify(act, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [act]);

  const vt = act.valueType || '';
  const isError = vt === 'DynamicPlanStepFinished' && (() => {
    const v = (act.value || {}) as Record<string, unknown>;
    const state = (v.state as string) || '';
    return state === 'failed' || state === 'error' || state === 'faulted';
  })();

  const marginLeft = depth > 0 ? `${depth * 12}px` : undefined;

  return (
    <div
      id={`step-${index}`}
      style={{ marginLeft }}
      className={`
        border border-gray-700/50 border-l-2 ${borderStyle} rounded-lg mb-1.5 overflow-hidden
        transition-all duration-150 cursor-pointer select-none
        ${isHighlighted
          ? 'ring-2 ring-yellow-400/60 bg-yellow-400/5'
          : 'bg-gray-900/60 hover:bg-gray-800/60'
        }
        ${isError ? 'border-red-700/60 border-l-red-500' : ''}
      `}
      onClick={onToggle}
      onDoubleClick={() => onDoubleClick?.(index)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 min-h-[36px]">
        <span className="text-gray-500 text-xs w-6 flex-shrink-0 text-right">{index + 1}</span>
        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 uppercase tracking-wider ${badgeStyle}`}>
          {cls.badge}
        </span>
        <span
          className="flex-1 text-sm text-gray-200 truncate"
          dangerouslySetInnerHTML={{ __html: searchTerm ? highlight(title, searchTerm) : title }}
        />
        {time && <span className="text-xs text-gray-600 flex-shrink-0">{time}</span>}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
            title="Copy title"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleCopyJson}
            className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors text-[9px] font-mono leading-none"
            title="Copy raw JSON"
          >
            { }
          </button>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-600 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Detail */}
      {isExpanded && (
        <div
          ref={detailRef}
          className="border-t border-gray-700/50 px-3 py-3 text-sm"
          dangerouslySetInnerHTML={{ __html: buildDetail(act, cls, componentMap) }}
          onClick={e => e.stopPropagation()}
        />
      )}
    </div>
  );
}
