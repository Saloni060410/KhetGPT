
import pytest

from src.data_pipeline.soil_data_loader import load_reference_tables
from src.evaluation.metrics import (
    baseline_report,
    cv_summary,
    evaluate_classifier,
    formula_conformity,
    per_slice,
)

TABLES = load_reference_tables()


def test_evaluate_classifier_perfect_predictions():
    y_true = ["a", "b", "a", "b"]
    y_pred = ["a", "b", "a", "b"]
    result = evaluate_classifier(y_true, y_pred, n_boot=50)
    assert result["accuracy"] == 1.0
    assert result["balanced_accuracy"] == 1.0
    assert result["macro_f1"] == 1.0
    assert result["mcc"] == 1.0
    assert result["confusion_matrix"] == [[2, 0], [0, 2]]
    assert result["per_class"]["a"] == {"precision": 1.0, "recall": 1.0, "f1": 1.0, "support": 2}
    # accuracy is 1.0 on every bootstrap resample (y_pred == y_true at every index, whatever
    # the resample draws) -- macro_f1's CI is not pinned to 1.0 too, because a resample can
    # drop one of the two classes entirely, and zero_division=0 then scores that class's f1
    # as 0 against the fixed two-class `labels` list, pulling the macro average down.
    assert result["bootstrap_ci_95"]["accuracy"] == [1.0, 1.0]
    assert result["bootstrap_ci_95"]["balanced_accuracy"] == [1.0, 1.0]
    lo, hi = result["bootstrap_ci_95"]["macro_f1"]
    assert 0.0 <= lo <= hi <= 1.0


def test_evaluate_classifier_known_confusion_matrix_and_accuracy():
    y_true = ["a", "a", "a", "b", "b", "b"]
    y_pred = ["a", "a", "b", "b", "b", "a"]
    result = evaluate_classifier(y_true, y_pred, classes=["a", "b"], n_boot=20)
    assert result["accuracy"] == pytest.approx(4 / 6)
    assert result["confusion_matrix"] == [[2, 1], [1, 2]]
    assert result["per_class"]["a"]["support"] == 3
    assert result["per_class"]["b"]["support"] == 3


def test_evaluate_classifier_result_is_json_serialisable():
    import json

    result = evaluate_classifier(["a", "b", "a"], ["a", "b", "b"], n_boot=10)
    json.dumps(result)  # raises if any numpy scalar/array leaked through


def test_evaluate_classifier_calibration_binary_perfect_confidence():
    y_true = [0, 0, 1, 1]
    y_pred = [0, 0, 1, 1]
    y_proba = [0.0, 0.0, 1.0, 1.0]  # fully confident and fully correct
    result = evaluate_classifier(y_true, y_pred, y_proba=y_proba, classes=[0, 1], n_boot=10)
    assert result["calibration"]["brier_score"] == pytest.approx(0.0)
    assert result["calibration"]["ece"] == pytest.approx(0.0)


def test_evaluate_classifier_calibration_binary_worst_case():
    y_true = [0, 0, 1, 1]
    y_pred = [0, 0, 1, 1]
    y_proba = [1.0, 1.0, 0.0, 0.0]  # confidently wrong about its own calibration target
    result = evaluate_classifier(y_true, y_pred, y_proba=y_proba, classes=[0, 1], n_boot=10)
    assert result["calibration"]["brier_score"] == pytest.approx(1.0)


def test_evaluate_classifier_rejects_mismatched_lengths():
    with pytest.raises(ValueError):
        evaluate_classifier(["a", "b"], ["a"])


def test_cv_summary_mean_and_std():
    fold_scores = [
        {"accuracy": 0.8, "macro_f1": 0.7},
        {"accuracy": 1.0, "macro_f1": 0.9},
    ]
    summary = cv_summary(fold_scores)
    assert summary["accuracy"]["mean"] == pytest.approx(0.9)
    assert summary["accuracy"]["std"] == pytest.approx(0.1)
    assert summary["macro_f1"]["mean"] == pytest.approx(0.8)


def test_cv_summary_rejects_mismatched_keys():
    with pytest.raises(ValueError):
        cv_summary([{"accuracy": 1.0}, {"accuracy": 1.0, "macro_f1": 0.5}])


def test_cv_summary_rejects_empty_input():
    with pytest.raises(ValueError):
        cv_summary([])


def test_baseline_report_majority_class_matches_hand_computation():
    y_train = ["a", "a", "a", "b"]
    y_test = ["a", "a", "b", "b"]
    report = baseline_report(y_train, y_test)
    # majority class is "a" -- predicting "a" for every test row gets 2/4 right.
    assert report["majority_class"]["accuracy"] == pytest.approx(0.5)
    assert set(report.keys()) == {"majority_class", "stratified_random"}
    assert "accuracy" in report["stratified_random"]


def test_per_slice_breaks_out_metrics_by_group():
    y_true = ["a", "a", "b", "b"]
    y_pred = ["a", "b", "b", "b"]
    slice_col = ["wheat", "wheat", "rice", "rice"]
    result = per_slice(y_true, y_pred, slice_col)
    assert set(result.keys()) == {"wheat", "rice"}
    assert result["wheat"]["accuracy"] == pytest.approx(0.5)
    assert result["wheat"]["n"] == 2
    assert result["rice"]["accuracy"] == pytest.approx(1.0)


def test_per_slice_rejects_mismatched_lengths():
    with pytest.raises(ValueError):
        per_slice(["a"], ["a", "b"], ["x", "y"])


def _wheat_rec(**overrides):
    entry = {
        "method": "reference_dose",
        "soil_rating": "low",
        "prior_credit_kg_ha": 0.0,
        "fertilizer_needed_kg_ha": 123.6 + 0.0,  # standard dose only, k has an adjustment below
    }
    entry.update(overrides)
    return entry


def test_formula_conformity_matches_hand_computed_reference_dose():
    # wheat/generic/irrigated/Punjab: n=123.6, p2o5=61.8, k2o=0 (reference_doses.csv).
    # k soil_rating "low" adds 29.7 (soil_adjustments.csv) -> expected k = 0 + 29.7 - 0 = 29.7.
    rec = {
        "crop_id": "wheat", "variety_id": "generic", "irrigation": "irrigated", "region": "Punjab",
        "nutrient_balance": {
            "n": {"method": "reference_dose", "soil_rating": None,
                  "prior_credit_kg_ha": 0.0, "fertilizer_needed_kg_ha": 123.6},
            "p": {"method": "reference_dose", "soil_rating": None,
                  "prior_credit_kg_ha": 0.0, "fertilizer_needed_kg_ha": 61.8},
            "k": {"method": "reference_dose", "soil_rating": "low",
                  "prior_credit_kg_ha": 0.0, "fertilizer_needed_kg_ha": 29.7},
        },
    }
    result = formula_conformity([rec], TABLES, tol=0.1)
    assert result["conformity_rate"] == 1.0
    assert result["n_checked"] == 3
    assert result["violators"] == []


def test_formula_conformity_flags_a_violator_outside_tolerance():
    rec = {
        "crop_id": "wheat", "variety_id": "generic", "irrigation": "irrigated", "region": "Punjab",
        "nutrient_balance": {
            "n": {"method": "reference_dose", "soil_rating": None,
                  "prior_credit_kg_ha": 0.0, "fertilizer_needed_kg_ha": 999.0},  # way off
        },
    }
    result = formula_conformity([rec], TABLES, tol=0.1)
    assert result["conformity_rate"] == 0.0
    assert len(result["violators"]) == 1
    violator = result["violators"][0]
    assert violator["nutrient"] == "n"
    assert violator["expected"] == pytest.approx(123.6)
    assert violator["reason"] == "outside tolerance"


def test_formula_conformity_subtracts_prior_credit():
    rec = {
        "crop_id": "wheat", "variety_id": "generic", "irrigation": "irrigated", "region": "Punjab",
        "nutrient_balance": {
            "n": {"method": "reference_dose", "soil_rating": None,
                  "prior_credit_kg_ha": 20.0, "fertilizer_needed_kg_ha": 103.6},
        },
    }
    result = formula_conformity([rec], TABLES, tol=0.1)
    assert result["conformity_rate"] == 1.0


def test_formula_conformity_reports_missing_table_row_as_a_violator_not_a_crash():
    rec = {
        "crop_id": "wheat", "variety_id": "nonexistent_variety", "irrigation": "irrigated", "region": "Punjab",
        "nutrient_balance": {
            "n": {"method": "reference_dose", "soil_rating": None,
                  "prior_credit_kg_ha": 0.0, "fertilizer_needed_kg_ha": 100.0},
        },
    }
    result = formula_conformity([rec], TABLES, tol=0.1)
    assert result["conformity_rate"] == 0.0
    assert "no reference_doses.csv row" in result["violators"][0]["reason"]


def test_formula_conformity_stcr_method_matches_hand_computation():
    # wheat/wh_542/Haryana/n: a=5.65, b=1.34 (stcr_equations.csv). target=50 q/ha, SN=100 kg/ha.
    # expected = max(0, 5.65*50 - 1.34*100 - 0) = max(0, 282.5 - 134.0) = 148.5
    rec = {
        "crop_id": "wheat", "variety_id": "wh_542", "irrigation": "irrigated", "region": "Haryana",
        "nutrient_balance": {
            "n": {"method": "stcr", "soil_test_value": 100.0, "target_yield_q_ha": 50.0,
                  "prior_credit_kg_ha": 0.0, "fertilizer_needed_kg_ha": 148.5},
        },
    }
    result = formula_conformity([rec], TABLES, tol=0.1)
    assert result["conformity_rate"] == 1.0


def test_formula_conformity_stcr_missing_soil_test_value_is_a_violator():
    rec = {
        "crop_id": "wheat", "variety_id": "wh_542", "irrigation": "irrigated", "region": "Haryana",
        "nutrient_balance": {
            "n": {"method": "stcr", "prior_credit_kg_ha": 0.0, "fertilizer_needed_kg_ha": 148.5},
        },
    }
    result = formula_conformity([rec], TABLES, tol=0.1)
    assert result["conformity_rate"] == 0.0
    assert "soil_test_value" in result["violators"][0]["reason"]


def test_formula_conformity_empty_recs_is_full_conformity_by_convention():
    result = formula_conformity([], TABLES, tol=0.1)
    assert result["conformity_rate"] == 1.0
    assert result["n_checked"] == 0
