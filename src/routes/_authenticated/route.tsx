import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";
import { LayoutDashboard, BookOpen, Target, Trophy, Medal, User, LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/missoes", label: "Missões", icon: Target },
  { to: "/conquistas", label: "Conquistas", icon: Medal },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

function AuthedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [nome, setNome] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("nome_exibicao").eq("id", data.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle(),
      ]);
      setNome(p?.nome_exibicao ?? "Aluno");
      setIsAdmin(!!r);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 p-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl text-lg font-bold text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>E</div>
          <span className="text-lg font-bold">EduQuest</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "text-primary-foreground shadow-sm" : "text-foreground hover:bg-accent"}`}
                style={active ? { backgroundImage: "var(--gradient-primary)" } : undefined}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname.startsWith("/admin") ? "text-primary-foreground shadow-sm" : "text-foreground hover:bg-accent"}`}
              style={pathname.startsWith("/admin") ? { backgroundImage: "var(--gradient-primary)" } : undefined}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 truncate text-xs text-muted-foreground">Olá, <span className="font-semibold text-foreground">{nome}</span></div>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>E</div>
          <span className="font-bold">EduQuest</span>
        </div>
        <button onClick={signOut} className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="pb-24 lg:ml-64 lg:pb-8">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        {navItems.map((n) => {
          const active = pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}