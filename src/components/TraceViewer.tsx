import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { DialogData, ComponentMap } from '../utils/types';
import Toolbar from './Toolbar';
import Timeline from './Timeline';
import ChatPane from './ChatPane';
import StatsPanel from '../panels/StatsPanel';
import ErrorBanner from '../panels/ErrorBanner';
import WaterfallPanel from '../panels/WaterfallPanel';
import KnowledgePanel from '../panels/KnowledgePanel';
import CitationPanel from '../panels/CitationPanel';
import VariablesPanel from '../panels/VariablesPanel';
import ToolsPanel from '../panels/ToolsPanel';
import OrchPanel from '../panels/OrchPanel';
import AgentDefPanel from '../panels/AgentDefPanel';
import FlowPanel from '../panels/FlowPanel';
import { detectIssues } from '../utils/fileProcessor';
import { exportToHtml } from '../utils/exportHtml';
import { processZipFile, processJsonFile, detectFileType } from '../utils/fileProcessor';
import type { Issue } from '../utils/types';

type PanelTab = 'stats' | 'waterfall' | 'knowledge' | 'citations' | 'variables' | 'tools' | 'orch' | 'agent' | 'flow';

interface TraceViewerProps {
  dialogData: DialogData;
  botComponentMap: ComponentMap;
  fileName: string;
  onHome: () => void;
  onCompare: (data: [DialogData, DialogData], names: [string, string]) => void;
}

const PANEL_TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'stats', label: 'Stats' },
  { id: 'orch', label: 'Orchestration' },
  { id: 'waterfall', label: 'Waterfall' },
  { id: 'tools', label: 'Tools' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'citations', label: 'Citations' },
  { id: 'variables', label: 'Variables' },
  { id: 'agent', label: 'Agent Def' },
  { id: 'flow', label: 'Flow' },
];

export default function TraceViewer({
  dialogData,
  botComponentMap,
  fileName,
  onHome,
  onCompare,
}: TraceViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [splitPos, setSplitPos] = useState(55); // percentage for left pane
  const [chatHighlight, setChatHighlight] = useState<number | null>(null);
  const [timelineHighlight, setTimelineHighlight] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<PanelTab>('stats');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareFile, setCompareFile] = useState<File | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(240);
  const [loadAnotherVisible, setLoadAnotherVisible] = useState(false);

  const issues = detectIssues(dialogData.activities);
  const isDraggingRef = useRef(false);
  const isBottomDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const compareInputRef = useRef<HTMLInputElement>(null);
  const loadAnotherInputRef = useRef<HTMLInputElement>(null);

  // Vertical splitter drag
  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.min(80, Math.max(20, ((ev.clientX - rect.left) / rect.width) * 100));
      setSplitPos(pct);
    };
    const onUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Bottom panel drag
  const handleBottomDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isBottomDragRef.current = true;
    const startY = e.clientY;
    const startH = bottomPanelHeight;

    const onMove = (ev: MouseEvent) => {
      if (!isBottomDragRef.current) return;
      const delta = startY - ev.clientY;
      setBottomPanelHeight(Math.max(120, Math.min(500, startH + delta)));
    };
    const onUp = () => {
      isBottomDragRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [bottomPanelHeight]);

  const handleExport = useCallback(() => {
    exportToHtml(dialogData.activities, botComponentMap, fileName);
  }, [dialogData, botComponentMap, fileName]);

  const handleExpandAll = useCallback(() => {
    setExpandAll(true);
    setTimeout(() => setExpandAll(false), 50);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandAll(false);
  }, []);

  const handleCrossLinkFromTimeline = useCallback((index: number) => {
    setChatHighlight(index);
  }, []);

  const handleCrossLinkFromChat = useCallback((index: number) => {
    setTimelineHighlight(index);
    setTimeout(() => setTimelineHighlight(null), 2000);
  }, []);

  const handleCompareFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = detectFileType(file);
    try {
      let cmpData: DialogData;
      if (type === 'zip') {
        const r = await processZipFile(file);
        cmpData = r.dialogData;
      } else if (type === 'json') {
        const r = await processJsonFile(file);
        cmpData = r.dialogData;
      } else {
        return;
      }
      onCompare([dialogData, cmpData], [fileName, file.name]);
    } catch (e) {
      console.error('Compare file error:', e);
    }
    setShowCompareModal(false);
  }, [dialogData, fileName, onCompare]);

  const handleLoadAnotherChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Redirect to home to pick up new file
    onHome();
  }, [onHome]);

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      <Toolbar
        fileName={fileName}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onLoadAnother={onHome}
        onExport={handleExport}
        onCompare={() => {
          setShowCompareModal(true);
          setTimeout(() => compareInputRef.current?.click(), 50);
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        useRegex={useRegex}
        onToggleRegex={() => setUseRegex(r => !r)}
        canCompare={true}
      />

      {issues.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-700/50">
          <ErrorBanner issues={issues} onJumpTo={(idx) => {
            setTimelineHighlight(idx);
            setTimeout(() => setTimelineHighlight(null), 2500);
          }} />
        </div>
      )}

      {/* Main split panes */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left: Timeline */}
        <div style={{ width: `${splitPos}%` }} className="flex flex-col overflow-hidden border-r border-gray-700/50">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/30 bg-gray-900/40">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</span>
            <span className="text-xs text-gray-600">{dialogData.activities.length} events</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Timeline
              activities={dialogData.activities}
              componentMap={botComponentMap}
              searchTerm={searchTerm}
              useRegex={useRegex}
              expandAll={expandAll}
              highlightIndex={timelineHighlight}
              onCrossLink={handleCrossLinkFromTimeline}
            />
          </div>
        </div>

        {/* Splitter */}
        <div
          onMouseDown={handleSplitterMouseDown}
          className="w-1 bg-gray-800 hover:bg-violet-600/50 cursor-col-resize flex-shrink-0 transition-colors"
        />

        {/* Right: Chat pane */}
        <div style={{ width: `${100 - splitPos}%` }} className="flex flex-col overflow-hidden">
          <div className="flex items-center px-3 py-1.5 border-b border-gray-700/30 bg-gray-900/40">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chat</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPane
              activities={dialogData.activities}
              componentMap={botComponentMap}
              onCrossLink={handleCrossLinkFromChat}
              highlightIndex={chatHighlight}
            />
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      {showBottomPanel && (
        <>
          <div
            onMouseDown={handleBottomDragMouseDown}
            className="h-1 bg-gray-800 hover:bg-violet-600/50 cursor-row-resize flex-shrink-0 transition-colors border-t border-gray-700/50"
          />
          <div style={{ height: bottomPanelHeight }} className="flex flex-col overflow-hidden border-t border-gray-700/50">
            {/* Tab bar */}
            <div className="flex items-center border-b border-gray-700/50 overflow-x-auto flex-shrink-0 bg-gray-900/60">
              {PANEL_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activePanel === tab.id
                      ? 'text-violet-300 border-violet-500'
                      : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => setShowBottomPanel(false)}
                className="ml-auto px-3 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                title="Close panel"
              >
                ✕
              </button>
            </div>
            {/* Panel content */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'stats' && <StatsPanel activities={dialogData.activities} componentMap={botComponentMap} />}
              {activePanel === 'waterfall' && <WaterfallPanel activities={dialogData.activities} componentMap={botComponentMap} />}
              {activePanel === 'knowledge' && <KnowledgePanel activities={dialogData.activities} />}
              {activePanel === 'citations' && <CitationPanel activities={dialogData.activities} />}
              {activePanel === 'variables' && <VariablesPanel activities={dialogData.activities} componentMap={botComponentMap} />}
              {activePanel === 'tools' && <ToolsPanel activities={dialogData.activities} componentMap={botComponentMap} />}
              {activePanel === 'orch' && <OrchPanel activities={dialogData.activities} componentMap={botComponentMap} />}
              {activePanel === 'agent' && <AgentDefPanel componentMap={botComponentMap} />}
              {activePanel === 'flow' && <FlowPanel activities={dialogData.activities} componentMap={botComponentMap} />}
            </div>
          </div>
        </>
      )}

      {!showBottomPanel && (
        <button
          onClick={() => setShowBottomPanel(true)}
          className="flex items-center justify-center gap-1.5 py-1 bg-gray-900/80 border-t border-gray-700/50 text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          Show Analysis Panel
        </button>
      )}

      {/* Hidden file inputs */}
      <input ref={compareInputRef} type="file" accept=".zip,.json" className="hidden" onChange={handleCompareFileChange} />
      <input ref={loadAnotherInputRef} type="file" accept=".zip,.json" className="hidden" onChange={handleLoadAnotherChange} />
    </div>
  );
}
