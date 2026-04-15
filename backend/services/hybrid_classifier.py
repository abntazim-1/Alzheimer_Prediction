import os
import hashlib
import joblib
from typing import Optional, List, Tuple, Dict

import numpy as np
import pandas as pd

from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier

# XGBoost import
try:
    from xgboost import XGBClassifier
    _HAS_XGB = True
except Exception:
    XGBClassifier = None
    _HAS_XGB = False

# Qiskit imports
try:
    from qiskit.circuit.library import ZZFeatureMap, PauliFeatureMap, TwoLocal
    from qiskit.primitives import Sampler
    _HAS_QISKIT = True
except Exception:
    ZZFeatureMap = None
    PauliFeatureMap = None
    TwoLocal = None
    Sampler = None
    _HAS_QISKIT = False

# ---------------------------
# Utility functions
# ---------------------------
def features_hash(x: np.ndarray) -> str:
    """Stable hash for a 1D numpy array of floats."""
    b = np.asarray(x, dtype=np.float64).tobytes()
    return hashlib.sha1(b).hexdigest()


# ---------------------------
# Quantum Feature Extractor
# ---------------------------
class QuantumFeatureExtractor:
    """
    Quantum feature extractor using a Qiskit feature map and Sampler.
    - Supports batching of circuits to reduce overhead.
    - Caches results by feature-hash to avoid recomputation.
    - Scales features into [0, 2*pi] by default (angle encoding).
    """

    def __init__(
        self,
        num_qubits: int = 32,
        reps: int = 10,
        feature_map_type: str = "zz",  # 'zz' or 'pauli'
        batch_size: int = 32,
        classical_approx: bool = False
    ):
        self.num_qubits = int(num_qubits)
        self.reps = int(reps)
        self.batch_size = int(batch_size)
        self.cache: Dict[str, np.ndarray] = {}
        self.classical_approx = bool(classical_approx)

        # choose feature map
        if _HAS_QISKIT and not classical_approx:
            if feature_map_type == "pauli" and PauliFeatureMap is not None:
                self.feature_map = PauliFeatureMap(feature_dimension=self.num_qubits, reps=self.reps)
            else:
                self.feature_map = ZZFeatureMap(feature_dimension=self.num_qubits, reps=self.reps)
            self.sampler = Sampler()
        else:
            self.feature_map = None
            self.sampler = None

    def _angle_scale(self, x: np.ndarray) -> np.ndarray:
        x_clipped = np.clip(x, 0.0, 1.0)
        return x_clipped * (2.0 * np.pi)

    def encode(self, x: np.ndarray) -> np.ndarray:
        x = np.asarray(x, dtype=float)
        if x.size < self.num_qubits:
            x = np.pad(x, (0, self.num_qubits - x.size), 'constant', constant_values=0.0)
        elif x.size > self.num_qubits:
            x = x[:self.num_qubits]

        key = features_hash(x)
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        if self.classical_approx or (not _HAS_QISKIT):
            angles = self._angle_scale(x)
            res = np.concatenate([np.cos(angles), np.sin(angles)])[: self.num_qubits]
            self.cache[key] = res
            return res

        res = self.transform(np.atleast_2d(x))[0]
        self.cache[key] = res
        return res

    def transform(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=float)
        if X.ndim == 1:
            X = X.reshape(1, -1)

        Xp = []
        for i, row in enumerate(X):
            if row.size < self.num_qubits:
                r = np.pad(row, (0, self.num_qubits - row.size), 'constant', constant_values=0.0)
            else:
                r = row[: self.num_qubits]
            Xp.append(r)
        Xp = np.vstack(Xp)

        outputs: List[np.ndarray] = [None] * len(Xp)

        if self.classical_approx or (not _HAS_QISKIT):
            for i, row in enumerate(Xp):
                key = features_hash(row)
                cached = self.cache.get(key)
                if cached is not None:
                    outputs[i] = cached
                else:
                    angles = self._angle_scale(row)
                    res = np.concatenate([np.cos(angles), np.sin(angles)])[: self.num_qubits]
                    outputs[i] = res
                    self.cache[key] = res
            return np.vstack(outputs)

        # Qiskit path
        to_compute_idx = []
        circuits = []
        for i, row in enumerate(Xp):
            key = features_hash(row)
            cached = self.cache.get(key)
            if cached is not None:
                outputs[i] = cached
            else:
                to_compute_idx.append(i)
                angles = self._angle_scale(row)
                param_map = dict(zip(self.feature_map.parameters, angles))
                circ = self.feature_map.assign_parameters(param_map)
                circuits.append(circ)

        if len(circuits) == 0:
            return np.vstack(outputs)

        start = 0
        while start < len(circuits):
            end = min(start + self.batch_size, len(circuits))
            batch = circuits[start:end]
            job = self.sampler.run(batch)
            result = job.result()

            for offset, res_obj in enumerate(result.quasi_dists):
                global_idx = to_compute_idx[start + offset]
                dist = res_obj
                exp_vals = []
                for q in range(self.num_qubits):
                    exp = 0.0
                    for bitstring, p in dist.items():
                        if isinstance(bitstring, int):
                            bitstring = bin(bitstring)[2:].zfill(self.num_qubits)
                        if len(bitstring) < self.num_qubits:
                            bitstring = bitstring.zfill(self.num_qubits)
                        if bitstring[-(q + 1)] == '0':
                            exp += float(p)
                        else:
                            exp -= float(p)
                    exp_vals.append(float(exp))
                res_vec = np.array(exp_vals, dtype=float)
                outputs[global_idx] = res_vec
                row = Xp[global_idx]
                self.cache[features_hash(row)] = res_vec

            start = end

        return np.vstack(outputs)


# ---------------------------
# Hybrid classifier
# ---------------------------
class HybridQuantumClassifier(BaseEstimator, ClassifierMixin):
    def __init__(
        self,
        model_type: str = "xgboost",
        qfe_params: Optional[dict] = None,
        random_state: int = 42,
    ):
        self.model_type = model_type
        self.qfe_params = qfe_params or {}
        self.random_state = int(random_state)
        self.scaler: Optional[MinMaxScaler] = None
        self.cat_encoders: dict = {}
        self.qfe: Optional[QuantumFeatureExtractor] = None
        self.model = None

    def _preprocess_dataframe(self, df: pd.DataFrame, fit: bool = True) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        df = df.copy()
        if 'PatientID' in df.columns:
            df = df.drop(columns=['PatientID'])

        y = None
        if fit:
            y = df['Diagnosis'].values
            X = df.drop(columns=['Diagnosis'])
        else:
            if 'Diagnosis' in df.columns:
                X = df.drop(columns=['Diagnosis'])
            else:
                X = df

        if 'DoctorInCharge' in X.columns:
            le = self.cat_encoders.get('DoctorInCharge')
            if le is not None:
                # Handle unseen labels by mapping them to the first known label to avoid error
                def safe_transform(s):
                    try: return le.transform([str(s)])[0]
                    except: return 0
                X['DoctorInCharge'] = X['DoctorInCharge'].apply(safe_transform)

        X = X.apply(pd.to_numeric, errors='coerce').fillna(0.0)

        if fit:
            self.scaler = MinMaxScaler()
            X_scaled = self.scaler.fit_transform(X.values)
        else:
            X_scaled = self.scaler.transform(X.values)

        return X_scaled, y

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        X_scaled, _ = self._preprocess_dataframe(df, fit=False)
        X_q = self.qfe.transform(X_scaled)
        preds = self.model.predict(X_q)
        return preds

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        X_scaled, _ = self._preprocess_dataframe(df, fit=False)
        X_q = self.qfe.transform(X_scaled)
        if hasattr(self.model, "predict_proba"):
            return self.model.predict_proba(X_q)
        return None

    def load(self, path: str):
        self.model = joblib.load(os.path.join(path, "model.joblib"))
        self.scaler = joblib.load(os.path.join(path, "scaler.joblib"))
        self.cat_encoders = joblib.load(os.path.join(path, "cat_encoders.joblib"))
        qfe_meta = joblib.load(os.path.join(path, "qfe_meta.joblib"))
        cache = joblib.load(os.path.join(path, "qfe_cache.joblib"))
        qfe_params = dict(num_qubits=qfe_meta["num_qubits"], reps=qfe_meta["reps"],
                          batch_size=qfe_meta["batch_size"],
                          feature_map_type=qfe_meta.get("feature_map_type", "zz"),
                          classical_approx=qfe_meta.get("classical_approx", False))
        self.qfe = QuantumFeatureExtractor(**qfe_params)
        self.qfe.cache = cache
        return self
