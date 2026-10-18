import { expect,test,type Page } from '@playwright/test';
async function signup(page:Page){
 await page.goto('/en/sign-up');await page.getByLabel('Email',{exact:true}).fill(`ai-${crypto.randomUUID()}@example.com`);
 await page.getByLabel(/^Password/).fill('correct-horse');await page.getByRole('button',{name:'Create account',exact:true}).click();
 await expect(page.getByText('Signed in. You can return to the studio.')).toBeVisible();
}
const capabilities={enabled:true,access:'pilot',remaining:300,dailyRemaining:30,resetAt:'2099-01-01T00:00:00.000Z',dailyResetAt:'2099-01-01T00:00:00.000Z',costs:{explain:2,step:1,full:4},reason:null};
async function setup(page:Page){
 await page.route('**/v1/account/capabilities',r=>r.fulfill({json:capabilities}));await signup(page);await page.goto('/en/builder');
 await page.getByRole('textbox',{name:'Recipe name',exact:true}).fill('AI recipe');await page.getByLabel('Add an ingredient').fill('Salmon');await page.getByRole('option',{name:/Salmon/}).click();
 await page.getByRole('tab',{name:'2. Preparation',exact:true}).click();await page.getByRole('button',{name:'Add a step',exact:true}).click();
 await page.getByRole('textbox',{name:'Step 1',exact:true}).fill('Prepare salmon.');
 return page.getByRole('region',{name:'Recipe assistant',exact:true});
}
test('review requires consent; explicit edits support undo and stale suggestions cannot apply',async({page})=>{
 let calls=0;
 await page.route('**/v1/ai/review-recipe',async route=>{
  calls++;const data=route.request().postDataJSON();
  await route.fulfill({json:{requestId:data.requestId,contentHash:'test-hash',quota:capabilities,comments:[{id:crypto.randomUUID(),kind:'clarity',stepId:data.recipe.steps[0].id,message:'Clarify the method.',suggestedText:'Sear the salmon in a hot pan.'}]}});
 });
 const panel=await setup(page);await expect(panel.getByRole('button',{name:'Check recipe · 4',exact:true})).toBeDisabled();
 await panel.getByRole('checkbox',{name:/Send this composition/}).check();await panel.getByRole('button',{name:'Check recipe · 4',exact:true}).click();
 await expect(panel.getByText('Clarify the method.')).toBeVisible();expect(calls).toBe(1);
 await panel.screenshot({path:'.local/ai-review-en.png'});
 await panel.getByRole('button',{name:'Replace step text',exact:true}).click();await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveValue('Sear the salmon in a hot pan.');
 await expect(panel.getByRole('button',{name:'Replace step text',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByRole('textbox',{name:'Step 1',exact:true})).toHaveValue('Prepare salmon.');
 await page.getByRole('textbox',{name:'Step 1',exact:true}).fill('A different method.');await expect(panel.getByRole('button',{name:'Replace step text',exact:true})).toBeDisabled();
 expect(calls).toBe(1);
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
 const uk=page.getByRole('region',{name:'Помічник рецепта',exact:true});await uk.getByRole('checkbox',{name:/Надсилати цей склад/}).check();await uk.getByRole('button',{name:'Перевірити рецепт · 4',exact:true}).click();await expect(uk.getByRole('alert')).toContainText('Ліміт перевірок ШІ');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await uk.screenshot({path:'.local/ai-review-uk-mobile.png'});
});
