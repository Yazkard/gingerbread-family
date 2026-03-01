export interface Point2D {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point2D[];
    width: number;
}

export interface DrawingState {
    strokes: Stroke[];
    isClosed: boolean;
    color: string;
    extrusionDepth: number;
}

export interface ExportOptions {
    filename: string;
    scale?: number;
}
