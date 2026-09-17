import { expect, test } from '@playwright/test';
import CoinMarketCapClient, {
  type BitcoinQuoteResponse,
  type EthereumQuoteResponse,
} from '../clients/coinmarketcap';

const minBitcoinPrice = 76389;
const maxBitcoinPrice = 96389;

function assertPriceIsNumber(assetName: string, price: number | undefined): asserts price is number {
  expect(typeof price).toBe('number');
  if (typeof price !== 'number') {
    throw new Error(`CoinMarketCap did not return a USD price for ${assetName}.`);
  }
}

test.describe('CoinMarketCap cryptocurrency prices', () => {
  test(`Bitcoin price is between $${minBitcoinPrice.toLocaleString()} and $${maxBitcoinPrice.toLocaleString()}`, async () => {
    const client = new CoinMarketCapClient();
    const response = await client.getLatestQuotes('BTC') as BitcoinQuoteResponse;
    const bitcoinPrice = response.data?.BTC?.[0]?.quote?.USD?.price;

    assertPriceIsNumber('Bitcoin', bitcoinPrice);

    expect(bitcoinPrice).toBeGreaterThanOrEqual(minBitcoinPrice);
    expect(bitcoinPrice).toBeLessThanOrEqual(maxBitcoinPrice);
  });

  const minEthereumPrice = 2440;
  const maxEthereumPrice = 3040;

  test(`Ethereum price is between $${minEthereumPrice.toLocaleString()} and $${maxEthereumPrice.toLocaleString()}`, async () => {
    const client = new CoinMarketCapClient();
    const response = await client.getLatestQuotes('ETH') as EthereumQuoteResponse;
    const ethereumPrice = response.data?.ETH?.[0]?.quote?.USD?.price;

    assertPriceIsNumber('Ethereum', ethereumPrice);

    expect(ethereumPrice).toBeGreaterThanOrEqual(minEthereumPrice);
    expect(ethereumPrice).toBeLessThanOrEqual(maxEthereumPrice);
  });
});