import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/admin/series")({ component: SeriesAdmin });

const SeriesCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  prefix: z.string().trim().min(1).max(20),
  start_number: z.number().int().nonnegative(),
  padding: z.number().int().min(0).max(12).optional(),
  is_active: z.boolean().optional(),
});
const SeriesUpdateSchema = SeriesCreateSchema.extend({
  id: z.string().uuid(),
  next_number: z.number().int().nonnegative(),
});
const SeriesDeleteSchema = z.object({ id: z.string().uuid() });
const SeriesActivateSchema = z.object({ id: z.string().uuid() });

async function getServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Server auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY.");
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const listSeries = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await getServiceRoleClient();
  const { data, error } = await admin
    .from("member_id_series")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SeriesRow[];
});

const createSeries = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof SeriesCreateSchema>) => SeriesCreateSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
    const { error } = await admin.from("member_id_series").insert({
      name: data.name,
      prefix: data.prefix,
      start_number: data.start_number,
      next_number: data.start_number,
      padding: data.padding ?? 0,
      is_active: data.is_active ?? false,
    });
    if (error) throw error;
    return { ok: true };
  });

const updateSeries = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof SeriesUpdateSchema>) => SeriesUpdateSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
    const { error } = await admin
      .from("member_id_series")
      .update({
        name: data.name,
        prefix: data.prefix,
        start_number: data.start_number,
        next_number: data.next_number,
        padding: data.padding ?? 0,
        is_active: data.is_active ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const deleteSeries = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof SeriesDeleteSchema>) => SeriesDeleteSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
    const { error } = await admin.from("member_id_series").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const activateSeries = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof SeriesActivateSchema>) => SeriesActivateSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
    const { error } = await admin
      .from("member_id_series")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

type SeriesRow = {
  id: string;
  name: string;
  prefix: string;
  start_number: number;
  next_number: number;
  padding: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FormState = {
  id?: string;
  name: string;
  prefix: string;
  start_number: number;
  next_number: number;
  padding: number;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  prefix: "RR-",
  start_number: 1001,
  next_number: 1001,
  padding: 0,
  is_active: false,
};

function previewId(f: { prefix: string; next_number: number; padding: number }) {
  const n = f.padding > 0 ? String(f.next_number).padStart(f.padding, "0") : String(f.next_number);
  return `${f.prefix}${n}`;
}

function SeriesAdmin() {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({
    queryKey: ["member_id_series"],
    queryFn: () => listSeries(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["member_id_series"] });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      createSeries({
        data: {
          name: f.name,
          prefix: f.prefix,
          start_number: f.start_number,
          padding: f.padding,
          is_active: f.is_active,
        },
      }),
    onSuccess: () => { toast.success("Series created"); invalidate(); setOpen(false); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create"),
  });

  const updateMut = useMutation({
    mutationFn: (f: FormState) =>
      updateSeries({
        data: {
          id: f.id!,
          name: f.name,
          prefix: f.prefix,
          start_number: f.start_number,
          next_number: f.next_number,
          padding: f.padding,
          is_active: f.is_active,
        },
      }),
    onSuccess: () => { toast.success("Series updated"); invalidate(); setOpen(false); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSeries({ data: { id } }),
    onSuccess: () => { toast.success("Series deleted"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => activateSeries({ data: { id } }),
    onSuccess: () => { toast.success("Series activated"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to activate"),
  });

  function openCreate() {
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(s: SeriesRow) {
    setForm({
      id: s.id,
      name: s.name,
      prefix: s.prefix,
      start_number: s.start_number,
      next_number: s.next_number,
      padding: s.padding,
      is_active: s.is_active,
    });
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.prefix.trim()) {
      toast.error("Name and prefix are required");
      return;
    }
    if (form.id) updateMut.mutate(form);
    else createMut.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wider">Member ID Series</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define ID format (e.g. RR-6521). New members get the next number from the active series.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Series
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading...</p>
        ) : list.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No series yet. Create one to start generating member IDs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Prefix</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">Next</th>
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3 font-mono">{s.prefix}</td>
                    <td className="px-4 py-3">{s.start_number}</td>
                    <td className="px-4 py-3">{s.next_number}</td>
                    <td className="px-4 py-3 font-mono text-primary">{previewId(s)}</td>
                    <td className="px-4 py-3">
                      {s.is_active ? (
                        <span className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">Active</span>
                      ) : (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!s.is_active && (
                          <Button size="sm" variant="secondary" onClick={() => activateMut.mutate(s.id)}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Activate
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete series "${s.name}"?`)) deleteMut.mutate(s.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Series" : "Create Series"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="2026 Batch" />
              </div>
              <div>
                <Label>Prefix</Label>
                <Input value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} placeholder="RR-" />
              </div>
              <div>
                <Label>Start Number</Label>
                <Input type="number" value={form.start_number}
                  onChange={(e) => {
                    const n = Number(e.target.value) || 0;
                    setForm((f) => ({ ...f, start_number: n, next_number: f.id ? f.next_number : n }));
                  }} />
              </div>
              {form.id && (
                <div>
                  <Label>Next Number</Label>
                  <Input type="number" value={form.next_number}
                    onChange={(e) => setForm({ ...form, next_number: Number(e.target.value) || 0 })} />
                </div>
              )}
              <div>
                <Label>Padding (zeros)</Label>
                <Input type="number" min={0} max={12} value={form.padding}
                  onChange={(e) => setForm({ ...form, padding: Number(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end gap-2">
                <input id="active" type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <Label htmlFor="active">Active series</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Preview: <span className="font-mono text-primary">{previewId(form)}</span>
            </p>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {form.id ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
