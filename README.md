# CLAIMSHIELD NEXUS

> **"From suspicious claims to evidence-backed investigations."**

**PS3 — Acentra Health Hackathon Master Build**  
An AI-assisted Fraud, Waste, and Abuse (FWA) investigation intelligence platform built for **Healthcare Insurers / Payers → Special Investigations Unit (SIU) → Investigators**.

> [!IMPORTANT]
> **SYNTHETIC DATA STATEMENT**  
> This prototype uses **entirely synthetic data** generated deterministically (`RANDOM_SEED = 42`) for demonstration and evaluation purposes. It does **not** use real patient, provider, member, facility, claims, or insurance data.

---

## 1. Project Overview & Problem Statement

Healthcare insurers process thousands of claims daily. Complex FWA patterns rarely surface inside a single isolated claim — they emerge across multiple claims, providers, members, facilities, referrals, procedures, geographic regions, and temporal sequences.

**ClaimShield Nexus** is **not** an automated "fraud declarer." Instead, it transforms raw synthetic claims into correlated, explainable, and prioritized SIU investigation cases:

```
10,000+ Raw Synthetic Claims
        ↓
10 Modular FWA Signal Detectors
        ↓
4 Complementary Engines (Rules 40% + Isolation Forest ML 30% + NetworkX Graph 20% + Temporal 10%)
        ↓
Explainable Composite Risk Score (0–100) & Potential Financial Exposure
        ↓
30 / 60 / 90-Day Synthetic Risk Forecast
        ↓
Prioritized SIU Investigation Queue (Featuring Flagship CASE-1842)
        ↓
AI Investigation Brief & Human-in-the-Loop SIU Review
```

---

## 2. Target User

- **Primary User**: Healthcare Insurance / Payer → **Special Investigations Unit (SIU) Investigator**.
- **Not Intended For**: Patients, doctors, hospitals, or ordinary insurance customers.

---

## 3. Architecture & Technology Stack

### Backend (`backend/`)
- **Framework**: Python 3.13 + FastAPI + Pydantic v2
- **Rule Detection Engine (`backend/detection/`)**: 10 modular explainable detectors (`duplicate.py`, `upcoding.py`, `unbundling.py`, `phantom.py`, `utilization.py`, `timing.py`, `abnormal_amount.py`, `referral.py`, `network.py`, `temporal.py`)
- **ML Anomaly Detection (`backend/ml/`)**: `scikit-learn` `IsolationForest` trained on 10 engineered provider/claim features with z-score feature attribution
- **Graph Intelligence (`backend/graph/`)**: `NetworkX` multi-entity graph analyzing degree centrality, PageRank, reciprocal referral loops, and multi-facility shared member clusters
- **Risk Forecasting (`backend/forecasting/`)**: 30/60/90-day synthetic risk trajectory calculator
- **Synthetic Data & Validation (`backend/data/`)**: Deterministic generator (`generator.py`) and integrity/detection coverage validator (`validate_dataset.py`)

### Frontend (`frontend/`)
- **Framework**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Visualizations**: Recharts (6 analytical charts) + Interactive SVG Entity Relationship Graph (`RelationshipGraph.tsx`) + Lucide Icons
- **Navigation**: Overview, Claims, SIU Queue, Network Intelligence, Providers, Analytics, Settings

---

## 4. Synthetic Data Methodology (`RANDOM_SEED = 42`)

Generated via `backend/data/generator.py`:
- **10,000 Synthetic Claims** (`CLM-000001` to `CLM-010000`)
- **500 Synthetic Providers** (`PROV-0001` to `PROV-0500`, e.g., `Provider Alpha-001`)
- **1,000 Synthetic Members** (`MEM-0001` to `MEM-1000`)
- **100 Synthetic Facilities** (`FAC-0001` to `FAC-0100` across `Region-A`, `Region-B`, `Region-C`, `Region-D`)
- **1,216 Synthetic Referrals** (`REF-000001`+)
- **16 Synthetic Procedures** (`PROC-001` to `PROC-016`)
- **55 Planted FWA Scenarios** (`SYN-FWA-0001` to `SYN-FWA-0055`) covering all 10 required FWA categories plus the flagship multi-signal demo case **`CASE-1842`** (`PROV-0042`).

Internal ground-truth labels (`ground_truth = true`) are used **strictly** by `backend/data/validate_dataset.py` and `pytest` to verify detection performance and are never exposed as "Fraud Confirmed" in the UI.

---

## 5. Multi-Engine Detection & Risk Scoring Methodology

### Four Complementary Engines
1. **Deterministic Rule Engine (40% Weight)**: Configurable weights across Duplicate Billing (+20), Impossible Timing (+25), Excessive Utilization (+15), Abnormal Billing (+15), Referral Anomaly (+10), Network Anomaly (+15), Upcoding (+15), Unbundling (+15), Phantom Service (+18), and Temporal Spike (+15).
2. **ML Anomaly Detection (30% Weight)**: `IsolationForest` (`n_estimators=150`, `random_state=42`) over 10 features: `claims_per_day`, `average_claim_amount`, `maximum_claim_amount`, `unique_members`, `unique_procedures`, `high_value_claim_ratio`, `duplicate_ratio`, `claim_growth`, `average_time_between_claims`, and `procedure_frequency`.
3. **Graph Analysis (20% Weight)**: `NetworkX` topology scoring repeated member ties, multi-facility dispersion, reciprocal referral rings, degree centrality, and PageRank.
4. **Temporal Analysis (10% Weight)**: Evaluates `<15 min` burst submissions, cross-region impossible travel sequences, peak daily volume, and month-over-month billing acceleration.

### Risk Categories
- `0–30`: **LOW**
- `31–60`: **MEDIUM**
- `61–80`: **HIGH**
- `81–100`: **CRITICAL**

---

## 6. API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Top KPI metrics, monthly trends, signal distribution, exposure by tier, and top SIU queue |
| `GET` | `/api/claims` | Searchable/filterable synthetic claims (`risk`, `date`, `provider`, `facility`, `signal`, `status`) |
| `GET` | `/api/providers` | Filterable list of 500 synthetic provider profiles |
| `GET` | `/api/providers/{provider_id}` | Detailed provider profile, historical trend, referrals, and linked SIU cases |
| `GET` | `/api/cases` | Prioritized SIU investigation cases (`status`, `risk_level`, `signal`, `search`) |
| `GET` | `/api/cases/{case_id}` | Full case overview, evidence list, investigator notes, and 30/60/90-day forecast |
| `GET` | `/api/cases/{case_id}/evidence` | Explainable signal contributions and confidence scores |
| `GET` | `/api/cases/{case_id}/timeline` | Chronological claims and referral events |
| `GET` | `/api/cases/{case_id}/graph` | Interactive relationship subgraph (Provider, Member, Facility, Claims, Referrals) |
| `GET` | `/api/cases/{case_id}/forecast` | 30/60/90-day synthetic risk forecast with trajectory and disclaimers |
| `GET` | `/api/risk-distribution` | Provider and case distribution across LOW / MEDIUM / HIGH / CRITICAL |
| `GET` | `/api/top-providers` | Highest-risk provider leaderboard |
| `GET` | `/api/network` | Global and filtered Network Intelligence graph & suspicious clusters |
| `POST` | `/api/cases/{case_id}/status` | Update human review status (`New`, `Under Review`, `Escalated`, `Dismissed`, `Resolved`) |
| `POST` | `/api/cases/{case_id}/notes` | Append an SIU investigator audit note |
| `POST` | `/api/generate-investigation-brief` | Generate structured, non-hallucinating AI investigation brief |

---

## 7. Setup, Execution & Testing Instructions

### 1. Generate & Validate Synthetic Dataset
```bash
backend/.venv/bin/python backend/data/generator.py
backend/.venv/bin/python backend/data/validate_dataset.py
```

### 2. Run Automated Tests
```bash
backend/.venv/bin/pytest backend/tests/test_claimshield.py -v
```

### 3. Start Backend API Server (Port 8000)
```bash
backend/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 4. Start Frontend Server (Port 3000)
```bash
cd frontend
npm run dev
```

---

## 8. 3-Minute Hackathon Demo Walkthrough (`CASE-1842`)

1. **Open Main Dashboard (`http://localhost:3000`)**: Show **10,000 Claims Analyzed**, **800+ Suspicious Alerts**, and how ClaimShield Nexus distills them into **55 prioritized SIU cases**.
2. **Open SIU Queue (`/queue`)**: Filter or click directly on flagship **`CASE-1842`** (`PROV-0042 • Provider Sigma-042`).
3. **Inspect `CASE-1842` (`/cases/CASE-1842`)**:
   - Observe **Risk Score = 94 / 100 (CRITICAL)** and **Potential Exposure**.
   - Review the **Correlated Evidence** tab showing Duplicate Billing (`+20`), Impossible Timing (`+25`, `Region-A` at `10:00` to `Region-D` at `10:08`), Excessive Utilization (`+15`), Abnormal Billing (`+15`), Unbundling (`+15`), Referral Anomaly (`+10`), and Network Anomaly (`+15`).
   - Switch to **Chronological Activity Timeline** and **Interactive Relationship Graph** (click nodes to inspect connections).
   - Review the **30 / 60 / 90-Day Synthetic Risk Forecast**.
   - Click **"Generate AI Investigation Brief"** to produce the structured investigator summary.
   - Click **"Mark Under Review"** and add an investigator note to demonstrate human-in-the-loop governance.

---

## 9. Limitations & Ethical Considerations

- **No Automated Fraud Accusation**: High risk scores indicate statistical or rule-based anomalies ("Potential FWA", "Investigation Recommended") that could also have benign clinical or clerical explanations.
- **Human-in-the-Loop Mandate**: Only qualified SIU investigators may escalate, resolve, or dismiss cases after reviewing clinical documentation.
- **100% Synthetic Isolation**: No real patient, member, or provider data is used anywhere in this repository.
