import { analyzeDish, defaultDish } from '@flavorpilot/flavor-engine';
import { getDictionary, type Locale } from '@/shared/i18n';
import { Badge, Icon, LinkButton } from '@/shared/ui';
import { DishAnalysis } from '@/widgets/dish-analysis';
export function HomeScreen({ locale }: {
    locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    const analysis = analyzeDish(defaultDish, 'fresh', false);
    return <div className="home-screen"><section className="hero"><div className="hero__copy"><Badge tone="green"><Icon name="leaf" size={14}/>{t.heroEyebrow}</Badge><h1>{t.heroTitle}</h1><p>{t.heroText}</p><div className="hero__actions"><LinkButton href={`/${locale}/builder`} variant="primary">{t.openStudio}<Icon name="arrow" size={18}/></LinkButton><LinkButton href={`/${locale}/discover`} variant="ghost">{t.browseExamples}</LinkButton></div><small>{t.noSignup}</small></div>
    <div className="hero__workbench"><div className="hero__recipe-label"><span><Icon name="flask" size={17}/>{t.exampleName}</span><Badge>{t.demo}</Badge></div><DishAnalysis locale={locale} analysis={analysis} itemCount={defaultDish.length}/></div></section>
    <div className="home-meta"><span>{t.heroNote}</span><span>{t.dataNotice}</span></div>
    <section className="steps" aria-label={t.workspace}>{[1, 2, 3].map(number => <article key={number}><span className="step-number">0{number}</span><h2>{t[`step${number}` as 'step1' | 'step2' | 'step3']}</h2><p>{t[`step${number}Text` as 'step1Text' | 'step2Text' | 'step3Text']}</p></article>)}</section>
    <section className="home-cta"><div><p className="eyebrow">FlavorPilot</p><h2>{t.newDish}</h2><p>{t.knowledgeNote}</p></div><LinkButton href={`/${locale}/builder?example=1`} variant="primary">{t.tryExample}<Icon name="arrow" size={17}/></LinkButton></section>
  </div>;
}
