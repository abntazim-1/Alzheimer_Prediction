import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import joblib
import pandas as pd
import shap
from PIL import Image
from typing import Dict, Any, List
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import SparsePauliOp
from qiskit_machine_learning.connectors import TorchConnector
from qiskit_machine_learning.neural_networks import EstimatorQNN
from qiskit.primitives import StatevectorEstimator
import io
import uuid
import matplotlib.pyplot as plt
from lime import lime_image
from skimage.segmentation import mark_boundaries, felzenszwalb
from skimage import filters

from .hybrid_classifier import HybridQuantumClassifier

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
        self.mri_classes = ['Moderate Demented', 'Non Demented']
        self.tabular_features = [
            'Age', 'Gender', 'Ethnicity', 'EducationLevel', 'BMI', 'Smoking', 
            'AlcoholConsumption', 'PhysicalActivity', 'DietQuality', 'SleepQuality', 
            'FamilyHistoryAlzheimers', 'CardiovascularDisease', 'Diabetes', 'Depression', 
            'HeadInjury', 'Hypertension', 'SystolicBP', 'DiastolicBP', 'CholesterolTotal', 
            'CholesterolLDL', 'CholesterolHDL', 'CholesterolTriglycerides', 'MMSE', 
            'FunctionalAssessment', 'MemoryComplaints', 'BehavioralProblems', 'ADL', 
            'Confusion', 'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks', 
            'Forgetfulness', 'DoctorInCharge'
        ]
        
        # Paths
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.mri_model_path = os.path.join(base_path, "models", "alz_qcnn_weights.pth")
        self.tabular_model_dir = os.path.join(base_path, "models")
        self.static_dir = os.path.join(base_path, "backend", "static", "explanations")
        if not os.path.exists(self.static_dir):
            os.makedirs(self.static_dir)

        self.explainer = lime_image.LimeImageExplainer()
        
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

        # Load Tabular Model
        if os.path.exists(os.path.join(self.tabular_model_dir, "model.joblib")):
            try:
                self.tabular_pipeline = HybridQuantumClassifier()
                self.tabular_pipeline.load(self.tabular_model_dir)
                print("Tabular hybrid model loaded successfully from models directory.")
            except Exception as e:
                print(f"Error loading Tabular model: {e}")
        else:
            print(f"Tabular model artifacts not found at {self.tabular_model_dir}")

    def _predict_for_lime(self, images):
        """Internal predict function for LIME."""
        batch = []
        for img in images:
            img_gray = np.mean(img, axis=-1)
            img_tensor = torch.FloatTensor((img_gray - 0.5) / 0.5).unsqueeze(0).unsqueeze(0)
            batch.append(img_tensor)
        batch_tensor = torch.cat(batch).to(next(self.mri_model.parameters()).device)
        
        with torch.no_grad():
            logits = self.mri_model(batch_tensor)
            probs = F.softmax(logits, dim=1)
        return probs.cpu().numpy()

    def generate_explanation(self, image_np: np.ndarray, predicted_class: int) -> str:
        """Generates LIME explanation visualization with class-dependent coloring."""
        img_array_3d = np.stack([image_np] * 3, axis=-1)
        
        # Determine color mapping based on class
        class_name = self.mri_classes[predicted_class]
        is_demented = "demented" in class_name.lower() and "non" not in class_name.lower()
        highlight_color = [1, 0, 0] if is_demented else [0, 1, 0] # Red for Demented, Green for Healthy
        boundary_color = (1, 0, 0) if is_demented else (0, 1, 0)
        
        # Segment brain regions
        threshold = filters.threshold_otsu(image_np)
        brain_mask = image_np > threshold
        segments = felzenszwalb(img_array_3d, scale=100, sigma=0.5, min_size=50)
        segments_masked = segments.copy()
        segments_masked[~brain_mask] = -1
        
        explanation = self.explainer.explain_instance(
            img_array_3d,
            self._predict_for_lime,
            top_labels=2,
            hide_color=0,
            num_samples=500,
            segmentation_fn=lambda x: segments_masked
        )
        
        temp, mask = explanation.get_image_and_mask(
            predicted_class,
            positive_only=True,
            num_features=5,
            hide_rest=False
        )
        
        fig, ax = plt.subplots(figsize=(6, 6))
        overlay = img_array_3d.copy()
        overlay[mask > 0] = highlight_color
        
        # Apply stronger blending for better visibility
        blended = img_array_3d * 0.45 + overlay * 0.55
        final_img = mark_boundaries(blended, mask, color=boundary_color, mode='thick')
        
        ax.imshow(final_img)
        ax.axis('off')
        
        filename = f"explanation_{uuid.uuid4().hex}.png"
        save_path = os.path.join(self.static_dir, filename)
        
        # Save high DPI for clarity
        plt.savefig(save_path, bbox_inches='tight', pad_inches=0, dpi=150)
        plt.close(fig)
        
        return f"/static/explanations/{filename}"

    def predict_mri(self, image_bytes: bytes) -> Dict[str, Any]:
        """Predicts Alzheimer's stage from MRI image."""
        if self.mri_model is None:
            return {"error": "MRI model not available."}
        
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert('L')
            image = image.resize((180, 180))
            img_array = np.array(image) / 255.0
            img_tensor = torch.FloatTensor(img_array).unsqueeze(0).unsqueeze(0)
            img_tensor = (img_tensor - 0.5) / 0.5

            with torch.no_grad():
                logits = self.mri_model(img_tensor)
                probs = F.softmax(logits, dim=1)
                conf, pred_idx = torch.max(probs, dim=1)
                
            prediction = self.mri_classes[pred_idx.item()]
            confidence = conf.item()
            explanation_url = self.generate_explanation(img_array, pred_idx.item())
            
            return {
                "prediction": prediction,
                "confidence": confidence,
                "probabilities": {self.mri_classes[i]: probs[0][i].item() for i in range(len(self.mri_classes))},
                "explanation_url": explanation_url
            }
        except Exception as e:
            return {"error": str(e)}

    def predict_tabular(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Predicts Alzheimer's from clinical tabular data with SHAP explainability."""
        if self.tabular_pipeline is None:
            return {"error": "Tabular model not available."}
        
        try:
            # Ensure all required features are present in the data dict
            # If missing, use default values (mean/mode behavior)
            input_data = {}
            for feat in self.tabular_features:
                input_data[feat] = data.get(feat, 0) # Default to 0/neutral

            df = pd.DataFrame([input_data])
            
            # 1. Prediction
            probs = self.tabular_pipeline.predict_proba(df)
            if probs is None: # Fallback for models without predict_proba
                pred_idx = int(self.tabular_pipeline.predict(df)[0])
                confidence = 0.95
            else:
                pred_idx = int(np.argmax(probs, axis=1)[0])
                confidence = float(np.max(probs))
            
            # 2. SHAP Explainability
            X_scaled, _ = self.tabular_pipeline._preprocess_dataframe(df, fit=False)
            X_q = self.tabular_pipeline.qfe.transform(X_scaled)
            
            explainer = shap.TreeExplainer(self.tabular_pipeline.model)
            shap_values = explainer.shap_values(X_q)
            
            # Extract SHAP values for the predicted/positive class
            if isinstance(shap_values, list):
                instance_shap = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
            elif len(shap_values.shape) == 3:
                instance_shap = shap_values[0][0][1] if shap_values.shape[2] > 1 else shap_values[0][0][0]
            else:
                instance_shap = shap_values[0]

            # Map quantum feature SHAP back to original features (heuristic based on angle encoding)
            shap_output = []
            for i in range(min(len(instance_shap), len(self.tabular_features))):
                shap_output.append({
                    "name": self.tabular_features[i],
                    "value": float(instance_shap[i])
                })
            
            # Sort by absolute impact
            shap_output = sorted(shap_output, key=lambda x: abs(x["value"]), reverse=True)[:10]

            return {
                "prediction": pred_idx,
                "confidence": confidence,
                "status": "Success",
                "shap_values": shap_output
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

# Instantiate service singleton
prediction_service = PredictionService()
