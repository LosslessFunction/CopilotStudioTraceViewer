import React from 'react';
import type { Activity, ComponentMap } from '../utils/types';
import { classifyActivity } from '../utils/activityClassifier';
import { friendlyTopicName } from '../utils/componentMap';

interface StatsPanelProps {
  activities: Activity[];
  componentMap: ComponentMap;
}

export default function StatsPanel({ activities, componentMap }: StatsPanelProps) {
  const cats: Record<string, number> = {};
  let userTurns = 0;
  let botTurns = 0;
  let planCount = 0;
  let stepCount = 0;
  let errorCount = 0;
  let cancelCount = 0;
  let searchCount = 0;
  let totalMs = 0;
  let timedSteps = 0;

  for (const act of activities) {
    const cls = classifyActivity(act);
    cats[cls.badge] = (cats[cls.badge] || 0) + 1;
    if (cls.cat === 'user-message') userTurns++;
    if (cls.cat === 'bot-message') botTurns++;
    if (cls.cat === 'plan') planCount++;
    const vt = act.valueType || '';
    if (vt === 'DynamicPlanStepFinished') {
      stepCount++;
      const v = (act.value || {}) as Record<string, unknown>;
      const state = (v.state as string) || '';
      if (state === 'failed' || state === 'error' || state === 'faulted') errorCount++;
      const dur = v.durationInMs as number | undefined;
      if (dur && typeof dur === 'number') { totalMs += dur; timedSteps++; }
    }
    if (vt === 'DynamicPlanFinished') {
      const v = (act.value || {}) as Record<string, unknown>;
      if (v.wasCancelled) cancelCount++;
    }
    if (cls.cat === 'search') searchCount++;
  }

  const avgMs = timedSteps > 0 ? Math.round(totalMs / timedSteps) : 0;

  const statCards = [
    { label: 'Total Activities', value: activities.length, color: 'text-gray-200' },
    { label: 'User Turns', value: userTurns, color: 'text-violet-300' },
    { label: 'Bot Responses', value: botTurns, color: 'text-emerald-300' },
    { label: 'Plans', value: planCount, color: 'text-blue-300' },
    { label: 'Steps', value: stepCount, color: 'text-indigo-300' },
    { label: 'Errors', value: errorCount, color: errorCount > 0 ? 'text-red-400' : 'text-gray-500' },
    { label: 'Cancellations', value: cancelCount, color: cancelCount > 0 ? 'text-yellow-400' : 'text-gray-500' },
    { label: 'Searches', value: searchCount, color: 'text-cyan-300' },
  ];

  // Top topics from DynamicPlanStepTriggered
  const topicCounts: Record<string, number> = {};
  for (const act of activities) {
    if (act.valueType === 'DynamicPlanStepTriggered') {
      const v = (act.value || {}) as Record<string, unknown>;
      const id = (v.taskDialogId as string) || '';
      if (id) {
        const name = friendlyTopicName(id, componentMap) || id;
        topicCounts[name] = (topicCounts[name] || 0) + 1;
      }
    }
  }
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="p-4 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {timedSteps > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Step Timing</h3>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Total time:</span>{' '}
              <span className="text-amber-300 font-medium">{(totalMs / 1000).toFixed(2)}s</span>
            </div>
            <div>
              <span className="text-gray-500">Avg/step:</span>{' '}
              <span className="text-amber-300 font-medium">{avgMs}ms</span>
            </div>
            <div>
              <span className="text-gray-500">Timed steps:</span>{' '}
              <span className="text-gray-300 font-medium">{timedSteps}</span>
            </div>
          </div>
        </div>
      )}

      {/* Activity breakdown */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Activity Breakdown</h3>
        <div className="space-y-1.5">
          {Object.entries(cats)
            .sort((a, b) => b[1] - a[1])
            .map(([badge, count]) => (
              <div key={badge} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-36 truncate">{badge}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                    style={{ width: `${Math.round((count / activities.length) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Top topics */}
      {topTopics.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Most Triggered Topics</h3>
          <div className="space-y-1.5">
            {topTopics.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate flex-1 mr-3">{name}</span>
                <span className="text-indigo-400 font-medium flex-shrink-0">{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
