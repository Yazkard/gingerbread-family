// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Helper functions for our models
export interface GameProject {
    strokes: any[];
    color: string;
    updatedAt: string;
    status?: 'in_progress' | 'completed';
}

export interface Game {
    name: string;
    createdAt: string;
    members: string[];
    projects: Record<string, GameProject>;
}

export const createGameInDb = async (gameId: string, gameData: Game) => {
    console.log("Checking config loaded:", !!firebaseConfig.apiKey, !!firebaseConfig.projectId);
    try {
        console.log("Attempting to write to Firestore games collection with ID", gameId);
        await setDoc(doc(db, "games", gameId), gameData);
        console.log("Successfully wrote to Firestore");
    } catch (e) {
        console.error("Firestore Write Error:", e);
        throw e;
    }
};

export const getGameFromDb = async (gameId: string): Promise<Game | null> => {
    const docSnap = await getDoc(doc(db, "games", gameId));
    if (docSnap.exists()) {
        return docSnap.data() as Game;
    }
    return null;
};

export const saveProjectToDb = async (gameId: string, memberName: string, projectData: GameProject) => {
    // Only update the specific member's project to avoid overwriting others
    const projectPath = `projects.${memberName}`;
    await updateDoc(doc(db, "games", gameId), {
        [projectPath]: projectData
    });
};
