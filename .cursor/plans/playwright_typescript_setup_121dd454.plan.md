---
name: Playwright TypeScript setup
overview: Create a new TypeScript Playwright Test project at C:\Users\kcmpm\playwright-automation, move the workspace into it, and leave a Chromium-only starter that can run one example test.
todos:
  - id: create-root
    content: Create C:\Users\kcmpm\playwright-automation, git init, move_agent_to_root
    status: completed
  - id: scaffold
    content: Add package.json, tsconfig, playwright.config.ts, example test, and .gitignore
    status: completed
  - id: install-verify
    content: npm install, install Chromium, run the example test
    status: completed
isProject: false
---

# Playwright TypeScript setup

Create a new project at [C:\Users\kcmpm\playwright-automation](C:\Users\kcmpm\playwright-automation). The existing [C:\Users\kcmpm\Automation_pw](C:\Users\kcmpm\Automation_pw) project stays untouched.

## Workspace

1. Create the folder and run `git init`.
2. Call `move_agent_to_root` with that path before adding files, installing packages, or writing tests.

## Project files

Scaffold the official Playwright Test layout, Chromium only:

- `package.json` — name `playwright-automation`, scripts:
  - `test` — `playwright test`
  - `test:headed` — `playwright test --headed`
  - `test:ui` — `playwright test --ui`
  - `report` — `playwright show-report`
- `playwright.config.ts` — `testDir: ./tests`, HTML reporter, trace on first retry, one project using `devices['Desktop Chrome']`.
- `tsconfig.json` — Playwright’s usual Node + `@playwright/test` types.
- `tests/example.spec.ts` — one smoke test against `https://playwright.dev` (title contains “Playwright”).
- `.gitignore` — `node_modules/`, `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`.

## Install and verify

- `npm install` (`@playwright/test` and `@types/node`).
- `npx playwright install chromium` (browser binary only).
- `npx playwright test` once to confirm the example passes.
