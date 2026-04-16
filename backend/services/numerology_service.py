from datetime import datetime, timezone
import math

MASTER_NUMBERS = {11, 22, 33, 44}

NUMBER_MEANINGS = {
    1:  {"energy": "Leadership, new beginnings, initiative",       "oil": 0.8,  "color": "#FFD700"},
    2:  {"energy": "Balance, cooperation, duality",                "oil": -0.2, "color": "#C0C0C0"},
    3:  {"energy": "Creativity, expansion, communication",         "oil": 0.6,  "color": "#FF8C00"},
    4:  {"energy": "Stability, foundation, structure",             "oil": -0.4, "color": "#228B22"},
    5:  {"energy": "Change, freedom, volatility",                  "oil": 1.0,  "color": "#DC143C"},
    6:  {"energy": "Harmony, responsibility, nurturing",           "oil": 0.1,  "color": "#4169E1"},
    7:  {"energy": "Analysis, mystery, introspection",             "oil": -0.6, "color": "#800080"},
    8:  {"energy": "Power, abundance, material success",           "oil": 0.9,  "color": "#B8860B"},
    9:  {"energy": "Completion, humanitarianism, endings",         "oil": -0.5, "color": "#8B0000"},
    11: {"energy": "Intuition, illumination, spiritual insight",   "oil": 0.7,  "color": "#00CED1"},
    22: {"energy": "Master builder, large-scale manifestation",    "oil": 0.85, "color": "#FF4500"},
    33: {"energy": "Master teacher, compassion, healing",          "oil": 0.3,  "color": "#9400D3"},
    44: {"energy": "Master healer, disciplined power",             "oil": 0.75, "color": "#006400"},
}

PYTHAGOREAN_MAP = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8,
}

def reduce_number(n: int, preserve_master: bool = True) -> int:
    while n > 9 and n not in (MASTER_NUMBERS if preserve_master else set()):
        n = sum(int(d) for d in str(n))
    return n

def digit_sum(n: int) -> int:
    return sum(int(d) for d in str(abs(n)))

def compute_numerology(dt: datetime | None = None) -> dict:
    if dt is None:
        dt = datetime.now(timezone.utc)

    # Personal year/month/day numbers
    year_num = reduce_number(sum(int(d) for d in str(dt.year)))
    month_num = reduce_number(dt.month)
    day_num = reduce_number(dt.day)
    hour_num = reduce_number(dt.hour if dt.hour > 0 else 9)
    minute_num = reduce_number(dt.minute if dt.minute > 0 else 9)
    second_num = reduce_number(dt.second if dt.second > 0 else 9)

    # Universal day number
    universal_day = reduce_number(dt.year + dt.month + dt.day)

    # Moment number: all time components combined
    moment_raw = dt.year + dt.month + dt.day + dt.hour + dt.minute + dt.second
    moment_num = reduce_number(digit_sum(moment_raw))

    # Unix timestamp numerology
    unix_ts = int(dt.timestamp())
    unix_num = reduce_number(digit_sum(unix_ts))

    # Fibonacci resonance (is the moment num a fibonacci?)
    fib_sequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
    fib_resonant = moment_num in fib_sequence or unix_num in fib_sequence

    # Oil Numerology Score computation
    weights = {
        "year": 0.10,
        "month": 0.12,
        "day": 0.15,
        "hour": 0.20,
        "minute": 0.25,
        "second": 0.10,
        "moment": 0.08,
    }
    nums = {
        "year": year_num,
        "month": month_num,
        "day": day_num,
        "hour": hour_num,
        "minute": minute_num,
        "second": second_num,
        "moment": moment_num,
    }
    raw_score = 0.0
    for key, weight in weights.items():
        n = nums[key]
        meaning = NUMBER_MEANINGS.get(n, NUMBER_MEANINGS.get(n % 9 or 9))
        raw_score += meaning["oil"] * weight * 100

    if fib_resonant:
        raw_score += 8  # Fibonacci boost

    # Vibration cycle (9-year personal cycle from 2000)
    years_since_base = dt.year - 2000
    cycle_position = (years_since_base % 9) + 1
    cycle_score = NUMBER_MEANINGS.get(cycle_position, {}).get("oil", 0) * 15

    total_score = max(-100, min(100, raw_score + cycle_score))

    number_breakdown = []
    for key, n in nums.items():
        meaning = NUMBER_MEANINGS.get(n, NUMBER_MEANINGS.get(n % 9 or 9, {}))
        number_breakdown.append({
            "label": key.capitalize(),
            "number": n,
            "energy": meaning.get("energy", ""),
            "color": meaning.get("color", "#888"),
            "oil_bias": meaning.get("oil", 0),
        })

    # Special time patterns
    patterns = []
    if dt.minute == dt.second:
        patterns.append("Mirror time (MM:SS identical) — amplified energy")
    if dt.hour == dt.minute:
        patterns.append("Master mirror (HH:MM match) — powerful signal")
    if str(dt.hour).zfill(2) + str(dt.minute).zfill(2) in ["1111", "2222", "0000", "1234", "3333"]:
        patterns.append(f"Angel number {str(dt.hour).zfill(2)}{str(dt.minute).zfill(2)} — breakthrough moment")
    if moment_num in MASTER_NUMBERS:
        patterns.append(f"Master Number {moment_num} active — elevated market potential")

    return {
        "timestamp": dt.isoformat(),
        "numbers": number_breakdown,
        "universal_day": universal_day,
        "moment_number": moment_num,
        "unix_numerology": unix_num,
        "cycle_position": cycle_position,
        "fib_resonant": fib_resonant,
        "special_patterns": patterns,
        "raw_score": round(total_score, 2),
        "signal": _score_to_signal(total_score),
        "interpretation": _interpret_numerology(total_score, moment_num, patterns),
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

def _interpret_numerology(score: float, moment_num: int, patterns: list) -> str:
    meaning = NUMBER_MEANINGS.get(moment_num, {})
    energy = meaning.get("energy", "balanced energies")
    bias_word = "expansive" if score > 0 else "contractive"
    base = f"Moment vibration {moment_num} carries {energy.lower()} — {bias_word} numerological field"
    if patterns:
        base += f". {patterns[0]}"
    return base
