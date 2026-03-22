import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n';
import type { Point2D, Stroke, BackgroundImage } from '../types';
import { isPointNear } from '../utils/extrusionUtils';

interface DrawingCanvasProps {
    strokes: Stroke[];
    onStrokesChange: (strokes: Stroke[]) => void;
    color: string;
    strokeWidth: number;
    detailStrokeWidth: number;
    backgroundImage: BackgroundImage | null;
    isMoveMode: boolean;
    onBackgroundMove: (dx: number, dy: number) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    strokes,
    onStrokesChange,
    color,
    strokeWidth,
    detailStrokeWidth,
    backgroundImage,
    isMoveMode,
    onBackgroundMove,
}) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Point2D[]>([]);
    const [dragStart, setDragStart] = useState<Point2D | null>(null);
    const [rawLoadedBgImage, setRawLoadedBgImage] = useState<HTMLImageElement | null>(null);
    const CANVAS_SIZE = 500;

    // Load background image when dataUrl changes
    const bgDataUrl = backgroundImage?.dataUrl;
    useEffect(() => {
        if (!bgDataUrl) return;
        const img = new Image();
        img.onload = () => setRawLoadedBgImage(img);
        img.src = bgDataUrl;
    }, [bgDataUrl]);

    // Derived: null when no background, stale image cleared automatically
    const loadedBgImage = backgroundImage ? rawLoadedBgImage : null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background image
        if (loadedBgImage && backgroundImage) {
            ctx.save();
            ctx.globalAlpha = backgroundImage.opacity;
            const drawWidth = loadedBgImage.naturalWidth * backgroundImage.scale;
            const drawHeight = loadedBgImage.naturalHeight * backgroundImage.scale;
            ctx.drawImage(
                loadedBgImage,
                backgroundImage.x - drawWidth / 2,
                backgroundImage.y - drawHeight / 2,
                drawWidth,
                drawHeight
            );
            ctx.restore();
        }

        // Draw grid lines
        ctx.strokeStyle = '#4A2E1A';
        ctx.lineWidth = 1;
        for (let i = 0; i <= CANVAS_SIZE; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(CANVAS_SIZE, i);
            ctx.stroke();
        }

        // Draw visual boundary
        ctx.strokeStyle = '#D4A017';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.setLineDash([]);

        // Helper to draw a stroke
        const drawStroke = (points: Point2D[], isOuter: boolean, isCurrent: boolean, width: number) => {
            if (points.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }

            if (isOuter) {
                if (!isCurrent) {
                    ctx.closePath();
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.3;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
                ctx.lineWidth = 5; // 1mm Wall = 5px at 10cm/500px scale
                ctx.strokeStyle = color;
            } else {
                ctx.lineWidth = width * 5; // 1mm = 5px at 10cm/500px scale
                ctx.strokeStyle = '#ffffff';
            }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            if (isOuter && isCurrent) {
                ctx.beginPath();
                ctx.arc(points[0].x, points[0].y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#D4A017';
                ctx.fill();
            }
        };

        // Draw finished strokes
        strokes.forEach((stroke: Stroke, index: number) => {
            drawStroke(stroke.points, index === 0, false, stroke.width);
        });

        // Draw current stroke
        if (isDrawing && currentStroke.length > 0) {
            drawStroke(currentStroke, strokes.length === 0, true, strokes.length === 0 ? 3 : detailStrokeWidth);
        }

        // Add labels
        ctx.fillStyle = '#C4A882';
        ctx.font = '10px Arial';
        ctx.fillText(t('canvas.size'), CANVAS_SIZE - 25, 12);
        ctx.fillText(t('canvas.size'), 2, CANVAS_SIZE - 5);
    }, [strokes, isDrawing, currentStroke, color, detailStrokeWidth, t, backgroundImage, loadedBgImage]);

    const getPoint = (clientX: number, clientY: number): Point2D => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        return {
            x: Math.max(0, Math.min(CANVAS_SIZE, (clientX - rect.left) * scaleX)),
            y: Math.max(0, Math.min(CANVAS_SIZE, (clientY - rect.top) * scaleY))
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isMoveMode && backgroundImage) {
            setDragStart(getPoint(e.clientX, e.clientY));
            return;
        }
        setIsDrawing(true);
        setCurrentStroke([getPoint(e.clientX, e.clientY)]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isMoveMode && dragStart) {
            const pt = getPoint(e.clientX, e.clientY);
            onBackgroundMove(pt.x - dragStart.x, pt.y - dragStart.y);
            setDragStart(pt);
            return;
        }
        if (!isDrawing) return;

        const newPoint = getPoint(e.clientX, e.clientY);
        const lastPoint = currentStroke[currentStroke.length - 1];

        const dist = Math.sqrt(
            Math.pow(newPoint.x - lastPoint.x, 2) +
            Math.pow(newPoint.y - lastPoint.y, 2)
        );

        if (dist > 5) {
            setCurrentStroke(prev => [...prev, newPoint]);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const touch = e.touches[0];
        if (isMoveMode && backgroundImage) {
            setDragStart(getPoint(touch.clientX, touch.clientY));
            return;
        }
        setIsDrawing(true);
        setCurrentStroke([getPoint(touch.clientX, touch.clientY)]);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const touch = e.touches[0];
        if (isMoveMode && dragStart) {
            const pt = getPoint(touch.clientX, touch.clientY);
            onBackgroundMove(pt.x - dragStart.x, pt.y - dragStart.y);
            setDragStart(pt);
            return;
        }
        if (!isDrawing) return;
        const newPoint = getPoint(touch.clientX, touch.clientY);
        const lastPoint = currentStroke[currentStroke.length - 1];
        const dist = Math.sqrt(
            Math.pow(newPoint.x - lastPoint.x, 2) +
            Math.pow(newPoint.y - lastPoint.y, 2)
        );
        if (dist > 5) {
            setCurrentStroke(prev => [...prev, newPoint]);
        }
    };

    const handleTouchEnd = () => {
        if (isMoveMode) {
            setDragStart(null);
            return;
        }
        handleMouseUp();
    };

    const handleMouseUp = () => {
        if (isMoveMode) {
            setDragStart(null);
            return;
        }
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentStroke.length < 2) {
            setCurrentStroke([]);
            return;
        }

        const finalPoints = [...currentStroke];

        if (strokes.length === 0) {
            const start = finalPoints[0];
            const end = finalPoints[finalPoints.length - 1];
            if (isPointNear(start, end, 30)) {
                finalPoints.push({ x: start.x, y: start.y });
            } else {
                finalPoints.push({ x: start.x, y: start.y });
            }
        }

        const newStroke: Stroke = {
            points: finalPoints,
            width: strokes.length === 0 ? strokeWidth : detailStrokeWidth
        };

        onStrokesChange([...strokes, newStroke]);
        setCurrentStroke([]);
    };

    const handleMouseLeave = () => {
        if (isMoveMode) {
            setDragStart(null);
            return;
        }
        if (isDrawing) {
            handleMouseUp();
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    border: '2px solid #4A2E1A',
                    borderRadius: '4px',
                    cursor: isMoveMode ? 'move' : 'crosshair',
                    backgroundColor: '#150C07',
                    touchAction: 'none',
                    display: 'block',
                    width: '100%',
                    height: '100%',
                }}
            />
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: isMoveMode ? 'rgba(30,80,180,0.7)' : 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                pointerEvents: 'none',
                border: isMoveMode ? '1px solid rgba(138,180,248,0.5)' : '1px solid #4A2E1A'
            }}>
                {isMoveMode
                    ? t('canvas.movePhotoMode')
                    : strokes.length === 0
                        ? t('canvas.outlineMode')
                        : t('canvas.detailMode')}
            </div>
        </div>
    );
};
