import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';
import BybitService from './services/bybitService.js';
import { API_KEY, BYBIT_API_KEY, BYBIT_API_SECRET } from './const.js';


const bybitService = new BybitService(BYBIT_API_KEY, BYBIT_API_SECRET);

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

server.tool(
  'bybitMarketData',
  'Obtiene datos de mercado de Bybit',
  {
    symbol: z.string().describe('Símbolo del mercado en Bybit, por ejemplo BTCUSDT'),
  },
  async ({ symbol }) => {
    try {
      const data = await bybitService.getMarketData(symbol);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error al obtener datos de Bybit: ${error.message}`,
          }
        ],
      };
    }
  }
);

server.tool(
  'bybitAccountInfo',
  'Obtiene la información de la cuenta en Bybit',
  {},
  async () => {
    try {
      const data = await bybitService.getAccountInfo();
      return {
        content: [
          {
            type: "text",
            text: data ? JSON.stringify(data, null, 2) : 'No se recibieron datos de Bybit.',
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error al obtener información de la cuenta Bybit: ${error.message}`,
          }
        ],
      };
    }
  }
);

server.tool(
  'bybitFundingBalance',
  'Obtiene el balance de fondos en Bybit',
  {},
  async () => {
    try {
      const data = await bybitService.getFundingBalance();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error al obtener el balance de fondos de Bybit: ${error.message}`,
          }
        ],
      };
    }
  }
);

server.tool(
  'bybitPlaceOrder',
  'Coloca una orden en Bybit (spot o futuros)',
  {
    symbol: z.string().describe('Símbolo del mercado, por ejemplo BTCUSDT'),
    side: z.enum(['Buy', 'Sell']).describe('Lado de la orden: Buy o Sell'),
    orderType: z.enum(['Limit', 'Market']).describe('Tipo de orden: Limit o Market'),
    qty: z.number().describe('Cantidad a operar'),
    price: z.number().optional().describe('Precio (solo para órdenes Limit)'),
    leverage: z.number().optional().describe('Apalancamiento (opcional)'),
    stopLoss: z.number().optional().describe('Stop Loss (opcional)'),
    takeProfit: z.number().optional().describe('Take Profit (opcional)'),
  },
  async ({ symbol, side, orderType, qty, price, leverage, stopLoss, takeProfit }) => {
    try {
      const data = await bybitService.placeOrder(
        symbol,
        side,
        orderType,
        qty,
        price,
        leverage,
        stopLoss,
        takeProfit
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error al colocar la orden en Bybit: ${error.message}`,
          }
        ],
      };
    }
  }
);

server.tool(
  'bybitUpdatePositionTPSL',
  'Actualiza el Stop Loss y Take Profit de una posición en Bybit',
  {
    symbol: z.string().describe('Símbolo del mercado, por ejemplo BTCUSDT'),
    stopLoss: z.number().optional().describe('Nuevo valor de Stop Loss'),
    takeProfit: z.number().optional().describe('Nuevo valor de Take Profit'),
  },
  async ({ symbol, stopLoss, takeProfit }) => {
    try {
      const data = await bybitService.updatePositionTP_SL(symbol, stopLoss, takeProfit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error al actualizar SL/TP en Bybit: ${error.message}`,
          }
        ],
      };
    }
  }
);

const transport = new StdioServerTransport()

await server.connect(transport);