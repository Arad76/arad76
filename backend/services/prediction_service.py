from datetime import datetime, timezone
import random
import math

WEIGHT_NEWS     = 0.30
WEIGHT_ASTRO    = 0.25
WEIGHT_NUMEROLOGY = 0.15
WEIGHT_TECHNICAL  = 0.30

SIGNAL_THRESHOLDS = {
    "STRONG BUY":  (50, 100),
    "BUY":         (20, 50),
    "NEUTRAL":     (-20, 20),
    "SELL":        (-50, -20),
    "STRONG SELL": (-100, -50),
}

SIGNAL_COLORS = {
    "STRONG BUY":  "#00FF88",
    "BUY":         "#00CC66",
    "NEUTRAL":     "#FFD700",
    "SELL":        "#FF6644",
    "STRONG SELL": "#FF0000",
}

CONFIDENCE_LABELS = {
    (85, 100): "Very High",
    (70, 85):  "High",
    (55, 70):  "Moderate",
    (40, 55):  "Low",
    (0, 40):   "Very Low",
}

def _get_confidence_label(pct: float) -> str:
    for (lo, hi), label in CONFIDENCE_LABELS.items():
        if lo <= pct < hi:
            return label
    return "Very Low"

def _technical_score(indicators: dict) -> float:
    score = 0.0
    if not indicators:
        return 0.0

    rsi = indicators.get("rsi14", 50)
    if rsi > 70:
        score -= 20  # overbought
    elif rsi < 30:
        score += 20  # oversold
    elif rsi > 55:
        score += 10
    elif rsi < 45:
        score -= 10

    macd_h = indicators.get("macd_hist", 0)
    macd_l = indicators.get("macd_line", 0)
    if macd_h > 0 and macd_l > 0:
        score += 15
    elif macd_h < 0 and macd_l < 0:
        score -= 15
    elif macd_h > 0:
        score += 8

    trend = indicators.get("trend", "SIDEWAYS")
    if trend == "BULLISH":
        score += 20
    elif trend == "BEARISH":
        score -= 20

    bb = indicators.get("price_vs_bb", "NORMAL")
    if bb == "OVERSOLD":
        score += 12
    elif bb == "OVERBOUGHT":
        score -= 12

    return max(-100, min(100, score))

def compute_composite_signal(
    news_score: float,
    astro_score: float,
    numerology_score: float,
    indicators: dict,
) -> dict:
    tech_score = _technical_score(indicators)

    composite = (
        news_score        * WEIGHT_NEWS      +
        astro_score       * WEIGHT_ASTRO     +
        numerology_score  * WEIGHT_NUMEROLOGY +
        tech_score        * WEIGHT_TECHNICAL
    )
    composite = max(-100, min(100, composite))

    # Confidence: agreement among signals
    scores = [news_score, astro_score, numerology_score, tech_score]
    signs = [1 if s > 5 else (-1 if s < -5 else 0) for s in scores]
    agreement = abs(sum(signs)) / len(signs)  # 0 to 1
    confidence = round(50 + agreement * 50, 1)
    confidence_label = _get_confidence_label(confidence)

    # Determine signal string
    signal = "NEUTRAL"
    for sig, (lo, hi) in SIGNAL_THRESHOLDS.items():
        if lo <= composite < hi or (lo < 0 and lo <= composite <= hi):
            signal = sig
            break

    # Force strong signals when all agree
    if all(s > 20 for s in scores):
        signal = "STRONG BUY"
        confidence = min(95, confidence + 10)
    elif all(s < -20 for s in scores):
        signal = "STRONG SELL"
        confidence = min(95, confidence + 10)

    color = SIGNAL_COLORS.get(signal, "#FFD700")

    # 5-min forecast
    direction = 1 if composite > 0 else -1
    magnitude = abs(composite) / 100
    expected_move_pct = direction * magnitude * 0.3  # max ~0.3% per 5 min

    component_breakdown = [
        {"label": "News & Sentiment",   "score": round(news_score, 1),        "weight": WEIGHT_NEWS,        "contribution": round(news_score * WEIGHT_NEWS, 1)},
        {"label": "Astrology",          "score": round(astro_score, 1),       "weight": WEIGHT_ASTRO,       "contribution": round(astro_score * WEIGHT_ASTRO, 1)},
        {"label": "Numerology",         "score": round(numerology_score, 1),  "weight": WEIGHT_NUMEROLOGY,  "contribution": round(numerology_score * WEIGHT_NUMEROLOGY, 1)},
        {"label": "Technical Analysis", "score": round(tech_score, 1),        "weight": WEIGHT_TECHNICAL,   "contribution": round(tech_score * WEIGHT_TECHNICAL, 1)},
    ]

    return {
        "composite_score":   round(composite, 2),
        "signal":            signal,
        "color":             color,
        "confidence":        confidence,
        "confidence_label":  confidence_label,
        "expected_move_pct": round(expected_move_pct, 4),
        "components":        component_breakdown,
        "timestamp":         datetime.now(timezone.utc).isoformat(),
        "valid_for_minutes": 5,
    }

def get_risk_metrics(trade: dict, signal: str, confidence: float) -> dict:
    leverage = trade.get("leverage", 140)
    margin   = trade.get("margin_used", 10)

    risk_score = 0
    if leverage > 100:
        risk_score += 30
    if confidence < 60:
        risk_score += 25
    if signal in ("NEUTRAL",):
        risk_score += 20
    if trade.get("risk_reward", 0) < 1.5:
        risk_score += 15

    risk_score = min(100, risk_score)
    risk_label = (
        "EXTREME" if risk_score > 75 else
        "HIGH"    if risk_score > 50 else
        "MODERATE"if risk_score > 25 else
        "LOW"
    )

    advice = []
    if leverage > 100:
        advice.append(f"Use {leverage}x leverage only with tight stop-loss — liquidation risk is high")
    if margin <= 10:
        advice.append(f"${margin} margin with {leverage}x = ${margin*leverage} position — scale only if signal is HIGH confidence")
    if signal == "NEUTRAL":
        advice.append("Signal is NEUTRAL — consider waiting for clearer directional confirmation")
    if confidence < 60:
        advice.append("Low signal agreement across systems — reduce position size or sit out")

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "advice": advice,
        "max_concurrent_trades": 1 if risk_score > 50 else 2,
        "suggested_margin": margin if confidence > 70 else max(5, margin * 0.5),
    }
