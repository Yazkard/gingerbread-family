import { useState, useCallback } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Viewer3D } from './components/Viewer3D';
import { Controls } from './components/Controls';
import type { Stroke } from './types';
import { exportTo3MF } from './utils/export3MF';
import { saveProjectToDb, type GameProject } from '../../lib/firebase';
import * as THREE from 'three';
import './ModelCreator.css';

interface ModelCreatorProps {
    currentUser?: string;
    gameName?: string;
    gameId?: string;
    initialProject?: GameProject;
}

export function ModelCreator({ currentUser, gameName, gameId, initialProject }: ModelCreatorProps) {
    const [strokes, setStrokes] = useState<Stroke[]>(initialProject?.strokes || []);
    const [color, setColor] = useState(initialProject?.color || '#d2691e'); // Gingerbread color
    const [isSaving, setIsSaving] = useState(false);

    // Geometry Settings (Fixed as requested)
    const [extrusionDepth] = useState(4);
    const [strokeWidth] = useState(1); // 1mm Wall
    const [detailStrokeWidth, setDetailStrokeWidth] = useState(1); // 1mm Default Detail
    const [outerExpansion] = useState(3); // 3mm Flange
    const [innerGap] = useState(2); // 2mm Gap

    const [currentGeometries, setCurrentGeometries] = useState<THREE.BufferGeometry[]>([]);

    const handleClear = useCallback(() => {
        if (window.confirm("Are you sure you want to clear your drawing?")) {
            setStrokes([]);
            setCurrentGeometries([]);
        }
    }, []);

    const handleExport3MF = useCallback(async () => {
        if (currentGeometries.length > 0) {
            const filename = currentUser ? `${currentUser}_gingerbread.3mf` : 'gingerbread.3mf';
            await exportTo3MF(currentGeometries, filename);
        }
    }, [currentGeometries, currentUser]);

    const handleSaveProgress = async () => {
        if (!gameId || !currentUser) return;
        setIsSaving(true);
        try {
            await saveProjectToDb(gameId, currentUser, {
                strokes,
                color,
                updatedAt: new Date().toISOString()
            });
            alert("Progress saved!");
        } catch (err) {
            console.error("Error saving progress:", err);
            alert("Failed to save progress.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <div>
                        <h1>{gameName || 'Gingerbread Architect'}</h1>
                        <p>
                            {currentUser ? `Welcome ${currentUser}! ` : ''}
                            Outline your shape, then add details!
                        </p>
                    </div>
                    {gameId && currentUser && (
                        <button
                            className="save-btn"
                            onClick={handleSaveProgress}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Progress"}
                        </button>
                    )}
                </div>
            </header>

            <div className="app-content">
                <div className="canvas-section">
                    <h2>2D Drawing</h2>
                    <DrawingCanvas
                        strokes={strokes}
                        onStrokesChange={setStrokes}
                        color={color}
                        strokeWidth={strokeWidth}
                        detailStrokeWidth={detailStrokeWidth}
                    />
                </div>

                <div className="viewer-section">
                    <h2>3D Preview</h2>
                    <Viewer3D
                        strokes={strokes}
                        color={color}
                        extrusionDepth={extrusionDepth}
                        strokeWidth={strokeWidth}
                        detailStrokeWidth={detailStrokeWidth}
                        outerExpansion={outerExpansion}
                        innerGap={innerGap}
                        onGeometriesReady={setCurrentGeometries}
                    />
                </div>

                <div className="controls-section">
                    <Controls
                        color={color}
                        onColorChange={setColor}
                        detailStrokeWidth={detailStrokeWidth}
                        onDetailStrokeWidthChange={setDetailStrokeWidth}
                        onClear={handleClear}
                        onExport3MF={handleExport3MF}
                        canExport={currentGeometries.length > 0}
                    />
                </div>
            </div>
        </div>
    );
}
