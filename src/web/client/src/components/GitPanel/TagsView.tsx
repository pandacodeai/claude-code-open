/**
 * TagsView - Git 标签管理视图
 * 显示 tags 列表，支持创建、删除、推送操作
 */

import { useState } from 'react';
import { useLanguage } from '../../i18n';
import { GitTag } from './index';

interface TagsViewProps {
  tags: GitTag[];
  send: (msg: any) => void;
  projectPath?: string;
}

export function TagsView({ tags, send, projectPath }: TagsViewProps) {
  const { t } = useLanguage();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagType, setTagType] = useState<'lightweight' | 'annotated'>('lightweight');
  const [tagMessage, setTagMessage] = useState('');

  // 创建 tag
  const handleCreateTag = () => {
    if (!projectPath) return;
    
    const name = tagName.trim();
    if (!name) return;

    // 如果是 annotated 类型，message 必填
    if (tagType === 'annotated' && !tagMessage.trim()) {
      return;
    }

    send({
      type: 'git:create_tag',
      payload: {
        projectPath,
        name,
        type: tagType,
        message: tagType === 'annotated' ? tagMessage.trim() : undefined,
      },
    });

    // 重置对话框
    setTagName('');
    setTagMessage('');
    setTagType('lightweight');
    setShowCreateDialog(false);
  };

  // 删除 tag
  const handleDeleteTag = (name: string) => {
    if (!projectPath) return;
    
    // 使用 t() 函数处理带插值的翻译
    const confirmMessage = t('git.confirmDeleteTag').replace('{{tag}}', name);
    if (window.confirm(confirmMessage)) {
      send({
        type: 'git:delete_tag',
        payload: { projectPath, name },
      });
    }
  };

  // 推送单个 tag
  const handlePushTag = (name: string) => {
    if (!projectPath) return;
    send({
      type: 'git:push_tags',
      payload: { projectPath, tags: [name] },
    });
  };

  // 推送所有 tags
  const handlePushAllTags = () => {
    if (!projectPath) return;
    send({
      type: 'git:push_tags',
      payload: { projectPath },
    });
  };

  return (
    <div className="git-tags-view">
      {/* 顶部操作栏 */}
      <div className="git-tags-header">
        <button className="git-new-tag-button" onClick={() => setShowCreateDialog(true)}>
          + {t('git.newTag')}
        </button>
        <button
          className="git-push-all-tags-button"
          onClick={handlePushAllTags}
          disabled={tags.length === 0}
        >
          {t('git.pushAllTags')}
        </button>
      </div>

      {/* 创建 Tag 对话框 */}
      {showCreateDialog && (
        <div className="git-input-dialog">
          <div className="git-input-dialog-content">
            <div className="git-input-dialog-header">
              <h3>{t('git.newTag')}</h3>
              <button
                className="git-input-dialog-close"
                onClick={() => {
                  setShowCreateDialog(false);
                  setTagName('');
                  setTagMessage('');
                  setTagType('lightweight');
                }}
              >
                ✕
              </button>
            </div>

            {/* Tag 名称输入 */}
            <input
              type="text"
              className="git-input-dialog-input"
              placeholder={t('git.tagName')}
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              autoFocus
            />

            {/* Tag 类型选择 */}
            <div className="git-tag-type-selector">
              <label className="git-tag-type-label">{t('git.tagType')}:</label>
              <div className="git-tag-type-options">
                <label className="git-tag-type-option">
                  <input
                    type="radio"
                    name="tagType"
                    value="lightweight"
                    checked={tagType === 'lightweight'}
                    onChange={(e) => setTagType(e.target.value as 'lightweight')}
                  />
                  <span>{t('git.tagLightweight')}</span>
                </label>
                <label className="git-tag-type-option">
                  <input
                    type="radio"
                    name="tagType"
                    value="annotated"
                    checked={tagType === 'annotated'}
                    onChange={(e) => setTagType(e.target.value as 'annotated')}
                  />
                  <span>{t('git.tagAnnotated')}</span>
                </label>
              </div>
            </div>

            {/* Tag Message 输入（仅 annotated 类型显示） */}
            {tagType === 'annotated' && (
              <textarea
                className="git-input-dialog-textarea"
                placeholder={t('git.tagMessage')}
                value={tagMessage}
                onChange={(e) => setTagMessage(e.target.value)}
                rows={3}
              />
            )}

            <div className="git-input-dialog-actions">
              <button
                className="git-input-dialog-cancel"
                onClick={() => {
                  setShowCreateDialog(false);
                  setTagName('');
                  setTagMessage('');
                  setTagType('lightweight');
                }}
              >
                {t('git.cancel')}
              </button>
              <button
                className="git-input-dialog-confirm"
                onClick={handleCreateTag}
                disabled={!tagName.trim() || (tagType === 'annotated' && !tagMessage.trim())}
              >
                {t('git.newTag')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags 列表 */}
      {tags.length === 0 ? (
        <div className="git-empty-state">
          {t('git.noTags')}
        </div>
      ) : (
        <div className="git-tag-list">
          {tags.map((tag) => (
            <div key={tag.name} className="git-tag-item">
              <div className="git-tag-info">
                <div className="git-tag-name-row">
                  <span className="git-tag-name">{tag.name}</span>
                  <span className="git-tag-type-badge">
                    {tag.type === 'annotated' ? t('git.tagAnnotated') : t('git.tagLightweight')}
                  </span>
                </div>
                <div className="git-tag-commit">
                  <span className="git-tag-commit-hash">{tag.commit.substring(0, 7)}</span>
                </div>
                {tag.message && (
                  <div className="git-tag-message">{tag.message}</div>
                )}
              </div>
              <div className="git-tag-actions">
                <button
                  onClick={() => handlePushTag(tag.name)}
                  title={t('git.pushTag')}
                >
                  {t('git.pushTag')}
                </button>
                <button
                  onClick={() => handleDeleteTag(tag.name)}
                  title={t('git.delete')}
                >
                  {t('git.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
