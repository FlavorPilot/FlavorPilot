import { expect,test,type Page } from '@playwright/test';
async function signup(page:Page){
 await page.goto('/en/sign-up');await page.getByLabel('Email',{exact:true}).fill(`ai-${crypto.randomUUID()}@example.com`);
 await page.getByLabel(/^Password/).fill('correct-horse');await page.getByRole('button',{name:'Create account',exact:true}).click();
 await expect(page.getByText('Signed in. You can return to the studio.')).toBeVisible();
}
const capabilities={enabled:true,access:'pilot',remaining:300,dailyRemaining:30,resetAt:'2099-01-01T00:00:00.000Z',dailyResetAt:'2099-01-01T00:00:00.000Z',costs:{explain:2,step:1,full:4},reason:null};
const forecast={verdict:'promising',summary:'This composition should work with careful searing.',taste:'Rich and fresh.',texture:'Tender fish with a browned surface.',strengths:['Simple composition'],risks:['Overcooking'],cookingAdvice:[{title:'Control the heat',instruction:'Sear the fish, then reduce the heat.',reason:'Keep the centre moist.'}],assumptions:['A pan is available.']};
async function setup(page:Page,withStep=true){
 await page.route('**/v1/account/capabilities',r=>r.fulfill({json:capabilities}));await signup(page);await page.goto('/en/builder');
 await page.getByRole('textbox',{name:'Recipe name',exact:true}).fill('AI recipe');await page.getByLabel('Add an ingredient').fill('Salmon');await page.getByRole('option',{name:/Salmon/}).click();
 await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();
 if(withStep){await page.getByRole('button',{name:'Add a step',exact:true}).click();await page.getByRole('textbox',{name:'Step 1',exact:true}).fill('Prepare salmon.');}
 return page.getByRole('region',{name:'Recipe assistant',exact:true});
}
test('review requires consent; explicit edits support undo and stale suggestions cannot apply',async({page})=>{
 let calls=0;
 await page.route('**/v1/ai/review-recipe',async route=>{
  calls++;const data=route.request().postDataJSON();
  await route.fulfill({json:{requestId:data.requestId,contentHash:'test-hash',quota:capabilities,...(data.includeOutcome?{outcome:forecast}:{}),comments:[{id:crypto.randomUUID(),kind:'clarity',stepId:data.recipe.steps[0].id,message:'Clarify the method.',suggestedText:'Sear the salmon in a hot pan.'}]}});
 });
 const panel=await setup(page);await expect(panel.getByRole('button',{name:'Assess dish & recipe · 4',exact:true})).toBeDisabled();
 await panel.getByRole('checkbox',{name:/Send this composition/}).check();await panel.getByRole('button',{name:'Assess dish & recipe · 4',exact:true}).click();
 await expect(panel.getByText('Clarify the method.')).toBeVisible();expect(calls).toBe(1);
 await panel.getByRole('combobox',{name:'Step to review',exact:true}).selectOption({label:'Step 1'});await panel.getByRole('button',{name:'Check step · 1',exact:true}).click();
 await expect(panel.getByRole('button',{name:'Check step · 1',exact:true})).toBeEnabled();await expect(panel.getByText(forecast.summary)).toBeVisible();expect(calls).toBe(2);
 await panel.screenshot({path:'.local/ai-review-en.png'});
 await panel.getByRole('button',{name:'Replace step text',exact:true}).click();await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveValue('Sear the salmon in a hot pan.');
 await expect(panel.getByRole('button',{name:'Replace step text',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveValue('Prepare salmon.');
 await page.getByRole('textbox',{name:'Step 1',exact:true}).fill('A different method.');await expect(panel.getByRole('button',{name:'Replace step text',exact:true})).toBeDisabled();
 expect(calls).toBe(2);
});
test('cloud steps and servings survive save/reload',async({page})=>{
 await setup(page);await page.getByLabel('Servings',{exact:true}).fill('3');await page.getByRole('button',{name:'Save recipe',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:/My account/}).click();await dialog.getByRole('button',{name:'Save recipe',exact:true}).click();
 await expect(page.getByText('Saved to your account.')).toBeVisible();await page.goto('/en/library');await page.getByRole('button',{name:'In my account',exact:true}).click();await page.getByRole('button',{name:'Open',exact:true}).click();
 await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveValue('Prepare salmon.');await expect(page.getByLabel('Servings',{exact:true})).toHaveValue('3');
});
test('automatic mode waits for edits and errors preserve Ukrainian mobile draft',async({page})=>{
 let calls=0;await page.route('**/v1/ai/review-recipe',r=>{calls++;return r.fulfill({status:429,json:{code:'AI_QUOTA_EXCEEDED'}});});
 const panel=await setup(page);await panel.getByRole('checkbox',{name:/Send this composition/}).check();
 await panel.getByRole('checkbox',{name:'Comment while I write',exact:true}).check();
 await page.getByRole('tab',{name:'1. Composition & balance',exact:true}).click();await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();expect(calls).toBe(0);
 await page.getByRole('textbox',{name:'Step 1',exact:true}).fill('Change this method.');
 await expect(panel.getByRole('alert')).toContainText('Your AI check allowance is exhausted');expect(calls).toBe(1);
 await page.setViewportSize({width:375,height:812});await page.getByRole('link',{name:'Switch language',exact:true}).click();
 await page.getByRole('tab',{name:'2. Приготування',exact:true}).click();await expect(page.getByRole('textbox',{name:'Крок 1',exact:true})).toHaveValue('Change this method.');
 const uk=page.getByRole('region',{name:'Помічник рецепта',exact:true});await uk.getByRole('checkbox',{name:/Надсилати цей склад/}).check();await uk.getByRole('button',{name:'Оцінити страву й рецепт · 4',exact:true}).click();await expect(uk.getByRole('alert')).toContainText('Ліміт перевірок ШІ');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await uk.screenshot({path:'.local/ai-review-uk-mobile.png'});
});

test('dish outcome works before steps; recipe generation previews, confirms, preserves composition and supports undo',async({page})=>{
 const outcome=forecast;
 await page.route('**/v1/ai/review-recipe',async route=>{const data=route.request().postDataJSON();expect(data.includeOutcome).toBe(true);expect(data.recipe.steps).toHaveLength(0);await route.fulfill({json:{requestId:data.requestId,contentHash:'outcome',quota:capabilities,comments:[],outcome}});});
 let grams='',prep='',calls=0;
 await page.route('**/v1/ai/generate-recipe',async route=>{
  calls++;const data=route.request().postDataJSON();grams=String(data.recipe.items[0].grams);prep=data.recipe.items[0].preparationId;
  await route.fulfill({json:{requestId:data.requestId,contentHash:'generated',quota:capabilities,recipe:{name:'Generated salmon',description:'A proposed pan method.',servings:data.recipe.servings,steps:[{id:crypto.randomUUID(),text:'Sear the salmon gently.',ingredientIds:['salmon']},{id:crypto.randomUUID(),text:'Rest briefly before serving.',ingredientIds:[]}]},assumptions:['A pan is available.']}});
 });
 const panel=await setup(page,false);await page.getByLabel('Servings',{exact:true}).fill('3');await page.getByRole('textbox',{name:'About this dish',exact:true}).fill('Original description.');
 await expect(panel.getByRole('button',{name:'Generate recipe · 4',exact:true})).toBeDisabled();await panel.getByRole('checkbox',{name:/Send this composition/}).check();
 await panel.getByRole('button',{name:'Assess dish & recipe · 4',exact:true}).click();await expect(panel.getByText(outcome.summary)).toBeVisible();await expect(panel.getByText(outcome.cookingAdvice[0].instruction)).toBeVisible();
 await panel.getByRole('region',{name:'Expected dish result',exact:true}).screenshot({path:'.local/ai-outcome-en.png'});
 await panel.getByLabel('Recipe preferences (optional)',{exact:true}).fill('A simple pan method.');await panel.getByRole('button',{name:'Generate recipe · 4',exact:true}).click();
 await expect(panel.getByRole('region',{name:'Generated recipe preview',exact:true})).toContainText('Generated salmon');
 await expect(page.getByRole('textbox',{name:'Recipe name',exact:true})).toHaveValue('AI recipe');await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveCount(0);
 await panel.getByRole('button',{name:'Use this recipe draft',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('textbox',{name:'Recipe name',exact:true})).toHaveValue('AI recipe');
 await panel.getByRole('button',{name:'Use this recipe draft',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Replace recipe text',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveValue('Sear the salmon gently.');await expect(page.getByRole('textbox',{name:'Step 2',exact:true})).toHaveValue('Rest briefly before serving.');await expect(page.getByRole('textbox',{name:'Recipe name',exact:true})).toHaveValue('Generated salmon');
 await page.getByRole('tab',{name:'1. Composition & balance',exact:true}).click();await expect(page.getByRole('textbox',{name:/Salmon —/})).toHaveValue(grams);await expect(page.getByRole('combobox',{name:/Salmon —/})).toHaveValue(prep);
 await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByRole('textbox',{name:'Recipe name',exact:true})).toHaveValue('AI recipe');await expect(page.getByRole('textbox',{name:'About this dish',exact:true})).toHaveValue('Original description.');await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveCount(0);expect(calls).toBe(1);
});

test('Ukrainian generated preview fits mobile; edited drafts reject stale apply and survive generation errors',async({page})=>{
 let fail=false;await page.route('**/v1/ai/generate-recipe',async route=>{
  const data=route.request().postDataJSON();
  if(fail){await route.fulfill({status:429,json:{code:'AI_QUOTA_EXCEEDED'}});return;}
  await route.fulfill({json:{requestId:data.requestId,contentHash:'uk-preview',quota:capabilities,recipe:{name:'Ніжний лосось',description:'Чернетка з вибраного складу.',servings:null,steps:[{id:crypto.randomUUID(),text:'Підготуйте лосось за вибраним способом обробки.',ingredientIds:['salmon']}]},assumptions:['Спосіб подавання можна уточнити.']}});
 });
 await setup(page);await page.setViewportSize({width:375,height:812});await page.getByRole('link',{name:'Switch language',exact:true}).click();await page.getByRole('tab',{name:'2. Приготування',exact:true}).click();
 const panel=page.getByRole('region',{name:'Помічник рецепта',exact:true});await panel.getByRole('checkbox',{name:/Надсилати цей склад/}).check();await panel.getByRole('button',{name:'Згенерувати рецепт · 4',exact:true}).click();
 const preview=panel.getByRole('region',{name:'Перегляд згенерованого рецепта',exact:true});await expect(preview).toContainText('Ніжний лосось');
 await preview.getByRole('button',{name:'Використати цю чернетку',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Скасувати',exact:true}).click();
 await preview.evaluate(element=>element.scrollIntoView({block:'center',behavior:'instant'}));await preview.screenshot({path:'.local/ai-generation-uk-mobile.png'});
 await page.getByRole('textbox',{name:'Крок 1',exact:true}).fill('Змінений рецепт.');await expect(preview.getByRole('button',{name:'Використати цю чернетку',exact:true})).toBeDisabled();
 fail=true;await panel.getByRole('button',{name:'Згенерувати рецепт · 4',exact:true}).click();await expect(panel.getByRole('alert')).toContainText('Ліміт перевірок ШІ');await expect(page.getByRole('textbox',{name:'Крок 1',exact:true})).toHaveValue('Змінений рецепт.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
