import * as THREE from 'three';
import React from 'react';
import type { Stroke } from '../types';
import { createRibbonGeometry, createInsetFillGeometry, clipPathToPolygon, getOffsetPoints, resolvePathSelfIntersections } from './extrusionUtils';

export interface BuildGeometriesOptions {
    color: string;
    extrusionDepth: number;
    strokeWidth: number;
    outerExpansion: number;
    innerGap: number;
}

export function buildGeometries(strokes: Stroke[], options: BuildGeometriesOptions): { meshes: React.ReactElement[], geometries: THREE.BufferGeometry[], detailStartIndex: number } {
    if (strokes.length === 0 || strokes[0].points.length < 2) {
        return { meshes: [], geometries: [], detailStartIndex: 0 };
    }

    const { color, extrusionDepth: depth, strokeWidth, outerExpansion, innerGap } = options;

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
    const basePoints = resolvePathSelfIntersections(normalizedStrokes[0].points);

    // Determine winding order for offset directions (Y up space)
    // @ts-expect-error ShapeUtils.isClockWise expects Vector2[] but Point2D works
    const isCW = THREE.ShapeUtils.isClockWise(basePoints);

    // 1. Outer Flange (Attached to outside)
    if (sOuterExp > 0) {
        const baseOffset = (sWidth / 2) + (sOuterExp / 2);
        const signedOffset = isCW ? baseOffset : -baseOffset;

        const outerGeo = createRibbonGeometry(basePoints, sOuterExp, sDepth, signedOffset);
        if (outerGeo) {
            outerGeo.computeVertexNormals();
            generatedGeometries.push(outerGeo);
            generatedMeshes.push(
                React.createElement('mesh', { key: "base-outer", geometry: outerGeo, castShadow: true, receiveShadow: true },
                    React.createElement('meshStandardMaterial', { color: color, side: THREE.DoubleSide })
                )
            );
        }
    }

    // 2. Main Wall (The drawn line - base layer)
    const wallGeo = createRibbonGeometry(basePoints, sWidth, sDepth, 0);
    if (wallGeo) {
        wallGeo.computeVertexNormals();
        generatedGeometries.push(wallGeo);
        generatedMeshes.push(
            React.createElement('mesh', { key: "base-wall", geometry: wallGeo, castShadow: true, receiveShadow: true },
                React.createElement('meshStandardMaterial', { color: color, side: THREE.DoubleSide })
            )
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
                React.createElement('mesh', { key: "base-inner-fill", geometry: fillGeo, castShadow: true, receiveShadow: true },
                    React.createElement('meshStandardMaterial', { color: color, side: THREE.DoubleSide })
                )
            );
        }
    }

    // 4. Base Rim (Inner edge of outer base, junction of wall/flange)
    const rimOffset = (sWidth / 2) + (rimWidth / 2);
    const signedRimOffset = isCW ? -rimOffset : rimOffset;
    const rimGeo = createRibbonGeometry(basePoints, rimWidth, 10.0, signedRimOffset);
    if (rimGeo) {
        rimGeo.computeVertexNormals();
        const rimGeoExport = rimGeo.clone();
        rimGeoExport.translate(0, 0, sDepth);
        generatedGeometries.push(rimGeoExport);
        generatedMeshes.push(
            React.createElement('mesh', { key: "base-rim", geometry: rimGeo, position: [0, 0, sDepth], castShadow: true, receiveShadow: true },
                React.createElement('meshStandardMaterial', { color: '#ffffff', side: THREE.DoubleSide })
            )
        );
    }

    const detailStartIndex = generatedGeometries.length;

    // --- OTHER STROKES (Decorations) ---
    for (let i = 1; i < normalizedStrokes.length; i++) {
        const stroke = normalizedStrokes[i];
        const rawDetail = stroke.points;
        const sStrokeWidth = stroke.width;

        const clippedPaths = clipPathToPolygon(rawDetail, innerFillBoundary);

        clippedPaths.forEach((path, pathIndex) => {
            const ribbonGeo = createRibbonGeometry(path, sStrokeWidth, 4.0, 0);
            if (ribbonGeo) {
                ribbonGeo.computeVertexNormals();
                const ribbonGeoExport = ribbonGeo.clone();
                ribbonGeoExport.translate(0, 0, sDepth);
                generatedGeometries.push(ribbonGeoExport);
                generatedMeshes.push(
                    React.createElement('mesh', { key: `detail-${i}-${pathIndex}`, geometry: ribbonGeo, position: [0, 0, sDepth], castShadow: true, receiveShadow: true },
                        React.createElement('meshStandardMaterial', { color: '#ffffff', side: THREE.DoubleSide })
                    )
                );
            }
        });
    }

    return { meshes: generatedMeshes, geometries: generatedGeometries, detailStartIndex };
}
