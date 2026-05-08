import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Class Schedule — IronFit" },
      { name: "description", content: "Weekly class schedule. CrossFit, Strength, Endurance and Open Gym." },
    ],
  }),
  component: SchedulePage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = [
  { time: "06:00", classes: ["WOD", "WOD", "WOD", "WOD", "WOD", "Open"] },
  { time: "08:00", classes: ["Strength", "Endurance", "Strength", "Endurance", "Strength", "WOD"] },
  { time: "12:00", classes: ["Express", "Express", "Express", "Express", "Express", "—"] },
  { time: "17:00", classes: ["Fundamentals", "WOD", "Fundamentals", "WOD", "Fundamentals", "Open"] },
  { time: "19:00", classes: ["WOD", "Strength", "WOD", "Endurance", "WOD", "—"] },
];

function SchedulePage() {
  return (
    <SiteShell>
      <section className="bg-surface-dark py-16 text-surface-dark-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">This Week</p>
          <h1 className="mt-3 font-display text-5xl">Class Schedule</h1>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  {DAYS.map((d) => <th key={d} className="px-4 py-3 text-left font-semibold">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((s) => (
                  <tr key={s.time} className="border-t border-border">
                    <td className="px-4 py-4 font-display text-lg tracking-wider text-primary">{s.time}</td>
                    {s.classes.map((c, i) => (
                      <td key={i} className="px-4 py-4">
                        {c === "—" ? <span className="text-muted-foreground">—</span> : <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{c}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
