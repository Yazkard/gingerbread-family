import * as THREE from 'three';
import type { Point2D } from '../types';

/**
 * Converts 2D points to a Three.js ExtrudeGeometry
 */
export function createExtrudedGeometry(
    points: Point2D[],
    depth: number
): THREE.ExtrudeGeometry | null {
    if (points.length < 3) {
        return null;
    }

    // Create a shape from the points
    const shape = new THREE.Shape();

    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
    }
    shape.lineTo(points[0].x, points[0].y); // Close the shape

    // Extrude settings
    const extrudeSettings = {
        depth: depth,
        bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Computes offset points along the normals of a path, handling closed loops and miters
 */
export function getOffsetPoints(points: Point2D[], distance: number): Point2D[] {
    if (points.length < 2) return [];

    const offsetPoints: Point2D[] = [];
    const isClosed = isPointNear(points[0], points[points.length - 1], 1.0);
    const miterLimit = 5.0; // Prevent extreme spikes

    for (let i = 0; i < points.length; i++) {
        const current = points[i];

        let prev: Point2D;
        let next: Point2D;

        if (isClosed) {
            // For closed loops, wrap around
            prev = i === 0 ? points[points.length - 2] : points[i - 1];
            next = i === points.length - 1 ? points[1] : points[i + 1];
        } else {
            // For open lines, use adjacent points or extend
            if (i === 0) {
                const dx = points[1].x - current.x;
                const dy = points[1].y - current.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const normal = { x: -dy / len, y: dx / len };
                offsetPoints.push({
                    x: current.x + normal.x * distance,
                    y: current.y + normal.y * distance
                });
                continue;
            } else if (i === points.length - 1) {
                const dx = current.x - points[i - 1].x;
                const dy = current.y - points[i - 1].y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const normal = { x: -dy / len, y: dx / len };
                offsetPoints.push({
                    x: current.x + normal.x * distance,
                    y: current.y + normal.y * distance
                });
                continue;
            }
            prev = points[i - 1];
            next = points[i + 1];
        }

        // Calculate segment normals
        const dx1 = current.x - prev.x;
        const dy1 = current.y - prev.y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const n1 = { x: -dy1 / len1, y: dx1 / len1 };

        const dx2 = next.x - current.x;
        const dy2 = next.y - current.y;
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const n2 = { x: -dy2 / len2, y: dx2 / len2 };

        // Average normal (bisector)
        const nx = (n1.x + n2.x);
        const ny = (n1.y + n2.y);
        const nLen = Math.sqrt(nx * nx + ny * ny);

        if (nLen < 0.0001) {
            // Parallel or opposite segments
            offsetPoints.push({
                x: current.x + n1.x * distance,
                y: current.y + n1.y * distance
            });
        } else {
            // Miter calculation
            // cos(theta) = n1 dot bisector / (len(n1) * len(bisector))
            const bisector = { x: nx / nLen, y: ny / nLen };
            const cosTheta = n1.x * bisector.x + n1.y * bisector.y;

            // Miter distance = distance / cos(theta)
            let miterDist = distance / cosTheta;

            // Clamp miter to avoid infinite spikes
            if (Math.abs(miterDist) > Math.abs(distance) * miterLimit) {
                miterDist = Math.sign(miterDist) * Math.abs(distance) * miterLimit;
            }

            offsetPoints.push({
                x: current.x + bisector.x * miterDist,
                y: current.y + bisector.y * miterDist
            });
        }
    }

    return offsetPoints;
}

/**
 * Creates a thickened ribbon geometry from a line of points
 */
/**
 * Builds a single-pass stroke outline matching Canvas 2D lineCap='round' + lineJoin='round'.
 * Works for both open and closed paths.
 *
 * Algorithm:
 *  - Computes per-segment directions and left-normals.
 *  - Traces one full continuous outline:
 *      right side (start→end) with round joins on convex-right corners
 *      → round end-cap (if open)
 *      → left side (end→start) with round joins on convex-left corners
 *      → round start-cap (if open)
 *  - Returns points suitable for THREE.Shape → ExtrudeGeometry.
 */
function buildStrokeOutline(
    points: Point2D[],
    halfWidth: number,
    offset: number,
    arcSteps: number
): Point2D[] {
    const n = points.length;
    const isClosed = isPointNear(points[0], points[n - 1], 1.0);

    // Per-segment unit direction vectors and left-perpendicular normals
    const segCount = isClosed ? n - 1 : n - 1;
    const dirs: { x: number; y: number }[] = [];
    const norms: { x: number; y: number }[] = [];
    for (let i = 0; i < segCount; i++) {
        const ax = points[i].x, ay = points[i].y;
        const bx = points[i + 1].x, by = points[i + 1].y;
        const dx = bx - ax, dy = by - ay;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dirs.push({ x: dx / len, y: dy / len });
        norms.push({ x: -dy / len, y: dx / len }); // 90° CCW = left normal
    }

    // Offset factors for left (+) and right (-) sides
    const rL = offset + halfWidth;
    const rR = offset - halfWidth;

    // Helper: add arc points centred at (cx,cy) radius r sweeping from a0 to a1
    //   positive delta = CCW, negative = CW
    const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number): Point2D[] => {
        const pts: Point2D[] = [];
        const steps = Math.max(1, Math.round(Math.abs(a1 - a0) / Math.PI * arcSteps));
        for (let k = 0; k <= steps; k++) {
            const a = a0 + (k / steps) * (a1 - a0);
            pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        return pts;
    };

    // Build a side of the outline from segment startSeg to endSeg (inclusive ends)
    // side: 1 = left (use rL), -1 = right (use rR)
    // direction of traversal: forward (start→end) or backward (end→start)
    //
    // We trace each vertex.  At each interior join vertex we detect the turn direction:
    //   convex on this side → add a rounding arc centred at the vertex
    //   concave on this side → simple bevel (just connect)
    const traceSide = (
        segStart: number, segEnd: number,  // inclusive range of segment indices
        side: number,                       // +1 = left side, -1 = right side
        forward: boolean                    // true = segments go segStart..segEnd, false = reversed
    ): Point2D[] => {
        const r = side > 0 ? rL : rR;
        const result: Point2D[] = [];
        const segs = forward
            ? range(segStart, segEnd)      // [segStart, ..., segEnd]
            : range(segEnd, segStart, -1); // [segEnd, ..., segStart]

        for (let si = 0; si < segs.length; si++) {
            const s = segs[si];
            const norm = norms[s];

            if (si === 0) {
                // First segment: add start point
                const p = forward ? points[s] : points[s + 1];
                result.push({ x: p.x + r * norm.x, y: p.y + r * norm.y });
            }

            // End point of this segment in traversal order
            const p = forward ? points[s + 1] : points[s];
            result.push({ x: p.x + r * norm.x, y: p.y + r * norm.y });

            // Handle join to next segment (if not the last)
            if (si < segs.length - 1) {
                const sNext = segs[si + 1];
                const normNext = norms[sNext];

                // Cross product of the two segment directions tells us turn direction
                // For "forward" traversal we compare consecutive dirs;
                // for "backward" traversal the effective direction is reversed so cross flips sign.
                const dA = forward ? dirs[s] : { x: -dirs[s].x, y: -dirs[s].y };
                const dB = forward ? dirs[sNext] : { x: -dirs[sNext].x, y: -dirs[sNext].y };
                const cross = dA.x * dB.y - dA.y * dB.x;

                // side > 0 (left side):  convex when cross < 0 (right turn)
                // side < 0 (right side): convex when cross > 0 (left turn)
                const convex = side > 0 ? cross < 0 : cross > 0;

                if (convex) {
                    // Outer (convex) side: rounding arc centred at the join vertex
                    const vx = p.x, vy = p.y;
                    const angle0 = Math.atan2(norm.y * r, norm.x * r);
                    const angle1 = Math.atan2(normNext.y * r, normNext.x * r);

                    // Sweep the short way around: for convex right side, go CW (negative delta)
                    // for convex left side, go CCW (positive delta)
                    let delta = angle1 - angle0;
                    if (side > 0) {
                        // Left side: convex on right turn → arc goes CW (negative)
                        while (delta > 0) delta -= Math.PI * 2;
                        if (delta < -Math.PI) delta += Math.PI * 2; // keep short arc
                    } else {
                        // Right side: convex on left turn → arc goes CCW (positive)
                        while (delta < 0) delta += Math.PI * 2;
                        if (delta > Math.PI) delta -= Math.PI * 2; // keep short arc
                    }

                    const arcSegments = arcPts(vx, vy, Math.abs(r), angle0, angle0 + delta);
                    for (const pt of arcSegments) result.push(pt);
                }
                // Concave side: the two line segments naturally meet near the vertex; just continue
            }
        }
        return result;
    };

    // ---- Assemble the full outline ----
    const outline: Point2D[] = [];

    if (isClosed) {
        // Closed loop: use simple miter-offset points — clean, no artifacts.
        // Round joins are only needed for open strokes where ends are visible.
        const leftPoints = getOffsetPoints(points, rL);
        const rightPoints = getOffsetPoints(points, rR);
        leftPoints.forEach(p => outline.push(p));
        for (let i = rightPoints.length - 1; i >= 0; i--) outline.push(rightPoints[i]);
    } else {
        // Open: right-side forward → end cap → left-side backward → start cap
        const rightSide = traceSide(0, segCount - 1, -1, true);
        rightSide.forEach(p => outline.push(p));

        // End cap: semicircle centred at last point, from right-normal to left-normal, sweeping CCW
        const endPt = points[n - 1];
        const endNorm = norms[segCount - 1];
        const endAngleR = Math.atan2(endNorm.y * rR, endNorm.x * rR); // right side angle at end
        const endAngleL = Math.atan2(endNorm.y * rL, endNorm.x * rL); // left side angle at end
        let endDelta = endAngleL - endAngleR;
        while (endDelta < 0) endDelta += Math.PI * 2;
        if (endDelta > Math.PI) endDelta -= Math.PI * 2;
        const endCap = arcPts(endPt.x, endPt.y, halfWidth, endAngleR, endAngleR + endDelta);
        endCap.forEach(p => outline.push(p));

        // Left side reversed (end → start)
        const leftSide = traceSide(0, segCount - 1, +1, false);
        leftSide.forEach(p => outline.push(p));

        // Start cap: semicircle centred at first point, from left-normal to right-normal, sweeping CCW
        const startPt = points[0];
        const startNorm = norms[0];
        const startAngleL = Math.atan2(startNorm.y * rL, startNorm.x * rL);
        const startAngleR = Math.atan2(startNorm.y * rR, startNorm.x * rR);
        let startDelta = startAngleR - startAngleL;
        while (startDelta < 0) startDelta += Math.PI * 2;
        if (startDelta > Math.PI) startDelta -= Math.PI * 2;
        const startCap = arcPts(startPt.x, startPt.y, halfWidth, startAngleL, startAngleL + startDelta);
        startCap.forEach(p => outline.push(p));
    }

    return outline;
}

/** Simple integer range helper */
function range(from: number, to: number, step = 1): number[] {
    const arr: number[] = [];
    if (step > 0) for (let i = from; i <= to; i += step) arr.push(i);
    else for (let i = from; i >= to; i += step) arr.push(i);
    return arr;
}

/**
 * Creates a thickened ribbon geometry from a line of points.
 * The outline matches Canvas 2D lineCap='round' + lineJoin='round'.
 */
export function createRibbonGeometry(
    points: Point2D[],
    width: number,
    depth: number,
    offset: number = 0
): THREE.ExtrudeGeometry | null {
    if (points.length < 2) return null;

    const halfWidth = width / 2;
    const outline = buildStrokeOutline(points, halfWidth, offset, 8);
    if (outline.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(outline[0].x, outline[0].y);
    for (let i = 1; i < outline.length; i++) {
        shape.lineTo(outline[i].x, outline[i].y);
    }
    shape.lineTo(outline[0].x, outline[0].y);

    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}


/**
 * Creates a filled geometry that is inset from a loop
 */
export function createInsetFillGeometry(
    points: Point2D[],
    inset: number,
    depth: number
): THREE.ExtrudeGeometry | null {
    if (points.length < 3) return null;

    // Determine winding order to know which way is "in"
    // In THREE.ShapeUtils, points are [x, y] arrays
    const formattedPoints = points.map(p => [p.x, p.y]);
    const isCW = THREE.ShapeUtils.isClockWise(formattedPoints as any);

    // In Three.js coordinate system (Y up):
    // CCW loop: Left normal points INWARD. (+distance)
    // CW loop: Left normal points OUTWARD. (-distance)
    // isClockWise(CCW) = false. isClockWise(CW) = true.
    const insetPoints = getOffsetPoints(points, isCW ? -inset : inset);

    if (insetPoints.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(insetPoints[0].x, insetPoints[0].y);
    for (let i = 1; i < insetPoints.length; i++) {
        shape.lineTo(insetPoints[i].x, insetPoints[i].y);
    }
    shape.lineTo(insetPoints[0].x, insetPoints[0].y);

    return new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: false
    });
}

/**
 * Checks if a point is inside a polygon using ray-casting algorithm
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Clips a 2D path (array of points) to be strictly inside a polygon
 * Returns an array of paths (since clipping can split a single path into multiple)
 */
export function clipPathToPolygon(path: Point2D[], polygon: Point2D[]): Point2D[][] {
    if (path.length < 2) return [];

    const clippedPaths: Point2D[][] = [];
    let currentPath: Point2D[] = [];

    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];

        const p1Inside = isPointInPolygon(p1, polygon);
        const p2Inside = isPointInPolygon(p2, polygon);

        if (p1Inside && p2Inside) {
            // Whole segment inside
            if (currentPath.length === 0) currentPath.push(p1);
            currentPath.push(p2);
        } else if (p1Inside && !p2Inside) {
            // Leaving polygon - find intersection
            const inter = getFirstIntersection(p1, p2, polygon);
            if (currentPath.length === 0) currentPath.push(p1);
            if (inter) currentPath.push(inter);
            clippedPaths.push(currentPath);
            currentPath = [];
        } else if (!p1Inside && p2Inside) {
            // Entering polygon - find intersection
            const inter = getFirstIntersection(p1, p2, polygon);
            if (inter) currentPath.push(inter);
            currentPath.push(p2);
        } else {
            // Both outside - check if segment crosses polygon entirely
            const intersections = getAllIntersections(p1, p2, polygon);
            if (intersections.length >= 2) {
                // Keep the part between intersections
                clippedPaths.push(intersections);
            }
        }
    }

    if (currentPath.length >= 2) {
        clippedPaths.push(currentPath);
    }

    return clippedPaths;
}

function getFirstIntersection(p1: Point2D, p2: Point2D, polygon: Point2D[]): Point2D | null {
    const inters = getAllIntersections(p1, p2, polygon);
    return inters.length > 0 ? inters[0] : null;
}

function getAllIntersections(p1: Point2D, p2: Point2D, polygon: Point2D[]): Point2D[] {
    const intersections: { point: Point2D, t: number }[] = [];

    for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        const q1 = polygon[i];
        const q2 = polygon[j];

        const inter = lineIntersect(p1, p2, q1, q2);
        if (inter) {
            intersections.push(inter);
        }
    }

    // Sort by distance from p1
    return intersections.sort((a, b) => a.t - b.t).map(i => i.point);
}

function lineIntersect(p1: Point2D, p2: Point2D, q1: Point2D, q2: Point2D): { point: Point2D, t: number } | null {
    const dx1 = p2.x - p1.x;
    const dy1 = p2.y - p1.y;
    const dx2 = q2.x - q1.x;
    const dy2 = q2.y - q1.y;

    const det = dx2 * dy1 - dy2 * dx1;
    if (Math.abs(det) < 0.0001) return null;

    const t = (dx2 * (q1.y - p1.y) - dy2 * (q1.x - p1.x)) / det;
    const u = (dx1 * (q1.y - p1.y) - dy1 * (q1.x - p1.x)) / det;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            point: { x: p1.x + t * dx1, y: p1.y + t * dy1 },
            t: t
        };
    }
    return null;
}

/**
 * Calculates the centroid of a polygon (Outer shape only for centering)
 */
export function calculateCentroid(points: Point2D[]): Point2D {
    if (points.length === 0) {
        return { x: 0, y: 0 };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    points.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });

    return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
    };
}

/**
 * Normalizes points to center around origin based on the first stroke (centroid)
 */
export function normalizeStrokes(strokes: Point2D[][]): Point2D[][] {
    if (strokes.length === 0 || strokes[0].length === 0) return strokes;

    const centroid = calculateCentroid(strokes[0]);

    return strokes.map(stroke => stroke.map(point => ({
        x: point.x - centroid.x,
        y: point.y - centroid.y,
    })));
}

/**
 * Checks if a point is close to another point (for closing shapes)
 */
export function isPointNear(p1: Point2D, p2: Point2D, threshold: number = 20): boolean {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
}

