from typing import Dict, Any, List
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from backend.ml.features import FEATURE_NAMES, extract_provider_features


def run_ml_anomaly_detection(dataset: Dict[str, Any], random_state: int = 42) -> Dict[str, Dict[str, Any]]:
    """
    Runs Scikit-learn IsolationForest on the 10 provider/claim features.
    Normalizes ML anomaly score to 0–100 and identifies strongest contributing features.
    """
    features_map = extract_provider_features(dataset)
    prov_ids = sorted(features_map.keys())

    X = np.array(
        [[features_map[pid][fname] for fname in FEATURE_NAMES] for pid in prov_ids],
        dtype=float,
    )

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    iso = IsolationForest(
        n_estimators=150,
        contamination=0.12,
        random_state=random_state,
    )
    iso.fit(X_scaled)

    # decision_function returns lower (more negative) values for anomalies
    raw_scores = -iso.decision_function(X_scaled)
    min_s = float(np.min(raw_scores))
    max_s = float(np.max(raw_scores))
    span = max(1e-6, max_s - min_s)

    results: Dict[str, Dict[str, Any]] = {}
    for idx, pid in enumerate(prov_ids):
        norm_score = ((float(raw_scores[idx]) - min_s) / span) * 100.0
        # Rank features by absolute z-score deviation to explain top drivers
        z_row = np.abs(X_scaled[idx])
        top_indices = np.argsort(z_row)[::-1][:3]
        top_feats = [FEATURE_NAMES[i] for i in top_indices]

        results[pid] = {
            "ml_anomaly_score": round(norm_score, 1),
            "top_features": top_feats,
            "feature_values": features_map[pid],
        }

    return results
