import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/member/workouts")({ component: () => (
  <div className="space-y-4">
    <h1 className="font-display text-4xl tracking-wider">Workout Library</h1>
    <p className="text-muted-foreground">Browse exercises with video demos.</p>
    <Link to="/workout-guide" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Open Workout Guide</Link>
  </div>
)});
