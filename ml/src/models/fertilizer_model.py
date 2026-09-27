"""Builds the candidate pipelines for the fertilizer-product classifier (S3).

Every estimator is wrapped in an sklearn Pipeline and takes `random_state` from the config,
so nothing is fit outside a cross-validation fold and every run is reproducible. The features
themselves (from Richa's build_features(), contract C4) involve no data-dependent fitting --
the one-hot vocabularies come from the reference tables, not from the training batch -- so
computing them once outside the fold loop is not a leakage risk.
"""

from sklearn.dummy import DummyClassifier
from sklearn.ensemble import (
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC
from xgboost import XGBClassifier


def build_pipeline(kind: str, seed: int, params: dict) -> Pipeline:
    # "balanced" isn't a constructor kwarg for any estimator here -- it's train.py's signal
    # to compute per-fold sample_weight at fit time (a universal API every classifier's
    # .fit() supports, unlike the inconsistent class_weight constructor param).
    params = {k: v for k, v in params.items() if k not in ("kind", "balanced")}

    if kind == "dummy":
        return Pipeline([("clf", DummyClassifier(random_state=seed, **params))])

    if kind == "logistic_regression":
        # n/p/k are NaN for real training rows by design (feature_engineering.py: the real
        # dataset's N/P/K aren't confirmed kg/ha, only synthetic rows and live requests are).
        # XGBoost handles NaN natively; plain sklearn estimators don't, so this pipeline needs
        # an imputer first. Median is a defensible, non-invented default for a placeholder
        # value on a feature that's missing for a real reason, not a guess at the true value.
        return Pipeline(
            [
                ("impute", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(random_state=seed, penalty="l2", **params)),
            ]
        )

    if kind == "xgboost":
        tree_method = params.pop("tree_method", "exact")
        return Pipeline(
            [
                (
                    "clf",
                    XGBClassifier(
                        random_state=seed,
                        eval_metric="mlogloss",
                        tree_method=tree_method,
                        **params,
                    ),
                )
            ]
        )

    if kind == "random_forest":
        # Bagging, not boosting -- a genuinely different model family from XGBoost's/
        # HistGradientBoosting's sequential trees. Plain sklearn, so n/p/k's real-row NaN
        # (see feature_engineering.py) needs the same imputer as logistic_regression.
        return Pipeline(
            [
                ("impute", SimpleImputer(strategy="median")),
                ("clf", RandomForestClassifier(random_state=seed, **params)),
            ]
        )

    if kind == "hist_gradient_boosting":
        # sklearn's own gradient boosting -- handles NaN natively like XGBoost (no imputer
        # needed), and is the alternative sklearn's own NaN error message pointed at
        # (see fertilizer_model.py's git history / the ValueError plain LogisticRegression
        # raised on n/p/k). A direct, same-ecosystem comparison to XGBoost's boosting.
        return Pipeline([("clf", HistGradientBoostingClassifier(random_state=seed, **params))])

    if kind == "extra_trees":
        # Extremely randomized trees: same bagging family as random_forest, but split
        # thresholds are also randomized (not just which features/samples), often trading a
        # little per-tree accuracy for less variance -- a real, distinct hypothesis from
        # random_forest, not just a hyperparameter tweak of it.
        return Pipeline(
            [
                ("impute", SimpleImputer(strategy="median")),
                ("clf", ExtraTreesClassifier(random_state=seed, **params)),
            ]
        )

    if kind == "gradient_boosting":
        # sklearn's original (pre-histogram) gradient boosting: single-threaded by
        # construction, so it never hits the OpenMP thread-contention problem
        # hist_gradient_boosting/xgboost can in a constrained environment. A genuinely
        # different boosting implementation, not just different hyperparameters.
        return Pipeline(
            [
                ("impute", SimpleImputer(strategy="median")),
                ("clf", GradientBoostingClassifier(random_state=seed, **params)),
            ]
        )

    if kind == "knn":
        # Instance-based, not a fitted decision boundary at all -- a genuinely different
        # paradigm. No native class_weight or sample_weight support (KNeighborsClassifier.fit
        # rejects sample_weight), so imbalance isn't handled here the way it is elsewhere;
        # weights="distance" is its own, different mitigation (closer neighbors count more).
        return Pipeline(
            [
                ("impute", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("clf", KNeighborsClassifier(**params)),
            ]
        )

    if kind == "linear_svm":
        # A linear margin classifier, distinct from logistic_regression's probabilistic
        # framing -- LinearSVC.fit supports sample_weight natively.
        return Pipeline(
            [
                ("impute", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("clf", LinearSVC(random_state=seed, **params)),
            ]
        )

    if kind == "gaussian_nb":
        # A generative, probabilistic model with a strong independence assumption -- about as
        # different a hypothesis from tree ensembles and margin classifiers as this
        # comparison gets. GaussianNB.fit supports sample_weight natively.
        return Pipeline(
            [
                ("impute", SimpleImputer(strategy="median")),
                ("clf", GaussianNB(**params)),
            ]
        )

    raise ValueError(f"Unknown model kind: {kind!r}")
