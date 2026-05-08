import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Dumbbell, HeartPulse, Trophy, Zap } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-gym.jpg";
import strengthImg from "@/assets/program-strength.jpg";
import wodImg from "@/assets/program-wod.jpg";
import enduranceImg from "@/assets/program-endurance.jpg";
import fundamentalsImg from "@/assets/program-fundamentals.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IronFit — Fast. Hard. Again. | Premium CrossFit Gym" },
      { name: "description", content: "Join IronFit, the #1 CrossFit gym. Daily WODs, strength programs, nutrition guidance and full member management." },
      { property: "og:title", content: "IronFit — Fast. Hard. Again." },
      { property: "og:description", content: "Premium CrossFit & strength training community." },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { icon: Dumbbell, label: "About Us", to: "/about" },
  { icon: Zap, label: "New to CrossFit?", to: "/programs" },
  { icon: Calendar, label: "Schedule", to: "/schedule" },
  { icon: HeartPulse, label: "Nutrition", to: "/diet-chart" },
];

const PROGRAMS = [
  { title: "Daily WOD", img: wodImg, desc: "Workout of the day, scaled for every level." },
  { title: "Strength", img: strengthImg, desc: "Progressive overload for serious gains." },
  { title: "Fundamentals", img: fundamentalsImg, desc: "New to fitness? Start here." },
  { title: "CrossFit Endurance", img: enduranceImg, desc: "Build engine. Finish strong." },
];

function HomePage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-surface-dark text-surface-dark-foreground">
        <img src={heroImg} alt="Athlete training on rings at IronFit" width={1920} height={1080} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface-dark/40 via-surface-dark/70 to-surface-dark" />
        <div className="container mx-auto flex min-h-[78vh] flex-col items-center justify-center px-4 py-32 text-center">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-sm uppercase tracking-[0.4em] text-primary">
            Welcome to IronFit
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="mt-4 font-display text-6xl tracking-wider sm:text-7xl md:text-8xl">
            FAST. HARD. AGAIN.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-5 max-w-xl text-base text-surface-dark-foreground/80">
            You don't have to be great to start — but you have to start to be great.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-display tracking-widest">
              <Link to="/login">GET STARTED <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent font-display tracking-widest text-white hover:bg-white/10 hover:text-white">
              <Link to="/programs">VIEW PROGRAMS</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="bg-surface-dark text-surface-dark-foreground">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-primary">Welcome</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              We are <span className="text-primary">#1 CrossFit</span> gym
            </h2>
            <p className="mt-3 text-sm text-surface-dark-foreground/70">Be part of our premier CrossFit community</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Link key={f.label} to={f.to} className="group rounded-lg border border-white/10 bg-white/5 p-8 text-center transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-white/10">
                <f.icon className="mx-auto h-10 w-10 text-primary transition-transform group-hover:scale-110" />
                <p className="mt-4 font-display text-lg tracking-wider">{f.label}</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-surface-dark-foreground/50">Details →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Classes</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Choose the program</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((p) => (
              <Link key={p.title} to="/programs" className="group relative aspect-[3/4] overflow-hidden rounded-lg">
                <img src={p.img} alt={p.title} loading="lazy" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="font-display text-2xl tracking-wider">{p.title}</h3>
                  <p className="mt-1 text-xs text-white/70">{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="font-display tracking-widest">
              <Link to="/programs">MORE PROGRAMS <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SIGN UP STRIP */}
      <section className="relative isolate overflow-hidden bg-surface-dark py-20 text-surface-dark-foreground">
        <img src={enduranceImg} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-surface-dark/70" />
        <div className="container mx-auto grid items-center gap-8 px-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary">Free Intro</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              <span className="text-primary">Sign up</span> for free intro
            </h2>
            <p className="mt-3 max-w-md text-sm text-surface-dark-foreground/70">
              Our coaching staff has many years of CrossFit training experience. Walk in for a complimentary session.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <input type="email" required placeholder="Your email" className="flex-1 rounded-md bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none ring-primary focus:ring-2" />
              <Button type="submit" size="lg" className="font-display tracking-widest">SIGN UP</Button>
            </form>
            <p className="mt-3 text-xs text-surface-dark-foreground/50">Or <Link to="/login" className="text-primary underline">log in</Link> if you're already a member.</p>
          </div>
        </div>
      </section>

      {/* COMPETITION CTA */}
      <section className="bg-background py-20">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-8 text-card-foreground">
            <Trophy className="h-8 w-8 text-primary" />
            <h3 className="mt-4 font-display text-2xl tracking-wider">Compete</h3>
            <p className="mt-2 text-sm text-muted-foreground">Quarterly in-house competitions and open events.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 text-card-foreground">
            <HeartPulse className="h-8 w-8 text-primary" />
            <h3 className="mt-4 font-display text-2xl tracking-wider">Eat Right</h3>
            <p className="mt-2 text-sm text-muted-foreground">Personalized diet charts based on your goals.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 text-card-foreground">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="mt-4 font-display text-2xl tracking-wider">Train Smart</h3>
            <p className="mt-2 text-sm text-muted-foreground">Video-guided workouts with form cues at every step.</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
