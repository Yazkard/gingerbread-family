import { Link } from 'wouter';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { HairlineFigure } from '../../components/HairlineFigure';
import './Landing.css';

export function Landing() {
    const { t } = useTranslation();

    return (
        <main className="landing">
            <div className="page-corner">
                <LanguageSwitcher />
            </div>

            <div className="landing-grid">
                <div className="landing-copy">
                    <h1>{t('landing.title')}</h1>
                    <p className="landing-lede">{t('landing.subtitle')}</p>
                    <p className="landing-mechanism">{t('landing.mechanism')}</p>

                    <div className="landing-actions">
                        <Link href="/create" className="btn btn-primary landing-cta">
                            {t('landing.createGame')}
                        </Link>
                        <Link href="/draw" className="btn landing-cta">
                            {t('landing.quickDraw')}
                        </Link>
                    </div>

                </div>

                <div className="landing-press">
                    <HairlineFigure />
                </div>
            </div>
        </main>
    );
}
