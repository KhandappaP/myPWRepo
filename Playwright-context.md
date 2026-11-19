# Playwright context

Context for web automation in this workspace. Tests live in `tests/` and run with `@playwright/test` against public sites. The main application under test is the OrangeHRM demo.

## Project

| Item | Value |
| --- | --- |
| Runner | `@playwright/test` ^1.65.0 |
| Config | `playwright.config.ts` |
| Test directory | `tests` |
| Browser project | `chromium` (Desktop Chrome) |
| Reporter | HTML (`npx playwright show-report`) |
| Trace | `on-first-retry` |
| Parallelism | `fullyParallel: true` in config. OrangeHRM tests override this with `test.describe.configure({ mode: 'serial' })`. |
| CI | 1 worker, 2 retries. Locally, retries are 0. |

Commands:

```powershell
npm test
npx playwright test tests/orangehrm.spec.ts --project=chromium --workers=1
npm run test:headed
npm run test:ui
npm run report
```

Run the OrangeHRM file with one worker. The public demo is slow, and several tests log in as the same admin account.

## Application under test

OrangeHRM OS 5.x demo:

- Login: `https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`
- Admin username: `Admin`
- Admin password: `admin123`
- These are the published demo credentials, not a private account.

Other sample specs, not part of the OrangeHRM flow:

- `tests/example.spec.ts` checks the Playwright docs title.
- `tests/todo.spec.ts` adds a todo on `https://demo.playwright.dev/todomvc`.
- `tests/google.spec.ts` opens Google Australia, dismisses a consent dialog when it is visible, and fills the search box.

## OrangeHRM scenarios

Defined in `tests/orangehrm.spec.ts`.

1. **Admin login.** Fill Username and Password, click Login, land on `/dashboard/index`, and see Dashboard in the top breadcrumb.
2. **Home screen.** After login, Dashboard is visible, along with the Admin, PIM, Leave, and My Info links and the user menu.
3. **Create a user.** A login can only be attached to an existing employee. The test creates an employee (`Play` / `User<suffix>`), then opens Add User and saves an ESS user with status Enabled. Password for the generated user is `Test1234!` (upper, lower, number, and symbol). The test then searches Admin > Users and expects the username, employee name, and Enabled.
4. **New user login.** Sign in with that generated username, confirm the dashboard and the user menu contains the first name, then log out back to the login page.
5. **Time menu.** Open Time from the side menu and check Attendance, Leave, My Time, Reports, and Apply.

Usernames are unique per run: `user` plus the last 6 digits of `Date.now()`. The create-user test and the new-user login test share that value, so they must stay in the serial describe.

Direct URLs used after login:

- Add employee: `/web/index.php/pim/addEmployee`
- Add user: `/web/index.php/admin/saveSystemUser`
- User list after save: `/web/index.php/admin/viewSystemUsers`

## How to drive the OrangeHRM UI

Prefer role and label locators. Fall back to OrangeHRM's `oxd` classes only where the widget is not a native control.

| Action | Locator |
| --- | --- |
| Login fields | `getByPlaceholder('Username')`, `getByPlaceholder('Password')`, `getByRole('button', { name: 'Login' })` |
| Dashboard ready | `.oxd-topbar-header-breadcrumb` contains `Dashboard` |
| Side menu | `getByRole('link', { name: 'Admin' })` (also PIM, Leave, Time, My Info) |
| Custom dropdown (User Role, Status) | `.oxd-input-group` filtered by the label, then `.oxd-select-text`, then `getByRole('option', { name })` |
| Employee autocomplete | input inside the Employee Name group; pick `.oxd-autocomplete-option` that contains the full name |
| Labeled text inputs | `.oxd-input-group` filtered by `/^Username/` or `/^Password/` or `Confirm Password`, then `input` |
| Save / Search | `getByRole('button', { name: 'Save' })` or `Search` |
| Success | text `Successfully Saved` |
| User row | `.oxd-table-card` filtered by the username |
| Saved employee | `.orangehrm-edit-employee-name` |
| Logout | `.oxd-userdropdown-tab`, then `getByRole('menuitem', { name: 'Logout' })` |

Dropdown options are not native `<select>` elements. Open the dropdown before choosing an option.

## Timeouts and waits

The demo often leaves `https://opensource-demo.orangehrmlive.com/web/index.php/auth/validate` pending. Waiting for the full load event makes `click` and `goto` time out even after the next screen is visible.

- Open pages with `waitUntil: 'domcontentloaded'` or `'commit'`.
- Click Login, Save, Search, and Logout with `{ noWaitAfter: true }`.
- Assert the next screen instead of waiting for the load event. Login waits for `/dashboard/index` with `waitUntil: 'commit'`, then asserts the breadcrumb.
- Default test timeout in this file is 90 seconds. Creating a user raises it to 240 seconds.
- Action timeout is 30 seconds. Navigation timeout is 60 seconds. Assertions that follow a slow transition use 45 or 75 seconds.

Do not add `waitForTimeout` to OrangeHRM tests. The Google spec currently pauses 10 seconds so the filled search box stays on screen; that pause is not a pattern for new tests.

## Rules for new tests

- Put OrangeHRM coverage in `tests/orangehrm.spec.ts` unless the flow is large enough for its own file.
- Keep tests that share a created user in `test.describe.serial`.
- Generate a unique employee and username. Do not reuse a fixed username; the demo rejects duplicates.
- Create the employee in PIM before creating the user. Each employee can have only one login.
- Assert a visible result: URL, heading, toast, or table row. Do not stop after a click.
- Run the OrangeHRM file alone with `--workers=1` before treating a new test as done.

## Playwright MCP

Project MCP config is `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

Reload the window after changing it. In Cursor Settings → MCP, `playwright` should list browser tools (`browser_navigate`, `browser_snapshot`, `browser_click`, and the rest). A connected server can open the OrangeHRM login URL and return a snapshot. That snapshot is the check that MCP is usable. The MCP browser is for exploring the page. Committed automation stays in `tests/*.spec.ts`.
