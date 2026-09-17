# Google Search Playwright Tests

A small Playwright test suite for the Google Search page.

## Setup

Install the dependencies:

```bash
npm install
```

If Playwright browsers are not installed yet, install Chromium:

```bash
npx playwright install chromium
```

## Run Tests

Run the tests in headless mode:

```bash
npm test
```

Run the tests with the browser visible:

```bash
npm run test:headed
```

## Scenarios

The suite checks that:

- The Google Search field is visible.
- The search field accepts a query.
- A query can be submitted by pressing Enter.
- A query can be submitted with the Google Search button.

The submission tests intercept the search request and provide a local response. This keeps the tests focused on form submission and avoids failures caused by Google's anti-automation page.

## Page Object

[pages/google-search.ts](pages/google-search.ts) contains the reusable locators for the Google Search field and search button. The test cases in [spec/google-search.spec.ts](spec/google-search.spec.ts) use this page object instead of defining locators inline.

## Educational CLI Agent

This project also includes a small tutoring agent in [agent.mjs](agent.mjs). It can read project files and run `npm test`, then explain the result. It uses the local MLX-LM model by default and falls back to Claude when an Anthropic API key is configured.

To use the local model on Apple Silicon, install the MLX-LM environment and start its OpenAI-compatible server:

```bash
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python mlx-lm
.venv/bin/mlx_lm.server --model mlx-community/Qwen3-8B-4bit --port 8080
```

Then ask the local agent a question:

```bash
npm run agent -- "Explain how the Google Search page object works"
```

To use Claude instead, set your API key and provider in the terminal:

```bash
export ANTHROPIC_API_KEY="your-api-key"
export AGENT_PROVIDER="anthropic"
```

Ask the agent a question:

```bash
npm run agent -- "Explain how the Google Search page object works"
```

Ask it to investigate a test failure:

```bash
npm run agent -- "Run the tests and explain any failures"
```

### Self-Healing CoinMarketCap Test

The agent includes a guarded `run_coinmarketcap_test` tool for the live Bitcoin price check. It runs the `coinmarketcap-api` Playwright project and, when the test fails specifically because the Bitcoin price is outside its configured range, updates the failing `minBitcoinPrice` or `maxBitcoinPrice` bound in [spec/coinmarketcap-api.spec.ts](spec/coinmarketcap-api.spec.ts) using the observed API price, then reruns the test to verify the repair.

Ask the agent to run and heal the CoinMarketCap test:

```bash
npm run agent -- "Run the CoinMarketCap test and heal the Bitcoin price threshold if the assertion fails."
```

Unrelated test failures are returned without modifying files. To run the CoinMarketCap test directly without healing:

```bash
npm run test:coinmarketcap
```

### Scheduled Self-Healing

The GitHub Actions workflow in [.github/workflows/coinmarketcap-self-heal.yml](.github/workflows/coinmarketcap-self-heal.yml) runs the self-healing CoinMarketCap check every hour on an Apple Silicon macOS runner and can also be started manually from the Actions tab. It installs MLX-LM and Qwen3 locally on the runner, so no Anthropic API credits or secret are required. Add this repository secret before enabling it:

- `COINMARKETCAP_API_KEY`: CoinMarketCap API key.

If a Bitcoin price bound changes, the workflow commits the updated spec back to `main`.

## Playwright MCP

This workspace includes a VS Code MCP configuration in [.vscode/mcp.json](.vscode/mcp.json). It launches the official Playwright MCP server with `npx`, allowing an MCP-compatible assistant to open pages, inspect the browser, interact with elements, and take screenshots.

After reopening the workspace, open the VS Code MCP view and start the `playwright` server. You can then ask the assistant to use the browser, for example:

```text
Use Playwright MCP to open https://www.google.com and inspect the search field.
```

The first start may download `@playwright/mcp` and the required browser package. Your existing Playwright tests and page objects remain unchanged.
