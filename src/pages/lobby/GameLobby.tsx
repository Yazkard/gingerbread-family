import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ModelCreator } from '../../model-creator/ModelCreator';
import { getGameFromDb, type Game } from '../../lib/firebase';
import './GameLobby.css';

export function GameLobby({ params }: { params: { gameId: string } }) {
    const { gameId } = params;
    const [, setLocation] = useLocation();

    const [game, setGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    // Fetch the game from Firebase
    useEffect(() => {
        async function loadGame() {
            try {
                if (!gameId) {
                    setError("No game ID provided.");
                    return;
                }
                const gameData = await getGameFromDb(gameId);
                if (gameData) {
                    setGame(gameData);
                } else {
                    setError("Game not found.");
                }
            } catch (err) {
                console.error("Error loading game:", err);
                setError("Failed to load game data.");
            } finally {
                setIsLoading(false);
            }
        }

        loadGame();
    }, [gameId]);

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
                            game.members.map((member, idx) => (
                                <button
                                    key={idx}
                                    className="member-btn"
                                    onClick={() => setCurrentUser(member)}
                                >
                                    {member}
                                </button>
                            ))
                        ) : (
                            <p className="error-text">No members found for this game.</p>
                        )}
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
