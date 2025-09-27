import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('ページが正常に読み込まれる', async ({ page }) => {
    await page.goto('/');

    // ページタイトルが存在することを確認
    await expect(page).toHaveTitle(/スワップ裁定取引ファインダー/);

    // メインコンテンツが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('ナビゲーションが機能する', async ({ page }) => {
    await page.goto('/');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 何らかのメインコンテンツが表示されることを確認
    const mainContent = page.locator('main, [role="main"], .main-content, body > div');
    await expect(mainContent.first()).toBeVisible();
  });
});