import asyncio
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import deque
import aiohttp

logger = logging.getLogger(__name__)


class BinanceWebSocketClient:
    def __init__(self):
        self.ws_url = "wss://stream.binance.com:9443/ws"
        self.rest_url = "https://api.binance.com/api/v3"
        self.symbols = ["btcusdt", "ethusdt", "bnbusdt", "solusdt"]
        self.prices: Dict[str, float] = {}
        self.ohlc_data: Dict[str, deque] = {symbol: deque(maxlen=200) for symbol in self.symbols}
        self.volumes: Dict[str, float] = {}
        self.is_running = False
        self.session: Optional[aiohttp.ClientSession] = None
        self.websocket: Optional[aiohttp.ClientWebSocketResponse] = None
        self.tasks: List[asyncio.Task] = []

    async def start(self):
        self.is_running = True
        logger.info("Starting Enhanced Binance WebSocket client...")

        self.session = aiohttp.ClientSession()
        await self._fetch_historical_data()
        await self._connect_and_subscribe()

    async def _fetch_historical_data(self):
        logger.info("Fetching historical OHLC data from Binance REST API...")

        for symbol in self.symbols:
            try:
                url = f"{self.rest_url}/klines"
                params = {
                    'symbol': symbol.upper(),
                    'interval': '1m',
                    'limit': 100
                }

                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()

                        for candle in data:
                            ohlc = {
                                'timestamp': datetime.fromtimestamp(candle[0] / 1000).isoformat(),
                                'open': float(candle[1]),
                                'high': float(candle[2]),
                                'low': float(candle[3]),
                                'close': float(candle[4]),
                                'volume': float(candle[5])
                            }
                            self.ohlc_data[symbol].append(ohlc)
                            self.prices[symbol] = float(candle[4])

                        logger.info(f"✓ Loaded {len(data)} historical candles for {symbol.upper()}")
                    else:
                        logger.error(f"Failed to fetch historical data for {symbol}: {response.status}")

            except Exception as e:
                logger.error(f"Error fetching historical data for {symbol}: {e}")

        logger.info(f"Historical data loaded. Ready for analytics!")

    async def _connect_and_subscribe(self):
        try:
            streams = [f"{symbol}@miniTicker" for symbol in self.symbols]
            kline_streams = [f"{symbol}@kline_1m" for symbol in self.symbols]
            streams.extend(kline_streams)

            stream_names = "/".join(streams)
            url = f"{self.ws_url}/{stream_names}"

            logger.info(f"Connecting to Binance WebSocket...")

            self.websocket = await self.session.ws_connect(url)

            logger.info("✓ Connected to Binance WebSocket successfully")

            task = asyncio.create_task(self._handle_messages())
            self.tasks.append(task)

        except Exception as e:
            logger.error(f"Error connecting to Binance WebSocket: {e}")
            await asyncio.sleep(5)
            if self.is_running:
                await self._connect_and_subscribe()

    async def _handle_messages(self):
        try:
            async for msg in self.websocket:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    await self._process_message(data)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {self.websocket.exception()}")
                    break
        except Exception as e:
            logger.error(f"Error handling WebSocket messages: {e}")
        finally:
            if self.is_running:
                logger.info("WebSocket connection lost, reconnecting...")
                await asyncio.sleep(2)
                await self._connect_and_subscribe()

    async def _process_message(self, data: dict):
        try:
            event_type = data.get("e")

            if event_type == "24hrMiniTicker":
                symbol = data.get("s", "").lower()
                if symbol in self.symbols:
                    self.prices[symbol] = float(data.get("c", 0))
                    self.volumes[symbol] = float(data.get("v", 0))

            elif event_type == "kline":
                kline = data.get("k", {})
                symbol = kline.get("s", "").lower()

                if symbol in self.symbols and kline.get("x"):
                    ohlc = {
                        "timestamp": datetime.fromtimestamp(kline["t"] / 1000).isoformat(),
                        "open": float(kline["o"]),
                        "high": float(kline["h"]),
                        "low": float(kline["l"]),
                        "close": float(kline["c"]),
                        "volume": float(kline["v"])
                    }
                    self.ohlc_data[symbol].append(ohlc)
                    logger.debug(f"New candle for {symbol.upper()}: close={ohlc['close']}")

        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def get_price(self, symbol: str) -> Optional[float]:
        return self.prices.get(symbol.lower())

    def get_ohlc(self, symbol: str, count: int = 100) -> List[dict]:
        symbol_lower = symbol.lower()
        if symbol_lower in self.ohlc_data:
            data_list = list(self.ohlc_data[symbol_lower])
            return data_list[-count:] if len(data_list) > count else data_list
        return []

    def get_volume(self, symbol: str) -> Optional[float]:
        return self.volumes.get(symbol.lower())

    def get_all_prices(self) -> Dict[str, float]:
        return self.prices.copy()

    def get_data_counts(self) -> Dict[str, int]:
        return {symbol: len(self.ohlc_data[symbol]) for symbol in self.symbols}

    async def stop(self):
        logger.info("Stopping Binance WebSocket client...")
        self.is_running = False

        for task in self.tasks:
            task.cancel()

        if self.websocket:
            await self.websocket.close()

        if self.session:
            await self.session.close()

        logger.info("Binance WebSocket client stopped")
