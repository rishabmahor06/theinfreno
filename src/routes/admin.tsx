import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, Bell, CreditCard, Dumbbell, LogOut, Menu, Moon, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function buildAdminLoginId(userId: string) {
  return `ADM-${userId.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function getAdminEmailAllowlist() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminDirectoryMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("admin_users") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("could not find"))
  );
}

const ensureAdminAccess = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; email: string }) => data)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return { isAdmin: false };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const normalizedEmail = normalizeEmail(data.email);
    const allowlistedAdminEmails = getAdminEmailAllowlist();

    const { data: existingAdminRole, error: existingAdminRoleError } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", data.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (existingAdminRoleError) {
      throw existingAdminRoleError;
    }

    const { data: directoryByUser, error: directoryByUserError } = await admin
      .from("admin_users")
      .select("login_id")
      .eq("user_id", data.userId)
      .maybeSingle();

    if (directoryByUserError) {
      if (isAdminDirectoryMissingError(directoryByUserError)) {
        return {
          isAdmin: !!existingAdminRole || allowlistedAdminEmails.includes(normalizedEmail),
        };
      }

      throw directoryByUserError;
    }

    let directoryEntry = directoryByUser;

    if (!directoryEntry) {
      const { data: directoryByEmail, error: directoryByEmailError } = await admin
        .from("admin_users")
        .select("login_id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (directoryByEmailError) {
        throw directoryByEmailError;
      }

      directoryEntry = directoryByEmail;
    }

    const canAccessAdmin =
      !!directoryEntry || !!existingAdminRole || allowlistedAdminEmails.includes(normalizedEmail);

    if (!canAccessAdmin) {
      return { isAdmin: false };
    }

    if (!directoryEntry) {
      const { error: ensureDirectoryError } = await admin.from("admin_users").upsert(
        {
          user_id: data.userId,
          email: normalizedEmail,
          login_id: buildAdminLoginId(data.userId),
        },
        { onConflict: "user_id", ignoreDuplicates: false },
      );

      if (ensureDirectoryError) {
        throw ensureDirectoryError;
      }
    }

    const { error: ensureAdminRoleError } = await admin.from("user_roles").upsert(
      {
        user_id: data.userId,
        role: "admin",
      },
      { onConflict: "user_id,role" },
    );

    if (ensureAdminRoleError) {
      throw ensureAdminRoleError;
    }

    return { isAdmin: true };
  });

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      throw redirect({ to: "/login", search: { role: "admin" } });
    }

    const ensured = await ensureAdminAccess({
      data: {
        userId: sessionData.session.user.id,
        email: sessionData.session.user.email ?? "",
      },
    });

    if (!ensured.isAdmin) {
      throw redirect({ to: "/login", search: { role: "admin" } });
    }
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: Activity, exact: true },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/alerts", label: "Alerts", icon: Bell },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 p-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <span className="block font-display text-2xl tracking-wider">IRONFIT</span>
          <span className="text-xs text-primary">ADMIN</span>
        </div>
      </div>
      <nav className="flex-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: "exact" in item ? item.exact : false }}
            activeProps={{ className: "bg-sidebar-accent text-primary" }}
            className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent"
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 flex gap-2 border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/login", search: { role: "admin" } });
          }}
          className="flex-1 justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden lg:block lg:min-h-screen lg:w-64">{sidebarContent}</aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <main className="flex-1 bg-background">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display tracking-wider">IRONFIT ADMIN</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
