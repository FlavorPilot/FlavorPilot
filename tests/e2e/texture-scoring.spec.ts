import {expect,test} from '@playwright/test';
const visibleRows=[['milk',150,'raw'],['cucumber',100,'raw'],['lemon',8.8,'raw'],['lime',8.3,'raw'],['avocado',48,'raw'],['cilantro',5.7,'raw'],['ginger',5.8,'raw'],['miso',9.1,'fermented'],['sesame',7.4,'raw']].map(([ingredientId,grams,preparationId])=>({ingredientId,grams,preparationId}));

test('reported visible rows have bounded descriptive contrast; browser and server agree in EN/UK',async({page})=>{
 await page.goto('/en/library');
 await page.locator('input[type=file]').setInputFiles({name:'texture-report.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'flavorpilot.recipe',version:2,name:'Reported visible rows',goal:'balanced',description:'',servings:null,steps:[],items:visibleRows}))});
 const panel=page.locator('.analysis-widget');
 await expect(panel.getByRole('heading',{name:'Composition index',exact:true})).toBeVisible();
 await expect(panel.locator('.score-ring strong')).toHaveText('69');
 await expect(panel.locator('.metric-grid > div').filter({has:page.getByText('Potential texture contrast',{exact:true})}).locator('dd')).toHaveText('36/100');
 await expect(panel).toContainText('More contrast does not mean better food.');
 const verification=page.waitForResponse(response=>response.url().includes('/v1/flavor/analyze')&&response.request().method()==='POST');
 await page.getByRole('button',{name:'Verify with server',exact:true}).click();
 const server=await (await verification).json();expect(server.textureScore).toBe(36);expect(server.overallScore).toBe(69);
 await page.setViewportSize({width:375,height:812});await page.getByRole('link',{name:'Switch language',exact:true}).click();
 await expect(panel.getByRole('heading',{name:'Індекс композиції',exact:true})).toBeVisible();
 await expect(panel).toContainText('Потенціал текстурного контрасту');
 await expect(panel).toContainText('Більший контраст не означає кращу страву.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 const metrics=panel.locator('.metric-grid');await metrics.evaluate(element=>element.scrollIntoView({block:'center',behavior:'instant'}));await metrics.screenshot({path:'.local/texture-scoring-uk-mobile.png'});
});

test('explicit purée removes cucumber crunch without marking a smooth dish as a texture defect',async({page})=>{
 await page.goto('/en/library');
 await page.locator('input[type=file]').setInputFiles({name:'smooth.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'flavorpilot.recipe',version:2,name:'Purée contrast',goal:'balanced',items:visibleRows.slice(0,2)}))});
 const metric=page.locator('.analysis-widget .metric-grid > div').filter({has:page.getByText('Potential texture contrast',{exact:true})}).locator('dd');
 await expect(metric).toHaveText('35/100');
 await page.getByTestId('ingredient-row').filter({has:page.getByText('Cucumber',{exact:true})}).locator('select').selectOption('pureed');
 await expect(metric).toHaveText('0/100');expect(Number(await page.locator('.score-ring strong').innerText())).toBeGreaterThan(0);
});
