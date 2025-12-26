import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * [GET] /api/market_data
 * Returns real-time market data for key indicators.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    // Define symbols to fetch
    // ^KS11: KOSPI, KRW=X: USD/KRW, GC=F: Gold, 005930.KS: Samsung Elec, NVDA: Nvidia, BTC-USD: Bitcoin
    // Note: Yahoo Finance specific tickers.
    const symbols = ['^KS11', 'KRW=X', 'GC=F', '005930.KS', 'NVDA', 'BTC-USD'];
    // Yahoo Finance API often blocks requests without cookies now.
    // We will try `query2` and specific User-Agent.
    // If it fails (401/403), we MUST gracefully degrade to Mock Data to ensure the UI works.
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}&crumb=`;
    // Note: query1 vs query2 is sometimes region based.

    let marketData = [];
    try {
      const response = await axios.get(quoteUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Origin: 'https://finance.yahoo.com',
          Referer: 'https://finance.yahoo.com/',
          Accept: 'application/json',
        },
        timeout: 5000,
      });

      const result = response.data?.quoteResponse?.result;
      if (Array.isArray(result) && result.length > 0) {
        marketData = result.map((item) => ({
          symbol: item.symbol,
          name: item.shortName || item.longName || item.symbol,
          price: item.regularMarketPrice,
          change: item.regularMarketChange,
          changePercent: item.regularMarketChangePercent,
          currency: item.currency,
        }));
      } else {
        throw new Error('Empty result from Yahoo API');
      }
    } catch (apiError) {
      console.warn(
        'Yahoo Finance API Failed (401/Block?), switching to Fallback Mock Data:',
        apiError.message,
      );
      // Fallback Data (Mock)
      marketData = [
        {
          symbol: '^KS11',
          name: 'KOSPI (Fallback)',
          price: 2750.2,
          change: -10.5,
          changePercent: -0.38,
          currency: 'KRW',
        },
        {
          symbol: 'KRW=X',
          name: 'USD/KRW (Fallback)',
          price: 1380.5,
          change: 5.0,
          changePercent: 0.36,
          currency: 'KRW',
        },
        {
          symbol: 'GC=F',
          name: 'Gold (Fallback)',
          price: 2650.5,
          change: 12.5,
          changePercent: 0.47,
          currency: 'USD',
        },
        {
          symbol: '005930.KS',
          name: 'Samsung Elec (Fallback)',
          price: 56000,
          change: -500,
          changePercent: -0.89,
          currency: 'KRW',
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA (Fallback)',
          price: 140.2,
          change: -2.3,
          changePercent: -1.6,
          currency: 'USD',
        },
        {
          symbol: 'BTC-USD',
          name: 'Bitcoin (Fallback)',
          price: 65000.0,
          change: 1200.0,
          changePercent: 1.88,
          currency: 'USD',
        },
      ];
    }

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: marketData,
    });
  } catch (error) {
    console.error('Market Data Fetch Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch market data',
      details: error.message,
    });
  }
});

export default router;
