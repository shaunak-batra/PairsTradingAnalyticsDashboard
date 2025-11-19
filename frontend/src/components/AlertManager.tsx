import { useState } from 'react';
import { Alert } from '../types';

interface AlertManagerProps {
  alerts: Alert[];
  onCreateAlert: (alert: Omit<Alert, 'id'>) => void;
  onToggleAlert: (id: number) => void;
  onDeleteAlert: (id: number) => void;
}

export function AlertManager({ alerts, onCreateAlert, onToggleAlert, onDeleteAlert }: AlertManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    metric: 'zscore' as Alert['metric'],
    operator: '>' as Alert['operator'],
    threshold: '',
    symbol_pair: 'BTCUSDT/ETHUSDT',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAlert({
      ...formData,
      threshold: parseFloat(formData.threshold),
      enabled: true,
    });
    setFormData({
      name: '',
      metric: 'zscore',
      operator: '>',
      threshold: '',
      symbol_pair: 'BTCUSDT/ETHUSDT',
    });
    setShowForm(false);
  };

  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">Alert Rules</h2>
        <button
          className="btn btn-primary text-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-background rounded-lg border border-border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Alert Name</label>
              <input
                type="text"
                className="input w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="High Z-Score Alert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Symbol Pair</label>
              <input
                type="text"
                className="input w-full"
                value={formData.symbol_pair}
                onChange={(e) => setFormData({ ...formData, symbol_pair: e.target.value })}
                placeholder="BTCUSDT/ETHUSDT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Metric</label>
              <select
                className="select w-full"
                value={formData.metric}
                onChange={(e) => setFormData({ ...formData, metric: e.target.value as Alert['metric'] })}
              >
                <option value="zscore">Z-Score</option>
                <option value="spread">Spread</option>
                <option value="price">Price</option>
                <option value="correlation">Correlation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Operator</label>
                <select
                  className="select w-full"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value as Alert['operator'] })}
                >
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="==">==</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Threshold</label>
                <input
                  type="number"
                  step="0.1"
                  className="input w-full"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                  required
                  placeholder="2.0"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-success w-full">
            Create Alert
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-text-muted text-center py-8 text-sm">
            No alerts configured. Create one to get started.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{alert.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${alert.enabled ? 'bg-success/20 text-success' : 'bg-text-muted/20 text-text-muted'}`}>
                    {alert.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="text-sm text-text-muted mt-1">
                  {alert.symbol_pair} · {alert.metric} {alert.operator} {alert.threshold}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className={`btn text-sm ${alert.enabled ? 'bg-warning/20 hover:bg-warning/30' : 'bg-success/20 hover:bg-success/30'}`}
                  onClick={() => onToggleAlert(alert.id)}
                >
                  {alert.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="btn btn-danger text-sm"
                  onClick={() => onDeleteAlert(alert.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
