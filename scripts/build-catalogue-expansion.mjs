import { readFileSync, writeFileSync } from 'node:fs';
import { families, refinements } from './data/catalogue-families.mjs';
export const AI_HYPOTHESIS_VERSION = 'ai-product-hypothesis-2';
export function expansionManifest() {
  let familyName;
  return readFileSync(new URL('./data/catalogue-expansion.txt', import.meta.url),'utf8').split(/\r?\n/).flatMap(line => {
    if (!line || line.startsWith('#')) return [];
    if (line.startsWith('@')) { familyName = line.slice(1); return []; }
    const [fdcId,id,nameEn,nameUk,values] = line.split('|');
    const family = families[familyName];
    if (!family || !/^[a-z][a-z0-9_]+$/.test(id) || !nameEn || !nameUk) throw new Error(`Invalid manifest row: ${line}`);
    const overrides = Object.fromEntries(family.axes.map((axis,i)=>[axis,Number(values.split(',')[i])]));
    const { axes, rationale, profile, ...rest } = family;
    const hypothesis = { ...profile, ...rest, ...overrides, ...refinements[id] };
    hypothesis.intensity = Math.round(Math.max(hypothesis.aromaIntensity, hypothesis.pungency, hypothesis.saltiness, hypothesis.acidity, hypothesis.bitterness, hypothesis.umami * 0.8) * 10) / 10;
    hypothesis.textureIntensity ??= family.textures.includes('crunchy') ? 7 : family.textures.includes('firm') ? 5 : 3;
    for (const [key,value] of Object.entries(hypothesis)) if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > 10)) throw new Error(`Invalid ${id}.${key}`);
    return [{ fdcId: Number(fdcId), id, nameEn, nameUk, family: familyName, hypothesis, rationale }];
  });
}
const rows = expansionManifest();
if (rows.length < 500 || new Set(rows.map(x=>x.id)).size !== rows.length) throw new Error('Expected at least 500 unique expansion foods');
const output = `import type { ProductHypothesis } from './product-hypotheses';\n/** Generated from the curated manifest and AI-authored culinary families.\n * USDA supplies identity/nutrients only. These sensory values are unreviewed hypotheses.\n */\nexport const AI_HYPOTHESIS_VERSION = ${JSON.stringify(AI_HYPOTHESIS_VERSION)};\nexport const expandedProductHypotheses: Record<string, ProductHypothesis> = ${JSON.stringify(Object.fromEntries(rows.map(x=>[x.id,x.hypothesis])),null,2)};\nexport const expandedHypothesisRationales: Record<string, string> = ${JSON.stringify(Object.fromEntries(rows.map(x=>[x.id,`${x.family}: ${x.rationale}`])),null,2)};\n`;
writeFileSync(new URL('../packages/flavor-engine/src/expanded-product-hypotheses.ts',import.meta.url),output);
console.log(`AI-authored expansion hypotheses: ${rows.length}`);
