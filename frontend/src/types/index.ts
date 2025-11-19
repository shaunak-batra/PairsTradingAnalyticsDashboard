export interface Tick {
  symbol: string;
  timestamp: string;
  price: number;
  size: number;
}

export interface OHLC {
  symbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
}

export interface Analytics {
  beta: number;
  alpha: number | null;
  spread: number[];
  zscore: number[];
  adf_statistic: number;
  adf_pvalue: number;
  correlation: number[];
  timestamps: string[];
}

export interface LiveStats {
  symbol: string;
  price: number;
  zscore: number | null;
  volume: number;
  mean: number;
  std: number;
  vwap: number;
  timestamp: string;
}

export interface Alert {
  id: number;
  name: string;
  metric: 'zscore' | 'spread' | 'price' | 'correlation';
  operator: '>' | '<' | '==' | '>=' | '<=';
  threshold: number;
  symbol_pair: string;
  enabled: boolean;
}

export interface AlertTrigger {
  type: 'alert';
  rule_name: string;
  message: string;
  timestamp: string;
}

export type Timeframe = '1s' | '1m' | '5m';
export type RegressionType = 'ols' | 'kalman' | 'huber' | 'theilsen';
export type Symbol = 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT';
