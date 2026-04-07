"""
Cardiovascular risk calculators.
- ASCVD (10-year atherosclerotic cardiovascular disease risk)
- CHA₂DS₂-VASc (stroke risk in atrial fibrillation)
- HEART Score (acute coronary syndrome risk)
"""

import math


def calculate_ascvd(
    age: int,
    sex: str,  # "male" or "female"
    race: str,  # "white" or "african_american" or "other"
    total_cholesterol: float,  # mg/dL
    hdl_cholesterol: float,  # mg/dL
    systolic_bp: float,  # mmHg
    on_bp_treatment: bool,
    diabetes: bool,
    smoker: bool,
) -> dict:
    """
    Calculate 10-year ASCVD risk using the Pooled Cohort Equations.
    Valid for ages 40-79.
    Returns risk percentage and category.
    """
    if age < 40 or age > 79:
        return {"risk_percent": None, "category": "Age out of range (40-79)", "valid": False}

    ln_age = math.log(age)
    ln_tc = math.log(total_cholesterol)
    ln_hdl = math.log(hdl_cholesterol)
    ln_sbp = math.log(systolic_bp)

    if sex == "male":
        if race == "african_american":
            terms = (
                2.469 * ln_age
                + 0.302 * ln_tc
                - 0.307 * ln_hdl
                + (1.916 * ln_sbp if on_bp_treatment else 1.809 * ln_sbp)
                + (0.549 * 1 if smoker else 0)
                + (0.645 * 1 if diabetes else 0)
            )
            baseline_survival = 0.8954
            mean_coeff = 19.54
        else:
            terms = (
                12.344 * ln_age
                + 11.853 * ln_tc
                - 2.664 * ln_age * ln_tc
                - 7.990 * ln_hdl
                + 1.769 * ln_age * ln_hdl
                + (1.797 * ln_sbp if on_bp_treatment else 1.764 * ln_sbp)
                + (7.837 * 1 if smoker else 0)
                - (1.795 * ln_age * 1 if smoker else 0)
                + (0.658 * 1 if diabetes else 0)
            )
            baseline_survival = 0.9144
            mean_coeff = 61.18
    else:
        if race == "african_american":
            terms = (
                17.114 * ln_age
                + 0.940 * ln_tc
                - 18.920 * ln_hdl
                + 4.475 * ln_age * ln_hdl
                + (29.291 * ln_sbp if on_bp_treatment else 27.820 * ln_sbp)
                + (-6.432 * ln_age * ln_sbp if on_bp_treatment else -6.087 * ln_age * ln_sbp)
                + (0.874 * 1 if smoker else 0)
                + (0.886 * 1 if diabetes else 0)
            )
            baseline_survival = 0.9533
            mean_coeff = 86.61
        else:
            terms = (
                -29.799 * ln_age
                + 4.884 * ln_age * ln_age
                + 13.540 * ln_tc
                - 3.114 * ln_age * ln_tc
                - 13.578 * ln_hdl
                + 3.149 * ln_age * ln_hdl
                + (2.019 * ln_sbp if on_bp_treatment else 1.957 * ln_sbp)
                + (7.574 * 1 if smoker else 0)
                - (1.665 * ln_age * 1 if smoker else 0)
                + (0.661 * 1 if diabetes else 0)
            )
            baseline_survival = 0.9665
            mean_coeff = -29.18

    risk = 1 - baseline_survival ** math.exp(terms - mean_coeff)
    risk_percent = round(risk * 100, 1)

    if risk_percent < 5:
        category = "Low"
    elif risk_percent < 7.5:
        category = "Borderline"
    elif risk_percent < 20:
        category = "Intermediate"
    else:
        category = "High"

    return {"risk_percent": risk_percent, "category": category, "valid": True}


def calculate_cha2ds2_vasc(
    age: int,
    sex: str,
    congestive_heart_failure: bool,
    hypertension: bool,
    stroke_tia_history: bool,
    vascular_disease: bool,
    diabetes: bool,
) -> dict:
    """
    Calculate CHA₂DS₂-VASc score for stroke risk in atrial fibrillation.
    Score 0-9.
    """
    score = 0

    # C - Congestive heart failure (+1)
    if congestive_heart_failure:
        score += 1

    # H - Hypertension (+1)
    if hypertension:
        score += 1

    # A₂ - Age ≥75 (+2) or Age 65-74 (+1)
    if age >= 75:
        score += 2
    elif age >= 65:
        score += 1

    # D - Diabetes (+1)
    if diabetes:
        score += 1

    # S₂ - Stroke/TIA/thromboembolism (+2)
    if stroke_tia_history:
        score += 2

    # V - Vascular disease (+1)
    if vascular_disease:
        score += 1

    # Sc - Sex category: female (+1)
    if sex == "female":
        score += 1

    # Annual stroke risk estimates
    stroke_risk_map = {
        0: 0.2, 1: 0.6, 2: 2.2, 3: 3.2, 4: 4.8,
        5: 7.2, 6: 9.7, 7: 11.2, 8: 10.8, 9: 12.2,
    }
    annual_stroke_risk = stroke_risk_map.get(score, 12.2)

    if score == 0:
        recommendation = "No anticoagulation recommended"
    elif score == 1:
        recommendation = "Consider anticoagulation (oral anticoagulant preferred over aspirin)"
    else:
        recommendation = "Anticoagulation recommended (oral anticoagulant)"

    return {
        "score": score,
        "max_score": 9,
        "annual_stroke_risk_percent": annual_stroke_risk,
        "recommendation": recommendation,
    }


def calculate_heart_score(
    history: int,  # 0=slightly suspicious, 1=moderately suspicious, 2=highly suspicious
    ecg: int,  # 0=normal, 1=non-specific repolarization, 2=significant ST deviation
    age: int,  # 0=<45, 1=45-64, 2=≥65
    risk_factors: int,  # 0=no known, 1=1-2 risk factors, 2=≥3 or history of atherosclerotic disease
    troponin: int,  # 0=≤normal, 1=1-3x normal, 2=>3x normal
) -> dict:
    """
    Calculate HEART Score for Major Adverse Cardiac Events (MACE).
    Each component scored 0-2, total 0-10.
    """
    score = history + ecg + age + risk_factors + troponin

    if score <= 3:
        risk_category = "Low"
        mace_risk = "1.7%"
        recommendation = "Consider early discharge with outpatient follow-up"
    elif score <= 6:
        risk_category = "Moderate"
        mace_risk = "16.6%"
        recommendation = "Admit for observation and further workup"
    else:
        risk_category = "High"
        mace_risk = "50.1%"
        recommendation = "Urgent intervention — cardiology consultation"

    return {
        "score": score,
        "max_score": 10,
        "risk_category": risk_category,
        "mace_risk_6_weeks": mace_risk,
        "recommendation": recommendation,
        "components": {
            "history": history,
            "ecg": ecg,
            "age": age,
            "risk_factors": risk_factors,
            "troponin": troponin,
        },
    }
