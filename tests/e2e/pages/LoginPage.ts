import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly googleLoginButton: Locator;
  readonly appleLoginButton: Locator;
  readonly devLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByText('JIZAI');
    this.subtitle = page.getByText('アカウントでサインインしてはじめましょう');
    this.googleLoginButton = page.getByRole('button', { name: /Googleで続ける/ });
    this.appleLoginButton = page.getByRole('button', { name: /Appleでサインイン/ });
    this.devLoginButton = page.getByRole('button', { name: /開発用テストユーザーでログイン/ });
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async loginWithDeveloperAccount() {
    if (await this.devLoginButton.isVisible()) {
      await this.devLoginButton.click();
      await this.page.waitForLoadState('networkidle');
      return true;
    }
    return false;
  }

  async isVisible() {
    return await this.title.isVisible();
  }
}