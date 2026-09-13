import type { CSSProperties } from 'react';
const paths = {
    leaf: 'M20 4C8 2 3 7 5 15c3 8 15 5 15-11ZM5 20 16 9',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    flask: 'M9 3h6M10 3v6L4 19a1.3 1.3 0 0 0 1 2h14a1.3 1.3 0 0 0 1-2L14 9V3M8 14h8',
    book: 'M4 3h14a2 2 0 0 1 2 2v16H6a3 3 0 0 1-3-3V5a2 2 0 0 1 1-2ZM3 17h17M7 7h9',
    compass: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5z',
    user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
    plus: 'M12 5v14M5 12h14', close: 'M6 6l12 12M6 18 18 6', arrow: 'M4 12h16M14 6l6 6-6 6',
    search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM15 15l6 6',
    undo: 'M8 4 3 9l5 5M3 9h11a7 7 0 0 1 0 14', redo: 'M16 4l5 5-5 5M21 9H10a7 7 0 0 0 0 14',
    save: 'M4 3h13l4 4v14H3V3ZM7 3v6h9V3M7 21v-8h10v8',
    lock: 'M6 10V7a6 6 0 0 1 12 0v3M4 10h16v11H4zM12 14v3',
    link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
    globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
    check: 'M4 12l5 5L20 6', warning: 'M12 3 2 21h20ZM12 9v5M12 17v.5',
    info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6M12 7v.5',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    download: 'M12 3v12M7 10l5 5 5-5M4 15v6h16v-6',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v5h16v-5',
    chevron: 'M8 4l8 8-8 8', menu: 'M4 6h16M4 12h16M4 18h16',
    spark: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
    sliders: 'M3 6h4M11 6h10M3 18h10M17 18h4M7 3v6M13 15v6',
};
export type IconName = keyof typeof paths;
export function Icon({ name, size = 20, className, style }: {
    name: IconName;
    size?: number;
    className?: string;
    style?: CSSProperties;
}) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} style={style}><path d={paths[name]}/></svg>;
}
