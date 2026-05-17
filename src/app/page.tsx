import { Hero } from "@/features/portfolio/Hero";
import { About } from "@/features/portfolio/About";
import { Artifacts } from "@/features/portfolio/Artifacts";
import { Stack } from "@/features/portfolio/Stack";
import { Philosophy } from "@/features/portfolio/Philosophy";
import { Experience } from "@/features/portfolio/Experience";
import { Contact } from "@/features/portfolio/Contact";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <About />
      <Artifacts />
      <Stack />
      <Philosophy />
      <Experience />
      <Contact />
      <Footer />
    </main>
  );
}

