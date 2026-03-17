import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../../i18n';
import { createGameInDb, type Game } from '../../lib/firebase';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import './CreateGame.css';

// Simple fallback to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export function CreateGame() {
    const { t } = useTranslation();
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
            alert(t('createGame.validationError'));
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
            alert(t('createGame.firebaseError'));
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
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <LanguageSwitcher />
            </div>
            <div className="create-card">
                <h2>{t('createGame.heading')}</h2>

                <form onSubmit={handleGenerateLink} className="create-form">
                    <div className="form-group">
                        <label htmlFor="gameName">{t('createGame.gameNameLabel')}</label>
                        <input
                            id="gameName"
                            type="text"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            placeholder={t('createGame.gameNamePlaceholder')}
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('createGame.membersLabel')}</label>
                        {members.map((member, index) => (
                            <div key={index} className="member-input-group">
                                <input
                                    type="text"
                                    value={member}
                                    onChange={(e) => handleMemberChange(index, e.target.value)}
                                    placeholder={t('createGame.memberPlaceholder', { index: index + 1 })}
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
                            {t('createGame.addMember')}
                        </button>
                    </div>

                    <button type="submit" className="generate-btn" disabled={isSaving}>
                        {isSaving ? t('createGame.generating') : t('createGame.generate')}
                    </button>
                </form>

                {generatedLink && (
                    <div className="link-result">
                        <p>{t('createGame.shareLabel')}</p>
                        <div className="link-box">
                            <input type="text" readOnly value={generatedLink} />
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedLink)}
                                title={t('createGame.copy')}
                            >
                                {t('createGame.copy')}
                            </button>
                        </div>
                        <button className="join-game-btn" onClick={handleGoToGame}>
                            {t('createGame.joinNow')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
