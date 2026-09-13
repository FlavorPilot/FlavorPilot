import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './icon';
export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    children: ReactNode;
}) {
    return <button type="button" {...props} className={`button button--${variant} ${className}`}>{children}</button>;
}
export function LinkButton({ href, children, variant = 'secondary', className = '' }: {
    href: string;
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    className?: string;
}) {
    return <Link href={href} className={`button button--${variant} ${className}`}>{children}</Link>;
}
export function Badge({ children, tone = 'neutral' }: {
    children: ReactNode;
    tone?: 'neutral' | 'green' | 'amber';
}) {
    return <span className={`badge badge--${tone}`}>{children}</span>;
}
export function WidgetFrame({ id, title, subtitle, icon, action, children, className = '' }: {
    id: string;
    title: string;
    subtitle?: string;
    icon?: IconName;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return <section className={`widget ${className}`} aria-labelledby={`${id}-title`}>
    <header className="widget__header"><div className="widget__heading"><div className="widget__title">{icon && <span className="widget__icon"><Icon name={icon} size={18}/></span>}<h2 id={`${id}-title`}>{title}</h2></div>{subtitle && <p className="muted small">{subtitle}</p>}</div>{action}</header>
    <div className="widget__body">{children}</div>
  </section>;
}
export function Notice({ children, tone = 'info', role = 'status' }: {
    children: ReactNode;
    tone?: 'info' | 'warning' | 'error' | 'success';
    role?: 'status' | 'alert';
}) {
    return <div className={`notice notice--${tone}`} role={role}><Icon name={tone === 'success' ? 'check' : tone === 'info' ? 'info' : 'warning'} size={18}/><div>{children}</div></div>;
}
export function EmptyState({ title, text, action, icon = 'flask' }: {
    title: string;
    text?: string;
    action?: ReactNode;
    icon?: IconName;
}) {
    return <div className="empty-state"><span className="empty-state__icon"><Icon name={icon} size={28}/></span><h3>{title}</h3>{text && <p>{text}</p>}{action}</div>;
}
export function Skeleton({ label }: {
    label: string;
}) {
    return <div className="skeleton" role="status" aria-busy="true"><span className="sr-only">{label}</span><i /><i /><i /></div>;
}
