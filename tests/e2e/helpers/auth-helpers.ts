import { Page, expect } from '@playwright/test';

/**
 * 開発環境ログインを実行する
 */
export async function loginAsDeveloper(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // 開発環境ログインボタンを探す
  const devLoginButton = page.getByRole('button', { name: /開発用テストユーザーでログイン/ });

  if (await devLoginButton.isVisible()) {
    await devLoginButton.click();
    await page.waitForLoadState('networkidle');
    return true;
  }

  return false;
}

/**
 * ユーザーがログイン済みかどうかを確認する
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  // マイファイルページにアクセスしてログイン状態を確認
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ログインページにリダイレクトされないかチェック
  const isOnLoginPage = page.url().includes('/login');
  const hasLoginForm = await page.getByText('アカウントでサインインしてはじめましょう').isVisible().catch(() => false);

  return !isOnLoginPage && !hasLoginForm;
}

/**
 * ログアウトする
 */
export async function logout(page: Page) {
  // ログアウトボタンやメニューを探す
  const logoutButton = page.getByRole('button', { name: /ログアウト|サインアウト/ });

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  } else {
    // ログアウトボタンが見つからない場合は、ローカルストレージをクリア
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  }
}

/**
 * 認証が必要なページにアクセスする前の共通セットアップ
 */
export async function setupAuthenticatedUser(page: Page) {
  const isLoggedIn = await isUserLoggedIn(page);

  if (!isLoggedIn) {
    const loginSuccess = await loginAsDeveloper(page);
    if (!loginSuccess) {
      console.warn('開発環境ログインが利用できません。テストをスキップします。');
      return false;
    }
  }

  return true;
}