import React, { useState, useMemo, useRef, useCallback } from 'react';
import type { DialogData, Activity } from '../utils/types';
import { classifyActivity, buildTitle, formatTime, getTs } from '../utils/activityClassifier';
import { computeDiff } from '../utils/lcs';

interface CompareViewProps {
  data: [DialogData, DialogData];
  names: [string, string];
  onClose: () => void;
}

const BADGE_STYLES: Record<string, string> = {
  'badge-user': 'bg-violet-900/60 text-violet-200',
  'badge-bot': 'bg-emerald-900/60 text-emerald-200',
  'badge-plan': 'bg-blue-900/60 text-blue-200',
  'badge-thought': 'bg-purple-900/60 text-purple-200',
  'badge-tool': 'bg-amber-900/60 text-amber-200',
  'badge-search': 'bg-cyan-900/60 text-cyan-200',
  'badge-typing': 'bg-gray-700/60 text-gray-200',
  'badge-info': 'bg-gray-800/60 text-gray-300',
};

const DIFF_COLORS: Record<string, string> = {
  same: '',
  added: 'bg-emerald-900/20 border-l-2 border-emerald-600',
  removed: 'bg-red-900/20 border-l-2 border-red-600',
  changed: 'bg-amber-900/20 border-l-2 border-amber-600',
};

function ActivityCell({ act, index, kind }: { act: Activity | null; index: number | null; kind: string }) {
  if (!act) {
    return <div className="h-10 bg-gray-900/30 rounded" />;
  }
  const activity = act;
  const cls = classifyActivity(activity);
  const title = buildTitle(activity, cls, {});
  const ts = getTs(activity);
  const time = formatTime(ts);

  return (
    <div className={`px-3 py-2 rounded ${DIFF_COLORS[kind]}`}>
      <div className="flex items-center gap-2">
        {index !== null && <span className="text-xs text-gray-600 w-5">{index + 1}</span>}
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${BADGE_STYLES[cls.badgeCls] || BADGE_STYLES['badge-info']}`}>
          {cls.badge}
        </span>
        <span className="text-sm text-gray-200 truncate flex-1">{title}</span>
        {time && <span className="text-xs text-gray-600 flex-shrink-0">{time}</span>}
      </div>
    </div>
  );
}

export default function CompareView({ data, names, onClose }: CompareViewProps) {
  const [showSameRows, setShowSameRows] = useState(true);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const diff = useMemo(() => {
    return computeDiff(data[0].activities, data[1].activities);
  }, [data]);

  const filteredDiff = showSameRows ? diff : diff.filter(r => r.kind !== 'same');

  const stats = useMemo(() => {
    const same = diff.filter(r => r.kind === 'same').length;
    const added = diff.filter(r => r.kind === 'added').length;
    const removed = diff.filter(r => r.kind === 'removed').length;
    return { same, added, removed, total: diff.length };
  }, [diff]);

  // Sync scroll between panes
  const handleLeftScroll = useCallback(() => {
    if (syncingRef.current || !rightScrollRef.current || !leftScrollRef.current) return;
    syncingRef.current = true;
    rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    syncingRef.current = false;
  }, []);

  const handleRightScroll = useCallback(() => {
    if (syncingRef.current || !leftScrollRef.current || !rightScrollRef.current) return;
    syncingRef.current = true;
    leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    syncingRef.current = false;
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-700/50 bg-gray-900/60 flex-shrink-0">
        <h2 className="text-base font-bold text-white">Compare View</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            {stats.same} same
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            +{stats.added} added
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            -{stats.removed} removed
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showSameRows}
              onChange={e => setShowSameRows(e.target.checked)}
              className="rounded"
            />
            Show identical
          </label>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700/50 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex flex-shrink-0 border-b border-gray-700/50">
        <div className="flex-1 px-4 py-2 border-r border-gray-700/50">
          <span className="text-xs font-semibold text-gray-400 truncate">{names[0]}</span>
          <span className="text-xs text-gray-600 ml-2">({data[0].activities.length} events)</span>
        </div>
        <div className="flex-1 px-4 py-2">
          <span className="text-xs font-semibold text-gray-400 truncate">{names[1]}</span>
          <span className="text-xs text-gray-600 ml-2">({data[1].activities.length} events)</span>
        </div>
      </div>

      {/* Diff rows */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={leftScrollRef} onScroll={handleLeftScroll} className="flex-1 overflow-y-auto border-r border-gray-700/50 p-2 space-y-1">
          {filteredDiff.map((row, i) => (
            <div key={i} className={row.kind === 'added' ? 'opacity-20' : ''}>
              <ActivityCell act={row.left} index={row.leftIndex} kind={row.kind === 'added' ? 'same' : row.kind} />
            </div>
          ))}
        </div>
        <div ref={rightScrollRef} onScroll={handleRightScroll} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDiff.map((row, i) => (
            <div key={i} className={row.kind === 'removed' ? 'opacity-20' : ''}>
              <ActivityCell act={row.right} index={row.rightIndex} kind={row.kind === 'removed' ? 'same' : row.kind} />
            </div>
          ))}
        </div>
      </div>

      {filteredDiff.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-8">
          {diff.length === 0 ? 'Both traces are identical' : 'No differences — enable "Show identical" to see all rows'}
        </div>
      )}
    </div>
  );
}
