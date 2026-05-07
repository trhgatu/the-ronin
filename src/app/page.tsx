import { Hero } from "@/features/portfolio/Hero";
import { Artifacts } from "@/features/portfolio/Artifacts";
import { Stack } from "@/features/portfolio/Stack";
import { Philosophy } from "@/features/portfolio/Philosophy";
import { Experience } from "@/features/portfolio/Experience";
import { Contact } from "@/features/portfolio/Contact";
import { Footer } from "@/components/shared/Footer";
import { ScrollTimeline } from "@/components/ui/ScrollTimeline";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <ScrollTimeline />
      <Hero />
      <Stack />
      <Philosophy />
      <Artifacts />
      <Experience />
      <Contact />
      <Footer />
    </main>
  );
}
