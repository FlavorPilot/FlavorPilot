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


test('guest receives 50 test units without signup and keeps the server balance after reload',async({page})=>{
 const token='a'.repeat(64);let remaining=50,sessions=0,reviews=0;
 const quota=()=>({...capabilities,access:'guest_test',allowancePeriod:'test',remaining,dailyRemaining:remaining});
 await page.route('**/v1/ai/capabilities',route=>{
  const guest=route.request().headers()['x-ai-guest-token'];expect(guest===undefined||guest===token).toBe(true);
  return route.fulfill({json:quota()});
 });
 await page.route('**/v1/ai/guest-session',route=>{sessions++;return route.fulfill({status:201,json:{token,quota:quota()}});});
 await page.route('**/v1/ai/review-recipe',route=>{
  expect(route.request().headers()['x-ai-guest-token']).toBe(token);expect(route.request().headers().authorization).toBeUndefined();
  reviews++;remaining-=4;const data=route.request().postDataJSON();return route.fulfill({status:201,json:{requestId:data.requestId,contentHash:'guest',comments:[],outcome:forecast,quota:quota()}});
 });
 await page.goto('/en/builder');await page.getByLabel('Add an ingredient').fill('Salmon');await page.getByRole('option',{name:/Salmon/}).click();
 await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();
 const panel=page.getByRole('region',{name:'Recipe assistant',exact:true});
 await expect(panel).toContainText('Guest testing allowance: 50 AI units.');await expect(panel).toContainText('Test units remaining: 50');
 expect(sessions).toBe(0);
 await panel.getByRole('checkbox',{name:/Send this composition/}).check();await panel.getByRole('button',{name:'Assess dish & recipe · 4',exact:true}).click();
 await expect(panel).toContainText('Test units remaining: 46');expect(sessions).toBe(1);
 await page.reload();await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();
 await expect(panel).toContainText('Test units remaining: 46');expect(sessions).toBe(1);expect(reviews).toBe(1);
 await expect(panel.getByRole('checkbox',{name:/Send this composition/})).not.toBeChecked();
});

test('Free test allowance displays 100 units without paid monthly reset copy',async({page})=>{
 await page.route('**/v1/account/capabilities',route=>route.fulfill({json:{...capabilities,access:'free_test',allowancePeriod:'test',remaining:100,dailyRemaining:100}}));
 await signup(page);await page.goto('/en/builder');await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();
 const panel=page.getByRole('region',{name:'Recipe assistant',exact:true});await expect(panel).toContainText('Free account testing allowance: 100 AI units.');await expect(panel).toContainText('Test units remaining: 100');
 await expect(panel).not.toContainText('Checks left this month');
});


test('composition review explains interactions and priorities in both locales without repeating legacy scores',async({page})=>{
 let calls=0;
 await page.route('**/v1/ai/explain',route=>{
  calls++;const data=route.request().postDataJSON();expect(data.includeCompositionReview).toBe(true);expect(data.description).toBe('');expect(data.steps).toEqual([]);expect(data.servings).toBeNull();expect(data.items[0].ingredientId).toBe('salmon');expect(data.items[0].grams).toBeGreaterThan(0);expect(data.items[0].preparationId).toBe('raw');
  const uk=data.locale==='uk';
  const composition={summary:uk?'Лосось може дати соковиту основу з виразною скоринкою.':'Salmon can provide a moist centre and a browned surface.',strengths:[{ingredientIds:['salmon'],observation:uk?'Обсмажування додає виразного аромату.':'Searing adds a distinct aroma.',reason:uk?'Скоринка створює контраст із ніжною серединою.':'The surface contrasts with the tender centre.'}],risks:[{ingredientIds:['salmon'],observation:uk?'Тривале обсмажування може висушити рибу.':'Prolonged searing could dry the fish.',reason:uk?'Середина продовжує нагріватися після утворення скоринки.':'The centre keeps heating after a crust forms.'}],actions:[{kind:'technique',ingredientIds:['salmon'],candidateId:null,riskIndex:0,title:uk?'Контролюйте нагрівання':'Control the heat',instruction:uk?'Після утворення скоринки зменште нагрівання.':'Reduce the heat once the surface is browned.',reason:uk?'Це стримує втрату вологи.':'This limits moisture loss.',expectedEffect:uk?'Ніжніша середина зі збереженою скоринкою.':'A tender centre with the browned surface retained.',addition:null}],missingContext:[]};
  return route.fulfill({json:{summary:'Legacy score narration must not render.',main_problem:'Compatibility is 60.',actions:[],composition}});
 });
 await setup(page);await page.getByRole('textbox',{name:'About this dish',exact:true}).fill('A warm salad.');await page.getByRole('tab',{name:'1. Composition & balance',exact:true}).click();
 const panel=page.getByRole('region',{name:'AI composition comment',exact:true});await expect(page.locator('.analysis-widget .composition-commentary')).toHaveCount(1);await expect(page.locator('.analysis-widget')).not.toContainText('No additional model warnings.');await panel.getByRole('checkbox',{name:/Send this composition/}).check();await panel.getByRole('button',{name:'Review composition · 2',exact:true}).click();
 await expect(panel.getByRole('heading',{name:'Overall impression',exact:true})).toBeVisible();await expect(panel.getByRole('heading',{name:'What could go wrong',exact:true})).toBeVisible();await expect(panel.getByRole('heading',{name:'What to change first',exact:true})).toBeVisible();await expect(panel).toContainText('Expected effect');await expect(panel).not.toContainText('Compatibility is 60');await expect(panel).not.toContainText('Legacy score narration');
 await panel.screenshot({path:'.local/composition-review-en.png'});
 await page.setViewportSize({width:375,height:812});await page.getByRole('link',{name:'Switch language',exact:true}).click();
 const translated=page.getByRole('region',{name:'Коментар ШІ до складу',exact:true});await translated.getByRole('checkbox',{name:/Надсилати цей склад/}).check();await translated.getByRole('button',{name:'Розібрати склад · 2',exact:true}).click();
 await expect(translated.getByRole('heading',{name:'Що змінити насамперед',exact:true})).toBeVisible();await expect(translated).toContainText('Ніжніша середина');
 const result=translated.getByRole('region',{name:'Результат розбору складу',exact:true});await result.evaluate(element=>element.scrollIntoView({block:'center',behavior:'instant'}));await result.screenshot({path:'.local/composition-review-uk-mobile.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);expect(calls).toBe(2);
});

test('composition review allows no changes and renders exact addition amounts only from metadata',async({page})=>{
 let add=false;
 await page.route('**/v1/ai/explain',route=>route.fulfill({json:{summary:'Legacy.',main_problem:'',actions:[],composition:{summary:'The composition has a clear direction.',strengths:[],risks:add?[{ingredientIds:['salmon'],observation:'The finish may feel heavy.',reason:'The fish supplies richness.'}]:[],actions:add?[{kind:'add',ingredientIds:['lime','salmon'],candidateId:'addition:0',riskIndex:0,title:'Try a fresh finish',instruction:'Try the proposed lime addition before making further changes.',reason:'Acidity can counter the rich finish.',expectedEffect:'A brighter finish.',addition:{ingredientId:'lime',preparationId:'raw',grams:12}}]:[],missingContext:[]}}}));
 await setup(page,false);await page.getByRole('tab',{name:'1. Composition & balance',exact:true}).click();const grams=await page.getByRole('textbox',{name:/Salmon —/}).inputValue();const panel=page.getByRole('region',{name:'AI composition comment',exact:true});await panel.getByRole('checkbox',{name:/Send this composition/}).check();await panel.getByRole('button',{name:'Review composition · 2',exact:true}).click();
 await expect(panel).toContainText('No changes are recommended for this composition.');
 add=true;await page.getByRole('textbox',{name:'Recipe name',exact:true}).fill('New snapshot');await panel.getByRole('button',{name:'Update comment · 2',exact:true}).click();await expect(panel).toContainText('Engine-calculated addition trial: Lime · 12 g');
 await expect(page.getByRole('textbox',{name:/Salmon —/})).toHaveValue(grams);await expect(page.getByRole('textbox',{name:/Lime —/})).toHaveCount(0);
});

test('ingredient comment survives recipe reviews, becomes stale on amount or preparation edits, and preserves inputs on failure',async({page})=>{
 let calls=0,fail=false;const payloads:Array<{requestId:string;items:Array<{grams:number;preparationId:string}>}>=[];
 await page.route('**/v1/ai/explain',route=>{
  calls++;payloads.push(route.request().postDataJSON());
  return fail?route.fulfill({status:503,json:{code:'AI_PROVIDER_UNAVAILABLE'}}):route.fulfill({json:{summary:'A specific comment about the selected salmon.',main_problem:'',actions:[],composition:{summary:'A specific comment about the selected salmon.',strengths:[],risks:[],actions:[],missingContext:[]}}});
 });
 await page.route('**/v1/ai/review-recipe',route=>route.fulfill({json:{requestId:route.request().postDataJSON().requestId,contentHash:'review',comments:[],outcome:forecast,quota:capabilities}}));
 await setup(page);await page.getByRole('tab',{name:'1. Composition & balance',exact:true}).click();
 const panel=page.getByRole('region',{name:'AI composition comment',exact:true});expect(calls).toBe(0);await panel.getByRole('checkbox',{name:/Send this composition/}).check();await panel.getByRole('button',{name:'Review composition · 2',exact:true}).click();await expect(panel).toContainText('A specific comment about the selected salmon.');expect(calls).toBe(1);
 await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();await page.getByRole('textbox',{name:'Step 1',exact:true}).fill('A new recipe instruction.');const review=page.getByRole('region',{name:'Recipe assistant',exact:true});await review.getByRole('button',{name:'Assess dish & recipe · 4',exact:true}).click();await expect(review).toContainText(forecast.summary);await page.getByRole('tab',{name:'1. Composition & balance',exact:true}).click();await expect(panel).toContainText('A specific comment about the selected salmon.');await expect(panel.getByText(/composition context changed/)).toHaveCount(0);expect(calls).toBe(1);
 await panel.getByRole('button',{name:'Review composition · 2',exact:true}).click();await expect.poll(()=>calls).toBe(2);await expect(panel.getByRole('button',{name:'Review composition · 2',exact:true})).toBeEnabled();expect(payloads[1].requestId).toBe(payloads[0].requestId);
 const grams=page.getByRole('textbox',{name:/Salmon —/});await grams.fill('222');await expect(panel).toContainText('The composition context changed.');await expect(panel.getByText('A specific comment about the selected salmon.',{exact:true})).toHaveCount(0);expect(calls).toBe(2);await panel.getByRole('button',{name:'Update comment · 2',exact:true}).click();await expect(panel).toContainText('A specific comment about the selected salmon.');expect(payloads[2].items[0].grams).toBe(222);expect(payloads[2].requestId).not.toBe(payloads[0].requestId);
 await page.getByRole('combobox',{name:/Salmon —/}).selectOption('roasted');await expect(panel).toContainText('The composition context changed.');fail=true;await panel.getByRole('button',{name:'Update comment · 2',exact:true}).click();await expect(panel.getByRole('alert')).toContainText('AI could not complete this check.');await expect(grams).toHaveValue('222');await expect(page.getByRole('combobox',{name:/Salmon —/})).toHaveValue('roasted');await expect(panel.getByText('A specific comment about the selected salmon.',{exact:true})).toHaveCount(0);expect(calls).toBe(4);
});

test('a delayed ingredient comment cannot replace the result for edited ingredients',async({page})=>{
 let calls=0,release:()=>void=()=>{};const delayed=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/v1/ai/explain',async route=>{
  const first=++calls===1;if(first)await delayed;
  await route.fulfill({json:{summary:first?'Outdated composition answer.':'Current composition answer.',main_problem:'',actions:[]}}).catch(()=>{});
 });
 await setup(page,false);await page.getByRole('tab',{name:'1. Composition & balance',exact:true}).click();const panel=page.getByRole('region',{name:'AI composition comment',exact:true});await panel.getByRole('checkbox',{name:/Send this composition/}).check();await panel.getByRole('button',{name:'Review composition · 2',exact:true}).click();await expect.poll(()=>calls).toBe(1);await expect(panel.getByRole('status')).toContainText('Analyzing the selected ingredients');
 await page.getByRole('textbox',{name:/Salmon —/}).fill('180');release();await expect(panel.getByRole('button',{name:'Review composition · 2',exact:true})).toBeEnabled();await expect(panel.getByText('Outdated composition answer.',{exact:true})).toHaveCount(0);await panel.getByRole('button',{name:'Review composition · 2',exact:true}).click();await expect(panel).toContainText('Current composition answer.');await expect(panel).not.toContainText('Outdated composition answer.');expect(calls).toBe(2);
});
