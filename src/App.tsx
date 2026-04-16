import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import TraceViewer from './components/TraceViewer';
import BatchDashboard from './components/BatchDashboard';
import CompareView from './components/CompareView';
import type { DialogData, ComponentMap, BatchResult } from './utils/types';

export type AppMode = 'home' | 'viewer' | 'batch' | 'compare';

export interface AppState {
  mode: AppMode;
  dialogData: DialogData | null;
  botComponentMap: ComponentMap;
  fileName: string;
  isLoading: boolean;
  batchResults: BatchResult[];
  compareData: [DialogData, DialogData] | null;
  compareNames: [string, string];
  theme: 'dark' | 'light';
}

export default function App() {
  const [state, setState] = useState<AppState>({
    mode: 'home',
    dialogData: null,
    botComponentMap: {},
    fileName: '',
    isLoading: false,
    batchResults: [],
    compareData: null,
    compareNames: ['', ''],
    theme: 'dark',
  });

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('csviewer-theme') as 'dark' | 'light' | null;
    const initial = saved || 'dark';
    setState(s => ({ ...s, theme: initial }));
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setState(s => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('csviewer-theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { ...s, theme: next };
    });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(s => ({ ...s, isLoading }));
  }, []);

  const loadTraceFile = useCallback((
    dialogData: DialogData,
    botComponentMap: ComponentMap,
    fileName: string
  ) => {
    setState(s => ({
      ...s,
      mode: 'viewer',
      dialogData,
      botComponentMap,
      fileName,
      isLoading: false,
    }));
  }, []);

  const loadBatchResults = useCallback((results: BatchResult[]) => {
    setState(s => ({
      ...s,
      mode: 'batch',
      batchResults: results,
      isLoading: false,
    }));
  }, []);

  const startCompare = useCallback((
    data: [DialogData, DialogData],
    names: [string, string]
  ) => {
    setState(s => ({
      ...s,
      mode: 'compare',
      compareData: data,
      compareNames: names,
    }));
  }, []);

  const goHome = useCallback(() => {
    setState(s => ({ ...s, mode: 'home', dialogData: null, fileName: '' }));
  }, []);

  const goToViewer = useCallback(() => {
    setState(s => ({ ...s, mode: 'viewer' }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 dark:bg-gray-950 text-gray-100 flex flex-col">
      <Header
        theme={state.theme}
        onToggleTheme={toggleTheme}
        mode={state.mode}
        onHome={goHome}
      />
      <main className="flex-1 flex flex-col">
        {state.mode === 'home' && (
          <UploadZone
            onLoad={loadTraceFile}
            onBatch={loadBatchResults}
            onLoading={setLoading}
            isLoading={state.isLoading}
          />
        )}
        {state.mode === 'viewer' && state.dialogData && (
          <TraceViewer
            dialogData={state.dialogData}
            botComponentMap={state.botComponentMap}
            fileName={state.fileName}
            onHome={goHome}
            onCompare={startCompare}
          />
        )}
        {state.mode === 'batch' && (
          <BatchDashboard
            results={state.batchResults}
            onOpen={(result) => {
              if (result.dialogData) {
                loadTraceFile(result.dialogData, result.componentMap || {}, result.fileName);
              }
            }}
            onHome={goHome}
          />
        )}
        {state.mode === 'compare' && state.compareData && (
          <CompareView
            data={state.compareData}
            names={state.compareNames}
            onClose={goToViewer}
          />
        )}
      </main>
    </div>
  );
}
