import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Stroke } from '../types';
import { createRibbonGeometry, createInsetFillGeometry, clipPathToPolygon, getOffsetPoints } from '../utils/extrusionUtils';

/** Stable, shader-free grid built from LineSegments — no flashing. */
const SimpleGrid: React.FC<{ size: number; divisions: number; centerX: number; centerY: number }> = (
    { size, divisions, centerX, centerY }
) => {
    const geometry = useMemo(() => {
        const step = size / divisions;
        const half = size / 2;
        const positions: number[] = [];

        for (let i = 0; i <= divisions; i++) {
            const t = -half + i * step;
            const isMajor = i % 10 === 0;
            // Lines along X
            positions.push(-half, t, 0, half, t, 0);
            // Lines along Y
            positions.push(t, -half, 0, t, half, 0);
            void isMajor; // used below for colour
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        return geo;
    }, [size, divisions]);

    return (
        <lineSegments geometry={geometry} position={[centerX, centerY, -1]}>
            <lineBasicMaterial color="#1B5E20" transparent opacity={0.6} />
        </lineSegments>
    );
};

interface Viewer3DProps {
    strokes: Stroke[];
    color: string;
    extrusionDepth: number;
    strokeWidth: number;
    detailStrokeWidth: number;
    outerExpansion: number;
    innerGap: number;
    onGeometriesReady?: (geometries: THREE.BufferGeometry[]) => void;
}

const SceneContent: React.FC<{
    strokes: Stroke[];
    color: string;
    depth: number;
    strokeWidth: number;
    outerExpansion: number;
    innerGap: number;
    onGeometriesReady?: (geometries: THREE.BufferGeometry[]) => void;
}> = ({ strokes, color, depth, strokeWidth, outerExpansion, innerGap, onGeometriesReady }) => {
    // Generate geometries
    const { meshes, geometries } = useMemo(() => {
        if (strokes.length === 0 || strokes[0].points.length < 2) {
            return { meshes: [], geometries: [] };
        }

        const normalizedStrokes = strokes.map(s => ({
            ...s,
            points: s.points.map(p => ({ x: p.x * 0.2, y: -p.y * 0.2 }))
        }));

        const generatedGeometries: THREE.BufferGeometry[] = [];
        const generatedMeshes: React.ReactElement[] = [];

        // Scale factors: Input is in mm, scene is scaled 1.0
        const sWidth = strokeWidth;
        const sOuterExp = outerExpansion;
        const sInnerGap = innerGap;
        const sDepth = depth; // 4mm -> 4.0 units in scene
        const rimWidth = sWidth * 0.8;

        // --- STROKE 0 (The Main Base) ---
        const basePoints = normalizedStrokes[0].points;

        // Determine winding order for offset directions (Y up space)
        const formattedPoints = basePoints.map(p => [p.x, p.y]);
        const isCW = THREE.ShapeUtils.isClockWise(formattedPoints as any);

        // 1. Outer Flange (Attached to outside)
        if (sOuterExp > 0) {
            // Offset starts at edges of main stroke
            // Center of outer flange is at W/2 + Exp/2
            // CCW (isCW=false): Left Normal points INWARD (+offset). 
            // To go OUTWARD, we need negative offset.
            // CW (isCW=true): Left Normal points OUTWARD (-offset).
            // To go OUTWARD, we need positive offset.
            const baseOffset = (sWidth / 2) + (sOuterExp / 2);
            const signedOffset = isCW ? baseOffset : -baseOffset;

            const outerGeo = createRibbonGeometry(basePoints, sOuterExp, sDepth, signedOffset);
            if (outerGeo) {
                outerGeo.computeVertexNormals();
                generatedGeometries.push(outerGeo);
                generatedMeshes.push(
                    <mesh key="base-outer" geometry={outerGeo} castShadow receiveShadow>
                        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                    </mesh>
                );
            }
        }

        // 2. Main Wall (The drawn line - base layer)
        const wallGeo = createRibbonGeometry(basePoints, sWidth, sDepth, 0);
        if (wallGeo) {
            wallGeo.computeVertexNormals();
            generatedGeometries.push(wallGeo);
            generatedMeshes.push(
                <mesh key="base-wall" geometry={wallGeo} castShadow receiveShadow>
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            );
        }

        // 3. Inner Fill & Boundary (for clipping)
        const insetAmount = (sWidth / 2) + rimWidth + sInnerGap;
        const innerFillBoundary = getOffsetPoints(basePoints, isCW ? -insetAmount : insetAmount);

        if (normalizedStrokes[0].points.length >= 3) {
            const fillGeo = createInsetFillGeometry(basePoints, insetAmount, sDepth);
            if (fillGeo) {
                fillGeo.computeVertexNormals();
                generatedGeometries.push(fillGeo);
                generatedMeshes.push(
                    <mesh key="base-inner-fill" geometry={fillGeo} castShadow receiveShadow>
                        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                    </mesh>
                );
            }
        }

        // 4. Base Rim (Inner edge of outer base, junction of wall/flange)
        // Fixed to 10mm height (10.0 scene units) - ATTACHED TO INTERIOR FACE
        const rimOffset = (sWidth / 2) + (rimWidth / 2);
        const signedRimOffset = isCW ? -rimOffset : rimOffset;
        const rimGeo = createRibbonGeometry(basePoints, rimWidth, 10.0, signedRimOffset);
        if (rimGeo) {
            rimGeo.computeVertexNormals();
            // Clone with baked Z-offset for export (so 3MF/STL matches preview)
            const rimGeoExport = rimGeo.clone();
            rimGeoExport.translate(0, 0, sDepth);
            generatedGeometries.push(rimGeoExport);
            generatedMeshes.push(
                <mesh key="base-rim" geometry={rimGeo} position={[0, 0, sDepth]} castShadow receiveShadow>
                    <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
                </mesh>
            );
        }

        // --- OTHER STROKES (Decorations) ---
        // CLIPPED to inner base fill boundary. Each stroke uses its own stored width.
        for (let i = 1; i < normalizedStrokes.length; i++) {
            const stroke = normalizedStrokes[i];
            const rawDetail = stroke.points;
            const sStrokeWidth = stroke.width;

            // Clip the decoration path using the fill boundary
            const clippedPaths = clipPathToPolygon(rawDetail, innerFillBoundary);

            clippedPaths.forEach((path, pathIndex) => {
                const ribbonGeo = createRibbonGeometry(path, sStrokeWidth, 4.0, 0);
                if (ribbonGeo) {
                    ribbonGeo.computeVertexNormals();
                    // Clone with baked Z-offset for export (so 3MF/STL matches preview)
                    const ribbonGeoExport = ribbonGeo.clone();
                    ribbonGeoExport.translate(0, 0, sDepth);
                    generatedGeometries.push(ribbonGeoExport);
                    generatedMeshes.push(
                        <mesh key={`detail-${i}-${pathIndex}`} geometry={ribbonGeo} position={[0, 0, sDepth]} castShadow receiveShadow>
                            <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
                        </mesh>
                    );
                }
            });
        }

        return { meshes: generatedMeshes, geometries: generatedGeometries };
    }, [strokes, depth, color, strokeWidth, outerExpansion, innerGap]);

    // Keep callback in a ref so it never appears in the effect dependency array,
    // preventing the render loop: geometries change → setCurrentGeometries → App re-renders
    // → new prop reference → effect re-fires → infinite loop → grid flash.
    const onGeometriesReadyRef = useRef(onGeometriesReady);
    useEffect(() => { onGeometriesReadyRef.current = onGeometriesReady; });

    // Notify parent only when geometries actually change
    useEffect(() => {
        onGeometriesReadyRef.current?.(geometries);
    }, [geometries]);

    return <group>{meshes}</group>;
};

export const Viewer3D: React.FC<Viewer3DProps> = (props) => {
    return (
        <div style={{ width: '600px', height: '600px', border: '2px solid #2E4A2E', borderRadius: '8px', overflow: 'hidden' }}>
            <Canvas
                shadows
                camera={{ position: [50, -50, 150], fov: 50 }}
                style={{ background: '#0F1A0F' }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />

                <SceneContent {...props} depth={props.extrusionDepth} />

                <SimpleGrid size={150} divisions={30} centerX={50} centerY={-50} />

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    target={[50, -50, 0]}
                    minDistance={20}
                    maxDistance={300}
                />
            </Canvas>

            {props.strokes.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.8)',
                    color: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                }}>
                    Draw a shape to see 3D preview
                </div>
            )}
        </div>
    );
};
