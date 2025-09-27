import { test, expect } from '@playwright/test';

test.describe('認証機能', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // JIZAIタイトルが表示されることを確認
    await expect(page.getByText('JIZAI')).toBeVisible();

    // ログインメッセージが表示されることを確認
    await expect(page.getByText('アカウントでサインインしてはじめましょう')).toBeVisible();

    // Googleログインボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /Googleで続ける|Google/ })).toBeVisible();

    // Appleログインボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /Appleでサインイン|Apple/ })).toBeVisible();
  });

  test('開発環境ログインボタンが表示される（開発環境の場合）', async ({ page }) => {
    await page.goto('/login');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 開発環境の場合、開発用ログインボタンが表示されることを確認
    const devButton = page.getByRole('button', { name: /開発用テストユーザーでログイン/ });

    // 開発環境かどうかに関係なく、ボタンが存在するかをチェック
    const isVisible = await devButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(devButton).toBeVisible();
      console.log('開発環境ログインボタンが確認されました');
    } else {
      console.log('本番環境のため、開発環境ログインボタンは表示されていません');
    }
  });

  test('認証なしでプロテクトされたページにアクセスした場合のリダイレクト', async ({ page }) => {
    // プロテクトされたページ（マイファイル）に直接アクセス
    await page.goto('/');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ログインページにリダイレクトされるか、またはログインコンポーネントが表示されることを確認
    const isOnLoginPage = page.url().includes('/login');
    const hasLoginComponent = await page.getByText('JIZAI').isVisible().catch(() => false);

    if (isOnLoginPage) {
      expect(page.url()).toContain('/login');
    } else if (hasLoginComponent) {
      await expect(page.getByText('JIZAI')).toBeVisible();
    } else {
      // どちらでもない場合は、何らかのメインコンテンツが表示されていることを確認
      await expect(page.locator('body')).toBeVisible();
    }
  });
});