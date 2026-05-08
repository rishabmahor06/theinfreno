import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Activity,
  Apple,
  Calendar,
  CreditCard,
  Dumbbell,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { MarkAttendanceButton } from "@/components/mark-attendance-button";
import { AvatarThumb } from "@/components/avatar-thumb";

export const Route = createFileRoute("/member")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { role: "member" } });
  },
  component: MemberLayout,
});

const NAV = [
  { to: "/member", label: "Dashboard", icon: Activity, exact: true },
  { to: "/member/attendance", label: "Attendance", icon: Calendar },
  { to: "/member/profile", label: "Profile", icon: User },
  { to: "/member/fees", label: "Fees", icon: CreditCard },
  { to: "/member/diet", label: "Diet", icon: Apple },
  { to: "/member/workouts", label: "Workouts", icon: Dumbbell },
] as const;

function MemberLayout() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["my-profile-sidebar"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("name, member_id, photo_url")
        .eq("id", auth.user.id)
        .maybeSingle();
      return data;
    },
  });

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 p-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Dumbbell className="h-5 w-5" />
        </div>
        <span className="font-display text-2xl tracking-wider">IRONFIT</span>
      </div>
      <nav className="flex-1 px-3">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: "exact" in n ? n.exact : false }}
            activeProps={{ className: "bg-sidebar-accent text-primary" }}
            className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent"
            onClick={() => setMobileOpen(false)}
          >
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 border-t border-sidebar-border p-4">
        {profile && (
          <div className="mb-3 flex items-center gap-3">
            <AvatarThumb url={profile.photo_url} name={profile.name} size={40} />
            <div className="text-xs text-sidebar-foreground/70">
              <div>{profile.name}</div>
              <div className="text-primary">{profile.member_id}</div>
            </div>
          </div>
        )}
        <div className="flex gap-2">
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
              navigate({ to: "/login", search: { role: "member" } });
            }}
            className="flex-1 justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden lg:block lg:w-64 lg:min-h-screen">{sidebarContent}</aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <main className="flex-1 bg-background">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-10">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto">
            <MarkAttendanceButton />
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
