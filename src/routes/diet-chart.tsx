import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/diet-chart")({
  head: () => ({
    meta: [
      { title: "Personalized Diet Chart — IronFit Nutrition" },
      { name: "description", content: "Generate a personalized diet plan based on your age, goal, weight, and activity level." },
    ],
  }),
  component: DietChartPage,
});

const Schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  age: z.number().min(10).max(100),
  gender: z.enum(["male", "female", "other"]),
  weight_kg: z.number().min(20).max(300),
  height_cm: z.number().min(80).max(250),
  goal: z.enum(["lose_fat", "build_muscle", "maintain", "performance"]),
  activity: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  allergies: z.string().max(500).optional(),
});

function generatePlan(input: z.infer<typeof Schema>) {
  // BMR via Mifflin-St Jeor
  const bmr = input.gender === "male"
    ? 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + 5
    : 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age - 161;
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = Math.round(bmr * factors[input.activity]);
  const target = input.goal === "lose_fat" ? tdee - 400 : input.goal === "build_muscle" ? tdee + 350 : tdee;
  const protein = Math.round(input.weight_kg * (input.goal === "build_muscle" ? 2 : 1.6));
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);

  return {
    target_calories: target,
    macros: { protein, carbs, fat },
    meals: [
      { name: "Breakfast", items: ["Oats with berries & whey", "2 boiled eggs", "Black coffee"] },
      { name: "Mid-morning", items: ["Greek yogurt", "Handful of almonds"] },
      { name: "Lunch", items: ["Grilled chicken / paneer", "Brown rice or roti", "Green salad", "Curd"] },
      { name: "Pre-workout", items: ["Banana", "Black coffee or BCAA"] },
      { name: "Post-workout", items: ["Whey shake", "Apple"] },
      { name: "Dinner", items: ["Fish / lentils", "Quinoa or roti", "Steamed veggies"] },
    ],
    notes: ["Hydrate 3–4 L water daily.", "Sleep 7–8 hours.", "Adjust portions based on weekly progress."],
  };
}

function DietChartPage() {
  const [form, setForm] = useState({
    name: "", email: "", age: 25, gender: "male" as const, weight_kg: 70, height_cm: 175,
    goal: "build_muscle" as const, activity: "moderate" as const, allergies: "",
  });
  const [plan, setPlan] = useState<ReturnType<typeof generatePlan> | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = Schema.parse(form);
      const generated = generatePlan(parsed);
      const { error } = await supabase.from("diet_intakes").insert({ ...parsed, plan: generated as any });
      if (error) throw error;
      return generated;
    },
    onSuccess: (g) => { setPlan(g); toast.success("Your personalized plan is ready!"); },
    onError: (e: any) => toast.error(e.message ?? "Could not generate plan"),
  });

  return (
    <SiteShell>
      <section className="bg-surface-dark py-16 text-surface-dark-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Eat Right</p>
          <h1 className="mt-3 font-display text-5xl">Personalized Diet Chart</h1>
          <p className="mx-auto mt-3 max-w-xl text-surface-dark-foreground/70">Fill in your details. Get an instant calorie & macro plan tailored to your goal.</p>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-2">
          <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl tracking-wider">Your Details</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} required /></div>
              <div><Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v: any) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Weight (kg)</Label><Input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: +e.target.value })} required /></div>
              <div><Label>Height (cm)</Label><Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: +e.target.value })} required /></div>
              <div><Label>Goal</Label>
                <Select value={form.goal} onValueChange={(v: any) => setForm({ ...form, goal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_fat">Lose Fat</SelectItem>
                    <SelectItem value="build_muscle">Build Muscle</SelectItem>
                    <SelectItem value="maintain">Maintain</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Activity</Label>
                <Select value={form.activity} onValueChange={(v: any) => setForm({ ...form, activity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very_active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Allergies / restrictions (optional)</Label><Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></div>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full font-display tracking-widest" disabled={submit.isPending}>
              {submit.isPending ? "GENERATING..." : "GENERATE MY PLAN"}
            </Button>
          </form>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl tracking-wider">Your Plan</h2>
            {!plan && <p className="mt-4 text-sm text-muted-foreground">Submit the form to see your personalized diet plan here.</p>}
            {plan && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="rounded-lg bg-primary/10 p-3"><p className="text-xs text-muted-foreground">Calories</p><p className="font-display text-2xl text-primary">{plan.target_calories}</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Protein</p><p className="font-display text-2xl">{plan.macros.protein}g</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Carbs</p><p className="font-display text-2xl">{plan.macros.carbs}g</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Fat</p><p className="font-display text-2xl">{plan.macros.fat}g</p></div>
                </div>
                <div className="space-y-3">
                  {plan.meals.map((m) => (
                    <div key={m.name} className="rounded-lg border border-border p-4">
                      <p className="font-semibold text-primary">{m.name}</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                        {m.items.map((i) => <li key={i}>{i}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-sm font-semibold">Notes</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                    {plan.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
