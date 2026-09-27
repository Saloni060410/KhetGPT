"""Builds the candidate pipelines for the fertilizer-product classifier (S3).

Every estimator is wrapped in an sklearn Pipeline and takes `random_state` from the config,
so nothing is fit outside a cross-validation fold and every run is reproducible. The features
themselves (from Richa's build_features(), contract C4) involve no data-dependent fitting --
the one-hot vocabularies come from the reference tables, not from the training batch -- so
computing them once outside the fold loop is not a leakage risk.
"""

from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier


def build_pipeline(kind: str, seed: int, params: dict) -> Pipeline:
    params = {k: v for k, v in params.items() if k != "kind"}

    if kind == "dummy":
        return Pipeline([("clf", DummyClassifier(random_state=seed, **params))])

    if kind == "logistic_regression":
        return Pipeline(
            [
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(random_state=seed, penalty="l2", **params)),
            ]
        )

    if kind == "xgboost":
        return Pipeline(
            [
                (
                    "clf",
                    XGBClassifier(
                        random_state=seed,
                        eval_metric="mlogloss",
                        tree_method="exact",
                        **params,
                    ),
                )
            ]
        )

    raise ValueError(f"Unknown model kind: {kind!r}")
