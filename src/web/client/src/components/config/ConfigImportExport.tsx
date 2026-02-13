/**
 * 配置导入导出组件
 * 用于配置的导入、导出、验证和重置
 */

import { useState } from 'react';
import { useLanguage } from '../../i18n';
import '../../styles/config-panels.css';

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

interface ConfigImportExportProps {
  onClose?: () => void;
}

export function ConfigImportExport({ onClose }: ConfigImportExportProps) {
  const { t } = useLanguage();
  const [exportedConfig, setExportedConfig] = useState<string>('');
  const [importConfig, setImportConfig] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 导出配置
  const handleExport = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config/export', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.config) {
        const configStr = JSON.stringify(data.config, null, 2);
        setExportedConfig(configStr);
        setMessage({ type: 'success', text: t('importExport.export.success') });
      } else {
        throw new Error(data.error || t('importExport.export.failed'));
      }
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('importExport.export.failed')
      });
    } finally {
      setLoading(false);
    }
  };

  // 验证配置
  const handleValidate = async () => {
    if (!importConfig.trim()) {
      setMessage({ type: 'error', text: t('importExport.import.noConfig') });
      return;
    }

    setLoading(true);
    setMessage(null);
    setValidationResult(null);

    try {
      // 先尝试解析 JSON
      let configObj;
      try {
        configObj = JSON.parse(importConfig);
      } catch (error) {
        setValidationResult({
          valid: false,
          errors: [t('importExport.import.invalidJson', { error: error instanceof Error ? error.message : '' })]
        });
        setLoading(false);
        return;
      }

      // 发送到服务器验证
      const response = await fetch('/api/config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configObj }),
      });

      const data = await response.json();
      setValidationResult(data);

      if (data.valid) {
        setMessage({ type: 'success', text: t('importExport.validation.success') });
      } else {
        setMessage({ type: 'error', text: t('importExport.validation.failed') });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult({
        valid: false,
        errors: [error instanceof Error ? error.message : t('importExport.validation.requestFailed')]
      });
      setMessage({ type: 'error', text: t('importExport.validation.requestFailed') });
    } finally {
      setLoading(false);
    }
  };

  // 导入配置
  const handleImport = async () => {
    if (!validationResult?.valid) {
      setMessage({ type: 'error', text: t('importExport.import.notValidated') });
      return;
    }

    const confirmed = window.confirm(t('importExport.import.confirm'));
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: importConfig,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: t('importExport.import.success') });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(data.error || t('importExport.import.failed'));
      }
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('importExport.import.failed')
      });
      setLoading(false);
    }
  };

  // 下载配置文件
  const handleDownload = () => {
    if (!exportedConfig) {
      setMessage({ type: 'error', text: t('importExport.export.failed') });
      return;
    }

    try {
      const blob = new Blob([exportedConfig], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claude-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: t('importExport.export.downloadSuccess') });
    } catch (error) {
      console.error('Download failed:', error);
      setMessage({ type: 'error', text: t('importExport.export.downloadFailed') });
    }
  };

  // 重置配置
  const handleReset = async () => {
    const confirmed1 = window.confirm(t('importExport.reset.confirm1'));
    if (!confirmed1) {
      return;
    }

    const confirmed2 = window.confirm(t('importExport.reset.confirm2'));
    if (!confirmed2) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config/reset', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: t('importExport.reset.success') });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(data.error || t('importExport.reset.failed'));
      }
    } catch (error) {
      console.error('Reset failed:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('importExport.reset.failed')
      });
      setLoading(false);
    }
  };

  // 从文件读取配置
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: t('importExport.import.fileTypeError') });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportConfig(content);
      setValidationResult(null);
      setMessage({ type: 'info', text: t('importExport.import.fileLoaded') });
    };
    reader.onerror = () => {
      setMessage({ type: 'error', text: t('importExport.import.fileFailed') });
    };
    reader.readAsText(file);

    // 重置 input，允许选择同一个文件
    event.target.value = '';
  };

  return (
    <div className="config-import-export">
      <div className="config-panel-header">
        <h3>{t('importExport.title')}</h3>
        <p className="config-description">
          {t('importExport.description')}
        </p>
      </div>

      {message && (
        <div className={`config-message config-message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 导出配置 */}
      <section className="config-section">
        <h4>{t('importExport.export.title')}</h4>
        <p className="config-section-desc">
          {t('importExport.export.description')}
        </p>

        <button
          className="config-btn config-btn-primary"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? t('importExport.export.exporting') : t('importExport.export.btn')}
        </button>

        {exportedConfig && (
          <div className="config-export-result">
            <textarea
              className="config-textarea config-export-textarea"
              value={exportedConfig}
              readOnly
              rows={15}
            />
            <button
              className="config-btn config-btn-secondary"
              onClick={handleDownload}
            >
              {t('importExport.export.download')}
            </button>
          </div>
        )}
      </section>

      {/* 导入配置 */}
      <section className="config-section">
        <h4>{t('importExport.import.title')}</h4>
        <p className="config-section-desc">
          {t('importExport.import.description')}
        </p>

        <div className="config-import-file">
          <label className="config-file-label">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="config-file-input"
            />
            <span className="config-btn config-btn-secondary">
              {t('importExport.import.fromFile')}
            </span>
          </label>
          <span className="help-text">{t('importExport.import.fileHint')}</span>
        </div>

        <textarea
          className="config-textarea config-import-textarea"
          value={importConfig}
          onChange={(e) => {
            setImportConfig(e.target.value);
            setValidationResult(null);
          }}
          placeholder={t('importExport.import.placeholder')}
          rows={15}
        />

        <div className="config-import-actions">
          <button
            className="config-btn config-btn-secondary"
            onClick={handleValidate}
            disabled={loading || !importConfig.trim()}
          >
            {loading ? t('importExport.import.validating') : t('importExport.import.validate')}
          </button>
          <button
            className="config-btn config-btn-primary"
            onClick={handleImport}
            disabled={loading || !validationResult?.valid}
          >
            {t('importExport.import.import')}
          </button>
        </div>

        {validationResult && (
          <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
            {validationResult.valid ? (
              <div className="validation-success">
                <div className="validation-icon">✓</div>
                <div className="validation-text">{t('importExport.validation.valid')}</div>
              </div>
            ) : (
              <div className="validation-error">
                <div className="validation-icon">✗</div>
                <div className="validation-text">
                  <div className="validation-title">{t('importExport.validation.invalid')}</div>
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <ul className="validation-list">
                      {validationResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div className="validation-warnings">
                <div className="validation-warning-title">{t('importExport.validation.warnings')}</div>
                <ul className="validation-list">
                  {validationResult.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 配置重置 */}
      <section className="config-section config-section-danger">
        <h4>{t('importExport.reset.title')}</h4>
        <p className="config-section-desc danger">
          {t('importExport.reset.description')}
        </p>

        <button
          className="config-btn config-btn-danger"
          onClick={handleReset}
          disabled={loading}
        >
          {t('importExport.reset.btn')}
        </button>
      </section>

      {onClose && (
        <div className="config-actions">
          <button
            className="config-btn config-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('importExport.close')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ConfigImportExport;
