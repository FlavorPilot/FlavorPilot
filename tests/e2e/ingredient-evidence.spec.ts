import {expect,test,type Page} from '@playwright/test';
const breaded=[['chicken',500,'roasted'],['breadcrumb',60,'roasted'],['egg',150,'raw'],['wheat_flour',150,'raw'],['lemon_juice',54,'raw'],['salt',5,'raw'],['ketchup',150,'sauce'],['dill_pickle',120,'raw']].map(([ingredientId,grams,preparationId])=>({ingredientId,grams,preparationId}));
async function load(page:Page,items:unknown[],goal='balanced'){
 await page.goto('/en/library');await page.locator('input[type=file]').setInputFiles({name:'composition.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'flavorpilot.recipe',version:2,name:'Ingredient-stage check',goal,items}))});
 await expect(page.locator('.analysis-widget')).toBeVisible();
}
test('reported chicken composition has no guessed index or proportion grade; EN/UK and server agree',async({page})=>{
 await load(page,breaded,'crunchy');const panel=page.locator('.analysis-widget');
 await expect(panel.locator('.assessment-status')).toHaveText('Insufficient pair data for an index');await expect(panel.locator('.score-ring')).toHaveCount(0);
 await expect(panel.getByText('Proportions',{exact:true})).toHaveCount(0);
 const coverage=panel.locator('.metric-grid > div').filter({has:page.getByText('Pairs with catalogue hypotheses',{exact:true})});await expect(coverage.locator('dd')).toHaveText('0 / 28');
 const fit=panel.locator('.metric-grid > div').filter({has:page.getByText('Fit to selected sensory profile',{exact:true})});await expect(fit.locator('dd')).toHaveText('92/100');
 await panel.getByText('Ingredient shares',{exact:true}).click();const flour=panel.locator('.ingredient-shares dl > div').filter({hasText:'Wheat flour'});await expect(flour).toContainText('12.62%');await expect(flour).toContainText('150 g');
 const response=page.waitForResponse(r=>r.url().includes('/v1/flavor/analyze')&&r.request().method()==='POST');await page.getByRole('button',{name:'Verify with server',exact:true}).click();const result=await(await response).json();expect(result.overallScore).toBeNull();expect(result.compatibilityScore).toBeNull();expect(result.ingredientAssessment.assessedPairs).toBe(0);
 await expect(page.getByText('Server calculation matches the local model.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Detailed',exact:true}).click();const table=page.locator('.pair-table');await expect(table.locator('tbody tr')).toHaveCount(28);await expect(table).not.toContainText('/ 100');
 await page.setViewportSize({width:375,height:812});await page.getByRole('link',{name:'Switch language',exact:true}).click();await expect(panel.locator('.assessment-status')).toHaveText('Недостатньо даних про пари для індексу');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:'.local/ingredient-evidence-uk-mobile.png'});
});
test('a complete pair index stays separate from the goal; partial data and potential conflicts stay explicit',async({page})=>{
 const known=[{ingredientId:'salmon',grams:150,preparationId:'raw'},{ingredientId:'lime',grams:10,preparationId:'raw'}];
 await load(page,known,'fresh');const ring=page.locator('.score-ring strong');await expect(ring).toHaveText('92');
 await page.getByLabel('What are you aiming for?').selectOption('rich');await expect(ring).toHaveText('92');
 await load(page,[...known,{ingredientId:'egg',grams:150,preparationId:'raw'}]);await expect(page.locator('.analysis-widget .assessment-status')).toContainText('Partial pair data');await expect(ring).toHaveCount(0);
 await load(page,[known[0],{ingredientId:'blue_cheese',grams:30,preparationId:'raw'}]);await expect(page.locator('.analysis-widget')).toContainText('Potential conflicts from catalogue hypotheses');
});
