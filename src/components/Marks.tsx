// Gingerbread-person outline in a 200x220 box, shared by the landing press demo.
export const GINGERBREAD_PATH =
    'M88 74 C70 76 56 78 48 84 C38 92 42 110 56 110 L80 104 L76 144 L60 186 C54 200 70 210 80 200 L100 162 L120 200 C130 210 146 200 140 186 L124 144 L120 104 L144 110 C158 110 162 92 152 84 C144 78 130 76 112 74 A28 28 0 1 0 88 74 Z';

export function Rosette({ size = 14 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            {[0, 45, 90, 135].map(a => (
                <ellipse key={a} cx="12" cy="12" rx="10" ry="3.2" transform={`rotate(${a} 12 12)`} />
            ))}
        </svg>
    );
}

function Icon({ d, size = 18 }: { d: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
        </svg>
    );
}

export const CloseIcon = () => <Icon d="M6 6l12 12M18 6L6 18" />;
export const PlusIcon = () => <Icon d="M12 5v14M5 12h14" />;
export const BackIcon = () => <Icon d="M19 12H5M11 6l-6 6 6 6" />;
export const DownloadIcon = () => <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />;
