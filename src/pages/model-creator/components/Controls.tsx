import React from 'react';

interface ControlsProps {
    color: string;
    onColorChange: (color: string) => void;
    detailStrokeWidth: number;
    onDetailStrokeWidthChange: (width: number) => void;
    onClear: () => void;
    onExport3MF: () => void;
    canExport: boolean;
}

const SliderControl: React.FC<{
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
}> = ({ label, value, onChange, min, max, step }) => (
    <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#b8c9a8', fontSize: '14px' }}>
            {label}: {value.toFixed(1)}mm
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
        />
    </div>
);

export const Controls: React.FC<ControlsProps> = ({
    color,
    onColorChange,
    detailStrokeWidth,
    onDetailStrokeWidthChange,
    onClear,
    onExport3MF,
    canExport,
}) => {
    return (
        <div style={{
            padding: '20px',
            background: '#1A261A',
            borderRadius: '8px',
            border: '2px solid #2E4A2E',
            color: '#FFF8E7',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#F0D06E' }}>Baking Controls</h2>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#b8c9a8', fontSize: '14px' }}>
                    Gingerbread Color
                </label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{
                        width: '100%',
                        height: '40px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                />
            </div>

            <SliderControl
                label="Detail Width"
                value={detailStrokeWidth}
                onChange={onDetailStrokeWidthChange}
                min={1} max={4} step={0.1}
            />

            <div style={{ height: '1px', background: '#2E4A2E', margin: '10px 0' }} />

            <button
                onClick={onClear}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: '#C41E3A',
                    color: '#FFF8E7',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                }}
            >
                Clear Canvas
            </button>

            <button
                onClick={onExport3MF}
                disabled={!canExport}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: canExport ? '#2E7D32' : '#2E4A2E',
                    color: '#FFF8E7',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: canExport ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500',
                }}
            >
                Export
            </button>
        </div>
    );
};

