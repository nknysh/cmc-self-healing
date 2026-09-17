/// <reference types="node" />

const DEFAULT_BASE_URL = 'https://pro-api.coinmarketcap.com';

type FetchImplementation = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

type CoinMarketCapResponse = {
  data?: unknown;
  status?: {
    error_message?: string;
  };
  [key: string]: unknown;
};

type ListingsOptions = {
  start?: number;
  limit?: number;
  convert?: string;
};

type QuoteOptions = {
  convert?: string;
};

type ClientOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: FetchImplementation;
};

export type BitcoinQuoteResponse = {
  data?: {
    BTC?: Array<{
      quote?: {
        USD?: {
          price?: number;
        };
      };
    }>;
  };
};

export class CoinMarketCapClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchImplementation;

  constructor({
    apiKey = process.env.COINMARKETCAP_API_KEY,
    baseUrl = process.env.COINMARKETCAP_BASE_URL ?? DEFAULT_BASE_URL,
    fetchImpl = globalThis.fetch,
  }: ClientOptions = {}) {
    if (!apiKey) {
      throw new Error('A CoinMarketCap API key is required. Set COINMARKETCAP_API_KEY or pass apiKey.');
    }

    if (typeof fetchImpl !== 'function') {
      throw new Error('A fetch implementation is required.');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
  }

  async getLatestListings({ start = 1, limit = 100, convert = 'USD' }: ListingsOptions = {}): Promise<CoinMarketCapResponse> {
    return this.request('/v1/cryptocurrency/listings/latest', { start, limit, convert });
  }

  async getLatestQuotes(symbols: string | string[], { convert = 'USD' }: QuoteOptions = {}): Promise<CoinMarketCapResponse> {
    return this.request('/v2/cryptocurrency/quotes/latest', { symbol: this.normalizeSymbols(symbols), convert });
  }

  async getMetadata(symbols: string | string[]): Promise<CoinMarketCapResponse> {
    return this.request('/v2/cryptocurrency/info', { symbol: this.normalizeSymbols(symbols) });
  }

  async getGlobalMetrics({ convert = 'USD' }: QuoteOptions = {}): Promise<CoinMarketCapResponse> {
    return this.request('/v1/global-metrics/quotes/latest', { convert });
  }

  async request(path: string, params: Record<string, string | number> = {}): Promise<CoinMarketCapResponse> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await this.fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'X-CMC_PRO_API_KEY': this.apiKey,
      },
    });

    const body = await response.json() as CoinMarketCapResponse;
    if (!response.ok) {
      const message = body?.status?.error_message || `CoinMarketCap request failed with status ${response.status}.`;
      throw new Error(message);
    }

    return body;
  }

  normalizeSymbols(symbols: string | string[]): string {
    const values = Array.isArray(symbols) ? symbols : [symbols];
    if (values.length === 0 || values.some((symbol) => typeof symbol !== 'string' || !symbol.trim())) {
      throw new Error('At least one non-empty cryptocurrency symbol is required.');
    }

    return values.map((symbol) => symbol.trim().toUpperCase()).join(',');
  }
}

export default CoinMarketCapClient;