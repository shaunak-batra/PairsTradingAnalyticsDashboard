import Plot from 'react-plotly.js';
import { OHLC } from '../types';

interface PriceChartProps {
  data: OHLC[];
  symbol: string;
  title?: string;
}

export function PriceChart({ data, symbol, title }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="text-text-muted text-center py-12">
          No data available for {symbol}
        </div>
      </div>
    );
  }

  const timestamps = data.map((d) => d.timestamp);
  const opens = data.map((d) => d.open);
  const highs = data.map((d) => d.high);
  const lows = data.map((d) => d.low);
  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);

  return (
    <div className="card">
      <Plot
        data={[
          {
            type: 'candlestick',
            x: timestamps,
            open: opens,
            high: highs,
            low: lows,
            close: closes,
            name: symbol,
            increasing: { line: { color: '#10b981' } },
            decreasing: { line: { color: '#ef4444' } },
          },
          {
            type: 'bar',
            x: timestamps,
            y: volumes,
            name: 'Volume',
            yaxis: 'y2',
            marker: { color: '#3b82f6', opacity: 0.3 },
          },
        ]}
        layout={{
          title: {
            text: title || `${symbol} Price Chart`,
            font: { color: '#e6edf3', size: 16 },
          },
          xaxis: {
            title: 'Time',
            color: '#8b949e',
            gridcolor: '#30363d',
            rangeslider: { visible: false },
          },
          yaxis: {
            title: 'Price (USD)',
            color: '#8b949e',
            gridcolor: '#30363d',
          },
          yaxis2: {
            title: 'Volume',
            color: '#8b949e',
            gridcolor: '#30363d',
            overlaying: 'y',
            side: 'right',
            showgrid: false,
          },
          plot_bgcolor: '#161b22',
          paper_bgcolor: '#161b22',
          font: { color: '#e6edf3' },
          hovermode: 'x unified',
          dragmode: 'pan',
          margin: { t: 50, r: 50, b: 50, l: 50 },
        }}
        config={{
          scrollZoom: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  );
}
