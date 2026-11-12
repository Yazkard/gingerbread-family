import React, { useId, useRef } from 'react';
import { useTranslation } from '../../../i18n';
import type { BackgroundImage } from '../types';
import { DownloadIcon, Rosette } from '../../../components/Marks';
import './Controls.css';

interface ControlsProps {
    detailStrokeWidth: number;
    onDetailStrokeWidthChange: (width: number) => void;
    onUndo: () => void;
    canUndo: boolean;
    onClear: () => void;
    onExport3MF: () => void;
    canExport: boolean;
    exportIsPrimary: boolean;
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
}> = ({ label, value, onChange, min, max, step, unit = 'mm', decimals = 1 }) => {
    const id = useId();
    return (
        <div className="slider">
            <label htmlFor={id}>
                <span>{label}</span>
                <output htmlFor={id}>{value.toFixed(decimals)}{unit}</output>
            </label>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />
        </div>
    );
};

const Divider = () => (
    <div className="rosette-rule controls-rule" aria-hidden="true">
        <Rosette size={12} />
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
    exportIsPrimary,
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
        <section className="controls panel" aria-labelledby="controls-heading">
            <h2 id="controls-heading">{t('controls.heading')}</h2>

            <h3>{t('controls.backgroundPhoto')}</h3>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onBackgroundUpload(file);
                    e.target.value = '';
                }}
            />

            <button type="button" className="btn btn-quiet btn-block" onClick={() => fileInputRef.current?.click()}>
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
                        type="button"
                        className="btn btn-quiet btn-block move-toggle"
                        aria-pressed={isMoveMode}
                        onClick={() => onMoveModeToggle(!isMoveMode)}
                    >
                        {isMoveMode ? t('controls.movePhotoOn') : t('controls.movePhoto')}
                    </button>

                    <button type="button" className="btn btn-danger btn-block" onClick={onBackgroundRemove}>
                        {t('controls.removePhoto')}
                    </button>
                </>
            )}

            <Divider />

            <SliderControl
                label={t('controls.detailWidth')}
                value={detailStrokeWidth}
                onChange={onDetailStrokeWidthChange}
                min={1} max={4} step={0.1}
            />

            <Divider />

            <div className="controls-pair">
                <button type="button" className="btn btn-quiet" onClick={onUndo} disabled={!canUndo} title="Ctrl+Z" aria-keyshortcuts="Control+Z Meta+Z">
                    {t('controls.undo')}
                </button>
                <button type="button" className="btn btn-danger" onClick={onClear}>
                    {t('controls.clearCanvas')}
                </button>
            </div>

            <button
                type="button"
                className={`btn btn-block controls-export ${exportIsPrimary ? 'btn-primary' : ''}`}
                onClick={onExport3MF}
                disabled={!canExport}
            >
                <DownloadIcon />
                {t('controls.export3MF')}
            </button>
        </section>
    );
};
