'use client';
import type { KeyboardEvent } from 'react';

export function Tabs<T extends string>({ id, label, value, options, onChange }: {
    id: string;
    label: string;
    value: T;
    options: readonly { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    function navigate(event: KeyboardEvent<HTMLDivElement>) {
        const index = options.findIndex(option => option.value === value);
        const next = event.key === 'ArrowRight' ? (index + 1) % options.length
            : event.key === 'ArrowLeft' ? (index + options.length - 1) % options.length
                : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        onChange(options[next].value);
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }
    return <div className="workspace-tabs" role="tablist" aria-label={label} onKeyDown={navigate}>
        {options.map(option => <button type="button" role="tab" key={option.value}
            id={`${id}-tab-${option.value}`} aria-controls={`${id}-panel-${option.value}`}
            aria-selected={value === option.value} tabIndex={value === option.value ? 0 : -1}
            onClick={() => onChange(option.value)}>{option.label}</button>)}
    </div>;
}
