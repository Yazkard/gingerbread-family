import { useState, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import { useTranslation } from '../../i18n';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Viewer3D } from './components/Viewer3D';
import { Controls } from './components/Controls';
import type { Stroke, BackgroundImage } from './types';
import { exportTo3MF } from './utils/export3MF';
import { saveProjectToDb, type GameProject } from '../../lib/firebase';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import * as THREE from 'three';
import './ModelCreator.css';

interface ModelCreatorProps {
    currentUser?: string;
    gameName?: string;
    gameId?: string;
    initialProject?: GameProject;
}

export function ModelCreator({ currentUser, gameName, gameId, initialProject }: ModelCreatorProps) {
    const { t } = useTranslation();
    const [strokes, setStrokes] = useState<Stroke[]>(initialProject?.strokes || []);
    const color = '#d2691e'; // Fixed gingerbread color
    const [isSaving, setIsSaving] = useState(false);

    // Geometry Settings (Fixed as requested)
    const [extrusionDepth] = useState(4);
    const [strokeWidth] = useState(1); // 1mm Wall
    const [detailStrokeWidth, setDetailStrokeWidth] = useState(1); // 1mm Default Detail
    const [outerExpansion] = useState(3); // 3mm Flange
    const [innerGap] = useState(2); // 2mm Gap

    const [currentGeometries, setCurrentGeometries] = useState<THREE.BufferGeometry[]>([]);
    const [detailStartIndex, setDetailStartIndex] = useState(0);
    const [backgroundImage, setBackgroundImage] = useState<BackgroundImage | null>(null);
    const [isMoveMode, setIsMoveMode] = useState(false);

    const handleUndo = useCallback(() => {
        setStrokes(prev => prev.slice(0, -1));
    }, []);

    const handleClear = useCallback(() => {
        if (window.confirm(t('modelCreator.confirmClear'))) {
            setStrokes([]);
            setCurrentGeometries([]);
        }
    }, [t]);

    const handleBackgroundUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) return;
            const img = new window.Image();
            img.onload = () => {
                const MAX = 2000;
                let finalDataUrl = dataUrl;
                if (img.naturalWidth > MAX || img.naturalHeight > MAX) {
                    const canvas = document.createElement('canvas');
                    const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight);
                    canvas.width = img.naturalWidth * ratio;
                    canvas.height = img.naturalHeight * ratio;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    finalDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                }
                const fitScale = Math.min(500 / img.naturalWidth, 500 / img.naturalHeight, 1.0);
                setBackgroundImage({
                    dataUrl: finalDataUrl,
                    x: 250,
                    y: 250,
                    scale: fitScale,
                    opacity: 0.3,
                });
                setIsMoveMode(false);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }, []);

    const handleBackgroundRemove = useCallback(() => {
        setBackgroundImage(null);
        setIsMoveMode(false);
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                setStrokes(prev => prev.slice(0, -1));
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const handleExport3MF = useCallback(async () => {
        if (currentGeometries.length > 0) {
            const filename = currentUser ? `${currentUser}_gingerbread.3mf` : 'gingerbread.3mf';
            await exportTo3MF(currentGeometries, filename, detailStartIndex, color);
        }
    }, [currentGeometries, currentUser, detailStartIndex, color]);

    const handleSaveProgress = async () => {
        if (!gameId || !currentUser) return;
        setIsSaving(true);
        try {
            await saveProjectToDb(gameId, currentUser, {
                strokes,
                color,
                updatedAt: new Date().toISOString(),
                status: 'in_progress'
            });
            alert(t('modelCreator.saved'));
        } catch (err) {
            console.error("Error saving progress:", err);
            alert(t('modelCreator.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinishSubmit = async () => {
        if (!gameId || !currentUser) return;
        if (!window.confirm(t('modelCreator.confirmSubmit'))) return;
        setIsSaving(true);
        try {
            await saveProjectToDb(gameId, currentUser, {
                strokes,
                color,
                updatedAt: new Date().toISOString(),
                status: 'completed'
            });
            alert(t('modelCreator.submitted'));
        } catch (err) {
            console.error("Error submitting model:", err);
            alert(t('modelCreator.submitFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <div>
                        <h1>{gameName || t('landing.title')}</h1>
                        <p>
                            {currentUser ? t('modelCreator.welcome', { name: currentUser }) : ''}
                            {t('modelCreator.instructions')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <LanguageSwitcher />
                        {!gameId && (
                            <Link href="/">{t('modelCreator.backHome')}</Link>
                        )}
                        {gameId && currentUser && (
                            <>
                                <button
                                    className="save-btn"
                                    onClick={handleSaveProgress}
                                    disabled={isSaving}
                                >
                                    {isSaving ? t('modelCreator.saving') : t('modelCreator.save')}
                                </button>
                                <button
                                    className="save-btn"
                                    onClick={handleFinishSubmit}
                                    disabled={isSaving || strokes.length === 0}
                                    style={{ background: '#4CAF50' }}
                                >
                                    {isSaving ? t('modelCreator.submitting') : t('modelCreator.finish')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="app-content">
                <div className="canvas-section">
                    <h2>{t('modelCreator.drawing2D')}</h2>
                    <DrawingCanvas
                        strokes={strokes}
                        onStrokesChange={setStrokes}
                        color={color}
                        strokeWidth={strokeWidth}
                        detailStrokeWidth={detailStrokeWidth}
                        backgroundImage={backgroundImage}
                        isMoveMode={isMoveMode}
                        onBackgroundMove={(dx, dy) => {
                            setBackgroundImage(prev => prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null);
                        }}
                    />
                </div>

                <div className="viewer-section">
                    <h2>{t('modelCreator.preview3D')}</h2>
                    <Viewer3D
                        strokes={strokes}
                        color={color}
                        extrusionDepth={extrusionDepth}
                        strokeWidth={strokeWidth}
                        detailStrokeWidth={detailStrokeWidth}
                        outerExpansion={outerExpansion}
                        innerGap={innerGap}
                        onGeometriesReady={(geometries, detailIdx) => {
                            setCurrentGeometries(geometries);
                            setDetailStartIndex(detailIdx);
                        }}
                    />
                </div>

                <div className="controls-section">
                    <Controls
                        detailStrokeWidth={detailStrokeWidth}
                        onDetailStrokeWidthChange={setDetailStrokeWidth}
                        onUndo={handleUndo}
                        canUndo={strokes.length > 0}
                        onClear={handleClear}
                        onExport3MF={handleExport3MF}
                        canExport={currentGeometries.length > 0}
                        backgroundImage={backgroundImage}
                        isMoveMode={isMoveMode}
                        onMoveModeToggle={setIsMoveMode}
                        onBackgroundUpload={handleBackgroundUpload}
                        onBackgroundRemove={handleBackgroundRemove}
                        onBackgroundChange={(updates) => {
                            setBackgroundImage(prev => prev ? { ...prev, ...updates } : null);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
