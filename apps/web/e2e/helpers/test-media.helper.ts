import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * Helper utilities for capturing screenshots and organizing test media
 */

let screenshotCounter = 0;

/**
 * Capture a named screenshot during test execution
 * Screenshots are saved to playwright-report/screenshots/
 */
export async function captureScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    steps?: boolean;
  }
): Promise<string> {
  screenshotCounter++;
  const timestamp = Date.now();
  const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${String(screenshotCounter).padStart(2, '0')}_${sanitizedName}_${timestamp}`;

  const screenshotPath = path.join('screenshots', `${filename}.png`);

  await page.screenshot({
    path: screenshotPath,
    fullPage: options?.fullPage ?? false,
  });

  return screenshotPath;
}

/**
 * Reset screenshot counter (call in beforeEach if needed)
 */
export function resetScreenshotCounter(): void {
  screenshotCounter = 0;
}

/**
 * Capture screenshot and attach it to test info for better reporting
 */
export async function captureAndAttachScreenshot(
  page: Page,
  name: string,
  testInfo: { attach: (name: string, options: { path: string; contentType: string }) => Promise<void> },
  options?: {
    fullPage?: boolean;
  }
): Promise<void> {
  const screenshotPath = await captureScreenshot(page, name, options);

  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png',
  });
}

/**
 * Take screenshots before and after an action, useful for visual comparison
 */
export async function captureActionScreenshots(
  page: Page,
  actionName: string,
  action: () => Promise<void>,
  testInfo?: { attach: (name: string, options: { path: string; contentType: string }) => Promise<void> }
): Promise<{ before: string; after: string }> {
  const beforePath = await captureScreenshot(page, `${actionName}_before`);

  if (testInfo) {
    await testInfo.attach(`${actionName}_before`, {
      path: beforePath,
      contentType: 'image/png',
    });
  }

  await action();

  const afterPath = await captureScreenshot(page, `${actionName}_after`);

  if (testInfo) {
    await testInfo.attach(`${actionName}_after`, {
      path: afterPath,
      contentType: 'image/png',
    });
  }

  return { before: beforePath, after: afterPath };
}

/**
 * Wait for network idle and capture screenshot
 */
export async function captureAfterNetworkIdle(
  page: Page,
  name: string,
  options?: {
    timeout?: number;
    fullPage?: boolean;
  }
): Promise<string> {
  await page.waitForLoadState('networkidle', { timeout: options?.timeout ?? 10_000 });
  return captureScreenshot(page, name, { fullPage: options?.fullPage });
}

/**
 * Capture element-specific screenshot
 */
export async function captureElementScreenshot(
  page: Page,
  selector: string,
  name: string
): Promise<string> {
  const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
  const screenshotPath = path.join('screenshots', `${sanitizedName}.png`);

  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await element.screenshot({ path: screenshotPath });

  return screenshotPath;
}
