import { describe, it, expect } from 'vitest';
import {
    isPointNear,
    calculateCentroid,
    normalizeStrokes,
    isPointInPolygon,
    clipPathToPolygon,
    getOffsetPoints,
    resolvePathSelfIntersections,
    createExtrudedGeometry,
    createRibbonGeometry,
    createInsetFillGeometry,
} from './extrusionUtils';
import type { Point2D } from '../types';

// ─── isPointNear ────────────────────────────────────────────────────────────

describe('isPointNear', () => {
    it('returns true when points are the same', () => {
        expect(isPointNear({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(true);
    });

    it('returns true when distance < default threshold (20)', () => {
        expect(isPointNear({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(true);
    });

    it('returns false when distance >= default threshold (20)', () => {
        expect(isPointNear({ x: 0, y: 0 }, { x: 20, y: 0 })).toBe(false);
    });

    it('respects custom threshold', () => {
        expect(isPointNear({ x: 0, y: 0 }, { x: 5, y: 0 }, 3)).toBe(false);
        expect(isPointNear({ x: 0, y: 0 }, { x: 5, y: 0 }, 10)).toBe(true);
    });

    it('works with diagonal distance', () => {
        // sqrt(3^2 + 4^2) = 5, threshold 6 → true
        expect(isPointNear({ x: 0, y: 0 }, { x: 3, y: 4 }, 6)).toBe(true);
        // threshold 4 → false
        expect(isPointNear({ x: 0, y: 0 }, { x: 3, y: 4 }, 4)).toBe(false);
    });
});

// ─── calculateCentroid ──────────────────────────────────────────────────────

describe('calculateCentroid', () => {
    it('returns (0,0) for an empty array', () => {
        expect(calculateCentroid([])).toEqual({ x: 0, y: 0 });
    });

    it('returns the point itself for a single point', () => {
        expect(calculateCentroid([{ x: 3, y: 7 }])).toEqual({ x: 3, y: 7 });
    });

    it('returns bounding-box center for a square', () => {
        const square: Point2D[] = [
            { x: 0, y: 0 },
            { x: 4, y: 0 },
            { x: 4, y: 4 },
            { x: 0, y: 4 },
        ];
        expect(calculateCentroid(square)).toEqual({ x: 2, y: 2 });
    });

    it('returns bounding-box center for a triangle', () => {
        const triangle: Point2D[] = [
            { x: 0, y: 0 },
            { x: 6, y: 0 },
            { x: 3, y: 4 },
        ];
        expect(calculateCentroid(triangle)).toEqual({ x: 3, y: 2 });
    });
});

// ─── normalizeStrokes ────────────────────────────────────────────────────────

describe('normalizeStrokes', () => {
    it('returns empty array unchanged', () => {
        expect(normalizeStrokes([])).toEqual([]);
    });

    it('centers first stroke so its bounding-box mid lands at (0,0)', () => {
        const strokes: Point2D[][] = [
            [
                { x: 2, y: 2 },
                { x: 6, y: 2 },
                { x: 6, y: 6 },
                { x: 2, y: 6 },
            ],
        ];
        // centroid of first stroke: x=(2+6)/2=4, y=(2+6)/2=4
        const result = normalizeStrokes(strokes);
        const centroidAfter = {
            x: Math.min(...result[0].map(p => p.x)) + (Math.max(...result[0].map(p => p.x)) - Math.min(...result[0].map(p => p.x))) / 2,
            y: Math.min(...result[0].map(p => p.y)) + (Math.max(...result[0].map(p => p.y)) - Math.min(...result[0].map(p => p.y))) / 2,
        };
        expect(centroidAfter.x).toBeCloseTo(0);
        expect(centroidAfter.y).toBeCloseTo(0);
    });

    it('applies the same offset to all strokes', () => {
        const strokes: Point2D[][] = [
            [{ x: 10, y: 10 }, { x: 20, y: 10 }],
            [{ x: 30, y: 30 }],
        ];
        // centroid of first stroke: x=15, y=10
        const result = normalizeStrokes(strokes);
        expect(result[1][0]).toEqual({ x: 30 - 15, y: 30 - 10 });
    });
});

// ─── isPointInPolygon ────────────────────────────────────────────────────────

describe('isPointInPolygon', () => {
    const square: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ];

    it('returns true for a point clearly inside', () => {
        expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    });

    it('returns false for a point clearly outside', () => {
        expect(isPointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
        expect(isPointInPolygon({ x: -1, y: 5 }, square)).toBe(false);
    });

    it('handles a non-convex polygon', () => {
        // L-shaped polygon
        const lShape: Point2D[] = [
            { x: 0, y: 0 },
            { x: 4, y: 0 },
            { x: 4, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: 4 },
            { x: 0, y: 4 },
        ];
        expect(isPointInPolygon({ x: 1, y: 1 }, lShape)).toBe(true);
        expect(isPointInPolygon({ x: 3, y: 3 }, lShape)).toBe(false);
    });
});

// ─── clipPathToPolygon ───────────────────────────────────────────────────────

describe('clipPathToPolygon', () => {
    const square: Point2D[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ];

    it('returns empty array for a path with fewer than 2 points', () => {
        expect(clipPathToPolygon([{ x: 5, y: 5 }], square)).toEqual([]);
        expect(clipPathToPolygon([], square)).toEqual([]);
    });

    it('returns the full path when it lies completely inside the polygon', () => {
        const path: Point2D[] = [{ x: 2, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 8 }];
        const result = clipPathToPolygon(path, square);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(3);
    });

    it('returns empty when path lies completely outside the polygon', () => {
        const path: Point2D[] = [{ x: 15, y: 5 }, { x: 20, y: 5 }];
        const result = clipPathToPolygon(path, square);
        expect(result).toHaveLength(0);
    });

    it('clips a segment that crosses the polygon boundary', () => {
        // Path goes from outside (-5,5) to inside (5,5)
        const path: Point2D[] = [{ x: -5, y: 5 }, { x: 5, y: 5 }];
        const result = clipPathToPolygon(path, square);
        expect(result).toHaveLength(1);
        // First point should be near the boundary (x≈0)
        expect(result[0][0].x).toBeCloseTo(0);
        // Last point should be the inside endpoint
        expect(result[0][result[0].length - 1]).toEqual({ x: 5, y: 5 });
    });
});

// ─── getOffsetPoints ─────────────────────────────────────────────────────────

describe('getOffsetPoints', () => {
    it('returns empty array for fewer than 2 points', () => {
        expect(getOffsetPoints([], 1)).toEqual([]);
        expect(getOffsetPoints([{ x: 0, y: 0 }], 1)).toEqual([]);
    });

    it('offsets a horizontal line upward (positive distance)', () => {
        const line: Point2D[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
        const result = getOffsetPoints(line, 2);
        expect(result).toHaveLength(2);
        // Left normal of rightward segment is (0,1), so offset = +2 in y
        result.forEach(p => expect(p.y).toBeCloseTo(2));
    });

    it('offsets a horizontal line downward (negative distance)', () => {
        const line: Point2D[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
        const result = getOffsetPoints(line, -2);
        result.forEach(p => expect(p.y).toBeCloseTo(-2));
    });

    it('produces same number of points as input', () => {
        const line: Point2D[] = [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 10, y: 5 },
        ];
        expect(getOffsetPoints(line, 1)).toHaveLength(3);
    });
});

// ─── resolvePathSelfIntersections ────────────────────────────────────────────

describe('resolvePathSelfIntersections', () => {
    it('returns short paths unchanged', () => {
        const path: Point2D[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }];
        expect(resolvePathSelfIntersections(path)).toEqual(path);
    });

    it('returns open paths unchanged', () => {
        const path: Point2D[] = [
            { x: 0, y: 0 },
            { x: 5, y: 5 },
            { x: 10, y: 0 },
            { x: 15, y: 5 },
        ];
        expect(resolvePathSelfIntersections(path)).toEqual(path);
    });

    it('returns a simple closed polygon unchanged', () => {
        // Square closed path — no self-intersections
        const path: Point2D[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            { x: 0, y: 0 }, // closing point
        ];
        const result = resolvePathSelfIntersections(path);
        // Should still be a closed path with no crossings
        expect(result[0]).toEqual(result[result.length - 1]);
    });

    it('resolves a figure-eight self-intersection', () => {
        // Figure-eight: two loops sharing a crossing point at (5,5)
        // Loop 1: (0,0)→(10,0)→(10,10)→(0,10)→(0,0) with diagonal crossing
        // Simpler: bowtie shape where diagonals cross
        const bowtie: Point2D[] = [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 10, y: 0 },
            { x: 0, y: 10 },
            { x: 0, y: 0 }, // closing point
        ];
        const result = resolvePathSelfIntersections(bowtie);
        // Result should be a closed path without self-intersection
        expect(result[0]).toEqual(result[result.length - 1]);
        // And it should be shorter than the original (one loop removed)
        expect(result.length).toBeLessThan(bowtie.length);
    });
});

// ─── Three.js geometry functions ─────────────────────────────────────────────

describe('createExtrudedGeometry', () => {
    it('returns null for fewer than 3 points', () => {
        expect(createExtrudedGeometry([], 4)).toBeNull();
        expect(createExtrudedGeometry([{ x: 0, y: 0 }, { x: 1, y: 0 }], 4)).toBeNull();
    });

    it('returns geometry with vertices for a valid triangle', () => {
        const triangle: Point2D[] = [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 2.5, y: 5 },
        ];
        const geo = createExtrudedGeometry(triangle, 4);
        expect(geo).not.toBeNull();
        expect(geo!.attributes.position.count).toBeGreaterThan(0);
    });

    it('produces more vertices for a more complex polygon', () => {
        const triangle: Point2D[] = [
            { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 },
        ];
        const square: Point2D[] = [
            { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 },
        ];
        const geoTri = createExtrudedGeometry(triangle, 4);
        const geoSq = createExtrudedGeometry(square, 4);
        expect(geoSq!.attributes.position.count).toBeGreaterThanOrEqual(
            geoTri!.attributes.position.count
        );
    });
});

describe('createRibbonGeometry', () => {
    it('returns null for fewer than 2 points', () => {
        expect(createRibbonGeometry([], 2, 4)).toBeNull();
        expect(createRibbonGeometry([{ x: 0, y: 0 }], 2, 4)).toBeNull();
    });

    it('returns geometry with vertices for a simple line', () => {
        const line: Point2D[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
        const geo = createRibbonGeometry(line, 2, 4);
        expect(geo).not.toBeNull();
        expect(geo!.attributes.position.count).toBeGreaterThan(0);
    });

    it('handles offset parameter', () => {
        const line: Point2D[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
        const geo = createRibbonGeometry(line, 2, 4, 1);
        expect(geo).not.toBeNull();
    });
});

describe('createInsetFillGeometry', () => {
    it('returns null for fewer than 3 points', () => {
        expect(createInsetFillGeometry([], 1, 4)).toBeNull();
        expect(createInsetFillGeometry([{ x: 0, y: 0 }, { x: 1, y: 0 }], 1, 4)).toBeNull();
    });

    it('returns geometry with vertices for a valid polygon', () => {
        const square: Point2D[] = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
            { x: 0, y: 0 },
        ];
        const geo = createInsetFillGeometry(square, 1, 4);
        expect(geo).not.toBeNull();
        expect(geo!.attributes.position.count).toBeGreaterThan(0);
    });
});
