import Plot from 'react-plotly.js';
import { Analytics } from '../types';

interface SpreadChartProps {
  analytics: Analytics | null;
}

export function SpreadChart({ analytics }: SpreadChartProps) {
  if (!analytics || !analytics.spread || analytics.spread.length === 0) {
    return (
      <div className="card">
        <div className="text-text-muted text-center py-12">
          No analytics data available. Click "Compute Analytics" to generate.
        </div>
      </div>
    );
  }

  const { timestamps, spread, zscore } = analytics;

  return (
    <div className="card">
      <Plot
        data={[
          {
            type: 'scatter',
            mode: 'lines',
            x: timestamps,
            y: spread,
            name: 'Spread',
            line: { color: '#3b82f6', width: 2 },
            yaxis: 'y',
          },
          {
            type: 'scatter',
            mode: 'lines',
            x: timestamps,
            y: zscore,
            name: 'Z-Score',
            line: { color: '#f59e0b', width: 2 },
            yaxis: 'y2',
          },
          // Z-score threshold lines
          {
            type: 'scatter',
            mode: 'lines',
            x: [timestamps[0], timestamps[timestamps.length - 1]],
            y: [2, 2],
            name: 'Z-Score +2',
            line: { color: '#ef4444', width: 1, dash: 'dash' },
            yaxis: 'y2',
            showlegend: false,
          },
          {
            type: 'scatter',
            mode: 'lines',
            x: [timestamps[0], timestamps[timestamps.length - 1]],
            y: [-2, -2],
            name: 'Z-Score -2',
            line: { color: '#ef4444', width: 1, dash: 'dash' },
            yaxis: 'y2',
            showlegend: false,
          },
          {
            type: 'scatter',
            mode: 'lines',
            x: [timestamps[0], timestamps[timestamps.length - 1]],
            y: [0, 0],
            name: 'Z-Score Mean',
            line: { color: '#8b949e', width: 1, dash: 'dot' },
            yaxis: 'y2',
            showlegend: false,
          },
        ]}
        layout={{
          title: {
            text: 'Spread & Z-Score Analysis',
            font: { color: '#e6edf3', size: 16 },
          },
          xaxis: {
            title: 'Time',
            color: '#8b949e',
            gridcolor: '#30363d',
          },
          yaxis: {
            title: 'Spread (USD)',
            color: '#3b82f6',
            gridcolor: '#30363d',
          },
          yaxis2: {
            title: 'Z-Score',
            color: '#f59e0b',
            gridcolor: '#30363d',
            overlaying: 'y',
            side: 'right',
          },
          plot_bgcolor: '#161b22',
          paper_bgcolor: '#161b22',
          font: { color: '#e6edf3' },
          hovermode: 'x unified',
          dragmode: 'pan',
          margin: { t: 50, r: 60, b: 50, l: 60 },
          legend: {
            x: 0.01,
            y: 0.99,
            bgcolor: 'rgba(22, 27, 34, 0.8)',
            bordercolor: '#30363d',
            borderwidth: 1,
          },
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
