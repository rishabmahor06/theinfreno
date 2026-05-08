import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/member/diet")({ component: () => (
  <div className="space-y-4">
    <h1 className="font-display text-4xl tracking-wider">My Diet Plan</h1>
    <p className="text-muted-foreground">Generate or update your personalized plan on the public diet page.</p>
    <Link to="/diet-chart" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Open Diet Chart</Link>
  </div>
)});
