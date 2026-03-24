import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Stroke } from '../types';


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
            <lineBasicMaterial color="#4A2E1A" transparent opacity={0.6} />
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
    onGeometriesReady?: (geometries: THREE.BufferGeometry[], detailStartIndex: number) => void;
}

import { buildGeometries, buildCookieGeometries } from '../utils/geometryBuilder';

const SceneContent: React.FC<{
    strokes: Stroke[];
    color: string;
    depth: number;
    strokeWidth: number;
    outerExpansion: number;
    innerGap: number;
    cookieView: boolean;
    onGeometriesReady?: (geometries: THREE.BufferGeometry[], detailStartIndex: number) => void;
}> = ({ strokes, color, depth, strokeWidth, outerExpansion, innerGap, cookieView, onGeometriesReady }) => {
    // Form geometries — always computed, used for export
    const formResult = useMemo(() => {
        return buildGeometries(strokes, {
            color,
            extrusionDepth: depth,
            strokeWidth,
            outerExpansion,
            innerGap,
        });
    }, [strokes, depth, color, strokeWidth, outerExpansion, innerGap]);

    // Cookie geometries — only computed when cookie view is active
    const cookieResult = useMemo(() => {
        if (!cookieView) return null;
        return buildCookieGeometries(strokes, { strokeWidth });
    }, [strokes, strokeWidth, cookieView]);

    // Keep callback in a ref so it never appears in the effect dependency array,
    // preventing the render loop: geometries change → setCurrentGeometries → App re-renders
    // → new prop reference → effect re-fires → infinite loop → grid flash.
    const onGeometriesReadyRef = useRef(onGeometriesReady);
    useEffect(() => { onGeometriesReadyRef.current = onGeometriesReady; });

    // Export always uses the form geometries regardless of view mode
    useEffect(() => {
        onGeometriesReadyRef.current?.(formResult.geometries, formResult.detailStartIndex);
    }, [formResult.geometries, formResult.detailStartIndex]);

    const meshes = cookieView ? (cookieResult?.meshes ?? []) : formResult.meshes;

    return (
        <group>{meshes}</group>
    );
};

export const Viewer3D: React.FC<Viewer3DProps> = (props) => {
    const { t } = useTranslation();
    const [cookieView, setCookieView] = useState(false);
    return (
        <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', border: '2px solid #4A2E1A', borderRadius: '8px', overflow: 'hidden', touchAction: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Canvas
                shadows
                camera={{ position: [50, -50, 150], fov: 50 }}
                style={{ background: '#150C07', touchAction: 'none' }}
            >
                <ambientLight intensity={cookieView ? 0.7 : 0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />
                {cookieView && <pointLight position={[0, 0, 30]} intensity={0.6} color="#fff8e7" />}

                <SceneContent {...props} depth={props.extrusionDepth} cookieView={cookieView} />

                <SimpleGrid size={150} divisions={30} centerX={50} centerY={-50} />

                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    target={[50, -50, 0]}
                    minDistance={20}
                    maxDistance={500}
                />
            </Canvas>

            <button
                onClick={() => setCookieView(v => !v)}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: cookieView ? 'rgba(212,160,23,0.25)' : 'rgba(30,17,9,0.85)',
                    border: `1px solid ${cookieView ? '#D4A017' : 'rgba(212,160,23,0.3)'}`,
                    color: cookieView ? '#F0D06E' : '#C4A882',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    zIndex: 10,
                }}
            >
                {cookieView ? t('viewer.cookieViewOn') : t('viewer.cookieViewOff')}
            </button>

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
                    {t('canvas.emptyState')}
                </div>
            )}
          </div>
        </div>
    );
};
