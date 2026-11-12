import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '../../i18n';
import { createGameInDb, type Game } from '../../lib/firebase';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { CloseIcon, PlusIcon, Rosette } from '../../components/Marks';
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
        <main className="create-page">
            <div className="page-corner">
                <LanguageSwitcher />
            </div>
            <div className="ticket">
                <div className="ticket-band">
                    <span>{t('landing.title')}</span>
                    <Rosette size={16} />
                    <div className="perforation perforation-bottom" aria-hidden="true" />
                </div>
                <h1 className="ticket-heading">{t('createGame.heading')}</h1>

                <form onSubmit={handleGenerateLink}>
                    <div className="ticket-row">
                        <label htmlFor="gameName">{t('createGame.gameNameLabel')}</label>
                        <input
                            id="gameName"
                            className="field"
                            type="text"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            placeholder={t('createGame.gameNamePlaceholder')}
                            required
                            disabled={isSaving}
                        />
                    </div>

                    <fieldset className="ticket-row">
                        <legend>{t('createGame.membersLabel')}</legend>
                        <ol className="member-lines">
                            {members.map((member, index) => (
                                <li key={index} className="member-line">
                                    <span className="member-num" aria-hidden="true">{index + 1}</span>
                                    <input
                                        className="field"
                                        type="text"
                                        value={member}
                                        onChange={(e) => handleMemberChange(index, e.target.value)}
                                        placeholder={t('createGame.memberPlaceholder', { index: index + 1 })}
                                        aria-label={t('createGame.memberPlaceholder', { index: index + 1 })}
                                        required={index === 0}
                                        disabled={isSaving}
                                    />
                                    {members.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeMemberField(index)}
                                            disabled={isSaving}
                                            aria-label={t('createGame.removeMember', { index: index + 1 })}
                                        >
                                            <CloseIcon />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ol>
                        <button
                            type="button"
                            className="btn btn-quiet btn-block add-member-btn"
                            onClick={addMemberField}
                            disabled={isSaving}
                        >
                            <PlusIcon />
                            {t('createGame.addMember')}
                        </button>
                    </fieldset>

                    <button type="submit" className="btn btn-primary btn-block ticket-submit" disabled={isSaving}>
                        {isSaving ? t('createGame.generating') : t('createGame.generate')}
                    </button>
                </form>

                {generatedLink && (
                    <div className="ticket-stub">
                        <div className="perforation" aria-hidden="true" />
                        <p id="share-label">{t('createGame.shareLabel')}</p>
                        <div className="link-box">
                            <input className="field" type="text" readOnly value={generatedLink} aria-labelledby="share-label" />
                            <button
                                type="button"
                                className="btn"
                                onClick={() => navigator.clipboard.writeText(generatedLink)}
                            >
                                {t('createGame.copy')}
                            </button>
                        </div>
                        <button type="button" className="btn btn-block" onClick={handleGoToGame}>
                            {t('createGame.joinNow')}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
