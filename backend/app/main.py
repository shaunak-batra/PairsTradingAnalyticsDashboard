from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from app.services.binance_client import BinanceWebSocketClient
from app.services.analytics_service import AnalyticsService
from app.api import analytics, websocket

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

binance_client = None
analytics_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global binance_client, analytics_service

    logger.info("Starting backend services...")

    binance_client = BinanceWebSocketClient()
    analytics_service = AnalyticsService()

    asyncio.create_task(binance_client.start())

    logger.info("Backend services started successfully")

    yield

    logger.info("Shutting down backend services...")
    await binance_client.stop()
    logger.info("Backend services stopped")
app = FastAPI(
    title="Pairs Trading Analytics API",
    description="Real-time statistical arbitrage analytics platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])


@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Pairs Trading Analytics API",
        "version": "1.0.0",
        "binance_status": "connected" if binance_client and binance_client.is_running else "disconnected"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "binance_client": binance_client.is_running if binance_client else False,
        "active_symbols": list(binance_client.prices.keys()) if binance_client else [],
        "price_count": len(binance_client.prices) if binance_client else 0
    }


@app.get("/api/test/prices")
async def test_prices():
    if not binance_client:
        return {"error": "Binance client not initialized"}

    return {
        "prices": binance_client.get_all_prices(),
        "ohlc_counts": {
            symbol: len(binance_client.get_ohlc(symbol))
            for symbol in binance_client.symbols
        },
        "volumes": {
            symbol: binance_client.get_volume(symbol)
            for symbol in binance_client.symbols
        }
    }


@app.get("/api/test/ohlc/{symbol}")
async def test_ohlc(symbol: str):
    if not binance_client:
        return {"error": "Binance client not initialized"}

    ohlc_data = binance_client.get_ohlc(symbol, count=10)
    return {
        "symbol": symbol,
        "count": len(ohlc_data),
        "data": ohlc_data
    }
