import LandingNav       from '@/components/home/LandingNav'
import HeroSection      from '@/components/home/HeroSection'
import AgentShowcase    from '@/components/home/AgentShowcase'
import HowItWorks       from '@/components/home/HowItWorks'
import LearningJourney  from '@/components/home/LearningJourney'
import FeatureHighlights from '@/components/home/FeatureHighlights'
import MissionPreview   from '@/components/home/MissionPreview'
import CTASection       from '@/components/home/CTASection'

export default function Home() {
  return (
    <div className="bg-bg text-text-primary overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <AgentShowcase />
      <HowItWorks />
      <LearningJourney />
      <FeatureHighlights />
      <MissionPreview />
      <CTASection />
    </div>
  )
}
