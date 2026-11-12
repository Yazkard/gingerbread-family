import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../../i18n';
import { ModelCreator } from '../model-creator/ModelCreator';
import { db, type Game } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { exportAllToZip } from '../model-creator/utils/export3MF';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { DownloadIcon, Rosette } from '../../components/Marks';
import './GameLobby.css';

export function GameLobby({ params }: { params: { gameId: string } }) {
    const { t } = useTranslation();
    const { gameId } = params;
    const [, setLocation] = useLocation();

    const [game, setGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Fetch the game from Firebase with realtime updates
    useEffect(() => {
        if (!gameId) {
            setError(t('lobby.noGameId'));
            setIsLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, "games", gameId), (docSnap) => {
            if (docSnap.exists()) {
                setGame(docSnap.data() as Game);
                setError(null);
            } else {
                setError(t('lobby.gameNotFound'));
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error loading game:", err);
            setError(t('lobby.loadFailed'));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [gameId, t]);

    const handleBulkExport = async () => {
        if (!game) return;
        setIsExporting(true);
        try {
            await exportAllToZip(game, game.name);
        } catch (err) {
            console.error("Failed to export:", err);
            alert(t('lobby.exportFailed'));
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="lobby-page">
                <div className="lobby-board" aria-busy="true">
                    <p className="lobby-loading">{t('lobby.loading')}</p>
                </div>
            </main>
        );
    }

    if (error || !game) {
        return (
            <main className="lobby-page">
                <div className="page-corner">
                    <LanguageSwitcher />
                </div>
                <div className="lobby-board">
                    <h1>{t('lobby.error')}</h1>
                    <p className="lobby-error" role="alert">{error || t('lobby.gameNotFound')}</p>
                    <button type="button" className="btn btn-block" onClick={() => setLocation('/')}>
                        {t('lobby.goHome')}
                    </button>
                </div>
            </main>
        );
    }

    if (!currentUser) {
        return (
            <main className="lobby-page">
                <div className="page-corner">
                    <LanguageSwitcher />
                </div>
                <div className="lobby-board">
                    <h1>{t('lobby.welcome', { name: game.name })}</h1>
                    <p className="lobby-lede">{t('lobby.selectWho')}</p>

                    {game.members && game.members.length > 0 ? (
                        <ul className="stub-list">
                            {game.members.map((member, idx) => {
                                const project = game.projects?.[member];
                                let statusText = t('lobby.notStarted');
                                let statusClass = 'seal-blank';

                                if (project) {
                                    if (project.status === 'completed') {
                                        statusText = t('lobby.completed');
                                        statusClass = 'seal-sealed';
                                    } else {
                                        statusText = t('lobby.inProgress');
                                        statusClass = 'seal-inked';
                                    }
                                }

                                return (
                                    <li key={idx}>
                                        <button
                                            type="button"
                                            className="stub"
                                            onClick={() => setCurrentUser(member)}
                                        >
                                            <span className="stub-end" aria-hidden="true">
                                                <span className={`seal ${statusClass}`} />
                                            </span>
                                            <span className="stub-body">
                                                <span className="stub-name">{member}</span>
                                                <span className="stub-status">{statusText}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="lobby-error">{t('lobby.noMembers')}</p>
                    )}

                    <div className="rosette-rule lobby-rule" aria-hidden="true">
                        <Rosette />
                    </div>

                    <button
                        type="button"
                        className="btn btn-quiet btn-block"
                        onClick={handleBulkExport}
                        disabled={isExporting || !game.projects || Object.keys(game.projects).length === 0}
                    >
                        <DownloadIcon />
                        {isExporting ? t('lobby.exporting') : t('lobby.bulkExport')}
                    </button>
                </div>
            </main>
        );
    }

    // Pass down the currentUser, gameName, AND gameId to ModelCreator
    // ModelCreator will be responsible for fetching/saving their specific strokes
    return (
        <ModelCreator
            currentUser={currentUser}
            gameName={game.name}
            gameId={gameId}
            initialProject={game.projects?.[currentUser]}
        />
    );
}
