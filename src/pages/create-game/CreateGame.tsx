import { useState } from 'react';
import { useLocation } from 'wouter';
import { createGameInDb, type Game } from '../../lib/firebase';
import './CreateGame.css';

// Simple fallback to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export function CreateGame() {
    const [, setLocation] = useLocation();
    const [gameName, setGameName] = useState('');
    const [members, setMembers] = useState<string[]>(['']);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleMemberChange = (index: number, value: string) => {
        const newMembers = [...members];
        newMembers[index] = value;
        setMembers(newMembers);
    };

    const addMemberField = () => {
        setMembers([...members, '']);
    };

    const removeMemberField = (index: number) => {
        if (members.length > 1) {
            setMembers(members.filter((_, i) => i !== index));
        }
    };

    const handleGenerateLink = async (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty members
        const validMembers = members.filter(m => m.trim().length > 0);

        if (gameName.trim() === '' || validMembers.length === 0) {
            alert("Please enter a game name and at least one member.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Generate an ID (e.g. smith-family-8x1f)
            const sanitizedName = gameName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
            const gameId = `${sanitizedName}-${generateId()}`;

            // 2. Prepare Game Document
            const newGame: Game = {
                name: gameName.trim(),
                createdAt: new Date().toISOString(),
                members: validMembers,
                projects: {}, // Empty to start
            };

            // 3. Save to Firebase 
            await createGameInDb(gameId, newGame);

            // 4. Generate the simpler URL
            const url = `${window.location.origin}/game/${gameId}`;
            setGeneratedLink(url);
        } catch (error) {
            console.error("Error creating game:", error);
            alert("Failed to create game connecting to Google Firebase. Did you set up the config?");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoToGame = () => {
        if (generatedLink) {
            const urlObj = new URL(generatedLink);
            setLocation(urlObj.pathname);
        }
    };

    return (
        <div className="create-container">
            <div className="create-card">
                <h2>Create a New Game</h2>

                <form onSubmit={handleGenerateLink} className="create-form">
                    <div className="form-group">
                        <label htmlFor="gameName">Game Name / Room Content:</label>
                        <input
                            id="gameName"
                            type="text"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            placeholder="e.g. Smith Family Gingerbread"
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="form-group">
                        <label>Members:</label>
                        {members.map((member, index) => (
                            <div key={index} className="member-input-group">
                                <input
                                    type="text"
                                    value={member}
                                    onChange={(e) => handleMemberChange(index, e.target.value)}
                                    placeholder={`Member ${index + 1}`}
                                    required={index === 0}
                                    disabled={isSaving}
                                />
                                {members.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeMemberField(index)}
                                        disabled={isSaving}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="add-member-btn"
                            onClick={addMemberField}
                            disabled={isSaving}
                        >
                            + Add Member
                        </button>
                    </div>

                    <button type="submit" className="generate-btn" disabled={isSaving}>
                        {isSaving ? 'Creating in Database...' : 'Generate Game Link'}
                    </button>
                </form>

                {generatedLink && (
                    <div className="link-result">
                        <p>Share this link with your family/friends:</p>
                        <div className="link-box">
                            <input type="text" readOnly value={generatedLink} />
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedLink)}
                                title="Copy to clipboard"
                            >
                                Copy
                            </button>
                        </div>
                        <button className="join-game-btn" onClick={handleGoToGame}>
                            Join Game Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
