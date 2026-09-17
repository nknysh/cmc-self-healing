import Anthropic from '@anthropic-ai/sdk';
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const coinMarketCapSpecPath = 'spec/coinmarketcap-api.spec.ts';
const provider = process.env.AGENT_PROVIDER ?? (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mlx');
const model = provider === 'mlx'
  ? (process.env.MLX_MODEL ?? 'mlx-community/Qwen3-8B-4bit')
  : (process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest');
const mlxBaseUrl = process.env.MLX_BASE_URL ?? 'http://127.0.0.1:8080/v1';
const systemPrompt = 'You are a patient programming tutor. The only file you may modify is spec/coinmarketcap-api.spec.ts, and only when healing a failed Bitcoin or Ethereum price range. Use tools when inspecting files or verifying tests would improve your answer. Explain your reasoning clearly and never claim a tool was used unless its result is provided.';
const ansiEscapePattern = /\u001b\[[0-?]*[ -/]*[@-~]/g;
const priceFailurePattern = /Expected:\s*(?:>=|<=|>|<)\s*[\d,.]+[\s\S]*?Received:\s*([\d.]+)/;
const healablePriceRanges = [
  { label: 'Bitcoin', minName: 'minBitcoinPrice', maxName: 'maxBitcoinPrice', width: 20000 },
  { label: 'Ethereum', minName: 'minEthereumPrice', maxName: 'maxEthereumPrice', width: 600 },
];

for (const range of healablePriceRanges) {
  range.failurePattern = new RegExp(
    `(?:^|\\n)\\s*\\d+\\)\\s+\\[coinmarketcap-api\\][\\s\\S]*?${range.label} price[\\s\\S]*?(?=\\n\\s*\\d+\\)\\s+\\[coinmarketcap-api\\]|\\n\\s*\\d+ failed|$)`,
  );
}

const tools = [
  {
    name: 'read_file',
    description: 'Read a text file from the project workspace.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Workspace-relative path, for example spec/google-search.spec.ts.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_tests',
    description: 'Run the project Playwright test suite with npm test.',
    input_schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'run_coinmarketcap_test',
    description: 'Run only the CoinMarketCap API test. If a Bitcoin or Ethereum price range assertion fails, update only its min and max bounds in spec/coinmarketcap-api.spec.ts using the observed API price while preserving that range width, then rerun the test.',
    input_schema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
];

const openAiTools = tools.map(({ name, description, input_schema }) => ({
  type: 'function',
  function: { name, description, parameters: input_schema },
}));

function usage() {
  console.log('Usage: npm run agent -- "your question about the test suite"');
  console.log('Example: npm run agent -- "Why might the search button test fail?"');
}

async function readWorkspaceFile(relativePath) {
  if (isAbsolute(relativePath)) {
    throw new Error('Access denied: use a workspace-relative path.');
  }

  const filePath = resolve(workspaceRoot, relativePath);
  const pathFromRoot = relative(workspaceRoot, filePath);
  if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
    throw new Error('Access denied: the file must be inside the project workspace.');
  }

  return readFile(filePath, 'utf8');
}

async function writeWorkspaceFile(relativePath, content) {
  if (relativePath !== coinMarketCapSpecPath) {
    throw new Error(`Write access denied: only ${coinMarketCapSpecPath} may be modified.`);
  }

  return writeFile(resolve(workspaceRoot, relativePath), content, 'utf8');
}

async function runTests() {
  try {
    const result = await execFileAsync('npm', ['test'], {
      cwd: workspaceRoot,
      maxBuffer: 1024 * 1024,
    });
    return result.stdout || 'Tests passed with no output.';
  } catch (error) {
    return [error.stdout, error.stderr].filter(Boolean).join('\n') || error.message;
  }
}

async function executeCoinMarketCapTest() {
  return execFileAsync('npm', ['run', 'test:coinmarketcap'], {
    cwd: workspaceRoot,
    maxBuffer: 1024 * 1024,
  });
}

function getCommandOutput(error) {
  return [error.stdout, error.stderr].filter(Boolean).join('\n');
}

function findFailedPriceRange(output) {
  const normalizedOutput = output.replace(ansiEscapePattern, '');

  for (const range of healablePriceRanges) {
    const failure = normalizedOutput.match(range.failurePattern)?.[0];
    const priceMatch = failure?.match(priceFailurePattern);

    if (
      failure
      && (failure.includes('toBeGreaterThanOrEqual') || failure.includes('toBeLessThanOrEqual'))
      && priceMatch
    ) {
      return {
        ...range,
        failure,
        observedPrice: Number(priceMatch[1]),
      };
    }
  }

  return undefined;
}

function healPriceRange(source, range) {
  const isMinimumFailure = range.failure.includes('toBeGreaterThanOrEqual');
  const healedMin = isMinimumFailure
    ? Math.floor(range.observedPrice) - 1
    : Math.ceil(range.observedPrice) + 1 - range.width;
  const healedMax = healedMin + range.width;
  const updatedSource = source
    .replace(new RegExp(`const ${range.minName} = \\d+(?:\\.\\d+)?;`), `const ${range.minName} = ${healedMin};`)
    .replace(new RegExp(`const ${range.maxName} = \\d+(?:\\.\\d+)?;`), `const ${range.maxName} = ${healedMax};`);

  return { healedMin, healedMax, updatedSource };
}

async function runCoinMarketCapTest() {
  const healingMessages = [];

  for (let attempt = 0; attempt <= healablePriceRanges.length; attempt += 1) {
    try {
      const result = await executeCoinMarketCapTest();
      return [
        ...healingMessages,
        healingMessages.length > 0 ? 'Verification rerun passed.' : result.stdout,
      ].filter(Boolean).join('\n') || 'CoinMarketCap test passed with no output.';
    } catch (error) {
      const output = getCommandOutput(error);
      const failedRange = findFailedPriceRange(output);

      if (!failedRange || !Number.isFinite(failedRange.observedPrice) || failedRange.observedPrice <= 1) {
        return [...healingMessages, output || error.message].filter(Boolean).join('\n');
      }

      const source = await readWorkspaceFile(coinMarketCapSpecPath);
      const { healedMin, healedMax, updatedSource } = healPriceRange(source, failedRange);

      if (updatedSource === source) {
        return [...healingMessages, output || error.message].filter(Boolean).join('\n');
      }

      await writeWorkspaceFile(coinMarketCapSpecPath, updatedSource);
      healingMessages.push(`${failedRange.label} range healed to ${healedMin}-${healedMax} (range width ${failedRange.width}).`);
    }
  }
}

async function runTool(name, input) {
  if (name === 'read_file') {
    return readWorkspaceFile(input.path);
  }

  if (name === 'run_tests') {
    return runTests();
  }

  if (name === 'run_coinmarketcap_test') {
    return runCoinMarketCapTest();
  }

  throw new Error(`Unknown tool: ${name}`);
}

const question = process.argv.slice(2).join(' ').trim();
if (!question || question === '--help') {
  usage();
  process.exit(question === '--help' ? 0 : 1);
}

if (/coinmarketcap/i.test(question) && /(run|heal|range)/i.test(question)) {
  console.log(await runCoinMarketCapTest());
  process.exit(0);
}

if (!['anthropic', 'mlx'].includes(provider)) {
  console.error('AGENT_PROVIDER must be either "anthropic" or "mlx".');
  process.exit(1);
}

if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY for the Anthropic provider.');
  process.exit(1);
}

const client = provider === 'anthropic' ? new Anthropic() : null;
const messages = [
  {
    role: 'system',
    content: systemPrompt,
  },
  { role: 'user', content: question },
];

async function requestModel() {
  if (provider === 'anthropic') {
    return client.messages.create({
      model,
      max_tokens: 1200,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  const response = await fetch(`${mlxBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      tools: openAiTools,
    }),
  });

  if (!response.ok) {
    throw new Error(`MLX-LM request failed (${response.status}). Is the MLX-LM server running?`);
  }

  const body = await response.json();
  return body.choices?.[0]?.message;
}

for (let turn = 0; turn < 6; turn += 1) {
  const response = await requestModel();
  const assistantContent = provider === 'anthropic' ? response.content : response;
  const toolUses = provider === 'anthropic'
    ? assistantContent.filter((block) => block.type === 'tool_use')
    : (assistantContent.tool_calls ?? []).map((toolCall) => ({
      id: toolCall.id,
      name: toolCall.function.name,
      input: typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments || '{}')
        : toolCall.function.arguments,
    }));

  if (provider === 'anthropic') {
    messages.push({ role: 'assistant', content: assistantContent });
  } else if (provider === 'mlx') {
    messages.push({
      role: 'assistant',
      content: assistantContent.content ?? assistantContent.reasoning ?? '',
      ...(assistantContent.tool_calls ? { tool_calls: assistantContent.tool_calls } : {}),
    });
  }

  if (toolUses.length === 0) {
    const text = provider === 'anthropic'
      ? assistantContent.filter((block) => block.type === 'text').map((block) => block.text).join('\n')
      : (assistantContent.content ?? assistantContent.reasoning ?? '');
    console.log(text || 'The model responded without text content.');
    break;
  }

  const toolResults = [];
  for (const toolUse of toolUses) {
    try {
      const result = await runTool(toolUse.name, toolUse.input);
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
    } catch (error) {
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, is_error: true, content: error.message });
    }
  }

  if (provider === 'anthropic') {
    messages.push({ role: 'user', content: toolResults });
  } else if (provider === 'mlx') {
    messages.push(...toolResults.map((result) => ({
      role: 'tool',
      tool_call_id: result.tool_use_id,
      content: result.content,
    })));
  }
}
