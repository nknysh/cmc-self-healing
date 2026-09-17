---
name: playwright-typescript
description: Write reliable Playwright tests and TypeScript helpers using web-first assertions, accessible locators, isolated fixtures, and this repository's project conventions.
---

# Playwright and TypeScript Best Practices

Use this skill when creating, reviewing, or repairing Playwright tests, page objects, fixtures, API clients, or Playwright configuration.

## Test Design

- Keep each test focused on one user-visible behavior or one API contract.
- Group related tests in a `describe` block with a clear, descriptive title.
- Prefer deterministic assertions over snapshots or implementation details.
- Make test titles describe the expected behavior and important bounds.
- Keep tests independent. Do not depend on execution order, shared mutable state, or a previous test's login/session.
- Use the narrowest configured project when validating a change. For CoinMarketCap tests, use `npm run test:coinmarketcap`.
- Run the relevant test after every behavioral change, then run the broader suite when shared code or configuration changes.

## Locators and Browser Interaction

- Prefer accessible, user-facing locators in this order: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, and `getByTestId` when a stable test id is necessary.
- Avoid CSS selectors, XPath, generated class names, and positional selectors unless no stable semantic locator exists.
- Do not use arbitrary `waitForTimeout` calls. Wait for a meaningful state, locator, response, or URL.
- Use Playwright's auto-waiting locator actions and assertions instead of manually checking visibility before every action.
- Scope locators to the relevant region of the page to avoid ambiguous matches.
- Prefer `locator` and `expect(locator)` over querying the DOM through `page.evaluate`.

## Assertions and Timing

- Use web-first assertions such as `toBeVisible`, `toHaveText`, `toHaveURL`, and `toHaveAttribute`.
- Assert observable outcomes, not internal framework state or private implementation details.
- Use explicit numeric assertions for API values and validate the type before comparing a value.
- When a test uses a live external service, make the expected volatility explicit and avoid hiding failures with overly broad ranges.
- For range healing, change only the failed test's bounds and preserve the configured range width.

## TypeScript

- Use strict, explicit types for API response shapes and fixture contracts.
- Prefer `type` or `interface` definitions over repeated inline casts.
- Use reusable functions or classes for common parsing, validation, and normalization logic instead of repeating it in multiple tests.
- Narrow optional values before using them. Do not silence errors with `any`, non-null assertions, or unchecked casts unless the external contract genuinely requires it.
- Keep helpers small and single-purpose. Extract parsing, data normalization, and setup logic when a test becomes difficult to read.
- Use descriptive names such as `ethereumPrice`, `response`, and `minPrice`; avoid one-letter variables.
- Preserve the existing module style and public APIs when modifying shared clients.

## API and External Services

- Reuse the repository's client abstraction instead of duplicating request construction in tests.
- Keep API keys in environment variables or GitHub Actions secrets. Never commit credentials or print them in test output.
- Validate HTTP success and meaningful response fields before making assertions.
- Use request fixtures or injected fetch implementations for unit-level client tests; reserve live API calls for integration checks.
- Make external dependencies and required environment variables clear in error messages.

## Fixtures and Configuration

- Put shared setup in fixtures or configuration rather than repeating it across tests.
- Keep project-specific `testMatch` patterns and names consistent with `playwright.config.ts`.
- Avoid changing global timeouts, retries, or parallelism to mask a flaky test. Fix the synchronization or isolation issue instead.
- Use trace, screenshots, and video on failure when diagnosing browser tests, but avoid committing generated reports or artifacts.

## Review Checklist

Before finishing a change, verify:

1. The test uses stable, accessible locators or a documented exception.
2. There are no arbitrary sleeps or order dependencies.
3. Assertions check the intended observable behavior.
4. Optional API values are narrowed and response errors are handled.
5. Secrets are not present in source, logs, or committed artifacts.
6. The narrow test passes, and the relevant broader suite has been considered.
