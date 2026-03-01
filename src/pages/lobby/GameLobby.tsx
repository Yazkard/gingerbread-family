import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ModelCreator } from '../../model-creator/ModelCreator';
import './GameLobby.css';

export function GameLobby() {
    const [location] = useLocation();

    // Initialize state directly from current URL
    const [gameName, setGameName] = useState<string>(() => {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('name') || '';
    });

    const [members, setMembers] = useState<string[]>(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const membersParam = searchParams.get('members');
        return membersParam ? membersParam.split(',') : [];
    });

    const [currentUser, setCurrentUser] = useState<string | null>(null);

    // Still want to update if location changes via navigation while on the page
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const nameParam = searchParams.get('name');
        const membersParam = searchParams.get('members');

        if (nameParam && nameParam !== gameName) setGameName(nameParam);
        if (membersParam) {
            const newMembers = membersParam.split(',');
            if (newMembers.join(',') !== members.join(',')) {
                setMembers(newMembers);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    if (!currentUser) {
        return (
            <div className="lobby-container">
                <div className="lobby-card">
                    <h2>Welcome to {gameName || 'Gingerbread Creator'}</h2>
                    <p>Please select who you are to start baking:</p>

                    <div className="members-list">
                        {members.length > 0 ? (
                            members.map((member, idx) => (
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

    // Once a user is selected, render the main ModelCreator
    // We pass down the currentUser and gameName as props
    return (
        <ModelCreator
            currentUser={currentUser}
            gameName={gameName}
        />
    );
}
