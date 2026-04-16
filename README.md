# Copilot Studio Trace Viewer

A React web application for exploring and analyzing conversation traces exported from [Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/). Upload a `dialog.json` (or its `.zip` archive) and navigate through every step of the conversation to understand what happened and why.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)


## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
npm run preview
```

## How to Export a Conversation Snapshot

Copilot Studio lets you capture a snapshot of a test conversation for offline analysis.

1. Open your agent in [Copilot Studio](https://web.powerva.microsoft.com/).
2. Open the **Test your agent** panel (click **Test** at the top of any page).
3. Have a conversation with your agent.
4. At the top of the test panel, click the **three dots (…)** menu, then select **Save snapshot**.
5. Confirm the prompt — a file named **`botContent.zip`** is downloaded.

The archive contains two files:

| File | Description |
|---|---|
| `dialog.json` | Conversational diagnostics — every activity, plan, tool call, and response in the trace. |
| `botContent.yml` | The agent's topics, entities, variables, and other content definitions. |

You can upload either the `.zip` or the extracted `dialog.json` directly into the Trace Viewer.

> **Note:** The snapshot file may contain sensitive information. Handle it accordingly.
>
> For full details see the [official documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-test-bot?tabs=webApp#save-conversation-snapshots).

## Features

### Core Trace Viewer
- **Upload dialog.json or .zip** — drag-and-drop or click to upload. ZIP files are parsed natively in the browser (no libraries). When a `.zip` contains both `dialog.json` and `botContent.yml`, both are parsed automatically.
- **Activity timeline** — every activity is displayed chronologically with color-coded badges (user message, bot message, plan, thought, tool call, search, info, typing, error).
- **Expandable details** — click any step to expand and see full metadata: timestamps, parameters, observations, raw JSON auto-formatted as key-value pairs.
- **Friendly topic names** — when `botContent.yml` is available, raw schema names (e.g. `copilots_header_5948b.topic.Greeting`) are replaced with human-readable display names throughout the timeline.

### Plan Tree Grouping
- **Hierarchical plan nesting** — `DynamicPlanReceived` events open collapsible plan groups; child plans nest inside parent plans based on `parentPlanIdentifier`.
- **Smart plan closing** — plans close on `DynamicPlanFinished` or when a `DynamicPlanStepFinished` reports `state: "completed"`. User messages force-close any remaining open plans to separate conversation turns.
- **Plan pills** — color-coded labels show which plan each step belongs to, with full ancestry breadcrumbs.
- **Plan status indicators** — each plan group shows its status (running, completed, cancelled, open-ended) and step count.

### Chat Simulation Pane
- **Side-by-side chat view** — a chat panel on the right displays only user and bot messages, styled like a real chat interface.
- **Resizable splitter** — drag the handle between the trace and chat panels to adjust their widths.
- **Cross-linking** — click a chat bubble to scroll the trace to the corresponding step. Double-click a message step in the trace to highlight the chat bubble.
- **Markdown rendering** — bot responses render with headings, lists, bold text, and links.
- **Citation display** — document citations from bot responses appear as clickable links below the message.

### Search & Filtering
- **Category filters** — toggle visibility by activity type (messages, plans, thoughts, tools, search, info, typing, errors).
- **Text search** — full-text search across activity titles and content with match highlighting and result count.
- **Regex mode** — toggle regex search for advanced pattern matching.

### Statistics & Navigation
- **Stats panel** — shows total duration, plan count (completed/cancelled), user turns, bot responses, tool calls, search calls, and the slowest step.
- **Expand / Collapse all** — quickly expand or collapse all plan groups.
- **Duration bars** — visual bars on each step show relative time between consecutive activities.

### Error Handling
- **Error/exception banner** — a prominent banner lists all errors and exceptions found in the trace. Click an error to jump to the corresponding step.
- **Error highlighting** — error and exception activities are visually distinct with red styling.

### Export & Comparison
- **HTML export** — download a self-contained HTML file of the current trace view.
- **Side-by-side comparison** — load two traces to compare them side by side with independent stats, activity counts, and an LCS-based diff summary.
- **Copy to clipboard** — each step has a copy button that copies structured JSON data for that activity.
- **Batch analysis** — upload multiple trace files at once to get aggregate statistics across conversations.

---

### Analysis Panels

Collapsible analysis panels appear below the trace timeline when relevant data is present.

#### Performance Waterfall
A horizontal bar chart showing the timing of every trace activity. Color-coded by category. Hover over any bar to see exact timestamps and duration.

#### Knowledge Sources
Extracts and displays all knowledge retrieval data from `GenerativeAnswersSupportData` activities — search results, verified results, query rewriting, summarization, token usage, and model info.

#### Citation Verification
Maps each citation number to its source document with title, URL, snippet, and verification status.

#### Topic Flow
An SVG flow diagram showing the execution path through the conversation — plan nodes, step nodes, agent handoffs, and dialog tracing actions.

#### Variable Tracker
Tracks how variables are declared, bound, and populated across the conversation. Shows AUTO/MANUAL binding badges and output harvesting from step results.

#### Agent Definition Panel (botContent.yml)
When a `.zip` file contains `botContent.yml`, displays the complete agent configuration: overview, AI settings, instructions, topics table, global variables, and connectors.

---

### Enriched Step Details

When `botContent.yml` is loaded, individual trace steps are enriched with additional context from the agent definition: tool-kind badges (Connected Agent, External Agent, Topic), trigger phrases, authored action flows, AI thought/reasoning, and flow input/output schemas.

## Known Limitations

### Variable Tracker — Connected Agent Topics

When a connected agent invokes a topic, some variables may show as **unset** because `DynamicPlanStepBindUpdate` for connected agent topics can have empty `arguments: {}`. Output variables are still recovered from `DynamicPlanStepFinished.observation`.

## Browser Support

Requires `DecompressionStream` API for ZIP extraction — Chrome 80+, Edge 80+, Firefox 113+, Safari 16.4+.

## License

MIT
