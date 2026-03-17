import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { ModelCreator } from '../model-creator/ModelCreator';
import { db, type Game } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { exportAllToZip } from '../model-creator/utils/export3MF';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
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
            <div className="lobby-container">
                <div className="lobby-card">
                    <h2>{t('lobby.loading')}</h2>
                </div>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="lobby-container">
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <LanguageSwitcher />
                </div>
                <div className="lobby-card">
                    <h2>{t('lobby.error')}</h2>
                    <p className="error-text">{error || t('lobby.gameNotFound')}</p>
                    <button className="member-btn" onClick={() => setLocation('/')}>
                        {t('lobby.goHome')}
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="lobby-container">
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <LanguageSwitcher />
                </div>
                <div className="lobby-card">
                    <h2>{t('lobby.welcome', { name: game.name })}</h2>
                    <p>{t('lobby.selectWho')}</p>

                    <div className="members-list">
                        {game.members && game.members.length > 0 ? (
                            game.members.map((member, idx) => {
                                const project = game.projects?.[member];
                                let statusText = t('lobby.notStarted');
                                let statusClass = 'status-not-started';

                                if (project) {
                                    if (project.status === 'completed') {
                                        statusText = t('lobby.completed');
                                        statusClass = 'status-completed';
                                    } else {
                                        statusText = t('lobby.inProgress');
                                        statusClass = 'status-in-progress';
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        className="member-btn"
                                        onClick={() => setCurrentUser(member)}
                                    >
                                        <span className="member-avatar">{member.charAt(0)}</span>
                                        <span className="member-name">{member}</span>
                                        <span className={`status-dot ${statusClass}`} title={statusText} />
                                        <span className="status-label">{statusText}</span>
                                    </button>
                                );
                            })
                        ) : (
                            <p className="error-text">{t('lobby.noMembers')}</p>
                        )}
                    </div>

                    <div className="bulk-export-section">
                        <button
                            className="bulk-export-btn"
                            onClick={handleBulkExport}
                            disabled={isExporting || !game.projects || Object.keys(game.projects).length === 0}
                        >
                            {isExporting ? t('lobby.exporting') : t('lobby.bulkExport')}
                        </button>
                    </div>
                </div>
            </div>
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
