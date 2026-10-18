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
 it('allows exact quoted source wording but rejects unquoted or unrelated Russian prose',()=>{
  const source={steps:[{text:'Нарежьте крупные куски курицы.'}]};
  expect(()=>assertOutputLocale({comments:[{message:'Фраза «Нарежьте крупные куски» потребує уточнення.'}]},'uk',source)).not.toThrow();
  expect(()=>assertOutputLocale({outcome:{summary:'Выраженный вкус'}},'uk',source)).toThrow();
  expect(()=>assertOutputLocale('Фраза «Острые специи» потребує уточнення.','uk',source)).toThrow();
 });
});
