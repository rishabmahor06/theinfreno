import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact IronFit — Visit, Call or Message Us" },
      { name: "description", content: "Get in touch with the IronFit team. Address, phone, and direct contact form." },
    ],
  }),
  component: ContactPage,
});

const Schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10).max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = Schema.parse(form);
      const { error } = await supabase.from("contact_messages").insert(parsed);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Thanks! We'll get back to you soon."); setForm({ name: "", email: "", phone: "", message: "" }); },
    onError: (e: any) => toast.error(e.message ?? "Could not send"),
  });

  return (
    <SiteShell>
      <section className="bg-surface-dark py-16 text-surface-dark-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Get In Touch</p>
          <h1 className="mt-3 font-display text-5xl">Contact Us</h1>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-6">
              <MapPin className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm font-semibold">Address</p>
              <p className="text-sm text-muted-foreground">500 South Capitol Avenue<br />Indianapolis, IN 46225</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <Phone className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm font-semibold">Phone</p>
              <p className="text-sm text-muted-foreground">+1 79 123 5578</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <Clock className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm font-semibold">Open Hours</p>
              <p className="text-sm text-muted-foreground">Mon – Sat · 5am – 10pm</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <h2 className="font-display text-2xl tracking-wider">Send a message</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="sm:col-span-2"><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Message</Label><Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
            </div>
            <Button type="submit" size="lg" className="mt-6 font-display tracking-widest" disabled={submit.isPending}>
              {submit.isPending ? "SENDING..." : "SEND MESSAGE"}
            </Button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
