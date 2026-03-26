import { Heart, Microscope, Shield, TrendingUp } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">About</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Understanding Alzheimer&apos;s & Our Mission
          </h2>
          <p className="text-lg text-muted-foreground">
            Empowering healthcare professionals with AI-driven insights for 
            early detection and better patient outcomes.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - About Alzheimer's */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  About Alzheimer&apos;s Disease
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Alzheimer&apos;s disease is a progressive neurodegenerative disorder 
                  affecting millions worldwide. It gradually impairs memory, thinking, 
                  and behavior, significantly impacting patients and their families.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Currently affecting over 55 million people globally, Alzheimer&apos;s 
                  is projected to triple by 2050. Early detection is crucial for 
                  intervention and improved quality of life.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Microscope className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Why Early Detection Matters
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Early diagnosis enables timely interventions that can slow disease 
                  progression, allow patients to participate in clinical trials, and 
                  give families time to plan for the future. Studies show that early 
                  treatment can delay symptom onset by up to 5 years.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - AI in Healthcare */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  AI in Healthcare Diagnostics
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Artificial intelligence is revolutionizing medical diagnostics by 
                  analyzing complex patterns in imaging and clinical data that may 
                  be invisible to the human eye.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our deep learning models are trained on thousands of verified cases, 
                  achieving accuracy rates that complement and enhance clinical expertise. 
                  AI doesn&apos;t replace doctors—it empowers them with better tools.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Our Commitment
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We&apos;re committed to developing transparent, explainable AI that 
                  healthcare professionals can trust. Our platform adheres to the 
                  highest standards of data privacy, security, and clinical validation, 
                  ensuring reliable insights that support informed decision-making.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 pt-16 border-t border-border">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">55M+</div>
            <div className="text-sm text-muted-foreground">People affected globally</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">10M</div>
            <div className="text-sm text-muted-foreground">New cases yearly</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">70%</div>
            <div className="text-sm text-muted-foreground">Undiagnosed cases</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">5yrs</div>
            <div className="text-sm text-muted-foreground">Earlier intervention impact</div>
          </div>
        </div>
      </div>
    </section>
  )
}
