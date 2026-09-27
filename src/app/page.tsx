import { Hero } from "@/features/portfolio/Hero";
import { About } from "@/features/portfolio/About";
import { Artifacts } from "@/features/portfolio/Artifacts";
import { Philosophy } from "@/features/portfolio/Philosophy";
import { Experience } from "@/features/portfolio/Experience";
import { Contact } from "@/features/portfolio/Contact";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <Hero />
      <About />
      <Artifacts />
      <Philosophy />
      <Experience />
      <Contact />
      <Footer />
    </main>
  );
}

