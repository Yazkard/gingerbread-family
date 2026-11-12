import { Link } from 'wouter';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { GINGERBREAD_PATH } from '../../components/Marks';
import './Landing.css';

// Wall depth layers, drawn back to front; each is the 1mm wall seen lower down.
const WALL_LAYERS = [7, 6, 5, 4, 3, 2, 1];

function CutterDemo() {
    return (
        <svg className="cutter-demo" viewBox="-20 -10 250 250" role="img" aria-label="A drawn gingerbread outline becoming a 3D-printable cookie cutter: a thin wall with a wide flange">
            <g transform="translate(15.4 21)">
                <path d={GINGERBREAD_PATH} className="cutter-flange" />
                <path d={GINGERBREAD_PATH} className="cutter-base" />
            </g>
            {WALL_LAYERS.map(i => (
                <path
                    key={i}
                    d={GINGERBREAD_PATH}
                    className="cutter-wall"
                    style={{ ['--i' as string]: i }}
                    transform={`translate(${i * 2.2} ${i * 3})`}
                />
            ))}
            <path d={GINGERBREAD_PATH} className="cutter-rim" />
            <path d={GINGERBREAD_PATH} className="cutter-outline" pathLength={1} />
            <g className="cutter-details">
                <circle cx="91" cy="44" r="3.5" />
                <circle cx="109" cy="44" r="3.5" />
                <path d="M90 57 q10 8 20 0" />
                <circle cx="100" cy="100" r="3.5" />
                <circle cx="100" cy="118" r="3.5" />
            </g>
        </svg>
    );
}

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
                    <CutterDemo />
                </div>
            </div>
        </main>
    );
}
