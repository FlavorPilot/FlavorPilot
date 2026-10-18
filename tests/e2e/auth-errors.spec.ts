import { expect, test } from '@playwright/test';

test('explains invalid credentials without losing entered details or showing provider data', async ({ page }) => {
    await page.route('**/auth/v1/token**', route => route.fulfill({
        status: 400, json: { error_code: 'invalid_credentials', msg: 'Private provider diagnostic' },
    }));
    await page.goto('/en/sign-in');
    await page.getByLabel('Email', { exact: true }).fill('auth-errors@example.com');
    await page.getByLabel(/^Password/).fill('test-password-123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const alert = page.getByRole('region', { name: 'Sign in', exact: true }).getByRole('alert');
    await expect(alert).toContainText('The email or password is incorrect.');
    await expect(alert).not.toContainText('Private provider diagnostic');
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('auth-errors@example.com');
    await expect(page.getByLabel(/^Password/)).toHaveValue('test-password-123');
});

test('shows the email limit during Ukrainian signup at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route('**/auth/v1/signup**', route => route.fulfill({
        status: 429, json: { error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' },
    }));
    await page.goto('/uk/sign-up');
    await page.getByLabel('Електронна пошта', { exact: true }).fill('auth-errors@example.com');
    await page.getByLabel(/^Пароль/).fill('test-password-123');
    await page.getByRole('button', { name: 'Створити обліковий запис', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Створити обліковий запис', exact: true }).getByRole('alert')).toContainText('Досягнуто ліміт надсилання листів.');
    await expect(page.getByText('Перевірте пошту, щоб підтвердити обліковий запис.')).toHaveCount(0);
    await expect(page.getByLabel('Електронна пошта', { exact: true })).toHaveValue('auth-errors@example.com');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('does not claim a reset email was sent when limited and allows an explicit retry', async ({ page }) => {
    let attempts = 0;
    await page.route('**/auth/v1/recover**', route => {
        attempts++;
        return route.fulfill(attempts === 1
            ? { status: 429, json: { error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' } }
            : { status: 200, json: {} });
    });
    await page.goto('/en/reset-password');
    await page.getByLabel('Email', { exact: true }).fill('auth-errors@example.com');
    await page.getByRole('button', { name: 'Reset password', exact: true }).click();
    const alert = page.getByRole('region', { name: 'Reset password', exact: true }).getByRole('alert');
    await expect(alert).toContainText('The email sending limit has been reached.');
    await expect(page.getByText('If that account exists, a password-reset link has been sent.')).toHaveCount(0);
    expect(attempts).toBe(1);
    await page.getByRole('button', { name: 'Reset password', exact: true }).click();
    await expect(page.getByText('If that account exists, a password-reset link has been sent.')).toBeVisible();
    await expect(alert).toHaveCount(0);
    expect(attempts).toBe(2);
});
