import { useState } from 'react';
import { Symbol, Timeframe, RegressionType } from '../types';

interface ControlPanelProps {
  onSymbolChange: (symbolA: Symbol, symbolB: Symbol) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onRegressionChange: (type: RegressionType) => void;
  onComputeAnalytics: () => void;
  onExportCSV: () => void;
}

const SYMBOLS: Symbol[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

export function ControlPanel({
  onSymbolChange,
  onTimeframeChange,
  onRegressionChange,
  onComputeAnalytics,
  onExportCSV,
}: ControlPanelProps) {
  const [symbolA, setSymbolA] = useState<Symbol>('BTCUSDT');
  const [symbolB, setSymbolB] = useState<Symbol>('ETHUSDT');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [regressionType, setRegressionType] = useState<RegressionType>('ols');

  const handleSymbolAChange = (symbol: Symbol) => {
    setSymbolA(symbol);
    onSymbolChange(symbol, symbolB);
  };

  const handleSymbolBChange = (symbol: Symbol) => {
    setSymbolB(symbol);
    onSymbolChange(symbolA, symbol);
  };

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    onTimeframeChange(tf);
  };

  const handleRegressionChange = (type: RegressionType) => {
    setRegressionType(type);
    onRegressionChange(type);
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-bold text-primary">Controls</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Symbol Pair Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Symbol A</label>
          <select
            className="select w-full"
            value={symbolA}
            onChange={(e) => handleSymbolAChange(e.target.value as Symbol)}
          >
            {SYMBOLS.map((sym) => (
              <option key={sym} value={sym}>
                {sym}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Symbol B</label>
          <select
            className="select w-full"
            value={symbolB}
            onChange={(e) => handleSymbolBChange(e.target.value as Symbol)}
          >
            {SYMBOLS.map((sym) => (
              <option key={sym} value={sym}>
                {sym}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Timeframe</label>
          <select
            className="select w-full"
            value={timeframe}
            onChange={(e) => handleTimeframeChange(e.target.value as Timeframe)}
          >
            <option value="1s">1 Second</option>
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
          </select>
        </div>

        {/* Regression Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Regression Type</label>
          <select
            className="select w-full"
            value={regressionType}
            onChange={(e) => handleRegressionChange(e.target.value as RegressionType)}
          >
            <option value="ols">OLS Regression</option>
            <option value="kalman">Kalman Filter</option>
            <option value="huber">Huber Robust</option>
            <option value="theilsen">Theil-Sen</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="btn btn-primary flex-1" onClick={onComputeAnalytics}>
          Compute Analytics
        </button>
        <button className="btn btn-success" onClick={onExportCSV}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
