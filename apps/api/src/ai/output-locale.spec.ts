import {describe,it,expect} from 'vitest';
import {assertOutputLocale} from './output-locale';
describe('Ukrainian AI output guard',()=>{
 it('rejects Russian-only letters in nested forecasts and generated step replacements',()=>{
  expect(()=>assertOutputLocale({outcome:{taste:'Выраженный вкус'}},'uk')).toThrow();
  expect(()=>assertOutputLocale({comments:[{suggestedText:'Обжарьте крупные куски'}]},'uk')).toThrow();
 });
 it('accepts Ukrainian, short shared-alphabet text, stable IDs, numbers and proper Latin names',()=>{
  expect(()=>assertOutputLocale({summary:'Курка суха.',steps:[{id:'abc',text:'Додайте лайм після обсмажування.'}],name:'Worcestershire',servings:2},'uk')).not.toThrow();
  expect(()=>assertOutputLocale('Quoted foreign text: Выраженный вкус','en')).not.toThrow();
 });
});
