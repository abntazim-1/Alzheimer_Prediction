import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/30 -z-10" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">AI-Powered Healthcare Innovation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              AI-Powered{" "}
              <span className="text-primary">Alzheimer&apos;s</span>{" "}
              Detection
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Harness the power of advanced machine learning to detect early signs of 
              Alzheimer&apos;s disease. Our platform analyzes MRI scans and clinical data 
              with unprecedented accuracy, empowering healthcare professionals with 
              actionable insights.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 px-6">
                Start Analysis
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-12 px-6 border-border hover:bg-secondary">
                <Play className="w-4 h-4" />
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">98.5%</div>
                <div className="text-sm text-muted-foreground">Detection Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Scans Analyzed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">200+</div>
                <div className="text-sm text-muted-foreground">Healthcare Partners</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main visual container */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/30 to-primary/10 border border-primary/20 shadow-2xl shadow-primary/10">
                {/* Brain scan visualization placeholder */}
                <div className="absolute inset-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      MRI Analysis Visualization
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-card border border-border shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-foreground">Live Analysis</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-xl bg-card border border-border shadow-lg">
                <div className="text-xs text-muted-foreground">Processing Time</div>
                <div className="text-lg font-semibold text-foreground">{"< 30 seconds"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
