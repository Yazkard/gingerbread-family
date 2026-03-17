import React from 'react';
import { useTranslation } from 'react-i18next';

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
        <label style={{ display: 'block', marginBottom: '8px', color: '#C4A882', fontSize: '14px' }}>
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
    const { t } = useTranslation();

    return (
        <div style={{
            padding: '20px',
            background: 'rgba(30, 17, 9, 0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(212,160,23,0.2)',
            color: '#FFF8E7',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
        }}>
            <h2 style={{ marginTop: 0, marginBottom: '10px', color: '#F0D06E', fontSize: '1.1em', letterSpacing: '0.02em' }}>
                {t('controls.heading')}
            </h2>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#C4A882', fontSize: '14px' }}>
                    {t('controls.colorLabel')}
                </label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{
                        width: '100%',
                        height: '40px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                />
            </div>

            <SliderControl
                label={t('controls.detailWidth')}
                value={detailStrokeWidth}
                onChange={onDetailStrokeWidthChange}
                min={1} max={4} step={0.1}
            />

            <div style={{ height: '1px', background: '#4A2E1A', margin: '4px 0' }} />

            <button
                onClick={onClear}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    color: '#ff6b6b',
                    border: '1px solid rgba(196,30,58,0.5)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(196,30,58,0.15)'; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; }}
            >
                {t('controls.clearCanvas')}
            </button>

            <button
                onClick={onExport3MF}
                disabled={!canExport}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: canExport
                        ? 'linear-gradient(135deg, #8B4513 0%, #D4A017 100%)'
                        : 'rgba(74,46,26,0.4)',
                    color: '#FFF8E7',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: canExport ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'inherit',
                    opacity: canExport ? 1 : 0.5,
                    boxShadow: canExport ? '0 4px 16px rgba(212,160,23,0.3)' : 'none',
                    transition: 'opacity 0.2s, transform 0.15s',
                }}
            >
                {t('controls.export3MF')}
            </button>
        </div>
    );
};
