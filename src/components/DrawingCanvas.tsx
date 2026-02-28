import React, { useRef, useEffect, useState } from 'react';
import type { Point2D, Stroke } from '../types';
import { isPointNear } from '../utils/extrusionUtils';

interface DrawingCanvasProps {
    strokes: Stroke[];
    onStrokesChange: (strokes: Stroke[]) => void;
    color: string;
    strokeWidth: number;
    detailStrokeWidth: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    strokes,
    onStrokesChange,
    color,
    strokeWidth,
    detailStrokeWidth
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Point2D[]>([]);
    const CANVAS_SIZE = 500;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = '#1B5E20';
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
                ctx.fillStyle = '#00ff00';
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
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText('10cm', CANVAS_SIZE - 25, 12);
        ctx.fillText('10cm', 2, CANVAS_SIZE - 5);
    }, [strokes, isDrawing, currentStroke, color, detailStrokeWidth]);

    const getPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point2D => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        // Clamp to 5cm box
        return {
            x: Math.max(0, Math.min(CANVAS_SIZE, e.clientX - rect.left)),
            y: Math.max(0, Math.min(CANVAS_SIZE, e.clientY - rect.top))
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        setCurrentStroke([getPoint(e)]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const newPoint = getPoint(e);
        const lastPoint = currentStroke[currentStroke.length - 1];

        const dist = Math.sqrt(
            Math.pow(newPoint.x - lastPoint.x, 2) +
            Math.pow(newPoint.y - lastPoint.y, 2)
        );

        if (dist > 5) {
            setCurrentStroke(prev => [...prev, newPoint]);
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentStroke.length < 2) {
            setCurrentStroke([]);
            return;
        }

        let finalPoints = [...currentStroke];

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
        if (isDrawing) {
            handleMouseUp();
        }
    };

    return (
        <div style={{ position: 'relative', width: CANVAS_SIZE, height: CANVAS_SIZE }}>
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{
                    border: '2px solid #2E4A2E',
                    borderRadius: '4px',
                    cursor: 'crosshair',
                    backgroundColor: '#0F1A0F',
                    touchAction: 'none',
                    display: 'block'
                }}
            />
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                pointerEvents: 'none',
                border: '1px solid #2E4A2E'
            }}>
                {strokes.length === 0
                    ? 'Outline (Base Shape)'
                    : 'Detail (Clipped to base)'}
            </div>
        </div>
    );
};

