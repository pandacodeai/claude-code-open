import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FileArtifact, ArtifactGroup } from '../../hooks/useArtifacts';
import { computeSideBySideDiff } from '../../utils/diffUtils';
import './ArtifactsPanel.css';

interface ArtifactsPanelProps {
  groups: ArtifactGroup[];
  artifacts: FileArtifact[];
  selectedId: string | null;
  selectedArtifact: FileArtifact | null;
  onSelectArtifact: (id: string | null) => void;
  onClose: () => void;
}

function getFileName(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

function getDirPath(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/');
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getLatestToolName(group: ArtifactGroup): string {
  const last = group.artifacts[group.artifacts.length - 1];
  return last?.toolName || 'Edit';
}

function getLatestStatus(group: ArtifactGroup): string {
  const statuses = group.artifacts.map(a => a.status);
  if (statuses.includes('running')) return 'running';
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('pending')) return 'pending';
  return 'completed';
}

/**
 * Diff 详情视图
 */
function DiffDetailView({ artifact }: { artifact: FileArtifact }) {
  const oldLines = (artifact.oldString || '').split('\n');
  const newLines = (artifact.newString || '').split('\n');

  const diffRows = useMemo(
    () => computeSideBySideDiff(oldLines, newLines),
    [artifact.oldString, artifact.newString]
  );

  const removedCount = diffRows.filter(r => r.left && !r.right).length;
  const addedCount = diffRows.filter(r => !r.left && r.right).length;

  return (
    <div className="artifacts-diff">
      <div className="artifacts-diff-header">
        <span style={{ color: 'var(--text-muted)' }}>
          {removedCount + addedCount} changes
        </span>
        <div className="artifacts-diff-stats">
          {removedCount > 0 && <span className="artifacts-diff-stat-removed">-{removedCount}</span>}
          {addedCount > 0 && <span className="artifacts-diff-stat-added">+{addedCount}</span>}
        </div>
      </div>
      <div className="artifacts-diff-table">
        {diffRows.map((row, i) => (
          <div key={i} className="artifacts-diff-row">
            <div className={`artifacts-diff-cell ${
              row.left
                ? (row.left.type === 'removed' ? 'artifacts-diff-cell--removed' : 'artifacts-diff-cell--unchanged')
                : 'artifacts-diff-cell--empty'
            }`}>
              {row.left && (
                <>
                  <span className="artifacts-diff-cell-prefix">
                    {row.left.type === 'removed' ? '\u2212' : '\u00A0'}
                  </span>
                  <span className="artifacts-diff-cell-text">{row.left.text || '\u00A0'}</span>
                </>
              )}
            </div>
            <div className={`artifacts-diff-cell ${
              row.right
                ? (row.right.type === 'added' ? 'artifacts-diff-cell--added' : 'artifacts-diff-cell--unchanged')
                : 'artifacts-diff-cell--empty'
            }`}>
              {row.right && (
                <>
                  <span className="artifacts-diff-cell-prefix">
                    {row.right.type === 'added' ? '+' : '\u00A0'}
                  </span>
                  <span className="artifacts-diff-cell-text">{row.right.text || '\u00A0'}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Write 内容详情视图
 */
function ContentDetailView({ artifact }: { artifact: FileArtifact }) {
  const lines = (artifact.content || '').split('\n');
  return (
    <div className="artifacts-content-view">
      <div className="artifacts-content-header">
        <span>{lines.length} lines</span>
        <span>Write</span>
      </div>
      <div className="artifacts-content-body">
        <pre>
          {lines.map((line, i) => (
            <div key={i} className="artifacts-content-line">
              <span className="artifacts-content-line-number">{i + 1}</span>
              <span className="artifacts-content-line-text">{line || '\u00A0'}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/**
 * 产物详情 - 大尺寸 overlay 弹窗，方便程序员阅读
 */
function ArtifactDetailOverlay({
  artifact,
  onClose,
}: {
  artifact: FileArtifact;
  onClose: () => void;
}) {
  const toolBadgeClass = artifact.toolName === 'Write'
    ? 'artifacts-detail-tool-badge--write'
    : 'artifacts-detail-tool-badge--edit';

  // Esc 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="artifacts-overlay" onClick={onClose}>
      <div className="artifacts-overlay-content" onClick={e => e.stopPropagation()}>
        <div className="artifacts-overlay-header">
          <div className="artifacts-overlay-file-info">
            <span className={`artifacts-detail-tool-badge ${toolBadgeClass}`}>
              {artifact.toolName}
            </span>
            <span className="artifacts-overlay-filepath">{artifact.filePath}</span>
          </div>
          <button className="artifacts-overlay-close" onClick={onClose} title="Close (Esc)">
            &#215;
          </button>
        </div>
        <div className="artifacts-overlay-body">
          {artifact.toolName === 'Edit' || artifact.toolName === 'MultiEdit' ? (
            <DiffDetailView artifact={artifact} />
          ) : (
            <ContentDetailView artifact={artifact} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Artifacts Panel 主组件
 */
export function ArtifactsPanel({
  groups,
  artifacts,
  selectedId,
  selectedArtifact,
  onSelectArtifact,
  onClose,
}: ArtifactsPanelProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFileExpand = (filePath: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const handleFileClick = (group: ArtifactGroup) => {
    if (group.artifacts.length === 1) {
      // 单个变更，直接打开详情
      onSelectArtifact(group.artifacts[0].id);
    } else {
      // 多个变更，展开/折叠列表
      toggleFileExpand(group.filePath);
    }
  };

  const handleCloseDetail = () => {
    onSelectArtifact(null);
  };

  return (
    <div className="artifacts-panel">
      {/* 选中产物时通过 Portal 弹出大尺寸 overlay 到 body，避免 backdrop-filter 导致的包含块问题 */}
      {selectedArtifact && createPortal(
        <ArtifactDetailOverlay artifact={selectedArtifact} onClose={handleCloseDetail} />,
        document.body
      )}

      <div className="artifacts-panel-header">
        <div className="artifacts-panel-title">
          <span className="artifacts-panel-title-icon">&#9874;</span>
          Artifacts
          {artifacts.length > 0 && (
            <span className="artifacts-panel-badge">{artifacts.length}</span>
          )}
        </div>
        <button className="artifacts-panel-close" onClick={onClose} title="Close panel">
          &#215;
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="artifacts-empty">
          <div className="artifacts-empty-icon">&#128196;</div>
          <div className="artifacts-empty-text">No artifacts yet</div>
        </div>
      ) : (
        <div className="artifacts-file-list">
          {groups.map(group => {
            const fileName = getFileName(group.filePath);
            const dirPath = getDirPath(group.filePath);
            const toolName = getLatestToolName(group);
            const status = getLatestStatus(group);
            const isExpanded = expandedFiles.has(group.filePath);
            const iconClass = toolName === 'Write' ? 'artifacts-file-icon--write' : 'artifacts-file-icon--edit';
            const iconChar = toolName === 'Write' ? '\u2795' : '\u270E';

            return (
              <div key={group.filePath} className="artifacts-file-group">
                <div
                  className="artifacts-file-item"
                  onClick={() => handleFileClick(group)}
                >
                  <div className={`artifacts-file-icon ${iconClass}`}>
                    {iconChar}
                  </div>
                  <div className="artifacts-file-info">
                    <span className="artifacts-file-name">{fileName}</span>
                    {dirPath && <span className="artifacts-file-path">{dirPath}</span>}
                  </div>
                  <div className="artifacts-file-meta">
                    {group.artifacts.length > 1 && (
                      <span className="artifacts-change-count">
                        {group.artifacts.length}
                      </span>
                    )}
                    <span className={`artifacts-status-dot artifacts-status-dot--${status}`} />
                  </div>
                </div>

                {/* 展开的变更子列表 */}
                {isExpanded && group.artifacts.length > 1 && (
                  <div className="artifacts-changes-list">
                    {group.artifacts.map(artifact => {
                      const toolClass = artifact.toolName === 'Write'
                        ? 'artifacts-change-tool--write'
                        : 'artifacts-change-tool--edit';
                      const isSelected = selectedId === artifact.id;

                      return (
                        <div
                          key={artifact.id}
                          className={`artifacts-change-item ${isSelected ? 'artifacts-change-item--selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectArtifact(artifact.id);
                          }}
                        >
                          <span className={`artifacts-change-tool ${toolClass}`}>
                            {artifact.toolName}
                          </span>
                          <span className={`artifacts-status-dot artifacts-status-dot--${artifact.status}`} />
                          <span className="artifacts-change-time">
                            {formatTime(artifact.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
