import ephem
import math
from datetime import datetime, timezone
from typing import Any

PLANETS = {
    "Sun": ephem.Sun,
    "Moon": ephem.Moon,
    "Mercury": ephem.Mercury,
    "Venus": ephem.Venus,
    "Mars": ephem.Mars,
    "Jupiter": ephem.Jupiter,
    "Saturn": ephem.Saturn,
    "Uranus": ephem.Uranus,
    "Neptune": ephem.Neptune,
}

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

ZODIAC_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]

HOUSE_NAMES = [
    "Self", "Wealth", "Communication", "Home", "Creativity", "Health",
    "Partnerships", "Transformation", "Philosophy", "Career", "Community", "Spirituality"
]

PLANET_OIL_INFLUENCE = {
    "Sun":     {"weight": 0.12, "bullish_signs": ["Aries", "Leo", "Sagittarius"]},
    "Moon":    {"weight": 0.18, "bullish_signs": ["Cancer", "Taurus", "Scorpio"]},
    "Mercury": {"weight": 0.08, "bullish_signs": ["Gemini", "Virgo"]},
    "Venus":   {"weight": 0.10, "bullish_signs": ["Taurus", "Libra", "Pisces"]},
    "Mars":    {"weight": 0.15, "bullish_signs": ["Aries", "Scorpio", "Capricorn"]},
    "Jupiter": {"weight": 0.14, "bullish_signs": ["Sagittarius", "Pisces", "Aries"]},
    "Saturn":  {"weight": 0.12, "bullish_signs": ["Capricorn", "Aquarius"]},
    "Uranus":  {"weight": 0.06, "bullish_signs": ["Aquarius", "Gemini"]},
    "Neptune": {"weight": 0.05, "bullish_signs": ["Pisces", "Scorpio"]},
}

ASPECT_INFLUENCES = {
    "Conjunction": {"orb": 8, "score": 15, "type": "major"},
    "Trine":       {"orb": 8, "score": 12, "type": "major"},
    "Sextile":     {"orb": 6, "score": 8,  "type": "minor"},
    "Square":      {"orb": 8, "score": -10, "type": "major"},
    "Opposition":  {"orb": 8, "score": -12, "type": "major"},
    "Quincunx":    {"orb": 3, "score": -5,  "type": "minor"},
}

RETROGRADE_PLANETS = {
    "Mercury": {"bearish_score": -8},
    "Venus":   {"bearish_score": -6},
    "Mars":    {"bearish_score": -5},
    "Jupiter": {"bearish_score": -7},
    "Saturn":  {"bearish_score": -6},
}

def rad_to_deg(rad: float) -> float:
    return math.degrees(rad) % 360

def get_zodiac(ecliptic_lon: float) -> tuple[str, str, int, float]:
    idx = int(ecliptic_lon / 30) % 12
    degree_in_sign = ecliptic_lon % 30
    return ZODIAC_SIGNS[idx], ZODIAC_SYMBOLS[idx], idx, degree_in_sign

def get_aspect(angle_diff: float) -> tuple[str, float] | None:
    diff = abs(angle_diff % 360)
    if diff > 180:
        diff = 360 - diff
    aspect_targets = {
        "Conjunction": 0,
        "Sextile": 60,
        "Square": 90,
        "Trine": 120,
        "Opposition": 180,
        "Quincunx": 150,
    }
    for aspect_name, target in aspect_targets.items():
        orb = ASPECT_INFLUENCES[aspect_name]["orb"]
        if abs(diff - target) <= orb:
            return aspect_name, abs(diff - target)
    return None

def check_retrograde(planet_name: str, planet_obj: Any, dt: datetime) -> bool:
    if planet_name in ("Sun", "Moon"):
        return False
    d1 = ephem.Date(dt)
    d2 = ephem.Date(dt.timestamp() / 86400.0 + ephem.Date("1899/12/31") + 1/1440)
    p1 = planet_obj.__class__()
    p1.compute(d1)
    p2 = planet_obj.__class__()
    p2.compute(d2)
    lon1 = math.degrees(p1.hlong) % 360
    lon2 = math.degrees(p2.hlong) % 360
    diff = (lon2 - lon1 + 360) % 360
    return diff > 180

def compute_planetary_analysis(dt: datetime | None = None) -> dict:
    if dt is None:
        dt = datetime.now(timezone.utc)

    ephem_date = ephem.Date(dt.strftime("%Y/%m/%d %H:%M:%S"))

    planet_data = []
    raw_positions = {}
    total_score = 0.0

    for planet_name, planet_class in PLANETS.items():
        obj = planet_class()
        obj.compute(ephem_date)

        ecliptic_lon = rad_to_deg(float(obj.hlong))
        sign, symbol, sign_idx, degree_in_sign = get_zodiac(ecliptic_lon)

        influence = PLANET_OIL_INFLUENCE.get(planet_name, {})
        bullish = sign in influence.get("bullish_signs", [])
        weight = influence.get("weight", 0.1)

        retrograde = False
        try:
            retrograde = check_retrograde(planet_name, obj, dt)
        except Exception:
            pass

        planet_score = weight * (1 if bullish else -0.5) * 100
        if retrograde and planet_name in RETROGRADE_PLANETS:
            planet_score += RETROGRADE_PLANETS[planet_name]["bearish_score"]

        total_score += planet_score

        moon_phase_info = None
        if planet_name == "Moon":
            moon_obj = ephem.Moon()
            moon_obj.compute(ephem_date)
            phase = moon_obj.phase
            if phase < 12.5:
                phase_name = "New Moon"
            elif phase < 37.5:
                phase_name = "Waxing Crescent"
            elif phase < 62.5:
                phase_name = "First Quarter"
            elif phase < 87.5:
                phase_name = "Waxing Gibbous"
            elif phase < 112.5:
                phase_name = "Full Moon"
            elif phase < 137.5:
                phase_name = "Waning Gibbous"
            elif phase < 162.5:
                phase_name = "Last Quarter"
            else:
                phase_name = "Waning Crescent"
            moon_phase_info = {"phase_pct": round(phase, 1), "phase_name": phase_name}

        planet_data.append({
            "name": planet_name,
            "symbol": _planet_symbol(planet_name),
            "sign": sign,
            "sign_symbol": symbol,
            "longitude": round(ecliptic_lon, 2),
            "degree_in_sign": round(degree_in_sign, 2),
            "retrograde": retrograde,
            "bullish": bullish,
            "score": round(planet_score, 2),
            "moon_phase": moon_phase_info,
        })
        raw_positions[planet_name] = ecliptic_lon

    # Compute major aspects
    aspects = []
    planet_names = list(raw_positions.keys())
    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            p1, p2 = planet_names[i], planet_names[j]
            diff = raw_positions[p1] - raw_positions[p2]
            aspect_result = get_aspect(diff)
            if aspect_result:
                aspect_name, orb_val = aspect_result
                aspect_score = ASPECT_INFLUENCES[aspect_name]["score"]
                total_score += aspect_score * 0.3
                aspects.append({
                    "planet1": p1,
                    "planet2": p2,
                    "aspect": aspect_name,
                    "orb": round(orb_val, 2),
                    "score": aspect_score,
                    "bullish": aspect_score > 0,
                })

    # Rising sign (simplified from local sidereal time)
    lst_hours = (dt.hour + dt.minute / 60 + dt.second / 3600) % 24
    asc_lon = (lst_hours * 15 + 180) % 360
    asc_sign, asc_symbol, asc_idx, _ = get_zodiac(asc_lon)

    # Normalize score to -100 to 100
    normalized = max(-100, min(100, total_score))

    return {
        "timestamp": dt.isoformat(),
        "planets": planet_data,
        "aspects": aspects[:10],
        "ascendant": {
            "sign": asc_sign,
            "symbol": asc_symbol,
            "longitude": round(asc_lon, 2),
        },
        "raw_score": round(normalized, 2),
        "signal": _score_to_signal(normalized),
        "interpretation": _interpret_astro(normalized, planet_data, aspects),
    }

def _planet_symbol(name: str) -> str:
    symbols = {
        "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀",
        "Mars": "♂", "Jupiter": "♃", "Saturn": "♄",
        "Uranus": "⛢", "Neptune": "♆",
    }
    return symbols.get(name, "★")

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

def _interpret_astro(score: float, planets: list, aspects: list) -> str:
    retrogrades = [p["name"] for p in planets if p["retrograde"]]
    bullish_aspects = [a for a in aspects if a["bullish"]]
    bearish_aspects = [a for a in aspects if not a["bullish"]]

    parts = []
    if retrogrades:
        parts.append(f"{', '.join(retrogrades)} retrograde — caution on momentum trades")
    if bullish_aspects:
        top = bullish_aspects[0]
        parts.append(f"{top['planet1']}–{top['planet2']} {top['aspect']} supports bullish energy")
    if bearish_aspects:
        top = bearish_aspects[0]
        parts.append(f"{top['planet1']}–{top['planet2']} {top['aspect']} creates resistance")

    moon = next((p for p in planets if p["name"] == "Moon"), None)
    if moon and moon.get("moon_phase"):
        parts.append(f"Moon in {moon['sign']} ({moon['moon_phase']['phase_name']})")

    return ". ".join(parts) if parts else "Planetary configuration neutral for oil markets"
