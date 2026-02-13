/**
 * Side-by-side diff 行数据
 */
export interface DiffRow {
  left: { text: string; type: 'unchanged' | 'removed' } | null;
  right: { text: string; type: 'unchanged' | 'added' } | null;
}

/**
 * 基于 LCS 的 side-by-side diff 算法
 * 将 old/new 行对齐为左右两列
 */
export function computeSideBySideDiff(oldLines: string[], newLines: string[]): DiffRow[] {
  const m = oldLines.length;
  const n = newLines.length;

  // 构建 LCS DP 表
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯构建 diff 行（倒序入栈）
  const stack: DiffRow[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({
        left: { text: oldLines[i - 1], type: 'unchanged' },
        right: { text: newLines[j - 1], type: 'unchanged' },
      });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        left: null,
        right: { text: newLines[j - 1], type: 'added' },
      });
      j--;
    } else {
      stack.push({
        left: { text: oldLines[i - 1], type: 'removed' },
        right: null,
      });
      i--;
    }
  }

  return stack.reverse();
}
