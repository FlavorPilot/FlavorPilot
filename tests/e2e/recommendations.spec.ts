import { expect, test } from '@playwright/test';

test('recalculates portions and applies the exact recommendation without changing the original during preview', async ({ page }) => {
    await page.goto('/en/builder?example');
    const cards = page.locator('.recommendation-card');
    await expect(cards.first()).toBeVisible();
    const initialCards = await cards.allTextContents();
    const initialRows = await page.getByTestId('ingredient-row').count();
    const amount = page.getByTestId('ingredient-row').first().locator('input');
    await amount.fill('440');
    await amount.blur();
    await expect.poll(() => cards.allTextContents()).not.toEqual(initialCards);

    const card = cards.first();
    const name = await card.locator('h3').innerText();
    const badge = await card.locator('header').innerText();
    const grams = Number(badge.match(/([\d,.]+)\s*g/)![1].replaceAll(',', ''));
    const deltaText = await card.locator('p').filter({ hasText: 'Overall model score change' }).innerText();
    const delta = Number(deltaText.match(/\+(\d+)/)![1]);
    const before = Number(await page.locator('.score-ring strong').innerText());
    await card.locator('summary').click();
    await expect(card).toContainText('This amount was selected by comparing trial portions');
    const preparation = await card.locator('dl > div').filter({ hasText: 'Preparation used in this preview' }).locator('dd').innerText();
    await card.getByRole('button', { name: 'Preview', exact: true }).click();
    const preview = page.getByTestId('change-preview');
    await expect(preview).toContainText(name);
    await expect(preview).toContainText(preparation);
    await expect(preview).toContainText(`Overall model score change: +${delta}`);
    await expect(page.getByTestId('ingredient-row')).toHaveCount(initialRows);
    await expect(page.locator('.score-ring strong')).toHaveText(String(before));
    await preview.getByRole('button', { name: 'Keep this change' }).click();
    await expect(preview).toHaveCount(0);
    const added = page.getByTestId('ingredient-row').filter({ has: page.getByText(name, { exact: true }) });
    await expect(added.locator('input')).toHaveValue(String(grams));
    await expect(added.locator('select option:checked')).toHaveText(preparation);
    await expect(page.locator('.score-ring strong')).toHaveText(String(before + delta));
    await expect(page.getByTestId('ingredient-row')).toHaveCount(initialRows + 1);
});

test('shows localized evidence in keyboard-accessible details at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/uk/builder?example');
    const card = page.locator('.recommendation-card').first();
    await expect(card).toContainText('Зміна загальної оцінки моделі');
    const summary = card.locator('summary');
    await summary.focus();
    await summary.press('Enter');
    await expect(card).toContainText('Кількість підібрано порівнянням пробних порцій');
    await expect(card.locator('details')).toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Переглянути', exact: true }).first().click();
    await expect(page.getByTestId('change-preview')).toContainText('Зміна загальної оцінки моделі');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
