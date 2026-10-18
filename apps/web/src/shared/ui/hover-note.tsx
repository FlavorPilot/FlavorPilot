'use client';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icon';

/** Hover, keyboard and tap access to the same note; portal prevents clipping in narrow columns. */
export function HoverNote({ label, trigger, children, closeLabel }: {
    label: string; trigger: ReactNode; children: ReactNode; closeLabel: string;
}) {
    const id = useId();
    const button = useRef<HTMLButtonElement>(null);
    const note = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const pinned = useRef(false);
    const dismissed = useRef(false);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ left: 16, top: 16 });
    const cancelClose = () => clearTimeout(timer.current);
    const close = () => { cancelClose(); pinned.current = false; dismissed.current = true; setOpen(false); };
    const show = () => { cancelClose(); if (!dismissed.current) setOpen(true); };
    const leave = () => {
        cancelClose();
        timer.current = setTimeout(() => {
            if (!pinned.current && !note.current?.contains(document.activeElement) && document.activeElement !== button.current) setOpen(false);
        }, 120);
    };
    const blur = () => {
        cancelClose();
        timer.current = setTimeout(() => {
            if (!note.current?.contains(document.activeElement) && document.activeElement !== button.current) {
                pinned.current = false;
                setOpen(false);
            }
        }, 120);
    };
    useEffect(() => () => clearTimeout(timer.current), []);
    useLayoutEffect(() => {
        if (!open) return;
        const place = () => {
            const anchor = button.current?.getBoundingClientRect();
            const box = note.current?.getBoundingClientRect();
            if (!anchor || !box) return;
            setPosition({ left: Math.max(16, Math.min(anchor.right - box.width, window.innerWidth - box.width - 16)),
                top: Math.max(16, anchor.bottom + box.height + 8 <= window.innerHeight - 16 ? anchor.bottom + 8 : anchor.top - box.height - 8) });
        };
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
    }, [open]);
    useEffect(() => {
        if (!open) return;
        const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); button.current?.focus(); } };
        const outside = (event: PointerEvent) => { if (!note.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) close(); };
        document.addEventListener('keydown', key);
        document.addEventListener('pointerdown', outside);
        return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside); };
    }, [open]);
    return <>
      <button ref={button} type="button" className="hover-note-trigger" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined}
        onMouseEnter={() => { dismissed.current = false; show(); }} onMouseLeave={leave}
        onFocus={show} onBlur={() => { dismissed.current = false; blur(); }}
        onKeyDown={event => {
            if (event.key === 'Tab' && !event.shiftKey && open) {
                event.preventDefault();
                pinned.current = true;
                note.current?.querySelector<HTMLButtonElement>('button')?.focus();
            }
        }}
        onClick={() => { if (pinned.current) close(); else { dismissed.current = false; pinned.current = true; show(); } }}>{trigger}</button>
      {open && createPortal(<div ref={note} id={id} role="note" aria-label={label} className="hover-note" style={position}
        onMouseEnter={cancelClose} onMouseLeave={leave} onFocusCapture={cancelClose} onBlurCapture={blur}>
        <button type="button" className="hover-note-close" aria-label={closeLabel} onClick={() => { close(); button.current?.focus(); }}><Icon name="close" size={16}/></button>
        {children}
      </div>, document.body)}
    </>;
}
