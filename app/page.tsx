import { FinalCTA } from "@/components/home/FinalCTA";
import { Hero } from "@/components/home/Hero";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { IntakePreviewSection } from "@/components/home/IntakePreviewSection";
import { ResultsSection } from "@/components/home/ResultsSection";
import { StorySection } from "@/components/home/StorySection";
import { TrustSection } from "@/components/home/TrustSection";

export default function HomePage() {
  return (
    <div className="page-rhythm">
      <Hero />
      <StorySection />
      <IntakePreviewSection />
      <ResultsSection />
      <HowItWorksSection />
      <TrustSection />
      <FinalCTA />
    </div>
  );
}
