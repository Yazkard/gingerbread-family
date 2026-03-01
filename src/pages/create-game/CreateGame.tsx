import { useState } from 'react';
import { useLocation } from 'wouter';
import './CreateGame.css';

export function CreateGame() {
    const [, setLocation] = useLocation();
    const [gameName, setGameName] = useState('');
    const [members, setMembers] = useState<string[]>(['']);
    const [generatedLink, setGeneratedLink] = useState('');

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

    const handleGenerateLink = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty members
        const validMembers = members.filter(m => m.trim().length > 0);

        if (gameName.trim() === '' || validMembers.length === 0) {
            alert("Please enter a game name and at least one member.");
            return;
        }

        const membersQuery = validMembers.map(encodeURIComponent).join(',');
        const gameNameQuery = encodeURIComponent(gameName.trim());

        // Generate full URL
        const url = `${window.location.origin}/game?name=${gameNameQuery}&members=${membersQuery}`;
        setGeneratedLink(url);
    };

    const handleGoToGame = () => {
        if (generatedLink) {
            // Extract path and query from full URL to use with wouter
            const urlObj = new URL(generatedLink);
            setLocation(urlObj.pathname + urlObj.search);
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
                                />
                                {members.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeMemberField(index)}
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
                        >
                            + Add Member
                        </button>
                    </div>

                    <button type="submit" className="generate-btn">
                        Generate Game Link
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
