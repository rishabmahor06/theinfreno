import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { MarkAttendanceButton } from "@/components/mark-attendance-button";

export const Route = createFileRoute("/member/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const { data: list = [] } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wider">Attendance</h1>
        {/* <MarkAttendanceButton /> */}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-150 text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Member ID</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a: any) => {
              const ts = a.created_at ? new Date(a.created_at) : new Date(a.date);
              return (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3">{format(ts, "PPP")}</td>
                  <td className="px-4 py-3 font-mono">{format(ts, "p")}</td>
                  <td className="px-4 py-3 font-mono">{a.member_id}</td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  No attendance yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
