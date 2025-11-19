import Plot from 'react-plotly.js';
import { Symbol } from '../types';

interface CorrelationHeatmapProps {
  correlationMatrix: number[][];
  symbols: Symbol[];
}

export function CorrelationHeatmap({ correlationMatrix, symbols }: CorrelationHeatmapProps) {
  if (!correlationMatrix || correlationMatrix.length === 0) {
    return (
      <div className="card">
        <div className="text-text-muted text-center py-12">
          No correlation data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <Plot
        data={[
          {
            type: 'heatmap',
            z: correlationMatrix,
            x: symbols,
            y: symbols,
            colorscale: [
              [0, '#1e3a8a'], // Dark blue (low correlation)
              [0.5, '#8b949e'], // Gray (medium)
              [1, '#10b981'], // Green (high correlation)
            ],
            colorbar: {
              title: 'Correlation',
              titleside: 'right',
              tickmode: 'linear',
              tick0: 0,
              dtick: 0.2,
              len: 0.75,
              thickness: 15,
              tickfont: { color: '#e6edf3' },
              titlefont: { color: '#e6edf3' },
            },
            hovertemplate: '%{y} vs %{x}<br>Correlation: %{z:.3f}<extra></extra>',
            showscale: true,
          },
        ]}
        layout={{
          title: {
            text: 'Cross-Correlation Matrix',
            font: { color: '#e6edf3', size: 16 },
          },
          xaxis: {
            title: '',
            tickfont: { color: '#e6edf3' },
            side: 'bottom',
          },
          yaxis: {
            title: '',
            tickfont: { color: '#e6edf3' },
            autorange: 'reversed',
          },
          plot_bgcolor: '#161b22',
          paper_bgcolor: '#161b22',
          font: { color: '#e6edf3' },
          margin: { t: 50, r: 100, b: 50, l: 80 },
        }}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'pan2d', 'zoom2d'],
        }}
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  );
}
