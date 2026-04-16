import React, { useRef, useEffect } from 'react';
import type { Activity, ComponentMap } from '../utils/types';
import { isUserMsg, classifyActivity, formatTime, getTs } from '../utils/activityClassifier';
import { simpleMarkdown } from '../utils/markdown';
import { escapeHtml } from '../utils/activityClassifier';

interface ChatPaneProps {
  activities: Activity[];
  componentMap: ComponentMap;
  onCrossLink?: (index: number) => void;
  highlightIndex?: number | null;
}

interface Citation {
  appearance?: {
    name?: string;
    url?: string;
    abstractText?: string;
    abstract?: string;
  };
}

function renderCitations(act: Activity): string {
  const entities = act.entities as Array<{ citation?: Citation[] }> | undefined;
  if (!entities) return '';
  const cits: Citation[] = [];
  for (const ent of entities) {
    if (ent.citation && Array.isArray(ent.citation)) {
      cits.push(...ent.citation);
    }
  }
  if (cits.length === 0) return '';
  let h = '<div class="citations-list" style="margin-top:10px;border-top:1px solid rgba(100,116,139,0.3);padding-top:8px">';
  h += '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px">Sources</div>';
  cits.forEach((c, i) => {
    const app = c.appearance || {};
    const title = app.name || 'Source ' + (i + 1);
    const url = app.url || '';
    const snippet = (app.abstractText || app.abstract || '').substring(0, 200);
    h += '<div style="margin-bottom:6px;font-size:0.78rem">';
    if (url) {
      h += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="color:#60a5fa;font-weight:500">${escapeHtml(title)}</a>`;
    } else {
      h += `<span style="color:#93c5fd;font-weight:500">${escapeHtml(title)}</span>`;
    }
    if (snippet) {
      h += `<div style="color:#94a3b8;margin-top:2px">${escapeHtml(snippet)}${snippet.length >= 200 ? '...' : ''}</div>`;
    }
    h += '</div>';
  });
  h += '</div>';
  return h;
}

export default function ChatPane({ activities, componentMap, onCrossLink, highlightIndex }: ChatPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightIndex != null && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-idx="${highlightIndex}"]`) as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightIndex]);

  const chatActivities = activities.filter(act => {
    const t = act.type;
    return t === 'message' || t === 'typing';
  });

  if (chatActivities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No chat messages found
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {chatActivities.map((act) => {
        const origIndex = activities.indexOf(act);
        const isUser = isUserMsg(act);
        const cls = classifyActivity(act);
        const ts = getTs(act);
        const time = formatTime(ts);
        const isHighlighted = origIndex === highlightIndex;

        if (act.type === 'typing') {
          return (
            <div key={origIndex} className="flex items-center gap-2 text-gray-600 text-xs">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '100ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '200ms' }} />
              </div>
              <span>Typing...</span>
              {time && <span className="text-gray-700">{time}</span>}
            </div>
          );
        }

        const text = (act.text as string) || '';
        const renderedText = text ? simpleMarkdown(text) : '';
        const citations = renderCitations(act);

        return (
          <div
            key={origIndex}
            data-idx={origIndex}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'ring-2 ring-yellow-400/60 rounded-2xl' : ''}`}
          >
            {!isUser && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center mr-2 mt-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2.5 cursor-pointer transition-all hover:brightness-110 ${
                isUser
                  ? 'bg-gradient-to-br from-violet-700 to-indigo-800 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50'
              }`}
              onClick={() => onCrossLink?.(origIndex)}
              title="Click to cross-link to Timeline"
            >
              <div
                className="text-sm leading-relaxed prose-sm"
                style={{ overflowWrap: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: renderedText || '<span class="text-gray-400 italic">(empty)</span>' }}
              />
              {citations && (
                <div dangerouslySetInnerHTML={{ __html: citations }} />
              )}
              <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {time && <span className={`text-[10px] ${isUser ? 'text-violet-300' : 'text-gray-600'}`}>{time}</span>}
              </div>
            </div>
            {isUser && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center ml-2 mt-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
