import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { format } from "date-fns";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { AvatarThumb } from "@/components/avatar-thumb";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/members")({ component: MembersList });

const MIN_PW = Math.max(
  1,
  Number(import.meta.env.VITE_MIN_PASSWORD_LENGTH ?? "4") || 4,
);

const PhotoSchema = z
  .string()
  .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, "Photo must be PNG/JPG/WEBP/GIF")
  .optional()
  .or(z.literal(""));

const MemberCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(MIN_PW).max(72),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  fee_amount: z.number().nonnegative().optional(),
  fee_due_date: z.string().optional(),
  joining_date: z.string().optional(),
  photo: PhotoSchema,
});

const MemberUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(MIN_PW).max(72).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  fee_amount: z.number().nonnegative().optional(),
  fee_due_date: z.string().optional(),
  joining_date: z.string().optional(),
  photo: PhotoSchema,
});

const MemberDeleteSchema = z.object({ id: z.string().uuid() });

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function generateNextMemberId(
  admin: Awaited<ReturnType<typeof getServiceRoleClient>>,
): Promise<string> {
  // Always use the active member_id_series configured in /admin/series.
  const { data: activeSeries, error: activeErr } = await (admin as any)
    .from("member_id_series")
    .select("id, prefix, next_number, padding")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeErr) {
    console.error("[member_id_series] lookup failed:", activeErr);
    throw new Error(
      `Member ID series lookup failed: ${activeErr.message}. Did you run the member_id_series migration?`,
    );
  }

  if (!activeSeries) {
    throw new Error(
      "No active member ID series. Go to /admin/series, create a series and mark it Active.",
    );
  }

  const num = activeSeries.next_number as number;
  const padding = (activeSeries.padding as number) ?? 0;
  const prefix = activeSeries.prefix as string;
  const id = padding > 0 ? `${prefix}${String(num).padStart(padding, "0")}` : `${prefix}${num}`;

  const { error: bumpErr } = await (admin as any)
    .from("member_id_series")
    .update({ next_number: num + 1, updated_at: new Date().toISOString() })
    .eq("id", activeSeries.id);
  if (bumpErr) {
    console.error("[member_id_series] bump failed:", bumpErr);
    throw new Error(`Failed to advance series: ${bumpErr.message}`);
  }

  return id;
}

async function getServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Server auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment.");
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function uploadPhotoFromDataUrl(
  admin: Awaited<ReturnType<typeof getServiceRoleClient>>,
  userId: string,
  dataUrl: string,
): Promise<string> {
  const match = dataUrl.match(/^data:(image\/(png|jpe?g|webp|gif));base64,(.+)$/);
  if (!match) throw new Error("Invalid image data");
  const contentType = match[1];
  const ext = match[2] === "jpeg" ? "jpg" : match[2];
  const base64 = match[3];
  const buffer = Buffer.from(base64, "base64");
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw error;

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

const adminCreateMember = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof MemberCreateSchema>) => MemberCreateSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
    const email = normalizeEmail(data.email);

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (error) throw error;

    const userId = created.user?.id;
    if (!userId) throw new Error("User created but no id returned.");

    const memberId = await generateNextMemberId(admin);

    const profilePayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: userId,
      member_id: memberId,
      name: data.name,
      email,
      phone: data.phone ? data.phone : null,
    };
    if (data.fee_amount !== undefined) profilePayload.fee_amount = data.fee_amount;
    if (data.fee_due_date) profilePayload.fee_due_date = data.fee_due_date;
    if (data.joining_date) profilePayload.joining_date = data.joining_date;
    if (data.photo) {
      profilePayload.photo_url = await uploadPhotoFromDataUrl(admin, userId, data.photo);
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });
    if (profileError) throw profileError;

    const { error: roleError } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "member" }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;

    return { id: userId, memberId };
  });

const adminUpdateMember = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof MemberUpdateSchema>) => MemberUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
    const email = normalizeEmail(data.email);

    const authUpdate: { email?: string; password?: string; user_metadata?: Record<string, unknown> } = {
      email,
      user_metadata: { name: data.name },
    };
    if (data.password) authUpdate.password = data.password;

    const { error: authError } = await admin.auth.admin.updateUserById(data.id, authUpdate);
    if (authError) throw authError;

    const profilePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
      name: data.name,
      email,
      phone: data.phone ? data.phone : null,
    };
    if (data.fee_amount !== undefined) profilePayload.fee_amount = data.fee_amount;
    if (data.fee_due_date) profilePayload.fee_due_date = data.fee_due_date;
    if (data.joining_date) profilePayload.joining_date = data.joining_date;
    if (data.photo) {
      profilePayload.photo_url = await uploadPhotoFromDataUrl(admin, data.id, data.photo);
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", data.id);
    if (profileError) throw profileError;

    return { ok: true };
  });

const adminDeleteMember = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof MemberDeleteSchema>) => MemberDeleteSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) throw error;
    return { ok: true };
  });

type MemberRow = Database["public"]["Tables"]["profiles"]["Row"];

type FormState = {
  id?: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  fee_amount: string;
  fee_due_date: string;
  joining_date: string;
  photo: string;
  existingPhotoUrl: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  fee_amount: "",
  fee_due_date: "",
  joining_date: "",
  photo: "",
  existingPhotoUrl: "",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function MembersList() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["all-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemberRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: z.infer<typeof MemberCreateSchema>) =>
      adminCreateMember({ data: input }),
    onSuccess: () => {
      toast.success("Member ban gaya.");
      qc.invalidateQueries({ queryKey: ["all-members"] });
      setDialogOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Create failed"),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: z.infer<typeof MemberUpdateSchema>) =>
      adminUpdateMember({ data: input }),
    onSuccess: () => {
      toast.success("Member update ho gaya.");
      qc.invalidateQueries({ queryKey: ["all-members"] });
      setDialogOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminDeleteMember({ data: { id } }),
    onSuccess: () => {
      toast.success("Member delete ho gaya.");
      qc.invalidateQueries({ queryKey: ["all-members"] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const filtered = data.filter((m) =>
    [m.member_id, m.name, m.email].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  const openCreate = () => {
    setMode("create");
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (m: MemberRow) => {
    setMode("edit");
    setForm({
      id: m.id,
      name: m.name ?? "",
      email: m.email ?? "",
      password: "",
      phone: m.phone ?? "",
      fee_amount: String(m.fee_amount ?? ""),
      fee_due_date: toDateInput(m.fee_due_date),
      joining_date: toDateInput(m.joining_date),
      photo: "",
      existingPhotoUrl: m.photo_url ?? "",
    });
    setDialogOpen(true);
  };

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setForm((f) => ({ ...f, photo: dataUrl }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fee_amount = form.fee_amount === "" ? undefined : Number(form.fee_amount);
    if (mode === "create") {
      createMutation.mutate({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        fee_amount,
        fee_due_date: form.fee_due_date || undefined,
        joining_date: form.joining_date || undefined,
        photo: form.photo || undefined,
      });
    } else if (form.id) {
      updateMutation.mutate({
        id: form.id,
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        phone: form.phone || undefined,
        fee_amount,
        fee_due_date: form.fee_due_date || undefined,
        joining_date: form.joining_date || undefined,
        photo: form.photo || undefined,
      });
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl tracking-wider">Members</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New member
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by member ID, name, email..."
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-180 text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Photo</th>
              <th className="px-4 py-3 text-left">Member ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Due</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <AvatarThumb url={m.photo_url} name={m.name} size={36} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-primary">{m.member_id}</td>
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.phone ?? "—"}</td>
                <td className="px-4 py-3">{m.joining_date ? format(new Date(m.joining_date), "PP") : "—"}</td>
                <td className="px-4 py-3">{m.fee_due_date ? format(new Date(m.fee_due_date), "PP") : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New member" : "Edit member"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Photo (optional)</Label>
              <div className="mt-1 flex items-center gap-4">
                <AvatarThumb
                  url={form.photo || form.existingPhotoUrl || null}
                  name={form.name}
                  size={64}
                />
                <div className="flex flex-col gap-2">
                  <Input type="file" accept="image/*" onChange={onPhotoChange} />
                  {(form.photo || form.existingPhotoUrl) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="self-start text-destructive"
                      onClick={() =>
                        setForm((f) => ({ ...f, photo: "", existingPhotoUrl: "" }))
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{mode === "create" ? "Password" : "New password (optional)"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={mode === "create"}
                minLength={mode === "create" ? MIN_PW : undefined}
                placeholder={mode === "edit" ? "Leave blank to keep current" : `Min ${MIN_PW} characters`}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fee amount</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.fee_amount}
                  onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Joining date</Label>
                <DatePicker
                  value={form.joining_date}
                  onChange={(v) => setForm({ ...form, joining_date: v })}
                />
              </div>
            </div>
            <div>
              <Label>Fee due date</Label>
              <DatePicker
                value={form.fee_due_date}
                onChange={(v) => setForm({ ...form, fee_due_date: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.name} ({deleteTarget?.email}) ka account, profile aur role permanently delete ho jayega.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
