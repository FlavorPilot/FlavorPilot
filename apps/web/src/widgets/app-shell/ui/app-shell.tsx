'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSession } from '@/features/session';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Icon, type IconName } from '@/shared/ui';
export function AppShell({ locale, children }: {
    locale: Locale;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const t = getDictionary(locale).messages;
    const { session } = useSession();
    const links: Array<{
        path: string;
        label: string;
        icon: IconName;
    }> = [
        { path: 'builder', label: t.builder, icon: 'flask' }, { path: 'library', label: t.library, icon: 'book' },
        { path: 'discover', label: t.discover, icon: 'compass' }, { path: 'account', label: t.account, icon: 'user' },
    ];
    const alternateLocale = locale === 'en' ? 'uk' : 'en';
    const alternateHref = pathname.replace(/^\/(en|uk)(?=\/|$)/, `/${alternateLocale}`);
    return <div className="app-shell">
    <a href="#main-content" className="skip-link">{t.skip}</a>
    <aside className="sidebar">
      <Link href={`/${locale}`} className="brand"><span className="brand__mark"><Icon name="leaf" size={24}/></span><span>Flavor<span className="brand__accent">Pilot</span><small>{t.workspace}</small></span></Link>
      <p className="sidebar__eyebrow">{t.workspace}</p>
      <nav aria-label={t.menu} className="side-nav">{links.map(link => <Link key={link.path} href={`/${locale}/${link.path}`} aria-current={pathname.includes(`/${link.path}`) ? 'page' : undefined}><Icon name={link.icon}/><span>{link.label}</span>{pathname.includes(`/${link.path}`) && <span className="nav-dot"/>}</Link>)}</nav>
      <div className="sidebar__bottom"><div className="model-note"><Icon name="info" size={18}/><p>{t.knowledge}<small>{t.modelVersion}</small></p></div><Link href={`/${locale}/pricing`} className="side-plan">{t.pricing}<Icon name="arrow" size={16}/></Link></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="breadcrumb"><span>FlavorPilot</span><Icon name="chevron" size={13}/><strong>{links.find(link => pathname.includes(`/${link.path}`))?.label ?? t.home}</strong></div>
        <div className="topbar__actions"><Badge tone={session ? 'green' : 'neutral'}><span className="status-dot"/>{session ? t.connectedMode : t.localMode}</Badge>
          <Link href={alternateHref} className="language-toggle" hrefLang={alternateLocale} aria-label={t.localeChange}>{locale === 'en' ? 'УКР' : 'EN'}</Link>
          <Link href={`/${locale}/${session ? 'account' : 'sign-in'}`} className="avatar-link" aria-label={session ? t.account : t.signIn}><Icon name="user" size={18}/></Link>
        </div>
      </header>
      <main id="main-content" className="page-content" tabIndex={-1}>{children}</main>
    </div>
    <nav className="mobile-nav" aria-label={t.menu}>{links.map(link => <Link key={link.path} href={`/${locale}/${link.path}`} aria-current={pathname.includes(`/${link.path}`) ? 'page' : undefined}><Icon name={link.icon}/><span>{link.label}</span></Link>)}</nav>
  </div>;
}
