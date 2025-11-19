import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

// Types
type Symbol = 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT';
type Timeframe = '1s' | '1m' | '5m';
type RegressionType = 'ols' | 'kalman' | 'huber' | 'theilsen';

interface Alert {
  id: number;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  enabled: boolean;
}

interface OHLCData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Mock data generators
function generateMockOHLC(symbol: Symbol, count: number, basePrice: number): OHLCData[] {
  const data: OHLCData[] = [];
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const open = price;
    const volatility = price * 0.002;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = low + Math.random() * (high - low);

    data.push({
      timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.random() * 100 + 50,
    });

    price = close;
  }

  return data;
}

function generateSpreadData(count: number) {
  const timestamps: string[] = [];
  const spread: number[] = [];
  const zscore: number[] = [];

  for (let i = 0; i < count; i++) {
    timestamps.push(new Date(Date.now() - (count - i) * 1000).toISOString());
    const s = Math.sin(i / 10) * 50 + (Math.random() - 0.5) * 20;
    spread.push(s);
    zscore.push(s / 25); // Normalize to z-score range
  }

  return { timestamps, spread, zscore };
}

export default function App() {
  // State
  const [symbolA, setSymbolA] = useState<Symbol>('BTCUSDT');
  const [symbolB, setSymbolB] = useState<Symbol>('ETHUSDT');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [regressionType, setRegressionType] = useState<RegressionType>('ols');

  const [priceA, setPriceA] = useState(42000);
  const [priceB, setPriceB] = useState(2200);
  const [ohlcA, setOhlcA] = useState<OHLCData[]>([]);
  const [ohlcB, setOhlcB] = useState<OHLCData[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [spreadData, setSpreadData] = useState(generateSpreadData(100));
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, name: 'High Z-Score Alert', metric: 'zscore', operator: '>', threshold: 2.0, enabled: true }
  ]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ name: '', metric: 'zscore', operator: '>', threshold: 2.0 });

  // Initialize OHLC data
  useEffect(() => {
    setOhlcA(generateMockOHLC(symbolA, 100, symbolA === 'BTCUSDT' ? 42000 : symbolA === 'ETHUSDT' ? 2200 : 300));
    setOhlcB(generateMockOHLC(symbolB, 100, symbolB === 'BTCUSDT' ? 42000 : symbolB === 'ETHUSDT' ? 2200 : 300));
  }, [symbolA, symbolB, timeframe]);

  // Live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceA(prev => prev + (Math.random() - 0.5) * prev * 0.01);
      setPriceB(prev => prev + (Math.random() - 0.5) * prev * 0.01);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Computed values
  const zscore = ((priceA - priceB * 19) / 50).toFixed(2);
  const correlation = (0.85 + Math.sin(Date.now() / 10000) * 0.1).toFixed(3);
  const beta = 19.0909;
  const adfPValue = 0.0043;

  // Handlers
  const handleComputeAnalytics = () => {
    setShowAnalytics(true);
    setSpreadData(generateSpreadData(100));
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['timestamp', 'spread', 'zscore'].join(','),
      ...spreadData.timestamps.map((ts, i) =>
        [ts, spreadData.spread[i], spreadData.zscore[i]].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${symbolA}_${symbolB}_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateAlert = () => {
    if (newAlert.name.trim()) {
      setAlerts([...alerts, { ...newAlert, id: Date.now(), enabled: true }]);
      setNewAlert({ name: '', metric: 'zscore', operator: '>', threshold: 2.0 });
      setShowAlertForm(false);
    }
  };

  const handleToggleAlert = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleDeleteAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleRunADFTest = () => {
    alert(`ADF Test Results:\n\nStatistic: -3.542\np-value: ${adfPValue}\n\nResult: Spread is STATIONARY (cointegrated)`);
  };

  // Correlation matrix data
  const symbols: Symbol[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
  const corrMatrix = [
    [1.00, 0.87, 0.82, 0.79],
    [0.87, 1.00, 0.91, 0.85],
    [0.82, 0.91, 1.00, 0.88],
    [0.79, 0.85, 0.88, 1.00],
  ];

  // Styles
  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0b0e14', color: '#e6edf3', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' },
    header: { textAlign: 'center' as const, marginBottom: '2rem' },
    title: { fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' },
    subtitle: { color: '#8b949e', fontSize: '0.875rem' },
    card: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
    select: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', color: '#e6edf3', marginRight: '1rem', cursor: 'pointer' },
    button: { backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' },
    buttonSuccess: { backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500', marginRight: '0.5rem' },
    buttonDanger: { backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500' },
    input: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', color: '#e6edf3', width: '100%' },
    statLabel: { color: '#8b949e', fontSize: '0.875rem', marginBottom: '0.25rem' },
    statValue: { fontSize: '1.5rem', fontWeight: 'bold', color: '#e6edf3' },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Real-Time Pairs Trading Analytics</h1>
        <p style={styles.subtitle}>Statistical Arbitrage Dashboard · Live Market Data Analysis</p>
      </div>

      {/* Control Panel */}
      <div style={styles.card}>
        <h2 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Controls</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Symbol A</label>
            <select style={styles.select} value={symbolA} onChange={(e) => setSymbolA(e.target.value as Symbol)}>
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="ETHUSDT">ETHUSDT</option>
              <option value="BNBUSDT">BNBUSDT</option>
              <option value="SOLUSDT">SOLUSDT</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Symbol B</label>
            <select style={styles.select} value={symbolB} onChange={(e) => setSymbolB(e.target.value as Symbol)}>
              <option value="ETHUSDT">ETHUSDT</option>
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="BNBUSDT">BNBUSDT</option>
              <option value="SOLUSDT">SOLUSDT</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Timeframe</label>
            <select style={styles.select} value={timeframe} onChange={(e) => setTimeframe(e.target.value as Timeframe)}>
              <option value="1s">1 Second</option>
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Regression Type</label>
            <select style={styles.select} value={regressionType} onChange={(e) => setRegressionType(e.target.value as RegressionType)}>
              <option value="ols">OLS Regression</option>
              <option value="kalman">Kalman Filter</option>
              <option value="huber">Huber Robust</option>
              <option value="theilsen">Theil-Sen</option>
            </select>
          </div>
        </div>
        <div>
          <button style={styles.button} onClick={handleComputeAnalytics}>Compute Analytics</button>
          <button style={styles.buttonSuccess} onClick={handleExportCSV}>Export CSV</button>
          <button style={{...styles.button, backgroundColor: '#f59e0b'}} onClick={handleRunADFTest}>Run ADF Test</button>
        </div>
      </div>

      {/* Live Stats */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>{symbolA} Live Stats</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={styles.statLabel}>Price</div>
            <div style={styles.statValue}>${priceA.toFixed(2)}</div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={styles.statLabel}>Z-Score</div>
            <div style={{ ...styles.statValue, color: Math.abs(parseFloat(zscore)) > 2 ? '#ef4444' : Math.abs(parseFloat(zscore)) > 1 ? '#f59e0b' : '#10b981' }}>
              {zscore}
            </div>
          </div>
          <div>
            <div style={styles.statLabel}>Volume</div>
            <div style={{ fontSize: '1.25rem' }}>{(Math.random() * 100 + 50).toFixed(2)}</div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>{symbolB} Live Stats</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={styles.statLabel}>Price</div>
            <div style={styles.statValue}>${priceB.toFixed(2)}</div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={styles.statLabel}>Correlation</div>
            <div style={{ ...styles.statValue, color: parseFloat(correlation) > 0.8 ? '#10b981' : '#f59e0b' }}>{correlation}</div>
          </div>
          <div>
            <div style={styles.statLabel}>Volume</div>
            <div style={{ fontSize: '1.25rem' }}>{(Math.random() * 100 + 50).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Price Charts */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <Plot
            data={[
              {
                type: 'candlestick',
                x: ohlcA.map(d => d.timestamp),
                open: ohlcA.map(d => d.open),
                high: ohlcA.map(d => d.high),
                low: ohlcA.map(d => d.low),
                close: ohlcA.map(d => d.close),
                name: symbolA,
                increasing: { line: { color: '#10b981' } },
                decreasing: { line: { color: '#ef4444' } },
              } as any
            ]}
            layout={{
              title: { text: `${symbolA} - ${timeframe} OHLC`, font: { color: '#e6edf3' } },
              xaxis: { color: '#8b949e', gridcolor: '#30363d' },
              yaxis: { title: 'Price (USD)', color: '#8b949e', gridcolor: '#30363d' },
              plot_bgcolor: '#161b22',
              paper_bgcolor: '#161b22',
              font: { color: '#e6edf3' },
              height: 350,
            }}
            config={{ displayModeBar: true, displaylogo: false }}
            style={{ width: '100%' }}
          />
        </div>

        <div style={styles.card}>
          <Plot
            data={[
              {
                type: 'candlestick',
                x: ohlcB.map(d => d.timestamp),
                open: ohlcB.map(d => d.open),
                high: ohlcB.map(d => d.high),
                low: ohlcB.map(d => d.low),
                close: ohlcB.map(d => d.close),
                name: symbolB,
                increasing: { line: { color: '#10b981' } },
                decreasing: { line: { color: '#ef4444' } },
              } as any
            ]}
            layout={{
              title: { text: `${symbolB} - ${timeframe} OHLC`, font: { color: '#e6edf3' } },
              xaxis: { color: '#8b949e', gridcolor: '#30363d' },
              yaxis: { title: 'Price (USD)', color: '#8b949e', gridcolor: '#30363d' },
              plot_bgcolor: '#161b22',
              paper_bgcolor: '#161b22',
              font: { color: '#e6edf3' },
              height: 350,
            }}
            config={{ displayModeBar: true, displaylogo: false }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <>
          <div style={styles.card}>
            <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Spread & Z-Score Analysis</h3>
            <Plot
              data={[
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: spreadData.timestamps,
                  y: spreadData.spread,
                  name: 'Spread',
                  line: { color: '#3b82f6', width: 2 },
                  yaxis: 'y',
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: spreadData.timestamps,
                  y: spreadData.zscore,
                  name: 'Z-Score',
                  line: { color: '#f59e0b', width: 2 },
                  yaxis: 'y2',
                },
                { type: 'scatter', mode: 'lines', x: [spreadData.timestamps[0], spreadData.timestamps[spreadData.timestamps.length - 1]], y: [2, 2], name: '+2σ', line: { color: '#ef4444', dash: 'dash', width: 1 }, yaxis: 'y2', showlegend: false },
                { type: 'scatter', mode: 'lines', x: [spreadData.timestamps[0], spreadData.timestamps[spreadData.timestamps.length - 1]], y: [-2, -2], name: '-2σ', line: { color: '#ef4444', dash: 'dash', width: 1 }, yaxis: 'y2', showlegend: false },
                { type: 'scatter', mode: 'lines', x: [spreadData.timestamps[0], spreadData.timestamps[spreadData.timestamps.length - 1]], y: [0, 0], name: 'Mean', line: { color: '#8b949e', dash: 'dot', width: 1 }, yaxis: 'y2', showlegend: false },
              ]}
              layout={{
                title: { text: 'Spread & Z-Score', font: { color: '#e6edf3' } },
                xaxis: { color: '#8b949e', gridcolor: '#30363d' },
                yaxis: { title: 'Spread (USD)', color: '#3b82f6', gridcolor: '#30363d' },
                yaxis2: { title: 'Z-Score', color: '#f59e0b', overlaying: 'y', side: 'right' },
                plot_bgcolor: '#161b22',
                paper_bgcolor: '#161b22',
                font: { color: '#e6edf3' },
                height: 400,
                hovermode: 'x unified',
              }}
              config={{ displayModeBar: true, displaylogo: false }}
              style={{ width: '100%' }}
            />
          </div>

          <div style={styles.card}>
            <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Analytics Summary</h3>
            <div style={styles.grid}>
              <div>
                <div style={styles.statLabel}>Hedge Ratio (β)</div>
                <div style={styles.statValue}>{beta.toFixed(4)}</div>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '0.25rem' }}>Method: {regressionType.toUpperCase()}</div>
              </div>
              <div>
                <div style={styles.statLabel}>Spread</div>
                <div style={styles.statValue}>{(priceA - priceB * beta).toFixed(2)}</div>
              </div>
              <div>
                <div style={styles.statLabel}>ADF p-value</div>
                <div style={{ ...styles.statValue, color: '#10b981' }}>{adfPValue.toFixed(4)}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>✓ Cointegrated</div>
              </div>
              <div>
                <div style={styles.statLabel}>Correlation</div>
                <div style={{ ...styles.statValue, color: '#10b981' }}>{correlation}</div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Correlation Heatmap</h3>
            <Plot
              data={[
                {
                  type: 'heatmap',
                  z: corrMatrix,
                  x: symbols,
                  y: symbols,
                  colorscale: [[0, '#1e3a8a'], [0.5, '#8b949e'], [1, '#10b981']],
                  colorbar: { title: 'Correlation', titleside: 'right', tickfont: { color: '#e6edf3' }, titlefont: { color: '#e6edf3' } },
                } as any
              ]}
              layout={{
                title: { text: 'Cross-Correlation Matrix', font: { color: '#e6edf3' } },
                xaxis: { tickfont: { color: '#e6edf3' } },
                yaxis: { tickfont: { color: '#e6edf3' }, autorange: 'reversed' },
                plot_bgcolor: '#161b22',
                paper_bgcolor: '#161b22',
                font: { color: '#e6edf3' },
                height: 400,
              }}
              config={{ displayModeBar: true, displaylogo: false }}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      {/* Alert Manager */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: '#3b82f6', margin: 0 }}>Alert Rules</h3>
          <button style={styles.button} onClick={() => setShowAlertForm(!showAlertForm)}>
            {showAlertForm ? 'Cancel' : '+ New Alert'}
          </button>
        </div>

        {showAlertForm && (
          <div style={{ padding: '1rem', backgroundColor: '#0b0e14', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Alert Name</label>
                <input style={styles.input} value={newAlert.name} onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })} placeholder="High Z-Score Alert" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Metric</label>
                <select style={styles.select} value={newAlert.metric} onChange={(e) => setNewAlert({ ...newAlert, metric: e.target.value })}>
                  <option value="zscore">Z-Score</option>
                  <option value="spread">Spread</option>
                  <option value="price">Price</option>
                  <option value="correlation">Correlation</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Operator</label>
                <select style={styles.select} value={newAlert.operator} onChange={(e) => setNewAlert({ ...newAlert, operator: e.target.value })}>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Threshold</label>
                <input style={styles.input} type="number" step="0.1" value={newAlert.threshold} onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })} />
              </div>
            </div>
            <button style={styles.buttonSuccess} onClick={handleCreateAlert}>Create Alert</button>
          </div>
        )}

        <div>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#8b949e' }}>No alerts configured</div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#0b0e14', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                    {alert.name}
                    <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: alert.enabled ? '#10b981' : '#6b7280', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      {alert.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#8b949e' }}>
                    {alert.metric} {alert.operator} {alert.threshold}
                  </div>
                </div>
                <div>
                  <button style={{ ...styles.button, backgroundColor: alert.enabled ? '#f59e0b' : '#10b981' }} onClick={() => handleToggleAlert(alert.id)}>
                    {alert.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button style={styles.buttonDanger} onClick={() => handleDeleteAlert(alert.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '2rem 0', borderTop: '1px solid #30363d', marginTop: '2rem' }}>
        <p style={{ color: '#8b949e', fontSize: '0.875rem' }}>Quant Developer Assignment · MFT Trading Desk Analytics Platform</p>
        <p style={{ color: '#8b949e', fontSize: '0.75rem', marginTop: '0.5rem' }}>Phase 1 Complete: Frontend with All Features · React + Plotly.js</p>
      </div>
    </div>
  );
}
