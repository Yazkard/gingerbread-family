import { useEffect, useRef, useState } from 'react';
import './HairlineFigure.css';

// The Hairline kernel (public/hairline/kernel.js, unchanged) and one figure per page load.
const FIGURES = ['rodzina', 'sciana', 'wycinanie'] as const;

interface Figure {
    name: string;
    means: string;
    range: [number, number, number];
    mount: (host: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string | null } }, value: number) => { set: (v: number) => void; destroy: () => void };
}

interface HLKernel {
    inject: (root: Document) => void;
    mk: (tag: string, attrs: Record<string, string>, parent: Element) => SVGSVGElement;
}

declare global {
    interface Window {
        HL?: HLKernel;
        hairline?: (figure: Figure) => void;
    }
}

const loaded = new Map<string, Promise<Figure>>();

function loadScript(src: string, module: boolean) {
    return new Promise<void>((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        if (module) el.type = 'module';
        el.onload = () => resolve();
        el.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(el);
    });
}

// A figure script calls the global hairline() once when it runs; a module runs once per page, so the result is kept.
function loadFigure(name: string): Promise<Figure> {
    let p = loaded.get(name);
    if (!p) {
        p = (async () => {
            if (!window.HL) await loadScript('/hairline/kernel.js', false);
            const figure = new Promise<Figure>((resolve) => { window.hairline = resolve; });
            await loadScript(`/hairline/${name}.js`, true);
            return figure;
        })();
        loaded.set(name, p);
    }
    return p;
}

export function HairlineFigure() {
    const stageRef = useRef<HTMLDivElement>(null);
    const [name] = useState(() => FIGURES[Math.floor(Math.random() * FIGURES.length)]);
    const [readout, setReadout] = useState('rest');

    useEffect(() => {
        let handle: ReturnType<Figure['mount']> | null = null;
        let cancelled = false;

        loadFigure(name).then((figure) => {
            const stage = stageRef.current;
            if (cancelled || !stage || !window.HL) return;
            window.HL.inject(document);
            stage.setAttribute('aria-label', figure.means);
            const svg = window.HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage);
            let text: string | null = null;
            const read = {
                get textContent() { return text; },
                set textContent(v: string | null) { text = v == null ? '' : String(v); setReadout(text); },
            };
            handle = figure.mount({ stage, svg, read }, figure.range[1]);
        }).catch((err) => console.error(err));

        return () => {
            cancelled = true;
            handle?.destroy();
        };
    }, [name]);

    return (
        <div className="hl-figure">
            <div ref={stageRef} className="hl-stage" data-hairline={name} role="img" />
            <span className="hl-read" aria-hidden="true" hidden={readout === 'rest'}>{readout}</span>
        </div>
    );
}
