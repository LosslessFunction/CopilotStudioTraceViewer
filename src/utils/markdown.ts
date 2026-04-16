import { escapeHtml } from './activityClassifier';

export function simpleMarkdown(text: string): string {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') text = String(text);
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^  - (.+)$/gm, '<li style="margin-left:16px">$1</li>');
  html = html.replace(/^    - (.+)$/gm, '<li style="margin-left:32px">$1</li>');
  html = html.replace(/((?:<li>\d+\..+?<\/li>\s*)+)/g, '<ol>$1</ol>');
  html = html.replace(/((?:<li>(?!\d+\.).+?<\/li>\s*)+)/g, '<ul>$1</ul>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/citeturn\d+file\d+/g, '');
  return '<div class="rendered-md"><p>' + html + '</p></div>';
}
