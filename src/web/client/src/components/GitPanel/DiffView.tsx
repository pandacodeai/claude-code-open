/**
 * DiffView - Git Diff 视图组件
 * 使用 <table> 布局渲染，参考 GitHub diff 实现
 * 支持 unified（统一视图）和 split（分栏视图）两种模式
 */

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n';

interface DiffViewProps {
  diff: string;
  fileName: string;
  onClose: () => void;
}

type DiffMode = 'unified' | 'split';

type DiffLineType = 'added' | 'removed' | 'context' | 'header' | 'hunk';

interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLn?: number;
  newLn?: number;
}

interface SplitRow {
  type: 'pair' | 'header' | 'hunk';
  left?: { type: DiffLineType; content: string; ln?: number };
  right?: { type: DiffLineType; content: string; ln?: number };
  content?: string;
}

function parseDiff(diffText: string) {
  const rawLines = diffText.split('\n');
  const lines: DiffLine[] = [];

  let oldLn = 0;
  let newLn = 0;

  for (const line of rawLines) {
    if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('+++') || line.startsWith('---')) {
      lines.push({ type: 'header', content: line });
      continue;
    }
    if (line.startsWith('@@')) {
      const m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (m) { oldLn = parseInt(m[1], 10); newLn = parseInt(m[2], 10); }
      lines.push({ type: 'hunk', content: line });
      continue;
    }
    if (line.startsWith('+')) {
      lines.push({ type: 'added', content: line, newLn });
      newLn++;
      continue;
    }
    if (line.startsWith('-')) {
      lines.push({ type: 'removed', content: line, oldLn });
      oldLn++;
      continue;
    }
    lines.push({ type: 'context', content: line, oldLn, newLn });
    if (line !== '' || rawLines.indexOf(line) < rawLines.length - 1) {
      oldLn++;
      newLn++;
    }
  }

  // Build split rows
  const splitRows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i];
    if (cur.type === 'header') { splitRows.push({ type: 'header', content: cur.content }); i++; continue; }
    if (cur.type === 'hunk') { splitRows.push({ type: 'hunk', content: cur.content }); i++; continue; }
    if (cur.type === 'context') {
      splitRows.push({ type: 'pair', left: { type: 'context', content: cur.content, ln: cur.oldLn }, right: { type: 'context', content: cur.content, ln: cur.newLn } });
      i++; continue;
    }
    if (cur.type === 'removed') {
      const rm: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'removed') { rm.push(lines[i]); i++; }
      const ad: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'added') { ad.push(lines[i]); i++; }
      const max = Math.max(rm.length, ad.length);
      for (let j = 0; j < max; j++) {
        splitRows.push({
          type: 'pair',
          left: rm[j] ? { type: 'removed', content: rm[j].content, ln: rm[j].oldLn } : undefined,
          right: ad[j] ? { type: 'added', content: ad[j].content, ln: ad[j].newLn } : undefined,
        });
      }
      continue;
    }
    if (cur.type === 'added') {
      splitRows.push({ type: 'pair', left: undefined, right: { type: 'added', content: cur.content, ln: cur.newLn } });
      i++; continue;
    }
    i++;
  }

  return { lines, splitRows };
}

export function DiffView({ diff, fileName, onClose }: DiffViewProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<DiffMode>('unified');
  const parsed = useMemo(() => parseDiff(diff), [diff]);

  if (!diff || diff.trim().length === 0) {
    return (
      <div className="git-diff-view">
        <div className="git-diff-header">
          <span className="git-diff-file-name">{fileName || t('git.diff')}</span>
          <button className="git-diff-close" onClick={onClose} title={t('common.close')}>✕</button>
        </div>
        <div className="git-diff-content">
          <div className="git-empty-state">{t('git.noChanges')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="git-diff-view">
      <div className="git-diff-header">
        <span className="git-diff-file-name">{fileName || t('git.diff')}</span>
        <div className="git-diff-mode-switcher">
          <button className={`git-diff-mode-btn ${mode === 'unified' ? 'active' : ''}`} onClick={() => setMode('unified')}>
            {t('git.unified')}
          </button>
          <button className={`git-diff-mode-btn ${mode === 'split' ? 'active' : ''}`} onClick={() => setMode('split')}>
            {t('git.split')}
          </button>
        </div>
        <button className="git-diff-close" onClick={onClose} title={t('common.close')}>✕</button>
      </div>
      <div className="git-diff-content">
        {mode === 'unified' ? <UnifiedView lines={parsed.lines} /> : <SplitView rows={parsed.splitRows} />}
      </div>
    </div>
  );
}

function UnifiedView({ lines }: { lines: DiffLine[] }) {
  return (
    <table className="diff-table diff-table--unified">
      <colgroup>
        <col className="diff-col-ln" />
        <col className="diff-col-ln" />
        <col className="diff-col-code" />
      </colgroup>
      <tbody>
        {lines.map((line, i) => {
          const cls = `diff-tr diff-tr--${line.type}`;
          if (line.type === 'header' || line.type === 'hunk') {
            return (
              <tr key={i} className={cls}>
                <td className="diff-td-ln"></td>
                <td className="diff-td-ln"></td>
                <td className="diff-td-code"><code>{line.content}</code></td>
              </tr>
            );
          }
          return (
            <tr key={i} className={cls}>
              <td className="diff-td-ln">{line.oldLn ?? ''}</td>
              <td className="diff-td-ln">{line.newLn ?? ''}</td>
              <td className="diff-td-code"><code>{line.content}</code></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SplitView({ rows }: { rows: SplitRow[] }) {
  return (
    <table className="diff-table diff-table--split">
      <colgroup>
        <col className="diff-col-ln" />
        <col className="diff-col-code" />
        <col className="diff-col-divider" />
        <col className="diff-col-ln" />
        <col className="diff-col-code" />
      </colgroup>
      <tbody>
        {rows.map((row, i) => {
          if (row.type === 'header' || row.type === 'hunk') {
            const cls = `diff-tr diff-tr--${row.type}`;
            return (
              <tr key={i} className={cls}>
                <td className="diff-td-ln"></td>
                <td colSpan={3} className="diff-td-code"><code>{row.content}</code></td>
                <td className="diff-td-ln"></td>
              </tr>
            );
          }

          const lt = row.left?.type ?? 'empty';
          const rt = row.right?.type ?? 'empty';

          return (
            <tr key={i} className="diff-tr">
              <td className={`diff-td-ln diff-td--${lt}`}>{row.left?.ln ?? ''}</td>
              <td className={`diff-td-code diff-td--${lt}`}><code>{row.left?.content ?? ''}</code></td>
              <td className="diff-td-divider"></td>
              <td className={`diff-td-ln diff-td--${rt}`}>{row.right?.ln ?? ''}</td>
              <td className={`diff-td-code diff-td--${rt}`}><code>{row.right?.content ?? ''}</code></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
