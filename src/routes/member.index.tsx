import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, AlertCircle, Activity } from "lucide-react";
import { differenceInDays, format } from "date-fns";

export const Route = createFileRoute("/member/")({
  component: MemberDashboard,
});

function MemberDashboard() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: attendanceCount = 0 } = useQuery({
    queryKey: ["my-attendance-count"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return 0;
      const { count, error } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("user_id", auth.user.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!profile) return <p className="text-muted-foreground">Profile not found. Admin se contact karo.</p>;

  const daysToDue = differenceInDays(new Date(profile.fee_due_date), new Date());
  const showAlert = daysToDue <= 2 && !profile.alert_disabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wider">Welcome, {profile.name?.split(" ")[0] ?? "Member"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Member ID: <span className="font-mono text-primary">{profile.member_id}</span>
        </p>
      </div>

      {showAlert && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">
              Fee due {daysToDue <= 0 ? "today / overdue" : `in ${daysToDue} day${daysToDue === 1 ? "" : "s"}`}
            </p>
            <p className="text-sm opacity-80">
              Please pay ₹{profile.fee_amount} before {format(new Date(profile.fee_due_date), "PP")}.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={CreditCard} label="Fee Amount" value={`₹${profile.fee_amount}`} />
        <Card icon={Calendar} label="Next Due" value={format(new Date(profile.fee_due_date), "d  MMM")} />
        <Card icon={Activity} label="Total Visits" value={String(attendanceCount)} />
        <Card icon={Calendar} label="Joined" value={format(new Date(profile.joining_date), "d  MMM yyyy")} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl tracking-wider">Quick Actions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Top right "Mark Attendance" button se attendance lagao. Sidebar se fees, diet aur workouts dekho.
        </p>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}
