import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AvatarThumb } from "@/components/avatar-thumb";

export const Route = createFileRoute("/member/profile")({ component: Profile });

function Profile() {
  const { data: p, isLoading } = useQuery({
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

  if (isLoading) return <p>Loading...</p>;
  if (!p) return <p className="text-muted-foreground">Profile not found.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-4xl tracking-wider">My Profile</h1>
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-center gap-6">
          <AvatarThumb url={p.photo_url} name={p.name} size={80} className="text-3xl" />
          <div>
            <h2 className="font-display text-3xl">{p.name}</h2>
            <p className="font-mono text-primary">{p.member_id}</p>
          </div>
        </div>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Field label="Email" value={p.email} />
          <Field label="Phone" value={p.phone ?? "—"} />
          <Field label="Joining Date" value={format(new Date(p.joining_date), "PPP")} />
          <Field label="Fee Amount" value={`₹${p.fee_amount}`} />
          <Field label="Next Due Date" value={format(new Date(p.fee_due_date), "PPP")} />
        </dl>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
