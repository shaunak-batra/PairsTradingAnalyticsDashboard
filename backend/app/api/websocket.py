from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

active_connections: Set[WebSocket] = set()


@router.websocket("/live")
async def websocket_live_data(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    logger.info(f"WebSocket client connected. Total connections: {len(active_connections)}")

    try:
        from app.main import binance_client

        if binance_client:
            initial_data = {
                'type': 'initial',
                'prices': binance_client.get_all_prices(),
                'message': 'Connected to live data stream'
            }
            await websocket.send_text(json.dumps(initial_data))

        while True:
            try:
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                    if data == "ping":
                        await websocket.send_text("pong")
                except asyncio.TimeoutError:
                    pass

                if binance_client and binance_client.is_running:
                    prices = binance_client.get_all_prices()

                    ohlc_data = {}
                    for symbol in binance_client.symbols:
                        ohlc = binance_client.get_ohlc(symbol, count=100)
                        if ohlc:
                            ohlc_data[symbol] = ohlc

                    volumes = {}
                    for symbol in binance_client.symbols:
                        volume = binance_client.get_volume(symbol)
                        if volume:
                            volumes[symbol] = volume

                    update = {
                        'type': 'update',
                        'timestamp': asyncio.get_event_loop().time(),
                        'prices': prices,
                        'ohlc': ohlc_data,
                        'volumes': volumes
                    }

                    await websocket.send_text(json.dumps(update))

                await asyncio.sleep(1)

            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop: {e}")
                break

    except Exception as e:
        logger.error(f"WebSocket error: {e}")

    finally:
        active_connections.discard(websocket)
        logger.info(f"WebSocket client removed. Total connections: {len(active_connections)}")


@router.websocket("/analytics/{symbol_a}/{symbol_b}")
async def websocket_analytics_stream(websocket: WebSocket, symbol_a: str, symbol_b: str):
    await websocket.accept()
    logger.info(f"Analytics WebSocket connected for {symbol_a}/{symbol_b}")

    try:
        from app.main import binance_client, analytics_service

        while True:
            try:
                if binance_client and analytics_service:
                    ohlc_a = binance_client.get_ohlc(symbol_a, count=100)
                    ohlc_b = binance_client.get_ohlc(symbol_b, count=100)

                    if ohlc_a and ohlc_b:
                        prices_a = [c['close'] for c in ohlc_a]
                        prices_b = [c['close'] for c in ohlc_b]
                        timestamps = [c['timestamp'] for c in ohlc_a]

                        min_len = min(len(prices_a), len(prices_b))
                        if min_len >= 20:
                            beta = analytics_service.compute_hedge_ratio(prices_a[:min_len], prices_b[:min_len])
                            spread = analytics_service.compute_spread(prices_a[:min_len], prices_b[:min_len], beta)
                            zscore = analytics_service.compute_zscore(spread)
                            correlation = analytics_service.compute_correlation(prices_a[:min_len], prices_b[:min_len])

                            update = {
                                'type': 'analytics',
                                'symbolA': symbol_a,
                                'symbolB': symbol_b,
                                'hedge_ratio': float(beta),
                                'spread': spread[-20:].tolist(),
                                'zscore': zscore[-20:].tolist(),
                                'correlation': float(correlation),
                                'current_zscore': float(zscore[-1])
                            }

                            await websocket.send_text(json.dumps(update))

                await asyncio.sleep(2)

            except WebSocketDisconnect:
                logger.info(f"Analytics WebSocket disconnected for {symbol_a}/{symbol_b}")
                break
            except Exception as e:
                logger.error(f"Error in analytics WebSocket: {e}")
                await asyncio.sleep(2)

    except Exception as e:
        logger.error(f"Analytics WebSocket error: {e}")


async def broadcast_message(message: dict):
    if active_connections:
        message_text = json.dumps(message)
        disconnected = set()

        for connection in active_connections:
            try:
                await connection.send_text(message_text)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.add(connection)

        active_connections.difference_update(disconnected)
