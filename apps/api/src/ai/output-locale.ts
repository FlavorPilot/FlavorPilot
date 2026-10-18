// A narrow rejection rule, not language detection: these letters do not occur in Ukrainian.
// Do not require Ukrainian-specific letters, since short valid Ukrainian text may lack them.
export function assertOutputLocale(value:unknown,locale:'en'|'uk'):void {
 if(locale!=='uk')return;
 if(typeof value==='string'){
  if(/[ыэъё]/iu.test(value))throw new Error('Output contains Russian-only letters');
 }else if(Array.isArray(value)){
  for(const item of value)assertOutputLocale(item,locale);
 }else if(value&&typeof value==='object'){
  for(const item of Object.values(value))assertOutputLocale(item,locale);
 }
}
