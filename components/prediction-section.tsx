"use client"

import { useState, useRef } from "react"
import { Upload, FileImage, Activity, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PredictionSection() {
  // MRI State
  const [mriFile, setMriFile] = useState<File | null>(null)
  const [isAnalyzingMRI, setIsAnalyzingMRI] = useState(false)
  const [mriResult, setMriResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tabular State
  const [tabularData, setTabularData] = useState<any>({
    age: "",
    gender: "0",
    mmse: "",
    education: "2",
  })
  const [isPredictingTabular, setIsPredictingTabular] = useState(false)
  const [tabularResult, setTabularResult] = useState<any>(null)

  const handleMriUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setMriFile(file)
  }

  const handlePredictMRI = async () => {
    if (!mriFile) return
    setIsAnalyzingMRI(true)
    setMriResult(null)

    try {
      const formData = new FormData()
      formData.append("file", mriFile)

      const response = await fetch("/api/predict/mri", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("MRI Prediction failed")
      const data = await response.json()
      setMriResult(data)
    } catch (error) {
      console.error(error)
      setMriResult({ error: "Failed to connect to backend server." })
    } finally {
      setIsAnalyzingMRI(false)
    }
  }

  const handlePredictTabular = async () => {
    setIsPredictingTabular(true)
    setTabularResult(null)

    try {
      const payload = {
        Age: parseFloat(tabularData.age) || 65,
        Gender: parseInt(tabularData.gender) || 0,
        Ethnicity: 0,
        EducationLevel: parseInt(tabularData.education) || 2,
        BMI: 25.0,
        Smoking: 0,
        AlcoholConsumption: 0,
        PhysicalActivity: 0,
        DietQuality: 0,
        SleepQuality: 0,
        FamilyHistoryAlzheimers: 0,
        CardiovascularDisease: 0,
        Diabetes: 0,
        Depression: 0,
        HeadInjury: 0,
        Hypertension: 0,
        SystolicBP: 120,
        DiastolicBP: 80,
        CholesterolTotal: 200,
        CholesterolLDL: 100,
        CholesterolHDL: 50,
        CholesterolTriglycerides: 150,
        MMSE: parseFloat(tabularData.mmse) || 24,
        FunctionalAssessment: 10,
        MemoryComplaints: 0,
        BehavioralProblems: 0,
        ADL: 10,
        Confusion: 0,
        Disorientation: 0,
        PersonalityChanges: 0,
        DifficultyCompletingTasks: 0,
        Forgetfulness: 0,
        DoctorInCharge: "Dr. Neuro"
      }

      const response = await fetch("/api/predict/tabular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Tabular Prediction failed")
      const data = await response.json()
      setTabularResult(data)
    } catch (error) {
      console.error(error)
      setTabularResult({ error: "Failed to connect to backend server." })
    } finally {
      setIsPredictingTabular(false)
    }
  }

  return (
    <section id="prediction" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">Prediction Module</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Analyze Patient Data
          </h2>
          <p className="text-lg text-muted-foreground">
            Upload MRI scans or input clinical data for comprehensive AI-powered analysis 
            and early detection insights.
          </p>
        </div>

        {/* Prediction Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Analysis Card */}
          <div className="rounded-2xl bg-card border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileImage className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Image Analysis</h3>
            </div>

            {/* Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMriUpload}
              className="hidden"
              accept="image/*"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 mb-6 hover:border-primary/40 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-foreground font-medium mb-1">
                  {mriFile ? mriFile.name : "Drop MRI scan here or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports DICOM, NIfTI, PNG, JPG formats
                </p>
              </div>
            </div>

            <Button 
              onClick={handlePredictMRI}
              disabled={!mriFile || isAnalyzingMRI}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-8"
            >
              {isAnalyzingMRI ? "Analyzing..." : "Analyze Image"}
            </Button>

            {/* Results Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <span className="text-sm font-medium text-foreground">Prediction Result:</span>
                <span className={`text-sm font-bold ${mriResult?.prediction ? 'text-primary' : 'text-muted-foreground'}`}>
                  {mriResult?.prediction || (mriResult?.error ? "Error" : "Awaiting analysis...")}
                </span>
              </div>

              {/* XAI visualization or error message */}
              {mriResult?.error ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {mriResult.error}
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-secondary/30 border border-border flex items-center justify-center overflow-hidden">
                  {mriResult?.explanation_url ? (
                    <div className="relative w-full h-full group">
                      <img 
                        src={mriResult.explanation_url} 
                        alt="MRI Explanation" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm p-4 translate-y-full group-hover:translate-y-0 transition-transform border-t border-border">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-primary">MRI Stage Confidence:</span>
                          <span className="font-bold text-primary">{(mriResult.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Activity className="w-8 h-8 text-primary/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mriResult ? "MRI Stage Confidence" : "Explainable AI Visualization"}
                      </p>
                      {mriResult && (
                        <p className="text-2xl font-bold text-primary mt-2">
                          {(mriResult.confidence * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Clinical Data Card */}
          <div className="rounded-2xl bg-card border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Clinical Data</h3>
            </div>

            {/* Form */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-foreground">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={tabularData.age}
                  onChange={(e) => setTabularData({...tabularData, age: e.target.value})}
                  className="bg-secondary/50 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-foreground">Gender</Label>
                <Select 
                  value={tabularData.gender} 
                  onValueChange={(val) => setTabularData({...tabularData, gender: val})}
                >
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Male</SelectItem>
                    <SelectItem value="1">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memory" className="text-sm font-medium text-foreground">MMSE Score</Label>
                <Input
                  id="memory"
                  type="number"
                  placeholder="0-30"
                  value={tabularData.mmse}
                  onChange={(e) => setTabularData({...tabularData, mmse: e.target.value})}
                  className="bg-secondary/50 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education" className="text-sm font-medium text-foreground">Education years</Label>
                <Select 
                  value={tabularData.education} 
                  onValueChange={(val) => setTabularData({...tabularData, education: val})}
                >
                  <SelectTrigger className="bg-secondary/50 border-border">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">High School (12 yrs)</SelectItem>
                    <SelectItem value="16">Bachelor&apos;s (16 yrs)</SelectItem>
                    <SelectItem value="18">Master&apos;s (18 yrs)</SelectItem>
                    <SelectItem value="21">Doctorate (21 yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handlePredictTabular}
              disabled={isPredictingTabular || !tabularData.age || !tabularData.mmse}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-8"
            >
              {isPredictingTabular ? "Predicting..." : "Predict"}
            </Button>

            {/* Results Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <span className="text-sm font-medium text-foreground">Prediction Result:</span>
                <span className={`text-sm font-bold ${tabularResult?.prediction !== undefined ? 'text-primary' : 'text-muted-foreground'}`}>
                  {tabularResult?.prediction !== undefined 
                    ? (tabularResult.prediction === 1 ? "Positive (Demented)" : "Negative (Non-Demented)") 
                    : (tabularResult?.error ? "Error" : "Awaiting input...")}
                </span>
              </div>

              {tabularResult?.error ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {tabularResult.error}
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-secondary/30 border border-border flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <CheckCircle2 className={`w-8 h-8 ${tabularResult ? 'text-primary' : 'text-primary/50'}`} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tabularResult ? "Prediction Finalized" : "SHAP Feature Importance"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tabularResult ? "Clinical audit trail generated" : "Visualization will render after prediction"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
