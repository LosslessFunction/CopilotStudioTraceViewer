import React, { useMemo } from 'react';
import type { Activity } from '../utils/types';
import { classifyActivity } from '../utils/activityClassifier';

export type CategoryFilter = Set<string>;

const CATEGORIES = [
  { key: 'user-message', label: 'User', cls: 'badge-user' },
  { key: 'bot-message', label: 'Bot', cls: 'badge-bot' },
  { key: 'plan', label: 'Plan', cls: 'badge-plan' },
  { key: 'thought', label: 'Thought', cls: 'badge-thought' },
  { key: 'tool', label: 'Tool', cls: 'badge-tool' },
  { key: 'search', label: 'Search', cls: 'badge-search' },
  { key: 'typing', label: 'Typing', cls: 'badge-typing' },
  { key: 'info', label: 'Info', cls: 'badge-info' },
];

const BADGE_COLORS: Record<string, string> = {
  'badge-user': 'bg-violet-900/60 text-violet-200 border-violet-700/50',
  'badge-bot': 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50',
  'badge-plan': 'bg-blue-900/60 text-blue-200 border-blue-700/50',
  'badge-thought': 'bg-purple-900/60 text-purple-200 border-purple-700/50',
  'badge-tool': 'bg-amber-900/60 text-amber-200 border-amber-700/50',
  'badge-search': 'bg-cyan-900/60 text-cyan-200 border-cyan-700/50',
  'badge-typing': 'bg-gray-700/60 text-gray-200 border-gray-600/50',
  'badge-info': 'bg-gray-800/60 text-gray-300 border-gray-700/50',
};

interface FilterBarProps {
  activities: Activity[];
  activeFilters: CategoryFilter;
  onFilterChange: (filters: CategoryFilter) => void;
  agentFilter: 'all' | 'parent' | 'child';
  onAgentFilterChange: (f: 'all' | 'parent' | 'child') => void;
  hasConnectedAgent: boolean;
}

export default function FilterBar({
  activities,
  activeFilters,
  onFilterChange,
  agentFilter,
  onAgentFilterChange,
  hasConnectedAgent,
}: FilterBarProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) map[cat.key] = 0;
    for (const act of activities) {
      const cls = classifyActivity(act);
      if (cls.cat in map) map[cls.cat]++;
      else map[cls.cat] = (map[cls.cat] || 0) + 1;
    }
    return map;
  }, [activities]);

  const toggleFilter = (key: string) => {
    const next = new Set(activeFilters);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onFilterChange(next);
  };

  const allActive = CATEGORIES.every(c => activeFilters.has(c.key));

  const toggleAll = () => {
    if (allActive) {
      onFilterChange(new Set());
    } else {
      onFilterChange(new Set(CATEGORIES.map(c => c.key)));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-700/50 bg-gray-900/40">
      <button
        onClick={toggleAll}
        className={`text-xs px-2 py-1 rounded border transition-colors ${
          allActive
            ? 'bg-gray-700 text-gray-200 border-gray-600'
            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
        }`}
      >
        {allActive ? 'Hide All' : 'Show All'}
      </button>
      {CATEGORIES.map(cat => {
        const count = counts[cat.key] || 0;
        if (count === 0) return null;
        const isActive = activeFilters.has(cat.key);
        const colorCls = isActive ? BADGE_COLORS[cat.cls] : 'bg-gray-800/50 text-gray-500 border-gray-700/50';
        return (
          <button
            key={cat.key}
            onClick={() => toggleFilter(cat.key)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors ${colorCls}`}
          >
            <span>{cat.label}</span>
            <span className="opacity-70">{count}</span>
          </button>
        );
      })}
      {hasConnectedAgent && (
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Agent:</span>
          {(['all', 'parent', 'child'] as const).map(f => (
            <button
              key={f}
              onClick={() => onAgentFilterChange(f)}
              className={`text-xs px-2 py-1 rounded border transition-colors capitalize ${
                agentFilter === f
                  ? 'bg-indigo-800 text-indigo-200 border-indigo-600'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
