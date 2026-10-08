import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient

from backend.data.generator import load_or_generate_dataset, RANDOM_SEED
from backend.data.validate_dataset import validate_dataset
from backend.detection.duplicate import duplicate_detector
from backend.detection.upcoding import upcoding_detector
from backend.detection.unbundling import unbundling_detector
from backend.detection.phantom import phantom_service_detector
from backend.detection.utilization import utilization_detector
from backend.detection.timing import impossible_timing_detector
from backend.detection.abnormal_amount import abnormal_amount_detector
from backend.detection.referral import referral_detector
from backend.detection.network import network_detector
from backend.detection.temporal import temporal_detector
from backend.ml.anomaly import run_ml_anomaly_detection
from backend.graph.network import run_graph_analysis
from backend.services.risk_engine import ClaimShieldEngine
from backend.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def dataset():
    return load_or_generate_dataset()


@pytest.fixture(scope="module")
def engine(dataset):
    return ClaimShieldEngine(dataset)


def test_synthetic_dataset_and_validator(dataset):
    assert dataset["seed"] == RANDOM_SEED
    valid, report = validate_dataset(dataset, run_detectors=True)
    assert valid is True
    assert report["total_claims"] >= 10000
    assert report["total_providers"] == 500
    assert report["total_members"] == 1000
    assert report["total_facilities"] == 100
    assert report["total_referrals"] >= 1000
    assert report["planted_fwa_scenarios"] >= 50
    assert report["detected_planted_scenarios"] == report["planted_fwa_scenarios"]


def test_duplicate_detection(dataset):
    res = duplicate_detector(dataset)
    assert "PROV-0042" in res
    assert "PROV-0001" in res
    ev = res["PROV-0042"][0]
    assert ev["signal"] == "duplicate_billing"
    assert ev["score"] == 20
    assert ev["confidence"] >= 0.9


def test_upcoding_detection(dataset):
    res = upcoding_detector(dataset)
    assert "PROV-0007" in res
    assert res["PROV-0007"][0]["signal"] == "upcoding"


def test_unbundling_detection(dataset):
    res = unbundling_detector(dataset)
    assert "PROV-0013" in res
    assert "PROV-0042" in res
    assert res["PROV-0013"][0]["signal"] == "unbundling"


def test_phantom_service_detection(dataset):
    res = phantom_service_detector(dataset)
    assert "PROV-0019" in res
    assert res["PROV-0019"][0]["signal"] == "phantom_service"


def test_excessive_utilization_detection(dataset):
    res = utilization_detector(dataset)
    assert "PROV-0025" in res
    assert "PROV-0042" in res
    assert res["PROV-0042"][0]["signal"] == "excessive_utilization"


def test_impossible_timing_detection(dataset):
    res = impossible_timing_detector(dataset)
    assert "PROV-0030" in res
    assert "PROV-0042" in res
    assert res["PROV-0042"][0]["signal"] == "impossible_timing"
    assert res["PROV-0042"][0]["score"] == 25


def test_abnormal_billing_detection(dataset):
    res = abnormal_amount_detector(dataset)
    assert "PROV-0035" in res
    assert "PROV-0042" in res
    assert res["PROV-0042"][0]["signal"] == "abnormal_billing"


def test_referral_anomaly_detection(dataset):
    res = referral_detector(dataset)
    assert "PROV-0040" in res
    assert "PROV-0042" in res
    assert res["PROV-0042"][0]["signal"] == "referral_anomaly"


def test_network_anomaly_detection(dataset):
    res = network_detector(dataset)
    assert "PROV-0048" in res
    assert "PROV-0042" in res
    assert res["PROV-0042"][0]["signal"] == "network_anomaly"


def test_temporal_anomaly_detection(dataset):
    res = temporal_detector(dataset)
    assert "PROV-0053" in res
    assert "PROV-0042" in res
    assert res["PROV-0053"][0]["signal"] == "temporal_spike"


def test_ml_anomaly_scoring(dataset):
    ml_res = run_ml_anomaly_detection(dataset)
    assert "PROV-0042" in ml_res
    p42 = ml_res["PROV-0042"]
    assert 0 <= p42["ml_anomaly_score"] <= 100
    assert p42["ml_anomaly_score"] >= 75.0
    assert len(p42["top_features"]) >= 2


def test_graph_analysis(dataset):
    g_res = run_graph_analysis(dataset)
    assert "PROV-0042" in g_res["provider_graph_scores"]
    assert g_res["provider_graph_scores"]["PROV-0042"] >= 70.0


def test_risk_engine_and_case_1842(engine):
    assert "CASE-1842" in engine.cases_by_id
    c1842 = engine.cases_by_id["CASE-1842"]
    assert c1842["provider_id"] == "PROV-0042"
    assert 90.0 <= c1842["risk_score"] <= 98.0
    assert c1842["risk_level"] == "CRITICAL"
    required_signals = {
        "duplicate_billing",
        "excessive_utilization",
        "abnormal_billing",
        "impossible_timing",
        "referral_anomaly",
        "network_anomaly",
    }
    assert required_signals.issubset(set(c1842["primary_signals"]))


def test_forecast_generation(engine):
    fc = engine.get_case_forecast("CASE-1842")
    assert "forecast_30_day" in fc
    assert "forecast_60_day" in fc
    assert "forecast_90_day" in fc
    assert fc["label"] == "Synthetic risk forecast"


def test_api_endpoints():
    r_sum = client.get("/api/dashboard/summary")
    assert r_sum.status_code == 200
    sum_data = r_sum.json()
    assert sum_data["metrics"]["claims_analyzed"] == 10000
    assert sum_data["metrics"]["suspicious_alerts"] > 100

    r_claims = client.get("/api/claims?limit=25")
    assert r_claims.status_code == 200
    assert len(r_claims.json()["claims"]) == 25

    r_provs = client.get("/api/providers")
    assert r_provs.status_code == 200
    assert r_provs.json()["total"] == 500

    r_prov_det = client.get("/api/providers/PROV-0042")
    assert r_prov_det.status_code == 200
    assert r_prov_det.json()["provider"]["provider_id"] == "PROV-0042"

    r_cases = client.get("/api/cases")
    assert r_cases.status_code == 200
    assert r_cases.json()["total"] >= 50

    r_c1842 = client.get("/api/cases/CASE-1842")
    assert r_c1842.status_code == 200
    assert r_c1842.json()["case"]["case_id"] == "CASE-1842"

    r_ev = client.get("/api/cases/CASE-1842/evidence")
    assert r_ev.status_code == 200
    assert len(r_ev.json()["evidence"]) >= 6

    r_tl = client.get("/api/cases/CASE-1842/timeline")
    assert r_tl.status_code == 200
    assert len(r_tl.json()["timeline"]) > 0

    r_gr = client.get("/api/cases/CASE-1842/graph")
    assert r_gr.status_code == 200
    assert len(r_gr.json()["nodes"]) > 3

    r_fc = client.get("/api/cases/CASE-1842/forecast")
    assert r_fc.status_code == 200
    assert "forecast_30_day" in r_fc.json()

    r_rd = client.get("/api/risk-distribution")
    assert r_rd.status_code == 200

    r_tp = client.get("/api/top-providers")
    assert r_tp.status_code == 200

    r_net = client.get("/api/network")
    assert r_net.status_code == 200

    r_brief = client.post("/api/generate-investigation-brief", json={"case_id": "CASE-1842"})
    assert r_brief.status_code == 200
    brief_text = r_brief.json()["formatted_brief"]
    assert "CASE-1842" in brief_text
    assert "Fraud confirmed" not in brief_text

    r_note = client.post(
        "/api/cases/CASE-1842/notes",
        json={"investigator": "QA Tester", "note": "Verified synthetic timeline."},
    )
    assert r_note.status_code == 200

    r_stat = client.post(
        "/api/cases/CASE-1842/status",
        json={"status": "Under Review", "investigator": "QA Tester"},
    )
    assert r_stat.status_code == 200
    assert r_stat.json()["status"] == "Under Review"
    # Reset back to New for clean demo initial state
    client.post("/api/cases/CASE-1842/status", json={"status": "New", "investigator": "System"})
