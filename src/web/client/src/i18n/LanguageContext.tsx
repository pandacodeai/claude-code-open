/**
 * 前端 i18n Language Context
 * 提供语言切换和 t() 翻译函数
 */

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { locales, type Locale, type Translations } from './locales';

interface LanguageContextValue {
  /** 当前语言 */
  locale: Locale;
  /** 切换语言 */
  setLocale: (locale: Locale) => void;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLocale(): Locale {
  const stored = localStorage.getItem('claude-code-language');
  if (stored === 'zh' || stored === 'en') return stored;
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('claude-code-language', newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translations: Translations = locales[locale] || locales.en;
    let template = translations[key] ?? locales.en[key] ?? key;
    if (params) {
      template = template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(params[name] ?? `{{${name}}}`));
    }
    return template;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * 使用语言 Context 的 Hook
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * 独立翻译函数（不依赖 React Context）
 * 用于 Class 组件或 Context 外部场景
 */
export function getTranslation(key: string, params?: Record<string, string | number>): string {
  const locale = getInitialLocale();
  const translations: Translations = locales[locale] || locales.en;
  let template = translations[key] ?? locales.en[key] ?? key;
  if (params) {
    template = template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(params[name] ?? `{{${name}}}`));
  }
  return template;
}
