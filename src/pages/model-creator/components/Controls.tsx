import React, { useRef } from 'react';
import { useTranslation } from '../../../i18n';
import type { BackgroundImage } from '../types';

interface ControlsProps {
    detailStrokeWidth: number;
    onDetailStrokeWidthChange: (width: number) => void;
    onUndo: () => void;
    canUndo: boolean;
    onClear: () => void;
    onExport3MF: () => void;
    canExport: boolean;
    backgroundImage: BackgroundImage | null;
    isMoveMode: boolean;
    onMoveModeToggle: (enabled: boolean) => void;
    onBackgroundUpload: (file: File) => void;
    onBackgroundRemove: () => void;
    onBackgroundChange: (updates: Partial<BackgroundImage>) => void;
}

const SliderControl: React.FC<{
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
    unit?: string;
    decimals?: number;
}> = ({ label, value, onChange, min, max, step, unit = 'mm', decimals = 1 }) => (
    <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#C4A882', fontSize: '14px' }}>
            {label}: {value.toFixed(decimals)}{unit}
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
    detailStrokeWidth,
    onDetailStrokeWidthChange,
    onUndo,
    canUndo,
    onClear,
    onExport3MF,
    canExport,
    backgroundImage,
    isMoveMode,
    onMoveModeToggle,
    onBackgroundUpload,
    onBackgroundRemove,
    onBackgroundChange,
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            {/* Background Photo Section */}
            <h3 style={{ margin: '0 0 4px 0', color: '#F0D06E', fontSize: '0.95em', fontWeight: 500 }}>
                {t('controls.backgroundPhoto')}
            </h3>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onBackgroundUpload(file);
                    e.target.value = '';
                }}
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    color: '#C4A882',
                    border: '1px solid rgba(196,168,130,0.3)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(196,168,130,0.1)'; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; }}
            >
                {backgroundImage ? t('controls.changePhoto') : t('controls.uploadPhoto')}
            </button>

            {backgroundImage && (
                <>
                    <SliderControl
                        label={t('controls.photoOpacity')}
                        value={backgroundImage.opacity}
                        onChange={(val) => onBackgroundChange({ opacity: val })}
                        min={0.05} max={1.0} step={0.05}
                        unit="" decimals={2}
                    />

                    <SliderControl
                        label={t('controls.photoScale')}
                        value={backgroundImage.scale}
                        onChange={(val) => onBackgroundChange({ scale: val })}
                        min={0.1} max={3.0} step={0.05}
                        unit="x" decimals={2}
                    />

                    <button
                        onClick={() => onMoveModeToggle(!isMoveMode)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: isMoveMode ? 'rgba(30,80,180,0.4)' : 'transparent',
                            color: isMoveMode ? '#8AB4F8' : '#C4A882',
                            border: `1px solid ${isMoveMode ? 'rgba(138,180,248,0.5)' : 'rgba(196,168,130,0.3)'}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            if (!isMoveMode) (e.target as HTMLButtonElement).style.background = 'rgba(196,168,130,0.1)';
                        }}
                        onMouseLeave={e => {
                            (e.target as HTMLButtonElement).style.background = isMoveMode ? 'rgba(30,80,180,0.4)' : 'transparent';
                        }}
                    >
                        {isMoveMode ? t('controls.movePhotoOn') : t('controls.movePhoto')}
                    </button>

                    <button
                        onClick={onBackgroundRemove}
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
                        {t('controls.removePhoto')}
                    </button>
                </>
            )}

            <div style={{ height: '1px', background: '#4A2E1A', margin: '4px 0' }} />

            <SliderControl
                label={t('controls.detailWidth')}
                value={detailStrokeWidth}
                onChange={onDetailStrokeWidthChange}
                min={1} max={4} step={0.1}
            />

            <div style={{ height: '1px', background: '#4A2E1A', margin: '4px 0' }} />

            <button
                onClick={onUndo}
                disabled={!canUndo}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    color: canUndo ? '#C4A882' : '#6B5040',
                    border: '1px solid rgba(196,168,130,0.3)',
                    borderRadius: '10px',
                    cursor: canUndo ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    opacity: canUndo ? 1 : 0.5,
                }}
                onMouseEnter={e => { if (canUndo) (e.target as HTMLButtonElement).style.background = 'rgba(196,168,130,0.1)'; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; }}
            >
                {t('controls.undo')}
            </button>

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
