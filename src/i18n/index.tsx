import React, { createContext, useContext, useState } from 'react';
import pl from './pl';
import en from './en';

type Lang = 'pl' | 'en';

const resources: Record<Lang, Record<string, Record<string, string>>> = {
    pl: pl as unknown as Record<string, Record<string, string>>,
    en: en as unknown as Record<string, Record<string, string>>,
};

function getInitialLang(): Lang {
    const stored = localStorage.getItem('lang');
    return stored === 'en' ? 'en' : 'pl';
}

function resolvePath(obj: Record<string, Record<string, string>>, path: string): string {
    const [section, key] = path.split('.');
    return obj[section]?.[key] ?? path;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
    if (!vars) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}

interface I18nContextValue {
    lang: Lang;
    t: (key: string, vars?: Record<string, string | number>) => string;
    i18n: {
        language: Lang;
        changeLanguage: (lang: Lang) => void;
    };
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Lang>(getInitialLang);

    const changeLanguage = (next: Lang) => {
        setLang(next);
        localStorage.setItem('lang', next);
    };

    const t = (key: string, vars?: Record<string, string | number>) => {
        const raw = resolvePath(resources[lang], key);
        return interpolate(raw, vars);
    };

    return (
        <I18nContext.Provider value={{ lang, t, i18n: { language: lang, changeLanguage } }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useTranslation must be used inside I18nProvider');
    return ctx;
}
