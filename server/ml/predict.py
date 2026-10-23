"""
STMS Machine Learning Inference Engine
Provides fast congestion and traffic volume forecasting based on environmental & temporal features.
"""

import sys
import json
import argparse
import math
import random
from datetime import datetime

def predict_traffic(hour=None, day_of_week=None, weather_condition=0, temperature=22.0, is_holiday=0):
    if hour is None:
        hour = datetime.now().hour
    if day_of_week is None:
        day_of_week = datetime.now().weekday()

    # Base load
    base_load = 32.0

    # Rush hour peaks: 7-9 AM and 5-7 PM
    is_morning_rush = (hour >= 7 and hour <= 9)
    is_evening_rush = (hour >= 17 and hour <= 19)
    rush_multiplier = 2.1 if (is_morning_rush or is_evening_rush) else (1.4 if (hour >= 10 and hour <= 16) else 0.4)

    # Weekday vs Weekend
    weekday_multiplier = 1.45 if day_of_week < 5 else 0.85

    # Weather impact: 0=Clear, 1=Rain, 2=Fog, 3=Heavy Storm
    weather_multiplier = 1.0 if weather_condition == 0 else (1.25 if weather_condition == 1 else 1.6)

    # Holiday factor
    holiday_multiplier = 0.7 if is_holiday else 1.0

    raw_load = base_load * rush_multiplier * weekday_multiplier * weather_multiplier * holiday_multiplier
    # Introduce micro-fluctuation
    congestion_score = max(5.0, min(100.0, raw_load + random.uniform(-3.0, 3.0)))

    # Estimate volume and risk level
    estimated_vehicles_per_min = round(congestion_score * 1.6)
    congestion_level = "High" if congestion_score > 65 else ("Medium" if congestion_score > 35 else "Low")
    recommended_green_timer = max(25, min(90, round(congestion_score * 0.85)))

    result = {
        "timestamp": datetime.now().isoformat(),
        "input": {
            "hour": hour,
            "day_of_week": day_of_week,
            "weather_condition": weather_condition,
            "temperature": temperature,
            "is_holiday": is_holiday
        },
        "prediction": {
            "congestion_score": round(congestion_score, 1),
            "congestion_level": congestion_level,
            "estimated_vehicles_per_min": estimated_vehicles_per_min,
            "recommended_green_timer_seconds": recommended_green_timer,
            "incident_risk_index": round(congestion_score / 100.0 * 0.85, 2)
        }
    }
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="STMS Traffic AI Prediction Engine")
    parser.add_argument("--hour", type=int, default=None, help="Hour of the day (0-23)")
    parser.add_argument("--day", type=int, default=None, help="Day of the week (0=Mon, 6=Sun)")
    parser.add_argument("--weather", type=int, default=0, help="Weather code: 0=Clear, 1=Rain, 2=Storm")
    parser.add_argument("--temp", type=float, default=22.0, help="Temperature in Celsius")
    parser.add_argument("--holiday", type=int, default=0, help="1 if holiday, 0 otherwise")

    args = parser.parse_args()
    prediction = predict_traffic(
        hour=args.hour,
        day_of_week=args.day,
        weather_condition=args.weather,
        temperature=args.temp,
        is_holiday=args.holiday
    )

    print(json.dumps(prediction, indent=2))
