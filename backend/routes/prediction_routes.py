from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.prediction_service import prediction_service

router = APIRouter(prefix="/api/predict", tags=["prediction"])

class TabularData(BaseModel):
    Age: float
    Gender: int
    Ethnicity: int
    EducationLevel: int
    BMI: float
    Smoking: int
    AlcoholConsumption: float
    PhysicalActivity: float
    DietQuality: float
    SleepQuality: float
    FamilyHistoryAlzheimers: int
    CardiovascularDisease: int
    Diabetes: int
    Depression: int
    HeadInjury: int
    Hypertension: int
    SystolicBP: float
    DiastolicBP: float
    CholesterolTotal: float
    CholesterolLDL: float
    CholesterolHDL: float
    CholesterolTriglycerides: float
    MMSE: float
    FunctionalAssessment: float
    MemoryComplaints: int
    BehavioralProblems: int
    ADL: float
    Confusion: int
    Disorientation: int
    PersonalityChanges: int
    DifficultyCompletingTasks: int
    Forgetfulness: int
    DoctorInCharge: str

@router.post("/mri")
async def predict_mri_endpoint(file: UploadFile = File(...)):
    """Prediction endpoint for MRI images."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    
    contents = await file.read()
    result = prediction_service.predict_mri(contents)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/tabular")
async def predict_tabular_endpoint(data: TabularData):
    """Prediction endpoint for clinical tabular data."""
    result = prediction_service.predict_tabular(data.dict())
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result
