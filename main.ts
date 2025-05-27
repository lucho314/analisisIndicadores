import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';

const API_KEY = 'd293f6fa708b440f971aba563b6524c7'; // Reemplaza con tu API Key de Alpha Vantage





const getUrls = (symbol,interval='1day') => {
  const base = 'https://api.twelvedata.com';

  return {
    RSI: `${base}/rsi?symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`,
    MACD: `${base}/macd?symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`,
    SMA: `${base}/sma?symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`,
    ADX: `${base}/adx?symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`,
    PRICES: `${base}/time_series?symbol=${symbol}&interval=15min&outputsize=120&apikey=${API_KEY}`,
    BOLLINGER: `${base}/bbands?symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`,
  };
}

async function fetchIndicator(url) {
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error('Error al obtener datos:', err.message);
    return null;
  }
}


const server = new McpServer({
  name: 'MyServer',
  version: '1.0.0',
  description: 'My server description',
});

server.tool(
  'analisisIndicadores',
  'Analiza indicadores técnicos cripto',
  {
    symbol: z.string().describe('Símbolo de la criptomoneda'),
  },
  async ({ symbol,}) => {
    const indicatorUrls = getUrls(symbol, '4h');
    const [rsi, macd, sma, adx,prices,bollinger] = await Promise.all([
    fetchIndicator(indicatorUrls.RSI),
    fetchIndicator(indicatorUrls.MACD),
    fetchIndicator(indicatorUrls.SMA),
    fetchIndicator(indicatorUrls.ADX),
    fetchIndicator(indicatorUrls.PRICES),
    fetchIndicator(indicatorUrls.BOLLINGER),
  ]);
    if (!rsi || !macd || !sma || !adx) {
      throw new Error('Error al obtener datos de indicadores');
    }

    const data = {
      rsi: rsi,
      macd: macd,
      sma: sma,
      adx: adx,
      prices: prices,
      bollinger: bollinger,
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        }
      ],
     
    };
  }
);

const transport = new StdioServerTransport()

await server.connect(transport);