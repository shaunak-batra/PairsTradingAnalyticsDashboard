import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.tsa.stattools import adfuller
from sklearn.linear_model import HuberRegressor, TheilSenRegressor
from typing import Dict, List, Tuple, Optional
import logging
import math

logger = logging.getLogger(__name__)


def sanitize_float(value: float) -> float:
    if math.isnan(value) or math.isinf(value):
        return 0.0
    return value


def sanitize_array(arr: np.ndarray) -> List[float]:
    return [sanitize_float(float(x)) for x in arr]


class AnalyticsService:
    def __init__(self):
        self.hedge_ratios: Dict[str, float] = {}
        self.spread_history: Dict[str, List[float]] = {}

    def compute_ols_regression(self, y: np.ndarray, x: np.ndarray) -> Tuple[float, float]:
        try:
            x_with_const = np.column_stack([np.ones(len(x)), x])
            beta_hat = np.linalg.lstsq(x_with_const, y, rcond=None)[0]
            return beta_hat[1], beta_hat[0]

        except Exception as e:
            logger.error(f"OLS regression error: {e}")
            return 1.0, 0.0

    def compute_kalman_filter(self, y: np.ndarray, x: np.ndarray) -> float:
        try:
            delta = 1e-5
            Vw = delta / (1 - delta) * np.eye(2)
            Ve = 0.001

            beta = np.zeros(2)
            P = np.zeros((2, 2))
            R = np.zeros((2, 2))

            for t in range(len(y)):
                if t > 0:
                    beta = beta
                    R = P + Vw

                x_t = np.array([1, x[t]])
                y_t = y[t]

                e = y_t - np.dot(x_t, beta)
                Q = np.dot(np.dot(x_t, R), x_t.T) + Ve
                K = np.dot(R, x_t.T) / Q
                beta = beta + K * e
                P = R - np.outer(K, x_t) @ R

            return beta[1]

        except Exception as e:
            logger.error(f"Kalman filter error: {e}")
            return 1.0

    def compute_huber_regression(self, y: np.ndarray, x: np.ndarray) -> float:
        try:
            model = HuberRegressor()
            model.fit(x.reshape(-1, 1), y)
            return model.coef_[0]

        except Exception as e:
            logger.error(f"Huber regression error: {e}")
            return 1.0

    def compute_theilsen_regression(self, y: np.ndarray, x: np.ndarray) -> float:
        try:
            model = TheilSenRegressor()
            model.fit(x.reshape(-1, 1), y)
            return model.coef_[0]

        except Exception as e:
            logger.error(f"Theil-Sen regression error: {e}")
            return 1.0

    def compute_hedge_ratio(
        self,
        prices_a: List[float],
        prices_b: List[float],
        method: str = "ols"
    ) -> float:
        y = np.array(prices_a)
        x = np.array(prices_b)

        if method == "ols":
            beta, _ = self.compute_ols_regression(y, x)
            return beta
        elif method == "kalman":
            return self.compute_kalman_filter(y, x)
        elif method == "huber":
            return self.compute_huber_regression(y, x)
        elif method == "theilsen":
            return self.compute_theilsen_regression(y, x)
        else:
            logger.warning(f"Unknown method '{method}', using OLS")
            beta, _ = self.compute_ols_regression(y, x)
            return beta

    def compute_spread(
        self,
        prices_a: List[float],
        prices_b: List[float],
        beta: float
    ) -> np.ndarray:
        return np.array(prices_a) - beta * np.array(prices_b)

    def compute_zscore(self, spread: np.ndarray, window: int = 20) -> np.ndarray:
        try:
            df = pd.DataFrame({'spread': spread})
            rolling_mean = df['spread'].rolling(window=window, min_periods=1).mean()
            rolling_std = df['spread'].rolling(window=window, min_periods=1).std()
            rolling_std = rolling_std.replace(0, 1e-8)

            zscore = (df['spread'] - rolling_mean) / rolling_std
            return zscore.values

        except Exception as e:
            logger.error(f"Z-score calculation error: {e}")
            return np.zeros(len(spread))

    def compute_adf_test(self, spread: np.ndarray) -> Dict[str, float]:
        try:
            result = adfuller(spread, autolag='AIC')

            return {
                'statistic': result[0],
                'pvalue': result[1],
                'critical_values': result[4],
                'is_stationary': result[1] < 0.05
            }

        except Exception as e:
            logger.error(f"ADF test error: {e}")
            return {
                'statistic': 0.0,
                'pvalue': 1.0,
                'critical_values': {},
                'is_stationary': False
            }

    def compute_correlation(
        self,
        prices_a: List[float],
        prices_b: List[float]
    ) -> float:
        try:
            correlation, _ = stats.pearsonr(prices_a, prices_b)
            return correlation

        except Exception as e:
            logger.error(f"Correlation calculation error: {e}")
            return 0.0

    def compute_correlation_matrix(
        self,
        price_data: Dict[str, List[float]]
    ) -> Dict[str, Dict[str, float]]:
        try:
            df = pd.DataFrame(price_data)
            corr_matrix = df.corr()

            result = {}
            for symbol_a in corr_matrix.index:
                result[symbol_a] = {}
                for symbol_b in corr_matrix.columns:
                    result[symbol_a][symbol_b] = corr_matrix.loc[symbol_a, symbol_b]

            return result

        except Exception as e:
            logger.error(f"Correlation matrix error: {e}")
            return {}

    def compute_full_analytics(
        self,
        prices_a: List[float],
        prices_b: List[float],
        timestamps: List[str],
        regression_type: str = "ols"
    ) -> Dict:
        try:
            beta = self.compute_hedge_ratio(prices_a, prices_b, regression_type)
            spread = self.compute_spread(prices_a, prices_b, beta)
            zscore = self.compute_zscore(spread)
            correlation = self.compute_correlation(prices_a, prices_b)
            adf_result = self.compute_adf_test(spread)
            spread_mean = np.mean(spread)
            spread_std = np.std(spread)

            return {
                'hedge_ratio': sanitize_float(beta),
                'regression_type': regression_type,
                'spread': {
                    'values': sanitize_array(spread),
                    'mean': sanitize_float(spread_mean),
                    'std': sanitize_float(spread_std),
                    'timestamps': timestamps
                },
                'zscore': {
                    'values': sanitize_array(zscore),
                    'current': sanitize_float(zscore[-1]) if len(zscore) > 0 else 0.0
                },
                'correlation': sanitize_float(correlation),
                'adf_test': {
                    'statistic': sanitize_float(adf_result['statistic']),
                    'pvalue': sanitize_float(adf_result['pvalue']),
                    'is_stationary': bool(adf_result['is_stationary']),
                    'critical_values': {k: sanitize_float(v) for k, v in adf_result['critical_values'].items()}
                }
            }

        except Exception as e:
            logger.error(f"Full analytics computation error: {e}")
            return {
                'error': str(e),
                'hedge_ratio': 1.0,
                'regression_type': regression_type
            }
