import { useTranslation } from '../i18n';
import './LanguageSwitcher.css';

const LANGS = ['pl', 'en'] as const;

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <div className="lang-switch" role="group" aria-label="Language">
            {LANGS.map(lang => (
                <button
                    key={lang}
                    type="button"
                    lang={lang}
                    aria-pressed={i18n.language === lang}
                    onClick={() => i18n.changeLanguage(lang)}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
