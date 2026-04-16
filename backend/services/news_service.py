import asyncio
import random
import time
from datetime import datetime, timezone
from typing import Any
import hashlib

try:
    import feedparser
    HAS_FEEDPARSER = True
except ImportError:
    HAS_FEEDPARSER = False

try:
    from textblob import TextBlob
    HAS_TEXTBLOB = True
except ImportError:
    HAS_TEXTBLOB = False

OIL_RSS_FEEDS = [
    {"name": "Reuters Energy",      "url": "https://feeds.reuters.com/reuters/businessNews"},
    {"name": "CNBC Energy",         "url": "https://www.cnbc.com/id/10000664/device/rss/rss.html"},
    {"name": "OilPrice.com",        "url": "https://oilprice.com/rss/main"},
    {"name": "EIA News",            "url": "https://www.eia.gov/rss/news.xml"},
    {"name": "Bloomberg Commodities","url": "https://feeds.bloomberg.com/markets/news.rss"},
    {"name": "FT Commodities",      "url": "https://www.ft.com/rss/home/uk"},
    {"name": "S&P Global Platts",   "url": "https://www.spglobal.com/commodityinsights/en/rss-feed"},
]

OIL_KEYWORDS_BULLISH = [
    "supply cut", "opec cut", "production cut", "supply disruption", "shortage",
    "pipeline attack", "sanctions", "conflict", "war", "hurricane", "storm",
    "demand surge", "strong demand", "economic growth", "stimulus", "recovery",
    "refinery fire", "output reduced", "geopolitical tension", "crude rally",
    "oil rally", "price surge", "inventory draw", "bullish", "backwardation",
]

OIL_KEYWORDS_BEARISH = [
    "supply glut", "oversupply", "production increase", "opec increase", "output boost",
    "demand weak", "recession", "slowdown", "economic contraction", "stockpile build",
    "inventory build", "bearish", "contango", "US shale", "electric vehicle", "renewable",
    "lockdown", "demand destruction", "price crash", "crude drop", "weak demand",
    "china slowdown", "strategic reserve release", "spill",
]

SIMULATED_HEADLINES = [
    ("OPEC+ signals potential output cut extension into Q3", "bullish", 0.78),
    ("US crude inventories fall by 3.2M barrels — API report", "bullish", 0.65),
    ("Middle East tensions escalate near Strait of Hormuz", "bullish", 0.82),
    ("WTI crude climbs on stronger-than-expected China PMI", "bullish", 0.60),
    ("Libya pipeline disruption cuts 200k bpd offline", "bullish", 0.74),
    ("Russia crude exports hit 3-month low amid EU restrictions", "bullish", 0.70),
    ("Hurricane tracks toward Gulf refineries, oil spikes", "bullish", 0.88),
    ("US strategic petroleum reserve at 40-year low", "bullish", 0.55),
    ("EIA reports surprise drawdown in gasoline stocks", "bullish", 0.62),
    ("Nigeria announces force majeure on Bonny Light exports", "bullish", 0.75),
    ("US shale output rises to record 13.4M bpd", "bearish", -0.65),
    ("OPEC+ members discuss easing production caps next meeting", "bearish", -0.72),
    ("China demand data disappoints, crude falls", "bearish", -0.68),
    ("IEA cuts 2024 oil demand growth forecast", "bearish", -0.60),
    ("EIA inventory build of 4.1M barrels surprises markets", "bearish", -0.75),
    ("US-Iran nuclear deal progress weighs on oil prices", "bearish", -0.58),
    ("Global PMI weakens, demand outlook deteriorates", "bearish", -0.55),
    ("Saudi Arabia resumes full production capacity", "bearish", -0.70),
    ("Recession fears mount as Fed signals more rate hikes", "bearish", -0.63),
    ("Venezuela oil exports recover after US sanctions ease", "bearish", -0.50),
    ("Dollar strengthens sharply, crude under pressure", "bearish", -0.52),
    ("Mild winter forecasts reduce heating oil demand", "bearish", -0.45),
]

SIMULATED_SOURCES = ["Reuters", "Bloomberg", "CNBC", "OilPrice.com", "S&P Platts",
                      "EIA", "Wall Street Journal", "Financial Times", "Rigzone"]

_news_cache: list[dict] = []
_cache_time: float = 0
CACHE_TTL = 120  # seconds


def _score_text(text: str) -> float:
    text_lower = text.lower()
    score = 0.0

    if HAS_TEXTBLOB:
        try:
            blob = TextBlob(text)
            score += blob.sentiment.polarity * 30
        except Exception:
            pass

    for kw in OIL_KEYWORDS_BULLISH:
        if kw in text_lower:
            score += 15
    for kw in OIL_KEYWORDS_BEARISH:
        if kw in text_lower:
            score -= 15

    return max(-100, min(100, score))


def _make_simulated_news(count: int = 8) -> list[dict]:
    now = datetime.now(timezone.utc)
    items = []
    used = set()
    while len(items) < count:
        headline, sentiment, score = random.choice(SIMULATED_HEADLINES)
        if headline in used:
            continue
        used.add(headline)
        ts = now.timestamp() - random.randint(60, 3600)
        items.append({
            "id": hashlib.md5(headline.encode()).hexdigest()[:8],
            "title": headline,
            "source": random.choice(SIMULATED_SOURCES),
            "sentiment": sentiment,
            "score": round(score * 100, 1),
            "timestamp": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
            "age_minutes": round((now.timestamp() - ts) / 60, 1),
            "simulated": True,
        })
    items.sort(key=lambda x: x["timestamp"], reverse=True)
    return items


async def _fetch_real_feed(session: Any, feed_info: dict) -> list[dict]:
    if not HAS_FEEDPARSER:
        return []
    try:
        loop = asyncio.get_event_loop()
        feed = await loop.run_in_executor(None, feedparser.parse, feed_info["url"])
        results = []
        for entry in feed.entries[:5]:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            text = f"{title} {summary}"
            score = _score_text(text)
            if abs(score) < 5:
                continue
            results.append({
                "id": hashlib.md5(title.encode()).hexdigest()[:8],
                "title": title,
                "source": feed_info["name"],
                "sentiment": "bullish" if score > 0 else "bearish",
                "score": round(score, 1),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "age_minutes": 0,
                "simulated": False,
            })
        return results
    except Exception:
        return []


async def get_news_sentiment() -> dict:
    global _news_cache, _cache_time
    now = time.time()

    if _news_cache and (now - _cache_time) < CACHE_TTL:
        return _build_result(_news_cache)

    articles = []

    # Try real feeds with short timeout
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            tasks = [_fetch_real_feed(session, f) for f in OIL_RSS_FEEDS[:3]]
            results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=8)
            for r in results:
                if isinstance(r, list):
                    articles.extend(r)
    except Exception:
        pass

    # Pad with simulated news
    target = max(10, 12 - len(articles))
    articles.extend(_make_simulated_news(target))

    articles.sort(key=lambda x: x["timestamp"], reverse=True)
    articles = articles[:15]

    _news_cache = articles
    _cache_time = now

    return _build_result(articles)


def _build_result(articles: list[dict]) -> dict:
    if not articles:
        return {"articles": [], "aggregate_score": 0, "signal": "NEUTRAL",
                "bullish_count": 0, "bearish_count": 0, "neutral_count": 0,
                "top_themes": [], "social_sentiment": _get_social_sentiment()}

    bullish = [a for a in articles if a["sentiment"] == "bullish"]
    bearish = [a for a in articles if a["sentiment"] == "bearish"]
    neutral = [a for a in articles if a["sentiment"] not in ("bullish", "bearish")]

    if articles:
        avg_score = sum(a["score"] for a in articles) / len(articles)
    else:
        avg_score = 0

    # Weight recent articles more
    weighted_score = 0.0
    total_weight = 0.0
    for a in articles:
        age = max(0.1, a.get("age_minutes", 1))
        weight = 1 / (1 + age / 60)
        weighted_score += a["score"] * weight
        total_weight += weight
    if total_weight > 0:
        weighted_score /= total_weight

    top_themes = _extract_themes(articles)
    social = _get_social_sentiment()

    return {
        "articles": articles,
        "aggregate_score": round(weighted_score, 2),
        "avg_score": round(avg_score, 2),
        "signal": _score_to_signal(weighted_score),
        "bullish_count": len(bullish),
        "bearish_count": len(bearish),
        "neutral_count": len(neutral),
        "top_themes": top_themes,
        "social_sentiment": social,
    }


def _extract_themes(articles: list[dict]) -> list[dict]:
    theme_keywords = {
        "OPEC": ["opec", "opec+", "saudi", "production cut", "quota"],
        "Geopolitics": ["war", "conflict", "tension", "sanction", "attack", "hormuz"],
        "Supply": ["supply", "inventory", "stockpile", "output", "production"],
        "Demand": ["demand", "china", "india", "consumption", "growth"],
        "Dollar": ["dollar", "usd", "fed", "rate hike", "currency"],
        "Shale": ["shale", "permian", "bakken", "us oil", "us crude"],
        "Weather": ["hurricane", "storm", "weather", "winter", "refinery"],
    }
    themes = []
    for theme, keywords in theme_keywords.items():
        count = 0
        bullish_count = 0
        for a in articles:
            title_lower = a["title"].lower()
            if any(kw in title_lower for kw in keywords):
                count += 1
                if a["sentiment"] == "bullish":
                    bullish_count += 1
        if count > 0:
            themes.append({
                "theme": theme,
                "count": count,
                "bullish_pct": round(bullish_count / count * 100),
            })
    themes.sort(key=lambda x: x["count"], reverse=True)
    return themes[:5]


def _get_social_sentiment() -> dict:
    # Simulated social media sentiment (would connect to Twitter/X API, YouTube, Instagram)
    platforms = {
        "Twitter/X": {
            "score": round(random.uniform(-60, 80), 1),
            "volume": random.randint(5000, 50000),
            "trending": random.choice(["#OilPrice", "#WTI", "#OPEC", "#CrudeOil", "#EnergyMarkets"]),
        },
        "YouTube": {
            "score": round(random.uniform(-40, 60), 1),
            "views_24h": random.randint(100000, 2000000),
            "top_topic": random.choice(["Oil Price Analysis", "OPEC Decision", "Energy Crisis", "WTI Forecast"]),
        },
        "Reddit": {
            "score": round(random.uniform(-50, 70), 1),
            "posts": random.randint(50, 500),
            "sentiment_shift": random.choice(["rising", "falling", "stable"]),
        },
        "Instagram": {
            "score": round(random.uniform(-30, 50), 1),
            "engagement": random.randint(10000, 200000),
        },
    }
    overall = sum(v["score"] for v in platforms.values()) / len(platforms)
    return {
        "platforms": platforms,
        "overall_score": round(overall, 1),
        "signal": _score_to_signal(overall),
    }


def _score_to_signal(score: float) -> str:
    if score >= 40:
        return "STRONG BUY"
    elif score >= 15:
        return "BUY"
    elif score >= -15:
        return "NEUTRAL"
    elif score >= -40:
        return "SELL"
    else:
        return "STRONG SELL"
