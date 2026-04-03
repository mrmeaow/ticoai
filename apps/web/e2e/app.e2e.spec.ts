import { test, expect } from '@playwright/test';

test.describe('TICOAI Application', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/(auth|dashboard)/);
  });
});
