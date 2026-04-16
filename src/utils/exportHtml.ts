import type { Activity, ComponentMap } from './types';
import { classifyActivity, buildTitle, getTs, formatTime } from './activityClassifier';
import { buildDetail } from './detailBuilder';
import { escapeHtml } from './activityClassifier';

export function exportToHtml(activities: Activity[], componentMap: ComponentMap, fileName: string): void {
  const rows = activities.map((act, i) => {
    const cls = classifyActivity(act);
    const title = buildTitle(act, cls, componentMap);
    const ts = getTs(act);
    const time = formatTime(ts);
    const detail = buildDetail(act, cls, componentMap);
    return `
      <div class="activity ${escapeHtml(cls.cat)}" id="act-${i}">
        <div class="act-header">
          <span class="badge ${escapeHtml(cls.badgeCls)}">${escapeHtml(cls.badge)}</span>
          <span class="act-title">${escapeHtml(title)}</span>
          ${time ? `<span class="act-time">${escapeHtml(time)}</span>` : ''}
        </div>
        <div class="act-detail">${detail}</div>
      </div>
    `;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trace Export: ${escapeHtml(fileName)}</title>
<style>
  :root { --bg: #0f0f1a; --card: #1a1a2e; --border: #2d2d44; --text: #e2e8f0; --muted: #64748b; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
  h1 { font-size: 1.4rem; margin-bottom: 16px; color: #a78bfa; }
  .activity { background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
  .act-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--border); }
  .act-title { flex: 1; font-size: 0.9rem; }
  .act-time { color: var(--muted); font-size: 0.8rem; }
  .act-detail { padding: 12px 14px; font-size: 0.85rem; }
  .badge { font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  .badge-user { background: #6d28d9; color: #ede9fe; }
  .badge-bot { background: #065f46; color: #d1fae5; }
  .badge-plan { background: #1e40af; color: #dbeafe; }
  .badge-thought { background: #5b21b6; color: #ede9fe; }
  .badge-tool { background: #92400e; color: #fef3c7; }
  .badge-search { background: #0e7490; color: #cffafe; }
  .badge-typing { background: #374151; color: #d1d5db; }
  .badge-info { background: #1f2937; color: #9ca3af; }
  .detail-section { margin-bottom: 12px; }
  .detail-section h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 4px; }
  .kv-row { display: flex; gap: 8px; margin-bottom: 3px; }
  .kv-key { color: #60a5fa; font-weight: 500; min-width: 120px; font-size: 0.8rem; }
  .kv-val { color: var(--text); font-size: 0.8rem; }
  pre { background: #111827; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 0.78rem; white-space: pre-wrap; }
</style>
</head>
<body>
<h1>Trace Export: ${escapeHtml(fileName)}</h1>
<p style="color:#64748b;margin-bottom:20px;font-size:0.85rem">${activities.length} activities exported</p>
${rows}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/\.[^.]+$/, '') + '_trace_export.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
