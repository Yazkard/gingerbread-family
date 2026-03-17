import { Link } from 'wouter';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import './Landing.css';

export function Landing() {
    const { t } = useTranslation();

    return (
        <div className="landing-container">
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <LanguageSwitcher />
            </div>
            <header className="landing-header">
                <span className="landing-icon">🫚</span>
                <h1>{t('landing.title')}</h1>
                <p>{t('landing.subtitle')}</p>
            </header>

            <div className="landing-actions">
                <Link href="/create">
                    <button className="primary-button">{t('landing.createGame')}</button>
                </Link>
                <Link href="/draw">
                    <button className="secondary-button">{t('landing.quickDraw')}</button>
                </Link>
            </div>
        </div>
    );
}
