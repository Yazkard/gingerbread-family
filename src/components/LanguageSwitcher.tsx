import React from 'react';
import { useTranslation } from '../i18n';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const current = i18n.language;

    const btnBase: React.CSSProperties = {
        background: 'transparent',
        border: '1px solid #4A2E1A',
        borderRadius: '6px',
        color: '#C4A882',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'inherit',
        padding: '4px 8px',
        transition: 'all 0.15s',
        letterSpacing: '0.05em',
    };

    const btnActive: React.CSSProperties = {
        ...btnBase,
        background: '#4A2E1A',
        color: '#D4A017',
        border: '1px solid #D4A017',
    };

    return (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
                style={current === 'pl' ? btnActive : btnBase}
                onClick={() => i18n.changeLanguage('pl')}
            >
                PL
            </button>
            <button
                style={current === 'en' ? btnActive : btnBase}
                onClick={() => i18n.changeLanguage('en')}
            >
                EN
            </button>
        </div>
    );
}
