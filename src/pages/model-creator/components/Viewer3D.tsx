import React, { useEffect, useMemo, useRef } from 'react';
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

import { buildGeometries } from '../utils/geometryBuilder';

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
        return buildGeometries(strokes, {
            color,
            extrusionDepth: depth,
            strokeWidth,
            outerExpansion,
            innerGap
        });
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
