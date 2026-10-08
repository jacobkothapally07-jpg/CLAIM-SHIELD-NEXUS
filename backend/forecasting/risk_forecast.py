from typing import Dict, Any


def compute_risk_forecast(
    current_risk_score: float,
    ml_features: Dict[str, float],
    graph_score: float,
    temporal_score: float,
    signal_count: int,
) -> Dict[str, Any]:
    """
    Computes 30-day, 60-day, and 90-day synthetic risk forecast based on:
    - previous claim growth
    - previous anomaly count (signal_count)
    - high-value claim ratio
    - network risk (graph_score)
    - utilization changes
    """
    growth = ml_features.get("claim_growth", 1.0)
    high_val_ratio = ml_features.get("high_value_claim_ratio", 0.0)
    claims_per_day = ml_features.get("claims_per_day", 1.0)

    # Calculate base trajectory probabilities (0–99%)
    base_30 = (
        current_risk_score * 0.58
        + min(12.0, growth * 0.8)
        + min(10.0, high_val_ratio * 12.0)
        + min(8.0, signal_count * 1.2)
    )
    day_30 = int(round(max(8.0, min(92.0, base_30))))

    drift_60 = min(11, int(round(3 + (growth > 2.5) * 4 + (graph_score > 60) * 3)))
    day_60 = int(round(min(96.0, day_30 + drift_60)))

    drift_90 = min(10, int(round(3 + (temporal_score > 60) * 4 + (claims_per_day > 10) * 3)))
    day_90 = int(round(min(98.0, day_60 + drift_90)))

    return {
        "current_risk_score": round(current_risk_score, 1),
        "forecast_30_day": day_30,
        "forecast_60_day": day_60,
        "forecast_90_day": day_90,
        "trajectory": "Accelerating" if day_90 - day_30 >= 12 else "Elevated Stable",
        "key_drivers": [
            f"Historical claim growth ratio ({growth:.1f}x baseline)",
            f"High-value procedure concentration ({high_val_ratio * 100:.0f}%)",
            f"Network connectivity risk score ({graph_score:.0f}/100)",
            f"Active correlated FWA signals ({signal_count})",
        ],
        "label": "Synthetic risk forecast",
        "disclaimer": "Risk estimates based on synthetic historical behavior. Does not establish certainty or confirm fraud.",
    }
