import LandingNav from "@/components/portfolio/LandingNav";
import HeroSection from "@/components/portfolio/HeroSection";
import DashboardPreviewSection from "@/components/portfolio/DashboardPreviewSection";
import FeaturesSection from "@/components/portfolio/FeaturesSection";
import TechStackSection from "@/components/portfolio/TechStackSection";
import DemoSection from "@/components/portfolio/DemoSection";
import ArchitectureSection from "@/components/portfolio/ArchitectureSection";
import PortfolioFooter from "@/components/portfolio/PortfolioFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <LandingNav />
      <HeroSection />
      <DashboardPreviewSection />
      <FeaturesSection />
      <TechStackSection />
      <DemoSection />
      <ArchitectureSection />
      <PortfolioFooter />
    </div>
  );
}
