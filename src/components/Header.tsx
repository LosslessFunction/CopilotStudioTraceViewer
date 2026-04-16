import React from 'react';
import type { AppMode } from '../App';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  mode: AppMode;
  onHome: () => void;
}

export default function Header({ theme, onToggleTheme, mode, onHome }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-purple-700/50 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Copilot Studio Trace Viewer</h1>
            <p className="text-xs text-purple-300 dark:text-gray-400 leading-tight">Conversation & orchestration analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode !== 'home' && (
            <button
              onClick={onHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-purple-200 dark:text-gray-300 hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>
          )}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-purple-200 dark:text-gray-300 hover:bg-white/10 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
