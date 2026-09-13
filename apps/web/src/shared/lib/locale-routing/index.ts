export function preferredLocale(header: string, saved?: string): 'en' | 'uk' {
    if (saved === 'en' || saved === 'uk')
        return saved;
    const languages = header.split(',').map((item, index) => { const [tag, ...parts] = item.trim().toLowerCase().split(';'); const qPart = parts.find(part => part.trim().startsWith('q=')); const weight = qPart ? Number(qPart.trim().slice(2)) : 1; return { tag: tag?.split('-')[0], weight: Number.isFinite(weight) ? weight : 0, index }; }).filter(item => item.weight > 0 && item.weight <= 1).sort((a, b) => b.weight - a.weight || a.index - b.index);
    for (const item of languages)
        if (item.tag === 'uk' || item.tag === 'en')
            return item.tag;
    return 'en';
}
