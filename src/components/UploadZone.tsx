import React, { useState, useRef, useCallback, DragEvent } from 'react';
import type { DialogData, ComponentMap, BatchResult } from '../utils/types';
import { processZipFile, processJsonFile, detectFileType, analyzeForBatch } from '../utils/fileProcessor';

interface UploadZoneProps {
  onLoad: (dialogData: DialogData, componentMap: ComponentMap, fileName: string) => void;
  onBatch: (results: BatchResult[]) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function UploadZone({ onLoad, onBatch, onLoading, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    onLoading(true);

    if (files.length === 1) {
      const file = files[0];
      const type = detectFileType(file);
      try {
        if (type === 'zip') {
          const { dialogData, componentMap } = await processZipFile(file);
          onLoad(dialogData, componentMap, file.name);
        } else if (type === 'json') {
          const { dialogData, componentMap } = await processJsonFile(file);
          onLoad(dialogData, componentMap, file.name);
        } else {
          setError('Unsupported file type. Please load a .zip or .json file.');
          onLoading(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load file');
        onLoading(false);
      }
    } else {
      // Batch mode
      const results: BatchResult[] = [];
      for (const file of files) {
        const type = detectFileType(file);
        try {
          if (type === 'zip') {
            const { dialogData, componentMap } = await processZipFile(file);
            const stats = analyzeForBatch(dialogData, componentMap);
            results.push({
              name: file.name,
              fileName: file.name,
              dialogData,
              componentMap,
              acts: dialogData.activities,
              ...stats,
            });
          } else if (type === 'json') {
            const { dialogData } = await processJsonFile(file);
            const stats = analyzeForBatch(dialogData, {});
            results.push({
              name: file.name,
              fileName: file.name,
              dialogData,
              componentMap: {},
              acts: dialogData.activities,
              ...stats,
            });
          } else {
            results.push({
              name: file.name,
              fileName: file.name,
              error: 'Unsupported file type',
              issueCount: 0,
              errorCount: 0,
              stepCount: 0,
              userTurns: 0,
              hasCancelled: false,
            });
          }
        } catch (e) {
          results.push({
            name: file.name,
            fileName: file.name,
            error: e instanceof Error ? e.message : 'Failed to process',
            issueCount: 0,
            errorCount: 0,
            stepCount: 0,
            userTurns: 0,
            hasCancelled: false,
          });
        }
      }
      onBatch(results);
    }
  }, [onLoad, onBatch, onLoading]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    // Reset input so same file can be re-loaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Hero section */}
      <div className="mb-8 text-center max-w-xl">
        <h2 className="text-3xl font-bold text-white mb-3">Analyze Copilot Studio Traces</h2>
        <p className="text-gray-400 text-lg">
          Load conversation trace files exported from Copilot Studio to visualize the orchestration, plan execution, and message flow.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          w-full max-w-2xl border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-200
          flex flex-col items-center gap-4
          ${isDragging
            ? 'border-violet-500 bg-violet-500/10 scale-105'
            : 'border-gray-600 hover:border-violet-500/60 hover:bg-gray-800/50 bg-gray-900/50'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {isLoading ? (
          <>
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300 text-lg font-medium">Processing trace file...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Drop trace files here</p>
              <p className="text-gray-400 mt-1">or click to browse</p>
              <p className="text-gray-500 text-sm mt-2">Supports .zip and .json • Drop multiple files for batch analysis</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.json"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <div className="mt-4 w-full max-w-2xl bg-red-900/30 border border-red-700/50 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Feature cards */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {[
          {
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
            title: 'Plan Orchestration',
            desc: 'Visualize AI plan steps, branches, and execution state',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            ),
            title: 'Chat View',
            desc: 'User/bot messages with rendered markdown and citations',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            title: 'Deep Analytics',
            desc: 'Stats, waterfall timings, knowledge search, and more',
          },
        ].map((card, i) => (
          <div key={i} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-violet-400">{card.icon}</span>
              <h3 className="text-white font-medium text-sm">{card.title}</h3>
            </div>
            <p className="text-gray-500 text-xs">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
