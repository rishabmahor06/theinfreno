import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";

export const Route = createFileRoute("/member/fees")({ component: FeesPage });

function FeesPage() {
  const { data: payments = [] } = useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const downloadInvoice = (p: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("IRONFIT — INVOICE", 20, 25);
    doc.setFontSize(11);
    doc.text(`Invoice #: ${p.invoice_no}`, 20, 40);
    doc.text(`Date: ${format(new Date(p.payment_date), "PPP")}`, 20, 48);
    doc.text(`Member ID: ${p.member_id}`, 20, 56);
    doc.text(`Mode: ${p.mode}`, 20, 64);
    if (p.transaction_id) doc.text(`Txn ID: ${p.transaction_id}`, 20, 72);
    doc.line(20, 80, 190, 80);
    doc.setFontSize(14);
    doc.text(`Amount Paid: ₹${p.amount}`, 20, 92);
    doc.setFontSize(10);
    doc.text(`Next Due: ${p.next_due_date ? format(new Date(p.next_due_date), "PPP") : "-"}`, 20, 102);
    doc.text("Thank you for being part of IronFit.", 20, 130);
    doc.save(`${p.invoice_no}.pdf`);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-wider">Fee Payments</h1>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Mode</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{p.invoice_no}</td>
                <td className="px-4 py-3">{format(new Date(p.payment_date), "PP")}</td>
                <td className="px-4 py-3 capitalize">{p.mode}</td>
                <td className="px-4 py-3 font-semibold">₹{p.amount}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => downloadInvoice(p)}>
                    <Download className="mr-1 h-4 w-4" /> Invoice
                  </Button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
