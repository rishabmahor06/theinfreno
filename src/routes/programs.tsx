import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import strengthImg from "@/assets/program-strength.jpg";
import wodImg from "@/assets/program-wod.jpg";
import enduranceImg from "@/assets/program-endurance.jpg";
import fundamentalsImg from "@/assets/program-fundamentals.jpg";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs — Daily WOD, Strength, Endurance | IronFit" },
      { name: "description", content: "Choose from CrossFit, strength, fundamentals, and endurance programs at IronFit." },
    ],
  }),
  component: ProgramsPage,
});

const PROGRAMS = [
  { title: "Daily WOD", img: wodImg, desc: "Workout of the day — varied, scaled, intense.", details: "60 min · All levels · Coach-led" },
  { title: "Express WOD", img: wodImg, desc: "30-minute lunch session for busy schedules.", details: "30 min · Lunch slot · Drop-in" },
  { title: "Strength", img: strengthImg, desc: "Linear and conjugate strength cycles.", details: "75 min · Intermediate+ · 3x/week" },
  { title: "Fundamentals", img: fundamentalsImg, desc: "On-ramp for new members. Learn the 9 essential movements.", details: "4-week course · Beginner" },
  { title: "CrossFit Endurance", img: enduranceImg, desc: "Build your aerobic engine.", details: "60 min · Intermediate+" },
  { title: "Open Gym", img: strengthImg, desc: "Train on your own program with coach support.", details: "Flexible · All levels" },
];

function ProgramsPage() {
  return (
    <SiteShell>
      <section className="bg-surface-dark py-20 text-surface-dark-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Train</p>
          <h1 className="mt-3 font-display text-5xl">Our Programs</h1>
          <p className="mx-auto mt-3 max-w-xl text-surface-dark-foreground/70">Pick what fits your goal. Every program is coach-led and progress-tracked.</p>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p) => (
            <article key={p.title} className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="p-6">
                <h2 className="font-display text-2xl tracking-wider">{p.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <p className="mt-3 text-xs uppercase tracking-widest text-primary">{p.details}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="container mx-auto mt-12 px-4 text-center">
          <Button asChild size="lg" className="font-display tracking-widest">
            <Link to="/login">JOIN NOW</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
