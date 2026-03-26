import { Upload, Cpu, BarChart3, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Input Data",
    description: "Upload MRI scans or enter clinical patient data through our secure, HIPAA-compliant interface.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Processing",
    description: "Our advanced deep learning models analyze the data using state-of-the-art neural networks trained on extensive datasets.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Get Insights",
    description: "Receive detailed predictions with explainable AI visualizations and actionable clinical recommendations.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Simple, Fast, and Reliable
          </h2>
          <p className="text-lg text-muted-foreground">
            Our streamlined workflow ensures quick and accurate analysis 
            while maintaining the highest standards of clinical accuracy.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full">
                  <div className="flex items-center justify-center">
                    <div className="w-full h-px bg-border" />
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-2 shrink-0" />
                  </div>
                </div>
              )}

              <div className="text-center">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-secondary/50 border border-border mb-6 relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
