import React, { useState, useRef } from 'react';

interface ToolbarProps {
  fileName: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onLoadAnother: () => void;
  onExport: () => void;
  onCompare: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  useRegex: boolean;
  onToggleRegex: () => void;
  canCompare: boolean;
}

export default function Toolbar({
  fileName,
  onExpandAll,
  onCollapseAll,
  onLoadAnother,
  onExport,
  onCompare,
  searchTerm,
  onSearchChange,
  useRegex,
  onToggleRegex,
  canCompare,
}: ToolbarProps) {
  const [regexError, setRegexError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (useRegex && val) {
      try { new RegExp(val); setRegexError(false); } catch { setRegexError(true); }
    } else {
      setRegexError(false);
    }
    onSearchChange(val);
  };

  const handleToggleRegex = () => {
    setRegexError(false);
    onToggleRegex();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-700/50 bg-gray-900/60">
      {/* File name */}
      <div className="flex items-center gap-1.5 min-w-0 max-w-[200px]">
        <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs text-gray-400 truncate">{fileName}</span>
      </div>

      <div className="h-4 w-px bg-gray-700/60 hidden sm:block" />

      {/* Expand/Collapse */}
      <div className="flex gap-1">
        <button
          onClick={onExpandAll}
          className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700/50 transition-colors"
          title="Expand all"
        >
          ⊞ All
        </button>
        <button
          onClick={onCollapseAll}
          className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700/50 transition-colors"
          title="Collapse all"
        >
          ⊟ All
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-1 flex-1 max-w-xs">
        <div className={`flex items-center bg-gray-800 border rounded-lg overflow-hidden flex-1 ${regexError ? 'border-red-600' : 'border-gray-700/50'}`}>
          <svg className="w-3.5 h-3.5 text-gray-500 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search activities…"
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 px-2 py-1 outline-none min-w-0"
          />
          {searchTerm && (
            <button
              onClick={() => { onSearchChange(''); setRegexError(false); }}
              className="px-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={handleToggleRegex}
          className={`text-xs px-2 py-1 rounded border transition-colors flex-shrink-0 font-mono ${
            useRegex
              ? 'bg-violet-900/60 text-violet-300 border-violet-700/50'
              : 'bg-gray-800 text-gray-500 border-gray-700/50 hover:border-gray-500'
          }`}
          title="Toggle regex search"
        >
          .*
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {canCompare && (
          <button
            onClick={onCompare}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-700/50 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Compare
          </button>
        )}
        <button
          onClick={onExport}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700/50 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
        <button
          onClick={onLoadAnother}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-800/50 text-violet-300 border border-violet-700/50 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Load
        </button>
      </div>
    </div>
  );
}
