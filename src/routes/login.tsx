import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, Shield } from "lucide-react";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role as "member" | "admin") ?? "member",
  }),
  head: () => ({
    meta: [
      { title: "Login - IronFit Member & Admin Access" },
      { name: "description", content: "Sign in to your IronFit member or admin account." },
    ],
  }),
  component: LoginPage,
});

const MIN_PW = Math.max(
  1,
  Number(import.meta.env.VITE_MIN_PASSWORD_LENGTH ?? "4") || 4,
);
const passwordSchema = z.string().min(MIN_PW).max(72);

const MemberLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Member ID ya email chahiye."),
  password: passwordSchema,
});

const AdminLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Admin ID ya email chahiye."),
  password: passwordSchema,
});

const SERVER_AUTH_CONFIG_ERROR =
  "Server auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment.";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hasEmailShape(value: string) {
  return value.includes("@");
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

function isEmailNotConfirmedError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("email not confirmed");
}

function isEmailRateLimitError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("rate limit exceeded");
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

async function getServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(SERVER_AUTH_CONFIG_ERROR);
  }

  const { createClient } = await import("@supabase/supabase-js");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

const resolveMemberEmail = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof MemberLoginSchema>) => MemberLoginSchema.parse(data))
  .handler(async ({ data }) => {
    if (hasEmailShape(data.identifier)) {
      return { email: normalizeEmail(data.identifier) };
    }

    const admin = await getServiceRoleClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("email")
      .eq("member_id", data.identifier.trim())
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile?.email) {
      throw new Error("Ye Member ID mila nahi. Sahi Member ID ya email try karo.");
    }

    return { email: normalizeEmail(profile.email) };
  });

const resolveAdminEmail = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof AdminLoginSchema>) => AdminLoginSchema.parse(data))
  .handler(async ({ data }) => {
    if (hasEmailShape(data.identifier)) {
      return { email: normalizeEmail(data.identifier) };
    }

    const admin = await getServiceRoleClient();
    const { data: adminUser, error } = await admin
      .from("admin_users")
      .select("email, login_id")
      .eq("login_id", data.identifier.trim())
      .maybeSingle();

    if (error) {
      if (isAdminDirectoryMissingError(error)) {
        throw new Error(
          "Admin table abhi create nahi hui. Supabase migration run karo, phir admin ID login chalega.",
        );
      }

      throw error;
    }

    if (!adminUser?.email) {
      throw new Error("Ye Admin ID mila nahi. Admin email ya valid Admin ID try karo.");
    }

    return {
      email: normalizeEmail(adminUser.email),
      loginId: adminUser.login_id,
    };
  });

const ensureAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; email: string }) => data)
  .handler(async ({ data }) => {
    const admin = await getServiceRoleClient();
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

    let directoryEntry: Pick<
      Database["public"]["Tables"]["admin_users"]["Row"],
      "login_id"
    > | null = null;

    const { data: directoryByUser, error: directoryByUserError } = await admin
      .from("admin_users")
      .select("login_id")
      .eq("user_id", data.userId)
      .maybeSingle();

    if (directoryByUserError) {
      if (isAdminDirectoryMissingError(directoryByUserError)) {
        return {
          isAdmin: !!existingAdminRole || allowlistedAdminEmails.includes(normalizedEmail),
          loginId: buildAdminLoginId(data.userId),
          directoryReady: false,
        };
      }

      throw directoryByUserError;
    }

    directoryEntry = directoryByUser;

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
      return { isAdmin: false, loginId: null, directoryReady: true };
    }

    const loginId = directoryEntry?.login_id ?? buildAdminLoginId(data.userId);

    if (!directoryEntry) {
      const { error: ensureDirectoryError } = await admin.from("admin_users").upsert(
        {
          user_id: data.userId,
          email: normalizedEmail,
          login_id: loginId,
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

    return {
      isAdmin: true,
      loginId,
      directoryReady: true,
    };
  });

function LoginPage() {
  const { role: initialRole } = Route.useSearch();
  const navigate = useNavigate();
  const resolveMemberEmailFn = useServerFn(resolveMemberEmail);
  const resolveAdminEmailFn = useServerFn(resolveAdminEmail);
  const ensureAdminAccountFn = useServerFn(ensureAdminAccount);
  const [role, setRole] = useState<"member" | "admin">(initialRole);
  const [memberLoginForm, setMemberLoginForm] = useState({ identifier: "", password: "" });
  const [adminForm, setAdminForm] = useState({ identifier: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submitMemberLogin = async () => {
    const parsed = MemberLoginSchema.parse(memberLoginForm);
    const { email } = await resolveMemberEmailFn({ data: parsed });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.password,
    });

    if (error) {
      throw error;
    }

    toast.success("Welcome back!");
    navigate({ to: "/member" });
  };

  const submitAdminLogin = async () => {
    const parsed = AdminLoginSchema.parse(adminForm);
    const { email } = await resolveAdminEmailFn({ data: parsed });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.password,
    });

    if (error) {
      throw error;
    }

    const ensuredAdmin = await ensureAdminAccountFn({
      data: {
        userId: data.user.id,
        email: data.user.email ?? email,
      },
    });

    if (!ensuredAdmin.isAdmin) {
      await supabase.auth.signOut();
      throw new Error("Is account ko admin access nahi mila hua.");
    }

    toast.success(
      ensuredAdmin.directoryReady
        ? "Admin login successful."
        : "Admin login successful. Admin table migration pending hai.",
    );
    navigate({ to: "/admin" });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      if (role === "admin") {
        await submitAdminLogin();
      } else {
        await submitMemberLogin();
      }
    } catch (err: unknown) {
      if (isEmailNotConfirmedError(err)) {
        toast.error("Email confirm nahi hua. Admin se contact karo.");
        return;
      }

      if (isEmailRateLimitError(err)) {
        toast.error("Bahut zyada requests ho gayi hain. Thodi der baad try karo.");
        return;
      }

      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const switchRole = (nextRole: "member" | "admin") => {
    setRole(nextRole);
    navigate({ to: "/login", search: { role: nextRole }, replace: true });
  };

  return (
    <SiteShell>
      <section className="bg-surface-dark py-16 text-surface-dark-foreground">
        <div className="container mx-auto max-w-xl px-4">
          <div className="relative grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute top-1 bottom-1 w-1/2 rounded-full bg-primary"
              style={{ left: role === "member" ? "0.25rem" : "calc(50% - 0.25rem)" }}
            />
            <button
              type="button"
              onClick={() => switchRole("member")}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-display tracking-widest ${
                role === "member" ? "text-primary-foreground" : "text-white/70"
              }`}
            >
              <Dumbbell className="h-4 w-4" /> MEMBER
            </button>
            <button
              type="button"
              onClick={() => switchRole("admin")}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-display tracking-widest ${
                role === "admin" ? "text-primary-foreground" : "text-white/70"
              }`}
            >
              <Shield className="h-4 w-4" /> ADMIN
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={role}
              initial={{ opacity: 0, x: role === "member" ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: role === "member" ? 40 : -40 }}
              transition={{ duration: 0.35 }}
              onSubmit={submit}
              className="mt-8 rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur"
            >
              <h1 className="font-display text-3xl tracking-wider">
                {role === "admin" ? "Admin Login" : "Member Login"}
              </h1>
              <p className="mt-1 text-sm text-surface-dark-foreground/60">
                {role === "admin"
                  ? "Admin accounts alag directory me manage hote hain. Admin ID ya approved email use karo."
                  : "Member ID ya email se login karo. Naya member account admin hi create karta hai."}
              </p>

              <div className="mt-6 space-y-4">
                {role === "member" ? (
                  <>
                    <div>
                      <Label className="text-white/80">Member ID or Email</Label>
                      <Input
                        value={memberLoginForm.identifier}
                        onChange={(e) =>
                          setMemberLoginForm((current) => ({
                            ...current,
                            identifier: e.target.value,
                          }))
                        }
                        required
                        className="bg-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Password</Label>
                      <Input
                        type="password"
                        value={memberLoginForm.password}
                        onChange={(e) =>
                          setMemberLoginForm((current) => ({
                            ...current,
                            password: e.target.value,
                          }))
                        }
                        required
                        className="bg-white/10 text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-white/80">Admin ID or Email</Label>
                      <Input
                        value={adminForm.identifier}
                        onChange={(e) =>
                          setAdminForm((current) => ({
                            ...current,
                            identifier: e.target.value,
                          }))
                        }
                        required
                        className="bg-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Password</Label>
                      <Input
                        type="password"
                        value={adminForm.password}
                        onChange={(e) =>
                          setAdminForm((current) => ({
                            ...current,
                            password: e.target.value,
                          }))
                        }
                        required
                        className="bg-white/10 text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-6 w-full font-display tracking-widest"
                disabled={busy}
              >
                {busy ? "..." : role === "admin" ? "LOG IN AS ADMIN" : "LOG IN AS MEMBER"}
              </Button>

              <p className="mt-4 text-center text-sm text-surface-dark-foreground/60">
                {role === "member"
                  ? "Naya member account banane ke liye admin se contact karo."
                  : "Admin signup yahan se nahi hota. Existing admin account se hi login hoga."}
              </p>

              <p className="mt-2 text-center text-xs text-surface-dark-foreground/50">
                <Link to="/" className="hover:text-primary">
                  &larr; Back to home
                </Link>
              </p>
            </motion.form>
          </AnimatePresence>
        </div>
      </section>
    </SiteShell>
  );
}
