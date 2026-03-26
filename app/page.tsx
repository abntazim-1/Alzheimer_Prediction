import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { AssistantSection } from "@/components/assistant-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { AboutSection } from "@/components/about-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AssistantSection />
      <HowItWorksSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
