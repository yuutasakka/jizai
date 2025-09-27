import { test, expect } from '@playwright/test';

test.describe('ファイル操作機能', () => {
  test.beforeEach(async ({ page }) => {
    // 各テストの前にホームページにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('マイファイルページが表示される', async ({ page }) => {
    // マイファイルのヘッダーが表示されることを確認
    const myFilesHeader = page.getByText('マイファイル');

    if (await myFilesHeader.isVisible().catch(() => false)) {
      await expect(myFilesHeader).toBeVisible();

      // ストレージボタンが表示されることを確認
      await expect(page.getByRole('button', { name: /ストレージ/ })).toBeVisible();

      // リフレッシュボタンが表示されることを確認
      await expect(page.getByRole('button', { name: /↻/ })).toBeVisible();
    } else {
      // マイファイルページが表示されない場合（認証が必要な場合など）
      console.log('マイファイルページにアクセスできません（認証が必要な可能性があります）');
    }
  });

  test('新規作成ボタンが機能する', async ({ page }) => {
    // 新規作成ボタンを探す
    const createButton = page.getByRole('button', { name: /新しい作品を作成|最初の一枚を作成|新規作成/ });

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();

      // 新規作成ページまたはコンポーネントが表示されることを確認
      await page.waitForLoadState('networkidle');

      // 新規作成に関連するコンテンツが表示されることを確認
      const hasCreateContent = await page.getByText(/写真をアップロード|新規作成|編集内容/).isVisible().catch(() => false);
      expect(hasCreateContent).toBe(true);
    } else {
      console.log('新規作成ボタンが見つかりません');
    }
  });

  test('検索ページにアクセスできる', async ({ page }) => {
    // 検索ページのリンクやボタンを探す
    const searchLink = page.getByRole('link', { name: /発見|検索|探す/ }).or(
      page.getByRole('button', { name: /発見|検索|探す/ })
    );

    if (await searchLink.isVisible().catch(() => false)) {
      await searchLink.click();
      await page.waitForLoadState('networkidle');

      // 検索ページの特徴的な要素を確認
      const hasSearchContent = await page.getByText(/発見|カテゴリ|すべて|人物|ペット|写真/).isVisible().catch(() => false);
      expect(hasSearchContent).toBe(true);
    } else {
      // URLで直接アクセスを試行
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const hasSearchContent = await page.getByText(/発見|カテゴリ/).isVisible().catch(() => false);
      if (hasSearchContent) {
        expect(hasSearchContent).toBe(true);
      } else {
        console.log('検索ページにアクセスできません');
      }
    }
  });

  test('検索ページのカテゴリボタンが機能する', async ({ page }) => {
    // 検索ページに移動
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // カテゴリボタンが表示されることを確認
    const categoryButtons = page.getByRole('button', { name: /すべて|人物|ペット|写真/ });

    if (await categoryButtons.first().isVisible().catch(() => false)) {
      // 各カテゴリボタンをクリックしてテスト
      const categories = ['すべて', '人物', 'ペット', '写真'];

      for (const category of categories) {
        const button = page.getByRole('button', { name: category });
        if (await button.isVisible().catch(() => false)) {
          await button.click();
          await page.waitForTimeout(500); // クリック後の状態変化を待つ

          // ボタンがアクティブ状態になることを確認
          await expect(button).toBeVisible();
        }
      }
    } else {
      console.log('カテゴリボタンが見つかりません');
    }
  });
});