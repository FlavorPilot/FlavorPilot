import { expect, test, type Page } from '@playwright/test';

function email() { return `e2e-${crypto.randomUUID()}@example.com`; }
const password = 'correct-horse';

async function addSalmon(page: Page) {
    await page.getByLabel('Add an ingredient').fill('Salmon');
    await page.getByRole('option', { name: /Salmon/ }).click();
    await expect(page.getByTestId('ingredient-row')).toContainText('Salmon');
}

async function signUp(page: Page, address = email()) {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill(address);
    await page.getByLabel(/^Password/).fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Signed in. You can return to the studio.')).toBeVisible();
    return address;
}

async function saveToAccount(page: Page, visibility: 'Only me' | 'Everyone' | 'Anyone with the link') {
    await page.getByRole('button', { name: 'Save recipe' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /My account/ }).click();
    if (visibility !== 'Only me') {
        await dialog.getByRole('radio', { name: new RegExp(visibility) }).check();
        await dialog.getByRole('checkbox').check();
    }
    const response = page.waitForResponse(res => res.url().includes('/v1/dishes') && res.request().method() !== 'GET' && res.ok());
    await dialog.getByRole('button', { name: 'Save recipe' }).click();
    const body = await (await response).json();
    await expect(page.getByText('Saved to your account.')).toBeVisible();
    return body as { id: string; shareToken?: string; parentDishId?: string | null };
}

test('switches language without dropping the composition', async ({ page }) => {
    await page.goto('/en/builder');
    await addSalmon(page);
    await expect(page.getByText('Draft saved in this browser')).toBeVisible();
    await page.getByRole('link', { name: 'Switch language' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page.getByTestId('ingredient-row')).toContainText('Лосось');
});

test('saves locally, reloads, and edits the same recipe', async ({ page }) => {
    await page.goto('/en/builder');
    await page.getByRole('textbox', { name: 'Recipe name' }).fill('Local salmon');
    await addSalmon(page);
    await expect(page.getByText('Draft saved in this browser')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Recipe name' })).toHaveValue('Local salmon');
    await expect(page.getByTestId('ingredient-row')).toContainText('Salmon');
    await page.getByRole('button', { name: 'Save recipe' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save recipe' }).click();
    await expect(page.getByText('Saved to this browser only.')).toBeVisible();
    await page.goto('/en/library');
    await expect(page.getByRole('heading', { name: 'Local salmon' })).toBeVisible();
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Recipe name' })).toHaveValue('Local salmon');
    await page.getByRole('textbox', { name: 'Recipe name' }).fill('Local salmon edited');
    await page.getByRole('button', { name: 'Save recipe' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save recipe' }).click();
    await page.goto('/en/library');
    await expect(page.getByRole('heading', { name: 'Local salmon edited' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Local salmon', exact: true })).toHaveCount(0);
});

test('signs up, signs out, and signs in again', async ({ page }) => {
    const address = await signUp(page);
    await page.goto('/en/account');
    await expect(page.getByText(address)).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByText('No account signed in.')).toBeVisible();
    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill(address);
    await page.getByLabel(/^Password/).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Signed in. You can return to the studio.')).toBeVisible();
    await page.goto('/en/account');
    await expect(page.getByText(address)).toBeVisible();
});

test('hides a private dish from another user and an anonymous visitor', async ({ browser, page }) => {
    await signUp(page);
    await page.goto('/en/builder');
    await page.getByRole('textbox', { name: 'Recipe name' }).fill('Secret salmon');
    await addSalmon(page);
    const saved = await saveToAccount(page, 'Only me');
    const outsider = await browser.newContext();
    const other = await outsider.newPage();
    await signUp(other);
    await other.goto('/en/library');
    await other.getByRole('button', { name: 'In my account' }).click();
    await expect(other.getByRole('heading', { name: 'Secret salmon' })).toHaveCount(0);
    await other.goto(`/en/dishes/${saved.id}`);
    await expect(other.getByText('This recipe is unavailable.')).toBeVisible();
    const anonymous = await browser.newContext();
    const guest = await anonymous.newPage();
    await guest.goto(`/en/dishes/${saved.id}`);
    await expect(guest.getByText('This recipe is unavailable.')).toBeVisible();
    await outsider.close();
    await anonymous.close();
});

test('shows a published dish to a second user and keeps a remix private', async ({ browser, page }) => {
    await signUp(page);
    await page.goto('/en/builder');
    await page.getByRole('textbox', { name: 'Recipe name' }).fill('Public salmon');
    await addSalmon(page);
    const saved = await saveToAccount(page, 'Everyone');
    const outsider = await browser.newContext();
    const other = await outsider.newPage();
    await signUp(other);
    await other.goto('/en/discover');
    const card = other.getByRole('article').filter({ hasText: 'Public salmon' });
    await expect(card.getByRole('heading', { name: 'Public salmon' })).toBeVisible();
    await card.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(other.getByRole('heading', { name: 'Public salmon' })).toBeVisible();
    await other.getByRole('button', { name: 'Use as a starting point' }).click();
    await expect(other.getByText('Based on')).toBeVisible();
    await other.getByRole('textbox', { name: 'Recipe name' }).fill('Public salmon remix');
    const posted = other.waitForRequest(req => req.url().endsWith('/v1/dishes') && req.method() === 'POST');
    await saveToAccount(other, 'Only me');
    expect(((await posted).postDataJSON() as { parentDishId?: string }).parentDishId).toBe(saved.id);
    await other.goto(`/en/dishes/${saved.id}`);
    await expect(other.getByRole('heading', { name: 'Public salmon' })).toBeVisible();
    await outsider.close();
});

test('opens an unlisted link and leaves it out of the public list', async ({ browser, page }) => {
    await signUp(page);
    await page.goto('/en/builder');
    await page.getByRole('textbox', { name: 'Recipe name' }).fill('Unlisted salmon');
    await addSalmon(page);
    await saveToAccount(page, 'Anyone with the link');
    const link = await page.getByLabel('Saved recipe link').inputValue();
    expect(link).toContain('/en/share/');
    const outsider = await browser.newContext();
    const other = await outsider.newPage();
    await other.goto(link);
    await expect(other.getByRole('heading', { name: 'Unlisted salmon' })).toBeVisible();
    await expect(other.getByText('Anyone with the link')).toBeVisible();
    await other.goto('/en/discover');
    await other.getByPlaceholder('Search your recipes…').fill('Unlisted salmon');
    await expect(other.getByText('No public recipes yet.')).toBeVisible();
    await outsider.close();
});

test('deletes an account recipe', async ({ page }) => {
    await signUp(page);
    await page.goto('/en/builder');
    await page.getByRole('textbox', { name: 'Recipe name' }).fill('Disposable salmon');
    await addSalmon(page);
    await saveToAccount(page, 'Only me');
    await page.goto('/en/library');
    await page.getByRole('button', { name: 'In my account' }).click();
    await page.getByRole('button', { name: 'Delete: Disposable salmon' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Recipe deleted.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Disposable salmon' })).toHaveCount(0);
});

test('keeps the mobile builder usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/builder');
    await page.getByRole('textbox', { name: 'Recipe name' }).fill('Pocket salmon');
    await addSalmon(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
});

test('warns when rosemary is above its working maximum', async ({ page }) => {
    await page.goto('/en/builder');
    for (const [name, grams] of [['Duck', '220'], ['Cherry', '70'], ['Rosemary', '35']] as const) {
        await page.getByLabel('Add an ingredient').fill(name);
        await page.getByRole('option', { name: new RegExp(name) }).click();
        await page.getByLabel(`${name} — Amount, grams`).fill(grams);
    }
    const issue = page.locator('.primary-issue');
    await expect(issue).toContainText('This amount is above the working maximum for this ingredient.');
    await expect(issue).toContainText('Rosemary');
});

test('keeps the local draft when the API is down', async ({ page }) => {
    await page.goto('/en/builder');
    await addSalmon(page);
    await page.route('**/v1/**', route => route.abort());
    await page.getByRole('button', { name: 'Verify with server' }).click();
    await expect(page.getByText('The API is unavailable. Local drafts are unaffected.')).toBeVisible();
    await expect(page.getByTestId('ingredient-row')).toContainText('Salmon');
    await page.goto('/en/discover');
    await expect(page.getByText('Community recipes could not be loaded. Examples are a separate, optional view.')).toBeVisible();
});
