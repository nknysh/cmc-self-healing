import { expect, test } from '@playwright/test';
import CoinMarketCapClient, {
  type BitcoinQuoteResponse,
  type EthereumQuoteResponse,
} from '../clients/coinmarketcap';

const minBitcoinPrice = 76469;
const maxBitcoinPrice = 96469;

test(`Bitcoin price is between $${minBitcoinPrice.toLocaleString()} and $${maxBitcoinPrice.toLocaleString()}`, async () => {
  const client = new CoinMarketCapClient();
  const response = await client.getLatestQuotes('BTC') as BitcoinQuoteResponse;
  const bitcoinPrice = response.data?.BTC?.[0]?.quote?.USD?.price;

  expect(typeof bitcoinPrice).toBe('number');
  if (typeof bitcoinPrice !== 'number') {
    throw new Error('CoinMarketCap did not return a USD price for Bitcoin.');
  }

  expect(bitcoinPrice).toBeGreaterThanOrEqual(minBitcoinPrice);
  expect(bitcoinPrice).toBeLessThanOrEqual(maxBitcoinPrice);
});

const minEthereumPrice = 2440;
const maxEthereumPrice = 3040;

test(`Ethereum price is between $${minEthereumPrice.toLocaleString()} and $${maxEthereumPrice.toLocaleString()}`, async () => {
  const client = new CoinMarketCapClient();
  const response = await client.getLatestQuotes('ETH') as EthereumQuoteResponse;
  const ethereumPrice = response.data?.ETH?.[0]?.quote?.USD?.price;

  expect(typeof ethereumPrice).toBe('number');
  if (typeof ethereumPrice !== 'number') {
    throw new Error('CoinMarketCap did not return a USD price for Ethereum.');
  }

  expect(ethereumPrice).toBeGreaterThanOrEqual(minEthereumPrice);
  expect(ethereumPrice).toBeLessThanOrEqual(maxEthereumPrice);
});