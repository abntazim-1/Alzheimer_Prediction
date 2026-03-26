import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import joblib
from PIL import Image
from typing import Dict, Any, List
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import SparsePauliOp
from qiskit_machine_learning.connectors import TorchConnector
from qiskit_machine_learning.neural_networks import EstimatorQNN
from qiskit.primitives import StatevectorEstimator
import io

# =========================
# MRI QCNN Model Definition
# =========================

def create_multiclass_pqc(num_qubits=4):
    x = ParameterVector("x", num_qubits)
    theta = ParameterVector("θ", num_qubits)
    qc = QuantumCircuit(num_qubits)
    for i in range(num_qubits):
        qc.h(i)
        qc.ry(x[i], i)
    for i in range(num_qubits - 1):
        qc.cz(i, i + 1)
    for i in range(num_qubits):
        qc.ry(theta[i], i)
    observables = [SparsePauliOp('I' * i + 'Z' + 'I' * (num_qubits - i - 1)) for i in range(num_qubits)]
    return qc, list(x), list(theta), observables

class MultiClassCQCNN(nn.Module):
    def __init__(self, num_qubits=4):
        super(MultiClassCQCNN, self).__init__()
        self.num_qubits = num_qubits
        self.conv1 = nn.Conv2d(1, 2, kernel_size=5)
        self.pool1 = nn.MaxPool2d(2)
        self.conv2 = nn.Conv2d(2, 4, kernel_size=5)
        self.pool2 = nn.MaxPool2d(2)
        self.dropout = nn.Dropout(0.25)
        self.fc1 = nn.Linear(7056, num_qubits)
        
        qc, input_params, weight_params, observables = create_multiclass_pqc(num_qubits)
        # Using StatevectorEstimator for Qiskit V2 compatibility
        estimator = StatevectorEstimator()
        qnn = EstimatorQNN(
            circuit=qc,
            input_params=input_params,
            weight_params=weight_params,
            observables=observables,
            estimator=estimator,
            input_gradients=True,
        )
        self.q_layer = TorchConnector(qnn)
        self.fc_final = nn.Linear(num_qubits, 2)

    def forward(self, x):
        x = self.pool1(F.relu(self.conv1(x)))
        x = self.pool2(F.relu(self.conv2(x)))
        x = self.dropout(x)
        x = x.view(x.size(0), -1)
        x = self.fc1(x)
        x = torch.tanh(x)
        x = self.q_layer(x)
        x = self.fc_final(x)
        return x

# =========================
# Prediction Service
# =========================

class PredictionService:
    def __init__(self):
        self.mri_model = None
        self.tabular_pipeline = None
        self.mri_classes = ['Moderate Demented', 'Non Demented'] # From CheckingXAI.ipynb
        
        # Paths
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.mri_model_path = os.path.join(base_path, "models", "alz_qcnn_weights.pth")
        self.tabular_model_path = os.path.join(base_path, "models", "hybrid_quantum_classifier_pipeline.joblib")
        
        self.load_models()

    def load_models(self):
        """Loads both MRI and Tabular models into memory."""
        # Load MRI Model
        if os.path.exists(self.mri_model_path):
            try:
                self.mri_model = MultiClassCQCNN(num_qubits=4)
                self.mri_model.load_state_dict(torch.load(self.mri_model_path, map_location=torch.device('cpu')))
                self.mri_model.eval()
                print("MRI QCNN model loaded successfully.")
            except Exception as e:
                print(f"Error loading MRI model: {e}")
        else:
            print(f"MRI model weights not found at {self.mri_model_path}")

        # Load Tabular Model
        if os.path.exists(self.tabular_model_path):
            try:
                self.tabular_pipeline = joblib.load(self.tabular_model_path)
                print("Tabular hybrid model loaded successfully.")
            except Exception as e:
                print(f"Error loading Tabular model: {e}")
        else:
            print(f"Tabular model pipeline not found at {self.tabular_model_path}. Please check implementation plan.")

    def predict_mri(self, image_bytes: bytes) -> Dict[str, Any]:
        """Predicts Alzheimer's stage from MRI image."""
        if self.mri_model is None:
            return {"error": "MRI model not available."}
        
        try:
            # Preprocessing (Matched to CheckingXAI.ipynb)
            image = Image.open(io.BytesIO(image_bytes)).convert('L') # Grayscale
            image = image.resize((180, 180))
            img_array = np.array(image) / 255.0
            img_tensor = torch.FloatTensor(img_array).unsqueeze(0).unsqueeze(0) # (1, 1, 180, 180)
            img_tensor = (img_tensor - 0.5) / 0.5 # Normalization

            with torch.no_grad():
                logits = self.mri_model(img_tensor)
                probs = F.softmax(logits, dim=1)
                conf, pred_idx = torch.max(probs, dim=1)
                
            prediction = self.mri_classes[pred_idx.item()]
            confidence = conf.item()
            
            return {
                "prediction": prediction,
                "confidence": confidence,
                "probabilities": {self.mri_classes[i]: probs[0][i].item() for i in range(len(self.mri_classes))}
            }
        except Exception as e:
            return {"error": str(e)}

    def predict_tabular(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Predicts Alzheimer's from clinical tabular data."""
        if self.tabular_pipeline is None:
            return {"error": "Tabular model not available. Ensure hybrid_quantum_classifier_pipeline.joblib is present."}
        
        try:
            import pandas as pd
            df = pd.DataFrame([data])
            # The pipeline saved via joblib should include preprocessing (scaling/encoding) 
            # as seen in the HybridQuantumClassifier class.
            prediction = self.tabular_pipeline.predict(df)[0]
            # Assuming outcome 0 for Non-Demented, 1 for Demented or similar mapping
            return {
                "prediction": int(prediction),
                "status": "Success"
            }
        except Exception as e:
            return {"error": str(e)}

# Instantiate service singleton
prediction_service = PredictionService()
