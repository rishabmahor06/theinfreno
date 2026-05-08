import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AvatarThumb } from "@/components/avatar-thumb";
import { supabase } from "@/integrations/supabase/client";

export function MarkAttendanceButton() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery({
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

  const overdue =
    !!profile &&
    differenceInDays(new Date(), new Date(profile.fee_due_date)) > 7 &&
    !profile.attendance_override;

  const submit = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Profile loading...");
      if (overdue) throw new Error("Fee overdue. Please contact admin.");
      const { error } = await supabase.from("attendance").insert({
        user_id: profile.id,
        member_id: profile.member_id,
        date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Attendance marked!");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["my-attendance-count"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Mark Attendance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
        </DialogHeader>
        {overdue && (
          <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> Fee overdue — admin permission required.
          </div>
        )}
        {profile && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 pb-2">
              <AvatarThumb url={profile.photo_url} name={profile.name} size={48} />
              <div>
                <p className="font-medium">{profile.name}</p>
                <p className="font-mono text-xs text-primary">{profile.member_id}</p>
              </div>
            </div>
            <p>
              <span className="text-muted-foreground">Member ID:</span>{" "}
              <span className="font-mono">{profile.member_id}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Name:</span> {profile.name}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {profile.email}
            </p>
            <p>
              <span className="text-muted-foreground">Mobile:</span> {profile.phone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Date:</span> {format(new Date(), "PPP")}
            </p>
          </div>
        )}
        <Button
          className="w-full"
          disabled={submit.isPending || overdue || !profile}
          onClick={() => submit.mutate()}
        >
          Confirm
        </Button>
      </DialogContent>
    </Dialog>
  );
}
