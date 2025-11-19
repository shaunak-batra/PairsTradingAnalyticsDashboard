from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import io
import csv
import logging
import math

logger = logging.getLogger(__name__)


def sanitize_float(value: float) -> float:
    if math.isnan(value) or math.isinf(value):
        return 0.0
    return value

router = APIRouter()


class ComputeAnalyticsRequest(BaseModel):
    symbolA: str
    symbolB: str
    timeframe: str = "1m"
    regressionType: str = "ols"


class ADFTestRequest(BaseModel):
    symbolA: str
    symbolB: str


@router.post("/compute")
async def compute_analytics(request: ComputeAnalyticsRequest):
    try:
        from app.main import binance_client, analytics_service

        if not binance_client or not analytics_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        ohlc_a = binance_client.get_ohlc(request.symbolA, count=100)
        ohlc_b = binance_client.get_ohlc(request.symbolB, count=100)

        if not ohlc_a or not ohlc_b:
            raise HTTPException(status_code=404, detail="Insufficient data for analysis")

        prices_a = [candle['close'] for candle in ohlc_a]
        prices_b = [candle['close'] for candle in ohlc_b]
        timestamps = [candle['timestamp'] for candle in ohlc_a]

        min_len = min(len(prices_a), len(prices_b))
        prices_a = prices_a[:min_len]
        prices_b = prices_b[:min_len]
        timestamps = timestamps[:min_len]

        if min_len < 20:
            raise HTTPException(status_code=400, detail="Not enough data points (minimum 20)")

        analytics = analytics_service.compute_full_analytics(
            prices_a,
            prices_b,
            timestamps,
            request.regressionType
        )

        return analytics

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analytics computation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adf-test")
async def run_adf_test(request: ADFTestRequest):
    try:
        from app.main import binance_client, analytics_service

        if not binance_client or not analytics_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        ohlc_a = binance_client.get_ohlc(request.symbolA, count=100)
        ohlc_b = binance_client.get_ohlc(request.symbolB, count=100)

        if not ohlc_a or not ohlc_b:
            raise HTTPException(status_code=404, detail="Insufficient data")

        prices_a = [candle['close'] for candle in ohlc_a]
        prices_b = [candle['close'] for candle in ohlc_b]

        min_len = min(len(prices_a), len(prices_b))
        prices_a = prices_a[:min_len]
        prices_b = prices_b[:min_len]

        beta = analytics_service.compute_hedge_ratio(prices_a, prices_b)
        spread = analytics_service.compute_spread(prices_a, prices_b, beta)
        adf_result = analytics_service.compute_adf_test(spread)

        return {
            'symbolA': request.symbolA,
            'symbolB': request.symbolB,
            'hedge_ratio': sanitize_float(beta),
            'adf_test': {
                'statistic': sanitize_float(adf_result['statistic']),
                'pvalue': sanitize_float(adf_result['pvalue']),
                'is_stationary': bool(adf_result['is_stationary']),
                'critical_values': {k: sanitize_float(v) for k, v in adf_result['critical_values'].items()}
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ADF test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def export_csv(
    symbolA: str,
    symbolB: str,
    format: str = "csv"
):
    try:
        from app.main import binance_client, analytics_service

        if not binance_client or not analytics_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        ohlc_a = binance_client.get_ohlc(symbolA, count=100)
        ohlc_b = binance_client.get_ohlc(symbolB, count=100)

        if not ohlc_a or not ohlc_b:
            raise HTTPException(status_code=404, detail="Insufficient data")

        prices_a = [candle['close'] for candle in ohlc_a]
        prices_b = [candle['close'] for candle in ohlc_b]
        timestamps = [candle['timestamp'] for candle in ohlc_a]

        min_len = min(len(prices_a), len(prices_b), len(timestamps))
        prices_a = prices_a[:min_len]
        prices_b = prices_b[:min_len]
        timestamps = timestamps[:min_len]

        beta = analytics_service.compute_hedge_ratio(prices_a, prices_b)
        spread = analytics_service.compute_spread(prices_a, prices_b, beta)
        zscore = analytics_service.compute_zscore(spread)

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(['timestamp', 'price_a', 'price_b', 'spread', 'zscore'])
        for i in range(len(timestamps)):
            writer.writerow([
                timestamps[i],
                prices_a[i],
                prices_b[i],
                spread[i],
                zscore[i]
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=analytics_{symbolA}_{symbolB}.csv"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlation-matrix")
async def get_correlation_matrix():
    try:
        from app.main import binance_client, analytics_service

        if not binance_client or not analytics_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        symbols = ["btcusdt", "ethusdt", "bnbusdt", "solusdt"]
        price_data = {}

        for symbol in symbols:
            ohlc = binance_client.get_ohlc(symbol, count=100)
            if ohlc:
                price_data[symbol.upper()] = [candle['close'] for candle in ohlc]

        if len(price_data) < 2:
            raise HTTPException(status_code=404, detail="Insufficient data")

        corr_matrix = analytics_service.compute_correlation_matrix(price_data)

        return {
            'symbols': list(price_data.keys()),
            'correlation_matrix': corr_matrix
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Correlation matrix error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
