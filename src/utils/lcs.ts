import type { Activity } from './types';
import { classifyActivity, buildTitle } from './activityClassifier';

export type DiffKind = 'same' | 'added' | 'removed' | 'changed';

export interface DiffRow {
  kind: DiffKind;
  left: Activity | null;
  right: Activity | null;
  leftIndex: number | null;
  rightIndex: number | null;
}

function getKey(act: Activity): string {
  const cls = classifyActivity(act);
  return cls.cat + ':' + act.valueType + ':' + act.name;
}

export function computeDiff(left: Activity[], right: Activity[]): DiffRow[] {
  // LCS-based diff
  const n = left.length;
  const m = right.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (getKey(left[i - 1]) === getKey(right[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const rows: DiffRow[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && getKey(left[i - 1]) === getKey(right[j - 1])) {
      rows.unshift({ kind: 'same', left: left[i - 1], right: right[j - 1], leftIndex: i - 1, rightIndex: j - 1 });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rows.unshift({ kind: 'added', left: null, right: right[j - 1], leftIndex: null, rightIndex: j - 1 });
      j--;
    } else {
      rows.unshift({ kind: 'removed', left: left[i - 1], right: null, leftIndex: i - 1, rightIndex: null });
      i--;
    }
  }

  return rows;
}
