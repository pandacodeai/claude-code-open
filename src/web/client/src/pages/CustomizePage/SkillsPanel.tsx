import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import styles from './SkillsPanel.module.css';

interface Skill {
  id: string;
  name: string;
  description: string;
  command?: string;
  enabled: boolean;
}

interface SkillsPanelProps {}

// ========================================
// SkillsPanel 主组件
// ========================================

export default function SkillsPanel({}: SkillsPanelProps) {
  const { t } = useLanguage();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // 尝试获取 skills 数据
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        // 尝试从 API 获取 skills
        const response = await fetch('/api/config/all');
        if (response.ok) {
          const data = await response.json();
          if (data.skills && Array.isArray(data.skills)) {
            const mappedSkills: Skill[] = data.skills.map((s: any, idx: number) => ({
              id: s.id || `skill-${idx}`,
              name: s.name || s.command || 'Unknown Skill',
              description: s.description || '',
              command: s.command,
              enabled: s.enabled !== false,
            }));
            setSkills(mappedSkills);
          }
        }
      } catch (error) {
        console.log('Failed to fetch skills, using empty state:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const handleToggle = (skill: Skill) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skill.id ? { ...s, enabled: !s.enabled } : s))
    );
    if (selectedSkill?.id === skill.id) {
      setSelectedSkill({ ...skill, enabled: !skill.enabled });
    }
  };

  return (
    <div className={styles.skillsPanel}>
      {/* 中栏：Skills 列表 */}
      <div className={styles.middleColumn}>
        <div className={styles.middleHeader}>
          <h2 className={styles.middleTitle}>{t('customize.skills')}</h2>
          <div className={styles.middleActions}>
            <button className={styles.searchButton} title={t('customize.search')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.middleContent}>
          {loading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : skills.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l1.5 4.5H18l-3.5 2.5 1.5 4.5L12 11l-3.5 2.5 1.5-4.5L6 6.5h4.5z" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>{t('customize.noSkills')}</p>
              <p className={styles.emptyHint}>{t('customize.noSkillsHint')}</p>
            </div>
          ) : (
            <div className={styles.skillList}>
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  className={`${styles.skillItem} ${selectedSkill?.id === skill.id ? styles.active : ''}`}
                  onClick={() => setSelectedSkill(skill)}
                >
                  <span className={styles.skillIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 3l-5 7h5v8l5-7h-5V3z" />
                    </svg>
                  </span>
                  <div className={styles.skillInfo}>
                    <div className={styles.skillName}>{skill.name}</div>
                    <div className={styles.skillDesc}>{skill.description}</div>
                  </div>
                  <span className={`${styles.skillStatus} ${skill.enabled ? styles.enabled : styles.disabled}`}>
                    {skill.enabled ? t('customize.skillEnabled') : t('customize.skillDisabled')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右栏：详情 */}
      <div className={styles.rightColumn}>
        {!selectedSkill ? (
          <div className={styles.emptyDetail}>
            <p>{skills.length === 0 ? t('customize.noSkills') : 'Select a skill to view details'}</p>
          </div>
        ) : (
          <div className={styles.detailContent}>
            {/* 图标 */}
            <div className={styles.detailIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l1.5 4.5H18l-3.5 2.5 1.5 4.5L12 11l-3.5 2.5 1.5-4.5L6 6.5h4.5z" />
              </svg>
            </div>

            {/* 名称 */}
            <h3 className={styles.detailTitle}>{selectedSkill.name}</h3>

            {/* 描述 */}
            {selectedSkill.description && (
              <p className={styles.detailDescription}>{selectedSkill.description}</p>
            )}

            {/* 触发命令 */}
            {selectedSkill.command && (
              <div className={styles.detailCommand}>
                <span className={styles.commandLabel}>Trigger:</span>
                <code className={styles.commandCode}>/{selectedSkill.command}</code>
              </div>
            )}

            {/* 状态 */}
            <div className={styles.detailStatus}>
              <span className={styles.statusLabel}>Status:</span>
              <span className={`${styles.statusBadge} ${selectedSkill.enabled ? styles.enabled : styles.disabled}`}>
                {selectedSkill.enabled ? t('customize.skillEnabled') : t('customize.skillDisabled')}
              </span>
            </div>

            {/* 操作按钮 */}
            <div className={styles.detailActions}>
              <button
                className={styles.toggleButton}
                onClick={() => handleToggle(selectedSkill)}
              >
                {selectedSkill.enabled ? t('customize.skillDisabled') : t('customize.skillEnabled')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
