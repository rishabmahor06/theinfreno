import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, Activity, Calendar } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const [stats, setStats] = useState({ members: 0, payments: 0, attendance: 0, revenue: 0 });
  useEffect(() => {
    (async () => {
      const [m, p, a, r] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("*", { count: "exact", head: true }),
        supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", new Date().toISOString().slice(0, 10)),
        supabase.from("payments").select("amount"),
      ]);
      setStats({
        members: m.count ?? 0, payments: p.count ?? 0, attendance: a.count ?? 0,
        revenue: (r.data ?? []).reduce((s, x: any) => s + Number(x.amount), 0),
      });
    })();
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-wider">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={Users} label="Total Members" value={String(stats.members)} />
        <Card icon={Activity} label="Today's Attendance" value={String(stats.attendance)} />
        <Card icon={CreditCard} label="Total Payments" value={String(stats.payments)} />
        <Card icon={Calendar} label="Total Revenue" value={`₹${stats.revenue}`} />
      </div>
    </div>
  );
}
function Card({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}
