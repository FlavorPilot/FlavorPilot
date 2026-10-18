// A narrow rejection rule, not language detection: these letters do not occur in Ukrainian.
// Do not require Ukrainian-specific letters, since short valid Ukrainian text may lack them.
export class AiOutputLocaleError extends Error {
 constructor(readonly section:'comments'|'outcome'|'recipe'|'other'){super('Output contains Russian-only letters');}
}
export function assertOutputLocale(value:unknown,locale:'en'|'uk',source:unknown=null):void {
 if(locale!=='uk')return;
 const sourceTexts:string[]=[];
 function collect(input:unknown){if(typeof input==='string')sourceTexts.push(input);else if(input&&typeof input==='object')Object.values(input).forEach(collect);}
 collect(source);
 function visit(input:unknown,section:AiOutputLocaleError['section']='other'):void{
  if(typeof input==='string'){
   // A translated explanation may legitimately quote the user's original wording.
   const prose=input.replace(/«([^»\n]{1,4000})»|“([^”\n]{1,4000})”|"([^"\n]{1,4000})"/g,(quote,a,b,c)=>sourceTexts.some(text=>text.includes(a??b??c))?'':quote);
   if(/[ыэъё]/iu.test(prose))throw new AiOutputLocaleError(section);
  }else if(Array.isArray(input))input.forEach(item=>visit(item,section));
  else if(input&&typeof input==='object')for(const [key,item] of Object.entries(input))visit(item,key==='comments'||key==='outcome'||key==='recipe'?key:section);
 }
 visit(value);
}
