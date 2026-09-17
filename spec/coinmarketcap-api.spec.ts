import { expect, test } from '@playwright/test';
import CoinMarketCapClient, { type BitcoinQuoteResponse } from '../clients/coinmarketcap';

const minBitcoinPrice = 75531;
const maxBitcoinPrice = 95531;

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