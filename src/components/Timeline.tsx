import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Activity, ComponentMap } from '../utils/types';
import { classifyActivity } from '../utils/activityClassifier';
import StepCard from './StepCard';
import FilterBar, { CategoryFilter } from './FilterBar';

interface TimelineProps {
  activities: Activity[];
  componentMap: ComponentMap;
  searchTerm: string;
  useRegex: boolean;
  expandAll: boolean;
  highlightIndex?: number | null;
  onCrossLink?: (index: number) => void;
}

function activityMatchesSearch(act: Activity, componentMap: ComponentMap, term: string, useRegex: boolean): boolean {
  if (!term) return true;
  try {
    const re = useRegex
      ? new RegExp(term, 'i')
      : new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const searchable = [
      act.type || '',
      act.valueType || '',
      act.text || '',
      act.name || '',
      JSON.stringify(act.value || {}),
    ].join(' ');
    return re.test(searchable);
  } catch {
    return false;
  }
}

function detectConnectedAgent(activities: Activity[]): boolean {
  return activities.some(a => a.valueType === 'ConnectedAgentInitializeTraceData' || a.valueType === 'ConnectedAgentResponseTraceData');
}

export default function Timeline({
  activities,
  componentMap,
  searchTerm,
  useRegex,
  expandAll,
  highlightIndex,
  onCrossLink,
}: TimelineProps) {
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());
  const [activeFilters, setActiveFilters] = useState<CategoryFilter>(() => {
    return new Set(['user-message', 'bot-message', 'plan', 'thought', 'tool', 'search', 'typing', 'info']);
  });
  const [agentFilter, setAgentFilter] = useState<'all' | 'parent' | 'child'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const hasConnectedAgent = detectConnectedAgent(activities);

  // Sync expandAll prop
  useEffect(() => {
    if (expandAll) {
      setExpandedSet(new Set(activities.map((_, i) => i)));
    } else {
      setExpandedSet(new Set());
    }
  }, [expandAll, activities]);

  // Scroll to highlighted
  useEffect(() => {
    if (highlightIndex != null && containerRef.current) {
      const el = document.getElementById(`step-${highlightIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightIndex]);

  const toggleExpand = useCallback((idx: number) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // Connected agent tracking
  const connectedAgentRanges: [number, number][] = [];
  if (hasConnectedAgent) {
    let start = -1;
    for (let i = 0; i < activities.length; i++) {
      const vt = activities[i].valueType || '';
      if (vt === 'ConnectedAgentInitializeTraceData') start = i;
      else if (vt === 'ConnectedAgentResponseTraceData' && start >= 0) {
        connectedAgentRanges.push([start, i]);
        start = -1;
      }
    }
  }

  const isChildAgent = (index: number) => {
    return connectedAgentRanges.some(([s, e]) => index > s && index < e);
  };

  const filteredActivities = activities.map((act, i) => ({ act, i })).filter(({ act, i }) => {
    const cls = classifyActivity(act);
    if (!activeFilters.has(cls.cat)) return false;
    if (agentFilter === 'child' && !isChildAgent(i)) return false;
    if (agentFilter === 'parent' && isChildAgent(i)) return false;
    if (searchTerm && !activityMatchesSearch(act, componentMap, searchTerm, useRegex)) return false;
    return true;
  });

  // Compute depth for indentation
  const getDepth = (index: number): number => {
    let depth = 0;
    for (let i = 0; i < index; i++) {
      const vt = activities[i].valueType || '';
      if (vt === 'DynamicPlanReceived' || vt === 'DynamicPlanReceivedDebug') depth++;
      if (vt === 'DynamicPlanFinished' && depth > 0) depth--;
    }
    return Math.max(0, depth);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FilterBar
        activities={activities}
        activeFilters={activeFilters}
        onFilterChange={setActiveFilters}
        agentFilter={agentFilter}
        onAgentFilterChange={setAgentFilter}
        hasConnectedAgent={hasConnectedAgent}
      />
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm gap-2">
            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm ? 'No activities match your search' : 'No activities match the current filter'}
          </div>
        ) : (
          filteredActivities.map(({ act, i }) => (
            <StepCard
              key={i}
              act={act}
              index={i}
              componentMap={componentMap}
              isExpanded={expandedSet.has(i)}
              onToggle={() => toggleExpand(i)}
              isHighlighted={i === highlightIndex}
              searchTerm={searchTerm}
              depth={Math.min(getDepth(i), 4)}
              onDoubleClick={onCrossLink}
            />
          ))
        )}
      </div>
      {filteredActivities.length > 0 && (
        <div className="px-3 py-1.5 border-t border-gray-700/50 text-xs text-gray-600 flex items-center justify-between">
          <span>{filteredActivities.length} of {activities.length} activities</span>
          {searchTerm && <span className="text-yellow-600">{filteredActivities.length} matches</span>}
        </div>
      )}
    </div>
  );
}
