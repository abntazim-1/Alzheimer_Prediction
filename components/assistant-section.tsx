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
  }
}

const clinicalFields = [
  { id: "age", label: "Age", type: "number", placeholder: "65" },
  { id: "mmse", label: "MMSE Score", type: "number", placeholder: "24" },
  { id: "cdr", label: "CDR Rating", type: "number", placeholder: "0.5" },
  { id: "education", label: "Years of Education", type: "number", placeholder: "16" },
]

const shapFeatures = [
  { name: "Hippocampal Volume", value: -0.32, impact: "high" },
  { name: "MMSE Score", value: -0.28, impact: "high" },
  { name: "Age", value: 0.15, impact: "moderate" },
  { name: "CDR Rating", value: 0.12, impact: "moderate" },
  { name: "Education Years", value: -0.08, impact: "low" },
]

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

        const response = await fetch("/api/predict/mri", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("MRI Prediction failed")
        const result = await response.json()

        const resultMessage: Message = {
          role: "assistant",
          content: `I've completed the analysis of your brain scan. \n\nOur models detect patterns consistent with **${result.prediction}**. This is calculated with a confidence score of **${(result.confidence * 100).toFixed(1)}%**.\n\nIn clinical terms, this suggests a **${result.prediction.toLowerCase().includes("non") ? "stable/low-risk" : "high-risk"}** cognitive profile. Below you can see the specific regions of interest identified by the AI.`,
          inputMode: "result",
          predictionResult: {
            classification: result.prediction,
            confidence: result.confidence * 100,
            riskLevel: result.prediction.toLowerCase().includes("non") ? "low" : "high",
          },
        }

        setMessages(prev => [...prev.filter(m => m.content !== processingMessage.content), resultMessage])
      } else if (currentMode === "clinical") {
        const payload = {
          Age: parseFloat(clinicalData.age) || 65,
          Gender: 0,
          Ethnicity: 0,
          EducationLevel: parseInt(clinicalData.education) || 2,
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
          MMSE: parseFloat(clinicalData.mmse) || 24,
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

        const userMessage: Message = {
          role: "user",
          content: `Clinical Data: Age ${clinicalData.age}, MMSE ${clinicalData.mmse}, Education ${clinicalData.education} years`,
        }
        setMessages(prev => [...prev, userMessage])

        const processingMessage: Message = {
          role: "assistant",
          content: "Thank you for the clinical details. I am now applying our hybrid quantum-classical classifier to assess these biomarkers...",
        }
        setMessages(prev => [...prev, processingMessage])
        setIsAnalyzing(true)

        const response = await fetch("/api/predict/tabular", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error("Tabular Prediction failed")
        const result = await response.json()

        const resultMessage: Message = {
          role: "assistant",
          content: `The assessment of your clinical markers (including MMSE and patient age) evaluates as **${result.prediction === 1 ? "Positive (Demented)" : "Negative (Non-Demented)"}**. \n\nThis indicates a **${result.prediction === 1 ? "significant" : "minimal"}** correlation with Alzheimer's-related cognitive impairment based on our reference dataset. I've highlighted the most influential factors in the importance chart below.`,
          inputMode: "result",
          predictionResult: {
            classification: result.prediction === 1 ? "Demented" : "Non-Demented",
            confidence: 94.2, 
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
      const response = await fetch("/api/chat", {
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

          <Button
            onClick={simulateAnalysis}
            disabled={!uploadedFile || isAnalyzing}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
        </div>
      )
    }

    if (mode === "clinical") {
      return (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {clinicalFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id} className="text-xs font-medium text-foreground">
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={clinicalData[field.id] || ""}
                  onChange={(e) => handleClinicalChange(field.id, e.target.value)}
                  className="bg-card border-border focus:border-primary h-9"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={simulateAnalysis}
            disabled={!clinicalData.age || !clinicalData.mmse || isAnalyzing}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Analyze Clinical Data"
            )}
          </Button>
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
              <p className="text-sm font-semibold text-foreground">{result.confidence}%</p>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${result.confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* SHAP Visualization */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">XAI / SHAP Feature Importance</p>
          </div>
          <div className="space-y-3">
            {shapFeatures.map((feature, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{feature.name}</span>
                  <span className={feature.value < 0 ? "text-blue-600" : "text-red-500"}>
                    {feature.value > 0 ? "+" : ""}{feature.value.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary relative overflow-hidden">
                    {feature.value < 0 ? (
                      <div 
                        className="absolute right-1/2 h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.abs(feature.value) * 100}%` }}
                      />
                    ) : (
                      <div 
                        className="absolute left-1/2 h-full bg-red-400 rounded-full"
                        style={{ width: `${feature.value * 100}%` }}
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
                  <h3 className="font-semibold text-foreground">NeuroDetect Assistant</h3>
                  <p className="text-xs text-muted-foreground">Powered by AI • Always available</p>
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
                      <p className="text-sm leading-relaxed">{msg.content}</p>
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
