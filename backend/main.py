import asyncio
import json
import time
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.astro_service import compute_planetary_analysis
from services.numerology_service import compute_numerology
from services.news_service import get_news_sentiment
from services.price_service import (
    get_current_price, get_5min_candles, get_indicators, calculate_trade
)
from services.prediction_service import compute_composite_signal, get_risk_metrics

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

# Background broadcast task
async def broadcast_loop():
    candles = get_5min_candles(60)
    last_news_update = 0
    last_full_update = 0
    news_data = {}

    while True:
        now = time.time()
        dt = datetime.now(timezone.utc)

        # Astro + numerology (every 60 seconds)
        if now - last_full_update > 60:
            astro   = compute_planetary_analysis(dt)
            numeral = compute_numerology(dt)
            last_full_update = now

        # News (every 2 minutes)
        if now - last_news_update > 120:
            try:
                news_data = await get_news_sentiment()
            except Exception:
                news_data = {}
            last_news_update = now

        # Price tick
        news_bias = news_data.get("aggregate_score", 0) if news_data else 0
        tick = get_current_price(signal_bias=news_bias)

        # New candle every 5 minutes
        latest_candle_ts = candles[-1]["time"] if candles else 0
        if now - latest_candle_ts >= 300:
            indicators = get_indicators(candles)
            new_candle = {
                "open": candles[-1]["close"] if candles else tick["price"],
                "high": tick["price"],
                "low":  tick["price"],
                "close": tick["price"],
                "volume": 10000,
                "timestamp": int(now) * 1000,
                "time": int(now),
            }
            candles.append(new_candle)
            if len(candles) > 300:
                candles.pop(0)
        else:
            # Update last candle
            candles[-1]["high"]  = max(candles[-1]["high"],  tick["price"])
            candles[-1]["low"]   = min(candles[-1]["low"],   tick["price"])
            candles[-1]["close"] = tick["price"]

        indicators = get_indicators(candles)

        composite = compute_composite_signal(
            news_score        = news_data.get("aggregate_score", 0) if news_data else 0,
            astro_score       = astro.get("raw_score", 0),
            numerology_score  = numeral.get("raw_score", 0),
            indicators        = indicators,
        )

        trade = calculate_trade(
            price    = tick["price"],
            signal   = composite["signal"],
            leverage = 140,
            margin   = 10.0,
        )
        risk = get_risk_metrics(trade, composite["signal"], composite["confidence"])

        payload = {
            "type": "update",
            "timestamp": dt.isoformat(),
            "price": tick,
            "candles": candles[-60:],  # last 60 candles (5 hours)
            "indicators": indicators,
            "signal": composite,
            "trade": trade,
            "risk": risk,
            "astro": astro,
            "numerology": numeral,
            "news": {
                "aggregate_score": news_data.get("aggregate_score", 0),
                "signal": news_data.get("signal", "NEUTRAL"),
                "bullish_count": news_data.get("bullish_count", 0),
                "bearish_count": news_data.get("bearish_count", 0),
                "top_themes": news_data.get("top_themes", []),
                "social": news_data.get("social_sentiment", {}),
                "articles": (news_data.get("articles", []) or [])[:8],
            },
        }

        await manager.broadcast(payload)
        await asyncio.sleep(5)  # broadcast every 5 seconds


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(broadcast_loop())
    yield
    task.cancel()

app = FastAPI(title="OilOracle API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}

@app.get("/api/astro")
async def api_astro():
    return compute_planetary_analysis()

@app.get("/api/numerology")
async def api_numerology():
    return compute_numerology()

@app.get("/api/news")
async def api_news():
    return await get_news_sentiment()

@app.get("/api/price")
async def api_price():
    candles = get_5min_candles(60)
    tick    = get_current_price()
    indicators = get_indicators(candles)
    return {"tick": tick, "candles": candles[-20:], "indicators": indicators}

@app.get("/api/signal")
async def api_signal():
    dt = datetime.now(timezone.utc)
    candles = get_5min_candles(60)
    indicators = get_indicators(candles)
    tick = get_current_price()
    news = await get_news_sentiment()
    astro = compute_planetary_analysis(dt)
    numeral = compute_numerology(dt)
    composite = compute_composite_signal(
        news_score       = news.get("aggregate_score", 0),
        astro_score      = astro.get("raw_score", 0),
        numerology_score = numeral.get("raw_score", 0),
        indicators       = indicators,
    )
    trade = calculate_trade(tick["price"], composite["signal"])
    risk  = get_risk_metrics(trade, composite["signal"], composite["confidence"])
    return {
        "signal": composite,
        "trade": trade,
        "risk": risk,
        "price": tick["price"],
    }

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            try:
                await asyncio.wait_for(ws.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                await ws.send_json({"type": "ping"})
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)
