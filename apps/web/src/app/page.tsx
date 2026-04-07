import { HeroSection } from "@/components/marketing/hero-section";
import { LogoStrip } from "@/components/marketing/logo-strip";
import { ProblemSection } from "@/components/marketing/problem-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturesSection } from "@/components/marketing/features-section";
import { DemoSection } from "@/components/marketing/demo-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <LogoStrip />
      <ProblemSection />
      <HowItWorks />
      <FeaturesSection />
      <DemoSection />
      <TestimonialsSection />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
    </main>
  );
}
