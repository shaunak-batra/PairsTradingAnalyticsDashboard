const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

export interface ComputeAnalyticsRequest {
  symbolA: string;
  symbolB: string;
  timeframe: string;
  regressionType: string;
}

export interface AnalyticsResponse {
  hedge_ratio: number;
  regression_type: string;
  spread: {
    values: number[];
    mean: number;
    std: number;
    timestamps: string[];
  };
  zscore: {
    values: number[];
    current: number;
  };
  correlation: number;
  adf_test: {
    statistic: number;
    pvalue: number;
    is_stationary: boolean;
    critical_values: Record<string, number>;
  };
}

export interface WebSocketMessage {
  type: string;
  timestamp?: number;
  prices?: Record<string, number>;
  ohlc?: Record<string, any[]>;
  volumes?: Record<string, number>;
  message?: string;
}

export async function computeAnalytics(
  request: ComputeAnalyticsRequest
): Promise<AnalyticsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/compute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.statusText}`);
  }

  return response.json();
}

export async function runADFTest(symbolA: string, symbolB: string) {
  const response = await fetch(`${API_BASE_URL}/api/analytics/adf-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbolA, symbolB }),
  });

  if (!response.ok) {
    throw new Error(`ADF test API error: ${response.statusText}`);
  }

  return response.json();
}

export async function exportCSV(symbolA: string, symbolB: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/export?symbolA=${symbolA}&symbolB=${symbolB}&format=csv`
  );

  if (!response.ok) {
    throw new Error(`CSV export error: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics_${symbolA}_${symbolB}_${new Date().toISOString()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function getCorrelationMatrix() {
  const response = await fetch(`${API_BASE_URL}/api/analytics/correlation-matrix`);

  if (!response.ok) {
    throw new Error(`Correlation matrix error: ${response.statusText}`);
  }

  return response.json();
}

export function createWebSocket(
  onMessage: (data: WebSocketMessage) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/live`);

  ws.onopen = () => {
    console.log('WebSocket connected to backend');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    if (onClose) {
      onClose();
    }
  };

  return ws;
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'disconnected' };
  }
}
