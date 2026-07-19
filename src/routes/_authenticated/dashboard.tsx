import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Trophy, Target, CheckCircle2, TrendingUp } from "lucide-react";
import { xpProximoNivel } from "@/lib/gamification";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Dashboard() {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const uid = u.user.id;
      const [profileRes, missionsRes, achRes, concluidosRes, respostasRes, rankRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("student_missions").select("*, missions:missao_id(*)").eq("aluno_id", uid).order("criado_em", { ascending: false }).limit(4),
        supabase.from("student_achievements").select("*, achievements:conquista_id(*)").eq("aluno_id", uid).order("desbloqueada_em", { ascending: false }).limit(3),
        supabase.from("student_contents").select("id", { count: "exact", head: true }).eq("aluno_id", uid).eq("status", "concluido"),
        supabase.from("student_answers").select("correta").eq("aluno_id", uid),
        supabase.from("profiles").select("id, xp_total").order("xp_total", { ascending: false }),
      ]);
      const respostas = respostasRes.data ?? [];
      const acertos = respostas.filter((r) => r.correta).length;
      const perc = respostas.length ? Math.round((acertos / respostas.length) * 100) : 0;
      const rank = (rankRes.data ?? []).findIndex((r) => r.id === uid) + 1;
      setState({
        profile: profileRes.data,
        missions: missionsRes.data ?? [],
        achievements: achRes.data ?? [],
        concluidos: concluidosRes.count ?? 0,
        percAcertos: perc,
        totalRespostas: respostas.length,
        rank: rank || null,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !state) return <SkeletonDash />;
  const p = state.profile;
  const xp = p?.xp_total ?? 0;
  const prog = xpProximoNivel(xp);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl p-6 text-white sm:p-8" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm opacity-90">Olá,</div>
            <h1 className="truncate text-2xl font-black sm:text-3xl">{p?.nome_exibicao || "Aluno"} 👋</h1>
            <div className="mt-1 text-sm opacity-90">Turma {p?.turma || "—"} · {p?.nivel_geral}</div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
            <Flame className="h-5 w-5 text-gold" />
            <div>
              <div className="text-xs opacity-80">Streak</div>
              <div className="text-lg font-black leading-none">{p?.streak_atual ?? 0} {p?.streak_atual === 1 ? "dia" : "dias"}</div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex flex-wrap justify-between text-xs opacity-90"><span>XP · {p?.nivel_geral}</span><span>{xp} / {prog.proximo}</span></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full transition-all" style={{ width: `${prog.percentual}%`, backgroundImage: "var(--gradient-gold)" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Concluídas" value={state.concluidos} />
        <StatCard icon={TrendingUp} label="Desempenho" value={`${state.percAcertos}%`} />
        <StatCard icon={Trophy} label="Ranking" value={state.rank ? `#${state.rank}` : "—"} />
        <StatCard icon={Target} label="Missões" value={state.missions.filter((m: any) => m.status === "concluida").length} />
      </div>

      {/* Missions */}
      <section>
        <SectionHeader title="Missões ativas" href="/missoes" />
        <div className="grid gap-3 sm:grid-cols-2">
          {state.missions.length === 0 && <EmptyState msg="Nenhuma missão iniciada ainda." href="/missoes" cta="Ver missões" />}
          {state.missions.map((m: any) => {
            const total = m.missions.objetivo_quantidade;
            const perc = Math.min(100, Math.round((m.progresso_atual / total) * 100));
            return (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{m.missions.titulo}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{m.missions.tipo === "diaria" ? "Diária" : "Semanal"} · +{m.missions.recompensa_xp} XP</div>
                  </div>
                  <StatusPill status={m.status} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${perc}%`, backgroundImage: "var(--gradient-primary)" }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{m.progresso_atual} / {total}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <SectionHeader title="Conquistas recentes" href="/conquistas" />
        {state.achievements.length === 0 ? (
          <EmptyState msg="Nenhuma conquista ainda. Complete atividades para desbloquear!" href="/biblioteca" cta="Explorar biblioteca" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {state.achievements.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-card p-4" style={{ boxShadow: "0 4px 12px -4px oklch(0.82 0.16 85 / 0.35)" }}>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl" style={{ backgroundImage: "var(--gradient-gold)" }}>{a.achievements.icone}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{a.achievements.nome}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{a.achievements.descricao}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: "/missoes" | "/conquistas" | "/biblioteca" | "/ranking" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      <Link to={href} className="text-sm font-semibold text-primary hover:underline">Ver todas</Link>
    </div>
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente: { label: "Pendente", cls: "bg-muted text-muted-foreground" },
    em_andamento: { label: "Em andamento", cls: "bg-accent text-accent-foreground" },
    concluida: { label: "Concluída", cls: "bg-success/15 text-success" },
  };
  const s = map[status] ?? map.pendente;
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
}
function EmptyState({ msg, href, cta }: { msg: string; href: "/missoes" | "/conquistas" | "/biblioteca"; cta: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      <Link to={href} className="mt-3 inline-block rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">{cta}</Link>
    </div>
  );
}
function SkeletonDash() {
  return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0,1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
      </div>
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}