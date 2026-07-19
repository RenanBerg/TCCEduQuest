import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Target, BookOpen, HelpCircle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/admin/missoes", label: "Missões", icon: Target },
  { to: "/admin/conteudos", label: "Conteúdos", icon: BookOpen },
  { to: "/admin/quizzes", label: "Quizzes", icon: HelpCircle },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Painel do Administrador</h1>
          <p className="text-sm text-muted-foreground">Gerencie missões, conteúdos e quizzes da plataforma.</p>
        </div>
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                active ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}