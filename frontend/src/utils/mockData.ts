import { OHLC, Analytics, LiveStats, Symbol, Timeframe } from '../types';

export function generateMockOHLC(symbol: Symbol, count: number = 100, timeframe: Timeframe = '1m'): OHLC[] {
  const data: OHLC[] = [];
  const now = new Date();
  let basePrice = symbol === 'BTCUSDT' ? 42000 : symbol === 'ETHUSDT' ? 2200 : 300;

  const intervalMs = timeframe === '1s' ? 1000 : timeframe === '1m' ? 60000 : 300000;

  for (let i = count; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs).toISOString();
    const volatility = basePrice * 0.002; // 0.2% volatility

    const open = basePrice + (Math.random() - 0.5) * volatility;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);
    const volume = Math.random() * 100 + 50;
    const vwap = (open + high + low + close) / 4;

    data.push({
      symbol,
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      vwap,
    });

    basePrice = close; // Use last close as next base price for trend
  }

  return data;
}

export function generateMockAnalytics(symbolA: Symbol, symbolB: Symbol): Analytics {
  const count = 500;
  const timestamps: string[] = [];
  const spread: number[] = [];
  const zscore: number[] = [];
  const correlation: number[] = [];

  const now = new Date();
  const beta = 19.0; // BTCUSDT / ETHUSDT ratio ~19
  const alpha = 100;

  for (let i = count; i >= 0; i--) {
    timestamps.push(new Date(now.getTime() - i * 1000).toISOString());

    // Generate realistic spread with mean reversion
    const meanSpread = 0;
    const stdSpread = 50;
    const spreadValue = meanSpread + stdSpread * (Math.random() - 0.5) * 2;
    spread.push(spreadValue);

    // Z-score calculation
    const window = Math.min(20, spread.length);
    if (spread.length >= window) {
      const recentSpread = spread.slice(-window);
      const mean = recentSpread.reduce((a, b) => a + b, 0) / window;
      const std = Math.sqrt(
        recentSpread.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window
      );
      zscore.push((spreadValue - mean) / (std || 1));
    } else {
      zscore.push(0);
    }

    // Rolling correlation (oscillating between 0.7 and 0.95)
    correlation.push(0.85 + 0.1 * Math.sin(i / 50));
  }

  return {
    beta,
    alpha,
    spread,
    zscore,
    adf_statistic: -3.5, // Negative indicates stationarity
    adf_pvalue: 0.01, // Low p-value indicates cointegration
    correlation,
    timestamps,
  };
}

export function generateMockLiveStats(symbol: Symbol): LiveStats {
  const basePrice = symbol === 'BTCUSDT' ? 42000 : symbol === 'ETHUSDT' ? 2200 : 300;
  const price = basePrice + (Math.random() - 0.5) * basePrice * 0.001;

  return {
    symbol,
    price,
    zscore: (Math.random() - 0.5) * 4, // Range from -2 to +2
    volume: Math.random() * 100 + 50,
    mean: price * 0.999,
    std: price * 0.002,
    vwap: price * (1 + (Math.random() - 0.5) * 0.0001),
    timestamp: new Date().toISOString(),
  };
}

export function generateCorrelationMatrix(symbols: Symbol[]): number[][] {
  const size = symbols.length;
  const matrix: number[][] = [];

  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = 1.0; // Perfect self-correlation
      } else {
        // Generate realistic correlations (higher for crypto pairs)
        matrix[i][j] = 0.6 + Math.random() * 0.3;
        matrix[j][i] = matrix[i][j]; // Symmetric matrix
      }
    }
  }

  return matrix;
}
