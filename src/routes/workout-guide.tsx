import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import strengthImg from "@/assets/program-strength.jpg";
import wodImg from "@/assets/program-wod.jpg";
import enduranceImg from "@/assets/program-endurance.jpg";
import fundamentalsImg from "@/assets/program-fundamentals.jpg";

export const Route = createFileRoute("/workout-guide")({
  head: () => ({
    meta: [
      { title: "Workout Guide — Exercise Library with Videos | IronFit" },
      { name: "description", content: "Browse the IronFit exercise library: form cues, demonstration videos, and difficulty levels." },
    ],
  }),
  component: WorkoutGuide,
});

const WORKOUTS = [
  { title: "Back Squat", category: "strength", difficulty: "Beginner", img: strengthImg, video: "https://www.youtube.com/embed/SW_C1A-rejs", desc: "King of lower body lifts. Brace, sit back, drive up." },
  { title: "Kettlebell Swing", category: "wod", difficulty: "Beginner", img: wodImg, video: "https://www.youtube.com/embed/sSESeQDeBJk", desc: "Hip hinge power. Hike, snap, repeat." },
  { title: "Rope Climb", category: "endurance", difficulty: "Advanced", img: enduranceImg, video: "https://www.youtube.com/embed/U-OdAaSwqSk", desc: "Wrap, stand, reach, repeat." },
  { title: "Box Jump", category: "fundamentals", difficulty: "Beginner", img: fundamentalsImg, video: "https://www.youtube.com/embed/52r_Ul5k03g", desc: "Explosive triple extension. Land soft." },
  { title: "Deadlift", category: "strength", difficulty: "Intermediate", img: strengthImg, video: "https://www.youtube.com/embed/op9kVnSso6Q", desc: "Bar over mid-foot. Push the floor away." },
  { title: "Burpee", category: "wod", difficulty: "Beginner", img: wodImg, video: "https://www.youtube.com/embed/auBLPXO8Fww", desc: "Down, jump, up. The great equalizer." },
  { title: "Pull-Up", category: "fundamentals", difficulty: "Intermediate", img: fundamentalsImg, video: "https://www.youtube.com/embed/eGo4IYlbE5g", desc: "Strict, kipping, butterfly — pick your variant." },
  { title: "Assault Bike", category: "endurance", difficulty: "Beginner", img: enduranceImg, video: "https://www.youtube.com/embed/N5OeyfbbX10", desc: "Push, pull, breathe. The pain machine." },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "strength", label: "Strength" },
  { id: "wod", label: "WOD" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "endurance", label: "Endurance" },
];

function WorkoutGuide() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = WORKOUTS.filter(
    (w) => (tab === "all" || w.category === tab) && w.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <SiteShell>
      <section className="bg-surface-dark py-16 text-surface-dark-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Train Smart</p>
          <h1 className="mt-3 font-display text-5xl">Workout Guide</h1>
          <p className="mx-auto mt-3 max-w-xl text-surface-dark-foreground/70">Form cues, video demos and difficulty for every movement.</p>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises..." className="pl-9" />
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                {CATEGORIES.map((c) => <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((w) => (
              <article key={w.title} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-video overflow-hidden">
                  <iframe src={w.video} title={w.title} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl tracking-wider">{w.title}</h2>
                    <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-medium text-primary">{w.difficulty}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{w.desc}</p>
                </div>
              </article>
            ))}
            {filtered.length === 0 && <p className="col-span-full py-12 text-center text-muted-foreground">No exercises match your search.</p>}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
