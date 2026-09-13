'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './icon';
export function Dialog({ open, onClose, title, closeLabel, children }: {
    open: boolean;
    onClose: () => void;
    title: string;
    closeLabel: string;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog)
            return;
        const trigger = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        if (open)
            document.body.style.overflow = 'hidden';
        if (open && !dialog.open)
            dialog.showModal();
        if (!open && dialog.open)
            dialog.close();
        return () => {
            document.body.style.overflow = previousOverflow;
            if (dialog.open)
                dialog.close();
            if (trigger instanceof HTMLElement && trigger.isConnected)
                trigger.focus();
        };
    }, [open]);
    return <dialog className="dialog" ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="dialog__header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label={closeLabel} onClick={onClose}><Icon name="close"/></button></header>
    {open && <div className="dialog__body">{children}</div>}
  </dialog>;
}
