"use client"

import { useState, useRef } from "react"
import { Send, Bot, User, Upload, FileImage, ClipboardList, X, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type MessageRole = "assistant" | "user"
type InputMode = "choice" | "mri" | "clinical" | "result" | null

interface Message {
  role: MessageRole
  content: string
  inputMode?: InputMode
  predictionResult?: {
    classification: string
    confidence: number
    riskLevel: "low" | "moderate" | "high"
    explanationUrl?: string
    showExplanation?: boolean
  }
}

interface MedicalInsightData {
  prediction_result: {
    label: string
    confidence: string
  }
  visual_explanation: string
  clinical_interpretation: string
  key_factors: string[]
  recommendations: string[]
  disclaimer: string
}

const isJson = (str: string) => {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

function MedicalInsight({ data }: { data: MedicalInsightData }) {
  return (
    <div className="space-y-6 pt-2">
      {/* Prediction Result & Legend */}
      <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Focus: Atrophy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Focus: Healthy</span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Prediction Result</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
            {data.prediction_result.confidence} Confidence
          </span>
        </div>
        <h4 className="text-xl font-bold text-foreground">{data.prediction_result.label}</h4>
      </div>

      {/* Visual & Clinical Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <FileImage className="w-4 h-4 text-primary/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visual Explanation</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{data.visual_explanation}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-primary/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Medical Context</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{data.clinical_interpretation}</p>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* Factors & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">Key Influencing Factors</span>
          <ul className="space-y-2">
            {data.key_factors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">Recommended Actions</span>
          <div className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 text-sm text-foreground/90">
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="pt-4 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground italic leading-relaxed">
          <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
          {data.disclaimer}
        </p>
      </div>
    </div>
  )
}

const clinicalFields = [
  // Demographics
  { id: "Age", label: "Age", type: "number", placeholder: "65", category: "Demographics" },
  { id: "Gender", label: "Gender (0:M, 1:F)", type: "number", placeholder: "0", category: "Demographics" },
  { id: "EducationLevel", label: "Education (Years)", type: "number", placeholder: "16", category: "Demographics" },
  
  // Lifestyle
  { id: "BMI", label: "BMI", type: "number", placeholder: "24.5", category: "Lifestyle" },
  { id: "Smoking", label: "Smoking (0/1)", type: "number", placeholder: "0", category: "Lifestyle" },
  { id: "AlcoholConsumption", label: "Alcohol (L/week)", type: "number", placeholder: "2", category: "Lifestyle" },
  { id: "PhysicalActivity", label: "Phys. Act (hr/wk)", type: "number", placeholder: "3", category: "Lifestyle" },
  { id: "DietQuality", label: "Diet (1-10)", type: "number", placeholder: "7", category: "Lifestyle" },
  { id: "SleepQuality", label: "Sleep (1-10)", type: "number", placeholder: "6", category: "Lifestyle" },

  // Medical
  { id: "FamilyHistoryAlzheimers", label: "Family History (0/1)", type: "number", placeholder: "0", category: "Medical" },
  { id: "CardiovascularDisease", label: "Cardio Disease (0/1)", type: "number", placeholder: "0", category: "Medical" },
  { id: "Diabetes", label: "Diabetes (0/1)", type: "number", placeholder: "0", category: "Medical" },
  { id: "Depression", label: "Depression (0/1)", type: "number", placeholder: "0", category: "Medical" },
  { id: "HeadInjury", label: "Head Injury (0/1)", type: "number", placeholder: "0", category: "Medical" },
  { id: "Hypertension", label: "Hypertension (0/1)", type: "number", placeholder: "0", category: "Medical" },
  
  // Assessments
  { id: "MMSE", label: "MMSE Score", type: "number", placeholder: "24", category: "Clinical" },
  { id: "FunctionalAssessment", label: "Func. Assess (0-10)", type: "number", placeholder: "8", category: "Clinical" },
  { id: "ADL", label: "ADL Score (0-10)", type: "number", placeholder: "9", category: "Clinical" },
  { id: "MemoryComplaints", label: "Mem. Complaints (0/1)", type: "number", placeholder: "1", category: "Clinical" },
]

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || ""
}

export function AssistantSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI healthcare assistant. I can help analyze data for Alzheimer's disease detection. What type of data would you like to analyze?",
      inputMode: "choice",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [currentMode, setCurrentMode] = useState<InputMode>("choice")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [clinicalData, setClinicalData] = useState<Record<string, string>>({})
  const [shapData, setShapData] = useState<{name: string, value: number}[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDataTypeChoice = (type: "mri" | "clinical") => {
    const userMessage: Message = {
      role: "user",
      content: type === "mri" ? "I'd like to upload an MRI image" : "I'd like to enter clinical data",
    }

    const assistantResponse: Message = {
      role: "assistant",
      content: type === "mri" 
        ? "Great! Please upload your MRI scan image below. We support DICOM, NIfTI, and standard image formats (JPG, PNG)."
        : "Perfect! Please fill in the clinical assessment data below. All fields help improve prediction accuracy.",
      inputMode: type,
    }

    setMessages(prev => [...prev, userMessage, assistantResponse])
    setCurrentMode(type)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleClinicalChange = (field: string, value: string) => {
    setClinicalData(prev => ({ ...prev, [field]: value }))
  }

  const simulateAnalysis = async () => {
    try {
      if (currentMode === "mri" && uploadedFile) {
        const userMessage: Message = {
          role: "user",
          content: `Uploaded: ${uploadedFile.name}`,
        }
        setMessages(prev => [...prev, userMessage])
        
        const processingMessage: Message = {
          role: "assistant",
          content: "I've received your MRI scan. I'm now running it through our Quantum-CNN model for analysis... please stay with me for a moment.",
        }
        setMessages(prev => [...prev, processingMessage])
        setIsAnalyzing(true)

        const formData = new FormData()
        formData.append("file", uploadedFile)

        const response = await fetch(`${getBackendUrl()}/api/predict/mri`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("MRI Prediction failed")
        const result = await response.json()

        // Get Dr. Neuro's interpretation
        const interpretResponse = await fetch(`${getBackendUrl()}/api/chat/interpret`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prediction_data: {
              type: "mri",
              prediction: result.prediction,
              confidence: result.confidence * 100
            }
          })
        })
        const interpretResult = await interpretResponse.json()

        const resultMessage: Message = {
          role: "assistant",
          content: interpretResult.response,
          inputMode: "result",
          predictionResult: {
            classification: result.prediction,
            confidence: result.confidence * 100,
            riskLevel: result.prediction.toLowerCase().includes("non") ? "low" : "high",
            explanationUrl: result.explanation_url,
            showExplanation: true,
          },
        }

        setMessages(prev => [...prev.filter(m => m.content !== processingMessage.content), resultMessage])
      } else if (currentMode === "clinical") {
        const payload: Record<string, any> = {
          // ... (payload contents same as before)
          Age: parseFloat(clinicalData.Age) || 65,
          Gender: parseInt(clinicalData.Gender) || 0,
          Ethnicity: 0,
          EducationLevel: parseInt(clinicalData.EducationLevel) || 12,
          BMI: parseFloat(clinicalData.BMI) || 25.0,
          Smoking: parseInt(clinicalData.Smoking) || 0,
          AlcoholConsumption: parseFloat(clinicalData.AlcoholConsumption) || 0,
          PhysicalActivity: parseFloat(clinicalData.PhysicalActivity) || 0,
          DietQuality: parseFloat(clinicalData.DietQuality) || 5,
          SleepQuality: parseFloat(clinicalData.SleepQuality) || 5,
          FamilyHistoryAlzheimers: parseInt(clinicalData.FamilyHistoryAlzheimers) || 0,
          CardiovascularDisease: parseInt(clinicalData.CardiovascularDisease) || 0,
          Diabetes: parseInt(clinicalData.Diabetes) || 0,
          Depression: parseInt(clinicalData.Depression) || 0,
          HeadInjury: parseInt(clinicalData.HeadInjury) || 0,
          Hypertension: parseInt(clinicalData.Hypertension) || 0,
          SystolicBP: 120,
          DiastolicBP: 80,
          CholesterolTotal: 200,
          CholesterolLDL: 100,
          CholesterolHDL: 50,
          CholesterolTriglycerides: 150,
          MMSE: parseFloat(clinicalData.MMSE) || 24,
          FunctionalAssessment: parseFloat(clinicalData.FunctionalAssessment) || 10,
          MemoryComplaints: parseInt(clinicalData.MemoryComplaints) || 0,
          BehavioralProblems: 0,
          ADL: parseFloat(clinicalData.ADL) || 10,
          Confusion: 0,
          Disorientation: 0,
          PersonalityChanges: 0,
          DifficultyCompletingTasks: 0,
          Forgetfulness: 0,
          DoctorInCharge: "Dr. AI Assistant"
        }

        const userMessage: Message = {
          role: "user",
          content: `Clinical Data Submitted: ${clinicalData.Age ? `Age ${clinicalData.Age}, ` : ""}${clinicalData.MMSE ? `MMSE ${clinicalData.MMSE}` : "Comprehensive check"}`,
        }
        setMessages(prev => [...prev, userMessage])

        const processingMessage: Message = {
          role: "assistant",
          content: "Thank you for the clinical details. I am now applying our hybrid quantum-classical classifier to assess these biomarkers...",
        }
        setMessages(prev => [...prev, processingMessage])
        setIsAnalyzing(true)

        const response = await fetch(`${getBackendUrl()}/api/predict/tabular`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error("Tabular Prediction failed")
        const result = await response.json()

        if (result.shap_values) {
          setShapData(result.shap_values)
        }

        // Get Dr. Neuro's interpretation
        const interpretResponse = await fetch(`${getBackendUrl()}/api/chat/interpret`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prediction_data: {
              type: "tabular",
              prediction: result.prediction === 1 ? "Demented" : "Non-Demented",
              confidence: result.confidence * 100,
              shap_values: result.shap_values
            }
          })
        })
        const interpretResult = await interpretResponse.json()

        const resultMessage: Message = {
          role: "assistant",
          content: interpretResult.response,
          inputMode: "result",
          predictionResult: {
            classification: result.prediction === 1 ? "Demented" : "Non-Demented",
            confidence: result.confidence * 100, 
            riskLevel: result.prediction === 1 ? "high" : "low",
          },
        }

        setMessages(prev => [...prev.filter(m => m.content !== processingMessage.content), resultMessage])
      }
      
      setCurrentMode("result")
      setUploadedFile(null)
      setClinicalData({})
    } catch (error) {
      console.error(error)
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error during analysis. Please ensure the backend server is running and try again.",
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCancel = (confirm: boolean = false) => {
    if (confirm && Object.keys(clinicalData).length > 0) {
      if (!window.confirm("Are you sure you want to cancel? All entered clinical data will be lost.")) {
        return
      }
    }
    setCurrentMode("choice")
    setUploadedFile(null)
    setClinicalData({})
    
    // Add a system update message to the chat
    const cancelMessage: Message = {
      role: "assistant",
      content: "Analysis cancelled. What else can I help you with?",
      inputMode: "choice",
    }
    setMessages(prev => [...prev, cancelMessage])
  }

  const handleContinueConversation = () => {
    const continueMessage: Message = {
      role: "assistant",
      content: "Would you like to analyze another dataset or ask questions about your results?",
      inputMode: "choice",
    }
    setMessages(prev => [...prev, continueMessage])
    setCurrentMode("choice")
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      role: "user",
      content: inputValue,
    }

    const text = inputValue.toLowerCase()
    let detectedMode: InputMode = null
    if (text.includes("mri") || text.includes("image") || text.includes("scan")) {
      detectedMode = "mri"
    } else if (text.includes("clinical") || text.includes("tabular") || text.includes("data") || text.includes("form")) {
      detectedMode = "clinical"
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")

    try {
      const response = await fetch(`${getBackendUrl()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          // model: "llama-3.3-70b-versatile" // Optional, backend defaults to this
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Chat failed with status ${response.status}`);
      }
      
      const data = await response.json()
      
      const assistantResponse: Message = {
        role: "assistant",
        content: data.response,
        inputMode: detectedMode || undefined
      }

      if (detectedMode) {
        setCurrentMode(detectedMode)
      }

      setMessages(prev => [...prev, assistantResponse])
    } catch (error: any) {
      console.error("Chat Error:", error)
      const assistantResponse: Message = {
        role: "assistant",
        content: `I'm having trouble connecting to my AI brain (Groq). Error: ${error.message || "Unknown Error"}. Please ensure the backend is running and the API key is valid.`,
      }
      setMessages(prev => [...prev, assistantResponse])
    }
  }

  const renderInputPanel = (mode: InputMode) => {
    if (mode === "choice") {
      return (
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={() => handleDataTypeChoice("mri")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group flex-1"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FileImage className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">MRI Image</p>
              <p className="text-xs text-muted-foreground">Upload brain scan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => handleDataTypeChoice("clinical")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group flex-1"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Clinical Data</p>
              <p className="text-xs text-muted-foreground">Enter assessment data</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
          </button>
        </div>
      )
    }

    if (mode === "mri") {
      return (
        <div className="mt-4 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.dcm,.nii,.nii.gz"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {!uploadedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Click to upload MRI scan</p>
                  <p className="text-xs text-muted-foreground mt-1">DICOM, NIfTI, JPG, PNG (max 50MB)</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileImage className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={simulateAnalysis}
              disabled={!uploadedFile || isAnalyzing}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                "Analyze MRI Scan"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCancel(false)}
              disabled={isAnalyzing}
              className="sm:w-32 border-border hover:bg-secondary/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    if (mode === "clinical") {
      const categories = Array.from(new Set(clinicalFields.map(f => f.category)))
      
      return (
        <div className="mt-4 space-y-6">
          <div className="max-h-[350px] overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            {categories.map((cat) => (
              <div key={cat} className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 px-1 border-l-2 border-primary/30 ml-1">
                  {cat}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {clinicalFields.filter(f => f.category === cat).map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={field.id} className="text-[10px] font-medium text-muted-foreground">
                        {field.label}
                      </Label>
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={clinicalData[field.id] || ""}
                        onChange={(e) => handleClinicalChange(field.id, e.target.value)}
                        className="bg-card border-border focus:border-primary h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={simulateAnalysis}
              disabled={!clinicalData.Age || !clinicalData.MMSE || isAnalyzing}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Quantum Processing...
                </>
              ) : (
                "Run Multi-Marker Analysis"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCancel(true)}
              disabled={isAnalyzing}
              className="sm:w-32 h-10 border-border hover:bg-secondary/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  const renderPredictionResult = (result: Message["predictionResult"]) => {
    if (!result) return null

    const riskColors = {
      low: "text-green-600 bg-green-50 border-green-200",
      moderate: "text-amber-600 bg-amber-50 border-amber-200",
      high: "text-red-600 bg-red-50 border-red-200",
    }

    return (
      <div className="mt-4 space-y-4">
        {/* Result Card */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Classification</p>
              <p className="font-semibold text-foreground">{result.classification}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full border text-xs font-medium ${riskColors[result.riskLevel]}`}>
              {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)} Risk
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Confidence Score</p>
              <p className="text-sm font-semibold text-foreground">{result.confidence.toFixed(1)}%</p>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${result.confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* MRI Explanation Image (if available) */}
        {result.explanationUrl && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-secondary/30 px-4 py-2 border-b border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {result.showExplanation ? "AI Visual Explanation Overlay" : "Raw MRI Scan"}
                </span>
              </div>
              <button 
                onClick={() => {
                  const newMessages = [...messages]
                  const msgIndex = newMessages.findIndex(m => m.predictionResult === result)
                  if (msgIndex !== -1) {
                    newMessages[msgIndex].predictionResult!.showExplanation = !result.showExplanation
                    setMessages(newMessages)
                  }
                }}
                className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
              >
                {result.showExplanation ? "Hide Overlay" : "Show Overlay"}
              </button>
            </div>
            <div className="relative aspect-square sm:aspect-video bg-muted flex items-center justify-center overflow-hidden">
              <img 
                src={result.showExplanation ? `${getBackendUrl()}${result.explanationUrl}` : `${getBackendUrl()}${result.explanationUrl.replace("explanation_", "raw_").replace(".png", ".jpg")}`} 
                alt="Brain Scan Analysis"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback for raw image if not specifically managed
                  if (!result.showExplanation) {
                     // If raw image not found, we could show placeholder or just stay on heatmap
                     // For now, let's just use a CSS filter to simulate "hiding" the green/red
                     (e.target as HTMLImageElement).style.filter = "grayscale(1) contrast(1.2)"
                  }
                }}
              />
              
              {/* Overlay Legend */}
              <div className="absolute bottom-3 left-3 flex gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-tight">High Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-tight">Healthy Signal</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHAP Visualization (Show for clinical, hide for MRI if we have image) */}
        {(!result.explanationUrl && shapData.length > 0) && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">XAI / SHAP Feature Importance</p>
            </div>
            <div className="space-y-3">
              {shapData.map((feature, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{feature.name}</span>
                    <span className={feature.value < 0 ? "text-blue-600" : "text-red-500"}>
                      {feature.value > 0 ? "+" : ""}{feature.value.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary relative overflow-hidden">
                      {feature.value < 0 ? (
                        <div 
                          className="absolute right-1/2 h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(1, Math.abs(feature.value) * 5)}%` }} // Scaled for visibility
                        />
                      ) : (
                        <div 
                          className="absolute left-1/2 h-full bg-red-400 rounded-full"
                          style={{ width: `${Math.min(1, feature.value * 5)}%` }} // Scaled for visibility
                        />
                      )}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded bg-blue-500" />
                Protective Factor
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded bg-red-400" />
                Risk Factor
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinueConversation}
          variant="outline"
          className="w-full border-border hover:bg-secondary"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Continue Conversation
        </Button>
      </div>
    )
  }

  return (
    <section id="assistant" className="py-24 lg:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">AI Assistant</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Interactive Analysis Assistant
          </h2>
          <p className="text-lg text-muted-foreground">
            Upload data, receive predictions, and get explainable insights—all through 
            a conversational interface powered by AI.
          </p>
        </div>

        {/* Chat Container */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Dr. Neuro</h3>
                  <p className="text-xs text-muted-foreground">AI Medical Assistant • Alzheimer's Specialist</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-6 min-h-[400px] max-h-[600px] overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index}>
                  <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === "assistant" 
                        ? "bg-primary/10" 
                        : "bg-secondary"
                    }`}>
                      {msg.role === "assistant" ? (
                        <Bot className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "assistant"
                        ? "bg-secondary/50 text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      {msg.role === "assistant" && isJson(msg.content) ? (
                        <MedicalInsight data={JSON.parse(msg.content)} />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Render input panel or result for assistant messages */}
                  {msg.role === "assistant" && msg.inputMode && msg.inputMode !== "result" && index === messages.length - 1 && (
                    <div className="ml-11 mt-2">
                      {renderInputPanel(msg.inputMode)}
                    </div>
                  )}
                  
                  {msg.role === "assistant" && msg.inputMode === "result" && msg.predictionResult && (
                    <div className="ml-11 mt-2">
                      {renderPredictionResult(msg.predictionResult)}
                    </div>
                  )}
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary/50 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-border bg-secondary/20">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask about your results or Alzheimer's disease..."
                  className="bg-card border-border focus:border-primary"
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground mt-4 px-4">
            This AI assistant is for informational purposes only and should not replace 
            professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </section>
  )
}
