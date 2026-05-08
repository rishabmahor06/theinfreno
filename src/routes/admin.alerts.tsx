import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AvatarThumb } from "@/components/avatar-thumb";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/alerts")({ component: AdminAlerts });

function AdminAlerts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["alert-members"],
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("id, member_id, name, fee_due_date, alert_disabled, attendance_override, photo_url")
          .order("fee_due_date")
      ).data ?? [],
  });

  const toggle = async (
    id: string,
    field: "alert_disabled" | "attendance_override",
    value: boolean,
  ) => {
    const patch = { [field]: value } as { alert_disabled?: boolean; attendance_override?: boolean };
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["alert-members"] });
    }
  };

  const filtered = (data as any[]).filter((m) =>
    [m.member_id, m.name].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-wider">Alerts & Permissions</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by member ID or name..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Member</th>
              <th className="px-4 py-3 text-left">Due</th>
              <th className="px-4 py-3 text-left">Disable Alert</th>
              <th className="px-4 py-3 text-left">Allow Attendance (overdue)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AvatarThumb url={m.photo_url} name={m.name} size={32} />
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-primary">{m.member_id}</span>
                      <span>{m.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{m.fee_due_date}</td>
                <td className="px-4 py-3">
                  <Switch
                    checked={m.alert_disabled}
                    onCheckedChange={(v) => toggle(m.id, "alert_disabled", v)}
                  />
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={m.attendance_override}
                    onCheckedChange={(v) => toggle(m.id, "attendance_override", v)}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
