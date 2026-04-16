# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-file, zero-dependency SPA (`index.html`, ~6800 lines) that visualizes Copilot Studio conversation traces. No build step, no package manager, no server — open `index.html` directly in a browser.

## Development

**Run locally:** Open `index.html` in any modern browser. No build, no `npm install`.

**Test manually:** Use a `botContent.zip` or `dialog.json` exported from Copilot Studio (Test panel → ⋯ → Save snapshot). The ZIP contains `dialog.json` (trace) and `botContent.yml` (agent definition).

**Browser requirement:** Chrome 80+, Edge 80+, Firefox 113+, Safari 16.4+ (requires `DecompressionStream` API for ZIP extraction).

## Architecture

Everything lives in `index.html` as a single IIFE (`(function() { ... })()`). There are no modules, no imports.

### Sections (in order)

1. **CSS** (lines ~8–1456) — CSS custom properties for dark/light themes, component styles.
2. **HTML body** (lines ~1458–1556) — Static shell: header, upload zone, app layout (trace pane + resize handle + chat pane), panel placeholders.
3. **JavaScript IIFE** (lines ~1557–6795)

### Key outer-scope state variables

| Variable | Purpose |
|---|---|
| `lastLoadedData` | Raw parsed `dialog.json` object |
| `botContentData` | Parsed `botContent.yml` |
| `botComponentMap` | `schemaName → component info` lookup; built by `buildComponentMap()` |
| `isLoading` | Prevents concurrent file loads |
| `searchDebounce` | Timer handle for search debounce; must be cleared in `resetViewer()` |

### Data flow

```
File drop/select
  → handleMultipleFiles()         — routes to single/batch/compare
  → handleFileWithBotContent()    — async; loads ZIP/JSON + optional YML
      → parseZipEntries()         — pure JS ZIP parser (no library)
      → decompressEntry()         — uses browser DecompressionStream API
      → parseYaml()               — custom minimal YAML parser for botContent.yml
      → buildComponentMap()       — transforms YAML into schemaName→info map
      → processDialog()           — main render entry point
```

### Rendering pipeline inside `processDialog()`

1. Builds toolbar, conv-info bar, stats panel
2. Detects errors/warnings → renders error banner
3. Iterates `activities[]` once, building the plan tree:
   - `DynamicPlanReceived` opens a collapsible plan group (`planStack`, `openPlanContainers`)
   - `DynamicPlanFinished` / `DynamicPlanStepFinished(completed)` closes it
   - User messages force-close open plans (iterate `toClose` **backwards** to avoid splice index shift)
4. Each activity → `classifyActivity()` → `buildTitle()` → `buildDetail()` → DOM step element with `step._actRef = act`
5. Renders analysis panels: waterfall, knowledge sources, citation verification, topic flow SVG, variable tracker, tools summary, orchestration timeline, agent definition

### Activity classification

Activity types map via `act.valueType` (for `type === 'event'`) or `act.type` / `act.from.role` (for messages). Key types: `DynamicPlanReceived`, `DynamicPlanStepTriggered`, `DynamicPlanStepBindUpdate`, `DynamicPlanStepFinished`, `DynamicPlanFinished`, `UniversalSearchToolTraceData`, `DialogTracingInfo`, `GenerativeAnswersSupportData`, `AIBuilderTraceData`.

### botContent enrichment

When `botContent.yml` is present, `botComponentMap[schemaName]` provides `displayName`, `triggerQueries`, `actions`, `inputs`, `outputs`, `invocationType` (connected/external/flow). `friendlyTopicName(schemaName)` resolves a raw schema name to its display name throughout the UI.

### Special modes

- **Batch:** Multiple JSON files → `handleBatch()` → `renderBatchDashboard()`. Click a row to drill into that trace.
- **Compare:** Single trace loaded → toolbar Compare button → `enterCompareMode()`. Second file loaded → LCS-based structural diff (`computeDiff()`) + side-by-side panes with synced scroll.
- **Agent isolation:** Filter timeline to show only activities from a specific connected agent.

### resetViewer()

Clears all DOM panels, resets all state variables including `isLoading` and `searchDebounce` (clearTimeout), removes scroll/minimap/keyboard cleanup listeners. Must be kept in sync whenever new persistent state is added.
