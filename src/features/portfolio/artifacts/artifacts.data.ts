export interface Project {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  year: string;
  accent: string;
  /** One line of verifiable facts shown under the title in the case study. */
  highlights: string;
  role: string;
  problem: string;
  approach: string;
  outcome: string;
  engineering: string[];
  links: { label: string; href: string }[];
  credit?: string;
  /** Extra images shown in the case study after the cover (`image`). */
  gallery: { src: string; caption: string }[];
}

// Every claim here is checked against the project's own repo — no invented
// traffic numbers or architecture the code doesn't have.
export const PROJECTS: Project[] = [
  {
    id: 'magnum-opus',
    category: 'Personal OS · Modular Monolith',
    title: 'Magnum Opus',
    description: 'A private operating system for observing and reshaping one\'s own life — journal, mood, memory, habits and routines woven into one loop: record, reflect, notice patterns, change, act.',
    image: '/projects/magnum-opus.webp',
    tags: ['TypeScript', 'NestJS', 'Next.js', 'PostgreSQL', 'Prisma', 'Redis', 'BullMQ', 'Docker'],
    year: '2026',
    accent: '#d4a24c',
    highlights: '330 test files · CI-enforced architecture & perf budgets · Transactional outbox',
    role: 'Solo — product, design and engineering',
    problem: 'Its predecessor, Forge OS, grew into 25+ gamified modules backed by two test files — impressive to demo, hard to trust or change. The product had also drifted into a productivity dashboard, the opposite of what it was for.',
    approach: 'Rebuilt from scratch as a calm, private product, one vertical slice at a time (Journal, Mood, Memory, Timeline, then Habits and Routines), on a foundation strict enough to keep that pace: bounded contexts, CQRS, ports and adapters, and an API and a BullMQ worker as separate composition roots.',
    outcome: '234 commits in two months, shipped through reviewed pull requests. Every slice lands with unit, API end-to-end and browser end-to-end tests, and CI refuses a merge that breaks the architecture rules, the JS budget per route or the migration chain.',
    engineering: [
      'Transactional outbox with idempotent, at-least-once realtime delivery',
      'Dependency rules enforced by a test: domain code cannot import Prisma, BullMQ or infrastructure',
      'Optimistic concurrency and per-user ownership isolation',
      'Production compose with Caddy, encrypted off-host backups and Prometheus alerts — all validated in CI',
      'Foundation shared with my open-source turborepo-advanced-starter',
    ],
    links: [
      { label: 'Live', href: 'https://www.magnum-opus.dev' },
      { label: 'Source', href: 'https://github.com/trhgatu/magnum-opus' },
    ],
    gallery: [
      { src: '/projects/magnum-opus.webp', caption: "Landing — life as the raw material of a masterpiece" },
      { src: '/projects/gallery/magnum-opus-architecture.webp', caption: "Architecture — one API process, bounded contexts, a separate worker" },
      { src: '/projects/gallery/magnum-opus-sign-in.webp', caption: "Sign-in — the same quiet, private tone as the rest of the product" },
    ],
  },
  {
    id: 'auto-wp-publisher',
    category: 'AI Content Pipeline · Client Tool',
    title: 'Auto WP Publisher',
    description: 'Turns a raw Excel or Google Sheets product list into published WooCommerce listings — columns mapped, SEO copy written by Gemini, categories, brands, images and RankMath/Yoast metadata filled in.',
    image: '/projects/auto-wp-publisher.webp',
    tags: ['NestJS', 'React', 'Ant Design', 'PostgreSQL', 'Prisma', 'BullMQ', 'Redis', 'Gemini', 'WooCommerce'],
    year: '2026',
    accent: '#f87171',
    highlights: 'Spreadsheet → Gemini → WooCommerce · Rate-limit-aware queue · Live job progress',
    role: 'Solo — built for a real e-commerce business',
    problem: 'Listing products by hand meant copying fields from spreadsheets, writing an SEO description for each one and uploading images one product at a time — slow, and inconsistent from one listing to the next.',
    approach: 'A NestJS service split into hexagonal bounded contexts (catalog, IAM, settings) with CQRS, fronted by a React admin. Imports become queued jobs; a BullMQ processor writes copy with Gemini, then publishes through the WooCommerce REST API while the UI follows progress over Socket.IO.',
    outcome: 'The whole flow — import, mapping preview, publishing, trash and restore, prompt templates, API log history and a dashboard — works end to end, with CI building and shipping a Docker image on every push.',
    engineering: [
      'Gemini 429 handling with retry and API-key rotation',
      'Queue processor at concurrency 1 behind a rate limiter, with a template fallback when AI generation fails',
      'WooCommerce integration that handles duplicate SKUs and de-duplicates media uploads',
      'Real-time job events pushed to the admin over Socket.IO',
    ],
    links: [
      { label: 'Source', href: 'https://github.com/trhgatu/auto-wp-publisher' },
    ],
    gallery: [
      { src: '/projects/auto-wp-publisher.webp', caption: "Pipeline — spreadsheet to storefront" },
      { src: '/projects/gallery/auto-wp-publisher-failures.webp', caption: "Failure handling — rate limits, key rotation, template fallback" },
    ],
  },
  {
    id: 'the-alchemist',
    category: 'Immersive Portfolio · Creative Frontend',
    title: 'The Alchemist',
    description: 'My previous portfolio: a scroll-driven grimoire after Paulo Coelho\'s novel. A washi-paper portal burns open onto a starfield, a 3D spellbook releases the tech stack as a constellation, and the story ends in the desert — in English and Vietnamese.',
    image: '/projects/the-alchemist.webp',
    tags: ['Next.js', 'React Three Fiber', 'GSAP', 'OGL', 'Zustand', 'Tailwind CSS'],
    year: '2025 — 2026',
    accent: '#f59e0b',
    highlights: '3D grimoire · Shader route transitions · EN / VI',
    role: 'Solo — concept, design and engineering',
    problem: 'A portfolio usually reads as a list. I wanted one that plays like a story, where every section is a chapter and the transitions carry the meaning.',
    approach: 'Long pinned scroll timelines drive React Three Fiber scenes through a scroll-progress ref read inside the frame loop, so the 3D never waits on React re-renders. Route changes burn the screen through an OGL noise shader, and torn, scorched parchment is drawn with SVG displacement filters.',
    outcome: 'Live since 2025 and refined over 186 commits across a year. Building it taught me where immersive sites lose people — pacing and weight — which is what this site was designed around.',
    engineering: [
      'Scroll progress kept in refs and read in useFrame, not React state',
      'OGL simplex-noise burn transition orchestrated through a Zustand router store',
      'Tech icons rasterised into textures and flown into a golden-angle constellation',
      'Custom EN / VI i18n store with GSAP timelines rebuilt per language',
    ],
    links: [
      { label: 'Live', href: 'https://thatu.is-a.dev' },
      { label: 'Source', href: 'https://github.com/trhgatu/the-alchemist' },
    ],
    gallery: [
      { src: '/projects/the-alchemist.webp', caption: "The grimoire — the tech stack released as a constellation" },
      { src: '/projects/gallery/the-alchemist-hero.webp', caption: "Hero — the name burned through washi paper" },
      { src: '/projects/gallery/the-alchemist-journal.webp', caption: "The alchemist's journal — Nigredo, Albedo, Citrinitas, Rubedo" },
      { src: '/projects/gallery/the-alchemist-desert.webp', caption: "The ending — the desert, and 'Maktub'" },
    ],
  },
  {
    id: 'kim-khanh',
    category: 'Client Work · Personal Archive',
    title: 'Kim Khanh',
    description: 'A bespoke digital home built for Kim Khanh — a warm botanical scrapbook of flowers, places, notes and small everyday joys, opening on an interactive 3D azalea.',
    image: '/projects/kim-khanh.webp',
    tags: ['Next.js', 'Three.js', 'OGL', 'GSAP', 'Lenis', 'Tailwind CSS'],
    year: '2026',
    accent: '#e8837a',
    highlights: '3D flower study · Shader pollen trail · Reduced-motion support',
    role: 'Solo — designed and built for a client',
    problem: 'A personal site for someone who isn\'t a developer: it had to feel like her — soft, tactile, handmade — rather than like a template, and stay gentle for visitors who prefer less motion.',
    approach: 'An editorial scrapbook layout with paper-like surfaces, a three.js hero flower playing its own animation, and small OGL shaders for the pollen cursor trail, the fog preloader and a cover ripple reserved for precise pointers.',
    outcome: 'Finished and polished across desktop and mobile, with real content throughout, ambient audio behind an opt-in toggle, and a reduced-motion mode.',
    engineering: [
      'three.js GLTF scene with baked animation for the hero flower',
      'OGL shaders for the pollen trail, fog preloader and cover ripple (fine pointers only)',
      'Scroll-linked flowers and a pinned editorial layout on GSAP + Lenis',
      'prefers-reduced-motion respected across the experience',
    ],
    links: [
      { label: 'Live', href: 'https://kimkhanh-portfolio.vercel.app/' },
      { label: 'Source', href: 'https://github.com/trhgatu/kimkhanh-portfolio' },
    ],
    credit: '3D model "Rhododendron - Azalea" by Nestaeric on Sketchfab, licensed CC BY 4.0.',
    gallery: [
      { src: '/projects/kim-khanh.webp', caption: "Hero — an interactive 3D azalea" },
      { src: '/projects/gallery/kim-khanh-about.webp', caption: "About — a life shaped by work and small joys" },
      { src: '/projects/gallery/kim-khanh-journey.webp', caption: "The paths that shaped me — a pinned editorial journey" },
      { src: '/projects/gallery/kim-khanh-notes.webp', caption: "A few things that shaped me — scrapbook notes" },
    ],
  },
];
