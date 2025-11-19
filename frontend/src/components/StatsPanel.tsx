import { LiveStats } from '../types';

interface StatsPanelProps {
  stats: LiveStats | null;
  title: string;
}

export function StatsPanel({ stats, title }: StatsPanelProps) {
  if (!stats) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-3 text-primary">{title}</h3>
        <div className="text-text-muted text-center py-8">
          Waiting for data...
        </div>
      </div>
    );
  }

  const getZScoreColor = (zscore: number | null) => {
    if (zscore === null) return 'text-text-muted';
    if (Math.abs(zscore) > 2) return 'text-danger';
    if (Math.abs(zscore) > 1) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-primary">{title}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-text-muted text-sm">Price</div>
          <div className="text-2xl font-bold">${stats.price.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-text-muted text-sm">Z-Score</div>
          <div className={`text-2xl font-bold ${getZScoreColor(stats.zscore)}`}>
            {stats.zscore?.toFixed(3) ?? 'N/A'}
          </div>
        </div>

        <div>
          <div className="text-text-muted text-sm">Volume</div>
          <div className="text-xl font-semibold">{stats.volume.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-text-muted text-sm">VWAP</div>
          <div className="text-xl font-semibold">${stats.vwap.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-text-muted text-sm">Mean</div>
          <div className="text-lg">${stats.mean.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-text-muted text-sm">Std Dev</div>
          <div className="text-lg">${stats.std.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-text-muted">
          Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
