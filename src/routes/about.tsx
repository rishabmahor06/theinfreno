import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import heroImg from "@/assets/program-strength.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About IronFit — Our Story & Coaches" },
      { name: "description", content: "IronFit is a community-driven CrossFit gym built on grit, family, and consistency." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { title: "Community", body: "Every member trains alongside coaches and friends — never alone." },
  { title: "Consistency", body: "Show up. Get 1% better. That's the IronFit standard." },
  { title: "Coaching", body: "Certified CrossFit L2/L3 coaches lead every class." },
];

function AboutPage() {
  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden bg-surface-dark text-surface-dark-foreground">
        <img src={heroImg} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Who We Are</p>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl">About IronFit</h1>
          <p className="mx-auto mt-4 max-w-2xl text-surface-dark-foreground/70">
            Founded by athletes for athletes. We started with a barbell, a pull-up rig, and a vision: build a gym where every rep matters.
          </p>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-8">
              <h3 className="font-display text-2xl tracking-wider text-primary">{v.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="font-display text-4xl">Our Story</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>The biggest advantage of doing CrossFit is being able to be a part of a thriving community of like-minded people, a lot of whom are there to support you in your fitness goals.</p>
            <p>We started the group a few years ago because we wanted a space for our members to connect with each other and us outside of the box. Today IronFit is home to over 400 members and a coaching team with combined 25+ years of CrossFit experience.</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
