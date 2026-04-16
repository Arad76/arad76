import time
import math
import random
from datetime import datetime, timezone
from collections import deque

# WTI Crude Oil base price simulation
_BASE_PRICE = 82.50
_current_price = _BASE_PRICE
_last_update = time.time()
_price_history: deque = deque(maxlen=300)  # 300 ticks = 25 mins at 5-sec intervals

# Market session regimes
SESSIONS = {
    "Asian":     {"hours": (0, 8),   "volatility": 0.15, "trend_bias": 0.0},
    "European":  {"hours": (8, 16),  "volatility": 0.25, "trend_bias": 0.05},
    "American":  {"hours": (16, 23), "volatility": 0.35, "trend_bias": 0.02},
}

# Technical levels
SUPPORT_LEVELS = [79.50, 80.00, 81.00, 81.50]
RESISTANCE_LEVELS = [83.00, 84.50, 85.00, 86.00]

def _get_session(hour_utc: int) -> str:
    for session, config in SESSIONS.items():
        s, e = config["hours"]
        if s <= hour_utc < e:
            return session
    return "Asian"

def _mean_revert_factor(price: float) -> float:
    if price > _BASE_PRICE * 1.05:
        return -0.3
    elif price < _BASE_PRICE * 0.95:
        return 0.3
    return 0.0

def _support_resistance_factor(price: float) -> float:
    for level in SUPPORT_LEVELS:
        if abs(price - level) < 0.15:
            return 0.2  # bounce support
    for level in RESISTANCE_LEVELS:
        if abs(price - level) < 0.15:
            return -0.2  # reject resistance
    return 0.0

def generate_ohlcv(prev_close: float, session_vol: float, signal_bias: float = 0.0) -> dict:
    vol = session_vol
    bias = signal_bias * 0.01

    o = prev_close
    moves = [random.gauss(bias, vol) for _ in range(4)]
    prices = [o]
    for m in moves:
        prices.append(prices[-1] + m)

    h = max(prices) + abs(random.gauss(0, vol * 0.3))
    l = min(prices) - abs(random.gauss(0, vol * 0.3))
    c = prices[-1]
    volume = int(random.gauss(15000, 4000))

    return {
        "open":   round(o, 2),
        "high":   round(h, 2),
        "low":    round(l, 2),
        "close":  round(c, 2),
        "volume": max(1000, volume),
    }

def get_current_price(signal_bias: float = 0.0) -> dict:
    global _current_price, _last_update

    now = datetime.now(timezone.utc)
    dt = time.time() - _last_update
    _last_update = time.time()

    session_name = _get_session(now.hour)
    session = SESSIONS[session_name]
    vol = session["volatility"] * math.sqrt(dt / 60)

    drift = session["trend_bias"] * dt / 60
    drift += signal_bias * 0.002
    drift += _mean_revert_factor(_current_price)
    drift += _support_resistance_factor(_current_price)

    noise = random.gauss(drift, max(0.001, vol))
    _current_price = max(60.0, min(130.0, _current_price + noise))

    tick = {
        "price": round(_current_price, 2),
        "timestamp": now.isoformat(),
        "session": session_name,
        "change": round(noise, 4),
        "change_pct": round(noise / (_current_price - noise) * 100, 4),
    }
    _price_history.append(tick)
    return tick

def get_5min_candles(n: int = 60) -> list[dict]:
    """Return last n 5-minute OHLCV candles."""
    global _current_price
    candles = []
    price = _BASE_PRICE + random.gauss(0, 0.5)
    now_ts = int(time.time())
    interval = 300  # 5 minutes

    start_ts = now_ts - (n * interval)
    for i in range(n):
        ts = start_ts + i * interval
        session = _get_session(datetime.fromtimestamp(ts, tz=timezone.utc).hour)
        vol = SESSIONS[session]["volatility"]
        candle = generate_ohlcv(price, vol)
        candle["timestamp"] = ts * 1000  # milliseconds for chart
        candle["time"] = ts
        price = candle["close"]
        candles.append(candle)

    _current_price = price
    return candles

def get_indicators(candles: list[dict]) -> dict:
    closes = [c["close"] for c in candles]
    if len(closes) < 20:
        return {}

    def ema(data: list[float], period: int) -> list[float]:
        k = 2 / (period + 1)
        result = [data[0]]
        for v in data[1:]:
            result.append(v * k + result[-1] * (1 - k))
        return result

    def rsi(data: list[float], period: int = 14) -> float:
        deltas = [data[i] - data[i-1] for i in range(1, len(data))]
        gains = [max(0, d) for d in deltas[-period:]]
        losses = [abs(min(0, d)) for d in deltas[-period:]]
        avg_gain = sum(gains) / period if gains else 0
        avg_loss = sum(losses) / period if losses else 1e-9
        rs = avg_gain / avg_loss
        return round(100 - 100 / (1 + rs), 2)

    ema9  = ema(closes, 9)
    ema21 = ema(closes, 21)
    ema50 = ema(closes, 50) if len(closes) >= 50 else ema(closes, len(closes))
    rsi14 = rsi(closes)

    # Bollinger Bands (20)
    window = closes[-20:]
    bb_mean = sum(window) / 20
    bb_std = (sum((x - bb_mean) ** 2 for x in window) / 20) ** 0.5
    bb_upper = round(bb_mean + 2 * bb_std, 2)
    bb_lower = round(bb_mean - 2 * bb_std, 2)

    # MACD
    macd_line = ema9[-1] - ema21[-1]
    macd_signal_vals = ema([ema9[i] - ema21[i] for i in range(len(ema9))], 9)
    macd_hist = macd_line - macd_signal_vals[-1]

    # ATR (14)
    highs = [c["high"] for c in candles[-15:]]
    lows  = [c["low"]  for c in candles[-15:]]
    atr_values = []
    for i in range(1, len(highs)):
        tr = max(highs[i] - lows[i],
                 abs(highs[i] - closes[-len(highs)+i-1]),
                 abs(lows[i]  - closes[-len(highs)+i-1]))
        atr_values.append(tr)
    atr = round(sum(atr_values) / len(atr_values), 4) if atr_values else 0.2

    current = closes[-1]
    return {
        "ema9":       round(ema9[-1], 2),
        "ema21":      round(ema21[-1], 2),
        "ema50":      round(ema50[-1], 2),
        "rsi14":      rsi14,
        "bb_upper":   bb_upper,
        "bb_middle":  round(bb_mean, 2),
        "bb_lower":   bb_lower,
        "macd_line":  round(macd_line, 4),
        "macd_signal":round(macd_signal_vals[-1], 4),
        "macd_hist":  round(macd_hist, 4),
        "atr":        atr,
        "trend": "BULLISH" if ema9[-1] > ema21[-1] > ema50[-1] else
                 "BEARISH" if ema9[-1] < ema21[-1] < ema50[-1] else "SIDEWAYS",
        "price_vs_bb": (
            "OVERBOUGHT" if current > bb_upper else
            "OVERSOLD"   if current < bb_lower else
            "NORMAL"
        ),
    }

def calculate_trade(price: float, signal: str, leverage: int = 140, margin: float = 10.0) -> dict:
    position_size = margin * leverage
    contracts = position_size / (price * 10)  # crude oil = 10 barrels per micro

    indicators = get_indicators(get_5min_candles(30))
    atr = indicators.get("atr", 0.2)

    is_long = "BUY" in signal
    direction = 1 if is_long else -1

    # ATR-based stops and targets
    stop_distance = atr * 1.5
    tp1_distance  = atr * 2.0
    tp2_distance  = atr * 3.5

    stop_loss  = round(price - direction * stop_distance, 2)
    take_profit1 = round(price + direction * tp1_distance, 2)
    take_profit2 = round(price + direction * tp2_distance, 2)

    # P&L per 1 pip ($0.01) with 140x leverage
    pip_value = margin * leverage * 0.01 / price
    stop_loss_pnl   = round(-stop_distance / 0.01 * pip_value, 2)
    tp1_pnl         = round(tp1_distance / 0.01 * pip_value, 2)
    tp2_pnl         = round(tp2_distance / 0.01 * pip_value, 2)

    rr_ratio = round(tp1_distance / stop_distance, 2)

    margin_call_price = round(
        price - direction * (margin * 0.8 / (contracts * 10)) if contracts > 0 else price * 0.9,
        2
    )

    return {
        "direction":       "LONG" if is_long else "SHORT",
        "entry_price":     round(price, 2),
        "stop_loss":       stop_loss,
        "take_profit_1":   take_profit1,
        "take_profit_2":   take_profit2,
        "leverage":        leverage,
        "margin_used":     margin,
        "position_size":   round(position_size, 2),
        "contracts":       round(contracts, 4),
        "risk_reward":     rr_ratio,
        "max_loss_usd":    round(abs(stop_loss_pnl), 2),
        "tp1_profit_usd":  tp1_pnl,
        "tp2_profit_usd":  tp2_pnl,
        "margin_call_at":  margin_call_price,
        "pip_value":       round(pip_value, 4),
        "atr":             atr,
    }
