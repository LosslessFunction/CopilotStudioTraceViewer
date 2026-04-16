import React, { useState } from 'react';
import type { BatchResult } from '../utils/types';

interface BatchDashboardProps {
  results: BatchResult[];
  onOpen: (result: BatchResult) => void;
  onHome: () => void;
}

type SortKey = 'name' | 'stepCount' | 'errorCount' | 'userTurns' | 'issueCount';
type SortDir = 'asc' | 'desc';

export default function BatchDashboard({ results, onOpen, onHome }: BatchDashboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = results
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return mult * a.name.localeCompare(b.name);
      const av = a[sortKey] as number || 0;
      const bv = b[sortKey] as number || 0;
      return mult * (av - bv);
    });

  const totalErrors = results.reduce((s, r) => s + (r.errorCount || 0), 0);
  const totalSteps = results.reduce((s, r) => s + (r.stepCount || 0), 0);
  const totalTurns = results.reduce((s, r) => s + (r.userTurns || 0), 0);
  const withErrors = results.filter(r => r.errorCount > 0).length;

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
        sortKey === col ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {label}
      {sortKey === col && (
        <svg className={`w-3 h-3 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Batch Analysis</h2>
          <button onClick={onHome} className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
            ← Load more files
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Files', value: results.length, color: 'text-gray-200' },
            { label: 'Total Steps', value: totalSteps, color: 'text-indigo-300' },
            { label: 'User Turns', value: totalTurns, color: 'text-violet-300' },
            { label: 'Files w/ Errors', value: withErrors, color: withErrors > 0 ? 'text-red-400' : 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 max-w-sm">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by filename…"
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="text-left pb-2 pr-4"><SortBtn col="name" label="File" /></th>
              <th className="text-right pb-2 px-3"><SortBtn col="stepCount" label="Steps" /></th>
              <th className="text-right pb-2 px-3"><SortBtn col="userTurns" label="Turns" /></th>
              <th className="text-right pb-2 px-3"><SortBtn col="issueCount" label="Issues" /></th>
              <th className="text-right pb-2 px-3"><SortBtn col="errorCount" label="Errors" /></th>
              <th className="text-right pb-2 pl-3">Status</th>
              <th className="pb-2 pl-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors cursor-pointer ${
                  r.error ? 'opacity-60' : ''
                }`}
                onClick={() => !r.error && onOpen(r)}
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-gray-200 truncate max-w-[300px]">{r.name}</span>
                  </div>
                  {r.error && <div className="text-xs text-red-400 mt-0.5">{r.error}</div>}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-400">{r.stepCount || 0}</td>
                <td className="py-2.5 px-3 text-right text-gray-400">{r.userTurns || 0}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className={r.issueCount > 0 ? 'text-yellow-400 font-medium' : 'text-gray-600'}>{r.issueCount || 0}</span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className={r.errorCount > 0 ? 'text-red-400 font-medium' : 'text-gray-600'}>{r.errorCount || 0}</span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {r.error ? (
                    <span className="text-xs text-red-400">Error</span>
                  ) : r.hasCancelled ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-300 border border-yellow-700/40">Cancelled</span>
                  ) : r.errorCount > 0 ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/40">Errors</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/40">OK</span>
                  )}
                </td>
                <td className="py-2.5 pl-3">
                  {!r.error && (
                    <button
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      onClick={e => { e.stopPropagation(); onOpen(r); }}
                    >
                      Open →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">No files match your filter</div>
        )}
      </div>
    </div>
  );
}
