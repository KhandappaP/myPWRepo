import { test, expect } from '@playwright/test';

test('Google Australia loads with a search box', async ({ page }) => {
  await page.goto('https://www.google.com.au');

  await expect(page).toHaveTitle(/Google/);

  // Google sometimes shows a consent screen before the search box.
  const accept = page.getByRole('button', { name: /accept all/i });
  if (await accept.isVisible()) {
    await accept.click();
  }

  const searchBox = page.getByRole('combobox', { name: 'Search' });
  await expect(searchBox).toBeVisible();
  await searchBox.fill('Playwright');
  await expect(searchBox).toHaveValue('Playwright');
});