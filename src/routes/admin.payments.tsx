import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Mail, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AvatarThumb } from "@/components/avatar-thumb";
import { toast } from "sonner";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

type Member = {
  id: string;
  member_id: string;
  name: string;
  email: string;
  photo_url: string | null;
};

function AdminPayments() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    amount: 0,
    mode: "cash",
    transaction_id: "",
    payment_date: "",
  });
  const [form, setForm] = useState({
    member_id: "",
    amount: 1500,
    mode: "cash",
    transaction_id: "",
  });

  const { data: members = [] } = useQuery({
    queryKey: ["m-list"],
    queryFn: async () =>
      ((await supabase.from("profiles").select("id, member_id, name, email, photo_url")).data ?? []) as Member[],
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["all-payments"],
    queryFn: async () =>
      (await supabase.from("payments").select("*").order("payment_date", { ascending: false }))
        .data ?? [],
  });

  const selectedMember = members.find((m) => m.member_id === form.member_id);

  const memberById = new Map(members.map((m) => [m.member_id, m]));
  const filteredPayments = (payments as any[]).filter((p) => {
    if (!q) return true;
    const m = memberById.get(p.member_id);
    return [p.invoice_no, p.member_id, m?.name, m?.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase());
  });

  const add = useMutation({
    mutationFn: async () => {
      const member = members.find((m) => m.member_id === form.member_id);
      if (!member) throw new Error("Member not found");
      const { error } = await supabase.from("payments").insert({
        user_id: member.id,
        member_id: member.member_id,
        amount: form.amount,
        mode: form.mode,
        transaction_id: form.transaction_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded — invoice generated");
      setOpen(false);
      setForm({ member_id: "", amount: 1500, mode: "cash", transaction_id: "" });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("No payment selected");
      const payload = {
        amount: editForm.amount,
        mode: editForm.mode,
        transaction_id: editForm.transaction_id || null,
        ...(editForm.payment_date ? { payment_date: editForm.payment_date } : {}),
      };
      const { error } = await (supabase as any).from("payments").update(payload).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment updated");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["all-payments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment deleted");
      qc.invalidateQueries({ queryKey: ["all-payments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setEditForm({
      amount: Number(p.amount) || 0,
      mode: p.mode ?? "cash",
      transaction_id: p.transaction_id ?? "",
      payment_date: p.payment_date ? String(p.payment_date).slice(0, 10) : "",
    });
  };

  const downloadInvoice = (p: any) => {
    const m = members.find((x) => x.member_id === p.member_id);
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("IRONFIT — INVOICE", 20, 25);
    doc.setFontSize(11);
    doc.text(`Invoice #: ${p.invoice_no}`, 20, 40);
    doc.text(`Date: ${format(new Date(p.payment_date), "PPP")}`, 20, 48);
    doc.text(`Member: ${m?.name ?? ""} (${p.member_id})`, 20, 56);
    if (m?.email) doc.text(`Email: ${m.email}`, 20, 64);
    doc.text(`Mode: ${p.mode}`, 20, 72);
    doc.line(20, 80, 190, 80);
    doc.setFontSize(14);
    doc.text(`Amount: ₹${p.amount}`, 20, 92);
    doc.save(`${p.invoice_no}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl tracking-wider">Payments</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Member</Label>
                <Popover open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedMember
                        ? `${selectedMember.member_id} — ${selectedMember.name}`
                        : "Select member"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command
                      filter={(value, search) => {
                        if (!search) return 1;
                        return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder="Search by ID, name, email..." />
                      <CommandList>
                        <CommandEmpty>No member found.</CommandEmpty>
                        <CommandGroup>
                          {members.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={`${m.member_id} ${m.name} ${m.email}`}
                              onSelect={() => {
                                setForm({ ...form, member_id: m.member_id });
                                setMemberPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.member_id === m.member_id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-mono text-xs text-primary">{m.member_id}</span>
                                <span>
                                  {m.name}
                                  <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: +e.target.value })}
                />
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transaction ID (optional)</Label>
                <Input
                  value={form.transaction_id}
                  onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={add.isPending || !form.member_id}
              onClick={() => add.mutate()}
            >
              Save & Generate Invoice
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by member ID, name or invoice..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Member</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Next Due</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((p) => {
              const m = memberById.get(p.member_id);
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{p.invoice_no}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarThumb url={m?.photo_url} name={m?.name ?? p.member_id} size={32} />
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-primary">{p.member_id}</span>
                        {m?.name ? <span>{m.name}</span> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{format(new Date(p.payment_date), "PP")}</td>
                  <td className="px-4 py-3 font-semibold">₹{p.amount}</td>
                  <td className="px-4 py-3">
                    {p.next_due_date ? format(new Date(p.next_due_date), "PP") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => downloadInvoice(p)}>
                        <Mail className="mr-1 h-4 w-4" /> Invoice
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete payment ${p.invoice_no}?`)) remove.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment {editing?.invoice_no ? `— ${editing.invoice_no}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: +e.target.value })}
              />
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={editForm.mode} onValueChange={(v) => setEditForm({ ...editForm, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={editForm.payment_date}
                onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Transaction ID (optional)</Label>
              <Input
                value={editForm.transaction_id}
                onChange={(e) => setEditForm({ ...editForm, transaction_id: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={update.isPending} onClick={() => update.mutate()}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
