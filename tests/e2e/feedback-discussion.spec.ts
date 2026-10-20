import { expect, test, type Page } from '@playwright/test';
const api=`http://127.0.0.1:${process.env.FLAVORPILOT_E2E_API_PORT ?? '4100'}/v1`;
const items=[{ingredientId:'salmon',grams:150,preparationId:'seared'},{ingredientId:'lime',grams:12,preparationId:'raw'}];
async function signup(page:Page) {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill(`feedback-${crypto.randomUUID()}@example.com`);
    await page.getByLabel(/^Password/).fill('correct-horse');
    const response=page.waitForResponse(response=>response.url().includes('/auth/v1/signup') && response.ok());
    await page.getByRole('button',{name:'Create account',exact:true}).click();
    const body=await(await response).json();
    await expect(page.getByText('Signed in. You can return to the studio.')).toBeVisible();
    return body.access_token as string;
}
async function createDish(page:Page,token:string) {
    const response=await page.request.post(`${api}/dishes`,{headers:{Authorization:`Bearer ${token}`},data:{name:'Discussion test dish',goal:'fresh',visibility:'public',items}});
    expect(response.status()).toBe(201);return await response.json() as {id:string;versionNumber:number};
}
test('author feedback captures a private draft, survives a failed request and does not follow later edits',async({page})=>{
    await signup(page);
    await page.goto('/en/builder');
    for(const name of ['Salmon','Lime']) {
        await page.getByLabel('Add an ingredient').fill(name);
        await page.getByRole('option').filter({has:page.getByText(name,{exact:true})}).click();
    }
    await page.getByRole('tab',{name:'2. Preparation'}).click();
    await page.getByLabel('About this dish').fill('Private cooking notes');
    await page.getByRole('button',{name:'Add a step',exact:true}).click();
    await page.getByRole('textbox',{name:'Step 1',exact:true}).fill('Cook, taste and adjust.');
    await page.getByRole('tab',{name:'1. Composition & balance'}).click();
    await page.getByRole('button',{name:'Review this prediction',exact:true}).click();
    const dialog=page.getByRole('dialog');
    await expect(dialog.getByRole('button',{name:'Send private feedback',exact:true})).toBeDisabled();
    await dialog.getByRole('radio',{name:'Yes, I cooked it',exact:true}).check();
    await dialog.getByRole('radio',{name:'Partly matches',exact:true}).check();
    await dialog.getByRole('checkbox',{name:'Fit to selected sensory profile',exact:true}).check();
    const note=dialog.getByRole('textbox',{name:'What was different? (optional)'});
    await note.fill('The lime was stronger than predicted.');
    await dialog.screenshot({path:'.local/model-feedback-en.png'});
    await page.route('**/v1/feedback',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'TEST_UNAVAILABLE'})}),{times:1});
    await dialog.getByRole('button',{name:'Send private feedback',exact:true}).click();
    await expect(dialog.getByRole('alert')).toContainText('Your answers are still here');
    await expect(note).toHaveValue('The lime was stronger than predicted.');
    const submitted=page.waitForResponse(response=>response.url().endsWith('/v1/feedback') && response.ok());
    await dialog.getByRole('button',{name:'Send private feedback',exact:true}).click();
    const result=await(await submitted).json();
    expect(result.recipe.description).toBe('Private cooking notes');
    expect(result.recipe.steps[0].text).toBe('Cook, taste and adjust.');
    expect(result.cooked).toBe(true);expect(result.concerns).toEqual(['balance']);
    expect(result.dishId).toBeNull();expect(result.analysis.overallScore).toBeGreaterThan(0);
    await expect(page.getByText('Feedback saved for this snapshot. It is not a public comment.')).toBeVisible();
    await page.getByLabel('Salmon — Amount').fill('160');
    await expect(page.getByText('Feedback saved for this snapshot. It is not a public comment.')).toHaveCount(0);
    await page.getByRole('button',{name:'Review this prediction',exact:true}).click();
    await expect(dialog.getByRole('textbox',{name:'What was different? (optional)'})).toHaveValue('');
    await page.keyboard.press('Escape');
});

test('public discussion separates visitor comments from private author feedback and retains replies after deletion',async({page,browser})=>{
    const ownerToken=await signup(page),dish=await createDish(page,ownerToken);
    await page.goto(`/en/dishes/${dish.id}`);
    await expect(page.getByRole('button',{name:'Review this prediction',exact:true})).toBeVisible();
    const context=await browser.newContext(),visitor=await context.newPage();
    await signup(visitor);
    await visitor.goto(`/en/dishes/${dish.id}`);
    await expect(visitor.getByRole('button',{name:'Review this prediction',exact:true})).toHaveCount(0);
    await visitor.getByLabel('Your comment',{exact:true}).fill('<script>alert("text only")</script> I tried it with lemon.');
    await visitor.getByLabel('I cooked this version of the dish',{exact:true}).check();
    await visitor.getByRole('button',{name:'Post comment',exact:true}).click();
    const comment=visitor.locator('.comment-card').filter({hasText:'I tried it with lemon.'});
    await expect(comment.getByText('Cooked this dish',{exact:true})).toBeVisible();
    await expect(comment).toContainText('<script>alert("text only")</script>');
    await page.reload();
    const ownerView=page.locator('.comment-card').filter({hasText:'I tried it with lemon.'});
    await expect(ownerView.getByRole('button',{name:'Delete my comment'})).toHaveCount(0);
    await ownerView.getByRole('button',{name:'Reply',exact:true}).click();
    await expect(page.getByLabel('Your comment',{exact:true})).toBeFocused();
    await page.getByLabel('Your comment',{exact:true}).fill('Thank you for cooking it.');
    await page.getByRole('button',{name:'Post comment',exact:true}).click();
    await expect(page.locator('.comment-card').filter({hasText:'Thank you for cooking it.'})).toBeVisible();
    await visitor.reload();
    await visitor.locator('.comment-card').filter({hasText:'I tried it with lemon.'}).filter({hasNotText:'Thank you for cooking it.'}).getByRole('button',{name:'Delete my comment'}).click();
    await visitor.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}).click();
    await expect(visitor.getByText('This comment was deleted.',{exact:true}).first()).toBeVisible();
    await expect(visitor.getByText('Thank you for cooking it.',{exact:true})).toBeVisible();
    await context.close();
});

test('stale recipe refresh and API failures keep the comment draft; Ukrainian discussion fits mobile',async({page})=>{
    const token=await signup(page),dish=await createDish(page,token);
    await page.goto(`/en/dishes/${dish.id}`);
    await page.getByLabel('Your comment',{exact:true}).fill('My draft survives a recipe change.');
    const changed=await page.request.patch(`${api}/dishes/${dish.id}`,{headers:{Authorization:`Bearer ${token}`},data:{name:'An updated dish'}});
    expect(changed.status()).toBe(200);
    await page.getByRole('button',{name:'Post comment',exact:true}).click();
    await expect(page.getByRole('region',{name:'Discussion of the dish'}).getByRole('alert')).toContainText('The recipe changed');
    await expect(page.getByLabel('Your comment',{exact:true})).toHaveValue('My draft survives a recipe change.');
    await page.getByRole('button',{name:'Refresh recipe',exact:true}).click();
    await expect(page.getByRole('heading',{name:'An updated dish',exact:true})).toBeVisible();
    await expect(page.getByLabel('Your comment',{exact:true})).toHaveValue('My draft survives a recipe change.');
    await page.route(`**/v1/dishes/${dish.id}/comments`,route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}),{times:1});
    await page.getByRole('button',{name:'Post comment',exact:true}).click();
    await expect(page.getByRole('region',{name:'Discussion of the dish'}).getByRole('alert')).toContainText('Your text is still here');
    await page.getByRole('button',{name:'Post comment',exact:true}).click();
    await expect(page.getByText('My draft survives a recipe change.',{exact:true})).toBeVisible();
    await expect(page.getByLabel('Your comment',{exact:true})).toHaveValue('');
    await page.setViewportSize({width:375,height:812});
    await page.goto(`/uk/dishes/${dish.id}`);
    await expect(page.getByRole('heading',{name:'Обговорення страви'})).toBeVisible();
    await page.getByLabel('Ваш коментар',{exact:true}).fill('Дякую за рецепт!');
    await page.getByRole('button',{name:'Опублікувати коментар',exact:true}).click();
    await expect(page.getByText('Дякую за рецепт!',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('section').filter({has:page.getByRole('heading',{name:'Обговорення страви'})}).screenshot({path:'.local/discussion-uk.png'});
});
