import { test, expect } from '@playwright/test';

test('add a todo on the Playwright TodoMVC demo', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');

  const newTodo = page.getByPlaceholder('What needs to be done?');
  await newTodo.fill('Buy milk');
  await newTodo.press('Enter');

  await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk']);
  await expect(page.getByTestId('todo-count')).toContainText('1 item left');
});