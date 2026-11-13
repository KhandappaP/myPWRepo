import { test, expect, type Page } from '@playwright/test';

const loginUrl =
  'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';

const admin = {
  username: 'Admin',
  password: 'admin123',
};

const newUserPassword = 'Test1234!';

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

test.use({
  actionTimeout: 30_000,
  navigationTimeout: 60_000,
});

async function login(page: Page, username: string, password: string) {
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  // The demo's auth/validate request often stays pending, so don't wait on it.
  await page.getByRole('button', { name: 'Login' }).click({ noWaitAfter: true });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
    timeout: 45_000,
  });
}

async function logout(page: Page) {
  await page.locator('.oxd-userdropdown-tab').click();
  await page.getByRole('menuitem', { name: 'Logout' }).click({ noWaitAfter: true });
  await expect(page.getByPlaceholder('Username')).toBeVisible({ timeout: 45_000 });
}

async function openDropdown(page: Page, label: string) {
  await page
    .locator('.oxd-input-group')
    .filter({ hasText: label })
    .locator('.oxd-select-text')
    .click();
}

test.describe('OrangeHRM demo', () => {
  test('admin can log in', async ({ page }) => {
    await login(page, admin.username, admin.password);

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('home screen shows the dashboard and main menu', async ({ page }) => {
    await login(page, admin.username, admin.password);

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'PIM' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Leave' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Info' })).toBeVisible();
    await expect(page.locator('.oxd-userdropdown-tab')).toBeVisible();
  });
});

test.describe.serial('create and validate a new user', () => {
  const suffix = Date.now().toString().slice(-6);
  const firstName = 'Play';
  const lastName = `User${suffix}`;
  const employeeName = `${firstName} ${lastName}`;
  const username = `user${suffix}`;

  test('admin can create a new user', async ({ page }) => {
    test.setTimeout(240_000);
    await login(page, admin.username, admin.password);

    await page.goto(
      'https://opensource-demo.orangehrmlive.com/web/index.php/pim/addEmployee',
      { waitUntil: 'commit' },
    );
    await expect(page.getByPlaceholder('First Name')).toBeVisible({ timeout: 45_000 });
    await page.getByPlaceholder('First Name').fill(firstName);
    await page.getByPlaceholder('Last Name').fill(lastName);
    await page.getByRole('button', { name: 'Save' }).click({ noWaitAfter: true });
    await expect(page).toHaveURL(/viewPersonalDetails/, { timeout: 45_000 });
    const savedEmployee = page.locator('.orangehrm-edit-employee-name');
    await expect(savedEmployee).toContainText(firstName, { timeout: 45_000 });
    await expect(savedEmployee).toContainText(lastName);

    await page.goto(
      'https://opensource-demo.orangehrmlive.com/web/index.php/admin/saveSystemUser',
      { waitUntil: 'commit' },
    );
    await expect(page.getByRole('heading', { name: 'Add User' })).toBeVisible({
      timeout: 45_000,
    });

    await openDropdown(page, 'User Role');
    await page.getByRole('option', { name: 'ESS' }).click();

    const employee = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Employee Name' })
      .locator('input');
    await employee.fill(lastName);
    await page
      .locator('.oxd-autocomplete-option')
      .filter({ hasText: employeeName })
      .click();

    await openDropdown(page, 'Status');
    await page.getByRole('option', { name: 'Enabled' }).click();

    await page
      .locator('.oxd-input-group')
      .filter({ hasText: /^Username/ })
      .locator('input')
      .fill(username);
    await page
      .locator('.oxd-input-group')
      .filter({ hasText: /^Password/ })
      .locator('input')
      .fill(newUserPassword);
    await page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Confirm Password' })
      .locator('input')
      .fill(newUserPassword);

    await page.getByRole('button', { name: 'Save' }).click({ noWaitAfter: true });
    await expect(page.getByText('Successfully Saved')).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/viewSystemUsers/, { timeout: 45_000 });

    await page
      .locator('.oxd-input-group')
      .filter({ hasText: /^Username/ })
      .locator('input')
      .fill(username);
    await page.getByRole('button', { name: 'Search' }).click({ noWaitAfter: true });

    const row = page.locator('.oxd-table-card').filter({ hasText: username });
    await expect(row).toContainText(username);
    await expect(row).toContainText(employeeName);
    await expect(row).toContainText('Enabled');
  });

  test('the new user can log in and see the home screen', async ({ page }) => {
    await login(page, username, newUserPassword);

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.locator('.oxd-userdropdown-tab')).toContainText(firstName);

    await logout(page);
    await expect(page).toHaveURL(/auth\/login/);
  });
});
