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
