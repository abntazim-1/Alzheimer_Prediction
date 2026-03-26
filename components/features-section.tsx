import { Brain, FileBarChart, Lightbulb, MessageSquare } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Image-Based Analysis",
    description: "Advanced deep learning models analyze MRI brain scans to detect subtle patterns indicative of Alzheimer's disease with high precision.",
  },
  {
    icon: FileBarChart,
    title: "Clinical Data Prediction",
    description: "Comprehensive analysis of patient demographics, cognitive assessments, and biomarkers to provide holistic risk evaluation.",
  },
  {
    icon: Lightbulb,
    title: "Explainable AI Insights",
    description: "Transparent AI decisions with SHAP visualizations and feature importance metrics, ensuring clinicians understand every prediction.",
  },
  {
    icon: MessageSquare,
    title: "AI Assistant Support",
    description: "Intelligent conversational assistant to help interpret results, answer questions, and provide evidence-based guidance.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">Platform Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Comprehensive AI-Powered Diagnostics
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines cutting-edge machine learning with clinical expertise 
            to deliver accurate, interpretable, and actionable insights.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
