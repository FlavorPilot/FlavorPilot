import { expect, test } from '@playwright/test';

test('each nutrient explains its own coverage, sources and missing rows', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/en/builder');
    for (const name of ['Salmon', 'Salt', 'Rice vinegar']) {
        await page.getByLabel('Add an ingredient').fill(name);
        await page.getByRole('option', { name: new RegExp(`^${name} `) }).click();
    }
    const about = page.getByRole('button', { name: 'About the published composition' });
    const explanation = page.getByRole('note', { name: 'About the published composition' });
    await expect(explanation).toHaveCount(0);
    await about.hover();
    await expect(explanation).toContainText('USDA FoodData Central');
    await page.keyboard.press('Escape');
    await expect(explanation).toHaveCount(0);
    const protein = page.getByRole('button', { name: 'Protein: Ingredient coverage and contributions' });
    await expect(protein).toHaveText('1 of 3');
    await protein.focus();
    const proteinNote = page.getByRole('note', { name: 'Protein: Ingredient coverage and contributions' });
    await expect(proteinNote).toBeVisible();
    await expect(proteinNote.locator('li')).toHaveCount(3);
    await expect(proteinNote.getByText('No published amount — excluded from this total.', { exact: true })).toHaveCount(2);
    await expect(proteinNote.getByRole('link', { name: /USDA record/ })).toHaveCount(2);
    await page.keyboard.press('Tab');
    await expect(proteinNote.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(proteinNote.getByRole('link', { name: /USDA record/ }).first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(proteinNote).toHaveCount(0);
    await expect(protein).toBeFocused();
    const sodium = page.getByRole('button', { name: 'Sodium: Ingredient coverage and contributions' });
    await sodium.click();
    await expect(sodium).toHaveText('2 of 3');
    const sodiumNote = page.getByRole('note', { name: 'Sodium: Ingredient coverage and contributions' });
    await expect(sodiumNote.getByText('No published amount — excluded from this total.', { exact: true })).toHaveCount(1);
    await sodiumNote.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(sodiumNote).toHaveCount(0);
    await expect(sodium).toBeFocused();
    expect(errors).toEqual([]);
});

test.describe('touch notes', () => {
test.use({ hasTouch: true });
test('Ukrainian catalogue and notes work by tap on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/uk/builder');
    const search = page.getByRole('combobox', { name: 'Додати інгредієнт' });
    for (const name of ['Шиїтаке', 'Чорна смородина', 'Гарбузове насіння']) {
        await search.fill(name);
        await page.getByRole('option', { name: new RegExp(name) }).click();
    }
    const protein = page.getByRole('button', { name: 'Білок: Покриття інгредієнтів та їхній внесок' });
    await protein.tap();
    const note = page.getByRole('note', { name: 'Білок: Покриття інгредієнтів та їхній внесок' });
    await expect(note).toBeVisible();
    await expect(note.locator('li')).toHaveCount(3);
    await expect(note).toContainText('Шиїтаке');
    const box = await note.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    await page.screenshot({ path: '.local/composition-breakdown-uk.png' });
    await note.getByRole('button', { name: 'Закрити', exact: true }).tap();
    await page.getByRole('button', { name: 'Про опублікований склад' }).tap();
    await expect(page.getByRole('note', { name: 'Про опублікований склад' })).toContainText('не змінює оцінку моделі');
    await page.getByRole('heading', { name: 'Опублікований склад' }).click();
    await expect(page.getByRole('note')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
});
