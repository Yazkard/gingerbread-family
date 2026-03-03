import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ModelCreator } from '../model-creator/ModelCreator';
import { db, type Game } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { exportAllToZip } from '../model-creator/utils/export3MF';
import './GameLobby.css';

export function GameLobby({ params }: { params: { gameId: string } }) {
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
            setError("No game ID provided.");
            setIsLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, "games", gameId), (docSnap) => {
            if (docSnap.exists()) {
                setGame(docSnap.data() as Game);
                setError(null);
            } else {
                setError("Game not found.");
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error loading game:", err);
            setError("Failed to load game data.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [gameId]);

    const handleBulkExport = async () => {
        if (!game) return;
        setIsExporting(true);
        try {
            await exportAllToZip(game, game.name);
        } catch (err) {
            console.error("Failed to export:", err);
            alert("Failed to export models.");
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="lobby-container">
                <div className="lobby-card">
                    <h2>Loading Game...</h2>
                </div>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="lobby-container">
                <div className="lobby-card">
                    <h2>Oops!</h2>
                    <p className="error-text">{error || "Game not found."}</p>
                    <button className="member-btn" onClick={() => setLocation('/')}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="lobby-container">
                <div className="lobby-card">
                    <h2>Welcome to {game.name}</h2>
                    <p>Please select who you are to start baking:</p>

                    <div className="members-list">
                        {game.members && game.members.length > 0 ? (
                            game.members.map((member, idx) => {
                                const project = game.projects?.[member];
                                let statusText = 'Not Started';
                                let statusClass = 'status-not-started';

                                if (project) {
                                    if (project.status === 'completed') {
                                        statusText = 'Completed';
                                        statusClass = 'status-completed';
                                    } else {
                                        statusText = 'In Progress';
                                        statusClass = 'status-in-progress';
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        className="member-btn"
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '10px' }}
                                        onClick={() => setCurrentUser(member)}
                                    >
                                        <span>{member}</span>
                                        <span className={`status-badge ${statusClass}`} style={{ fontSize: '0.8em', padding: '4px 8px', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}>
                                            {statusText}
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <p className="error-text">No members found for this game.</p>
                        )}
                    </div>

                    <div style={{ marginTop: '30px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '20px' }}>
                        <button
                            onClick={handleBulkExport}
                            disabled={isExporting || !game.projects || Object.keys(game.projects).length === 0}
                            style={{ width: '100%', padding: '10px', background: '#2E4A2E', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (isExporting || !game.projects || Object.keys(game.projects).length === 0) ? 0.5 : 1 }}
                        >
                            {isExporting ? "Exporting..." : "Bulk Export Models (.zip)"}
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
