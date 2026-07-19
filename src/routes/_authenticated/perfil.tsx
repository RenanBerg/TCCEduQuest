import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { xpProximoNivel } from "@/lib/gamification";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: Perfil,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Perfil() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [turma, setTurma] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const uid = u.user.id;
    const [p, sc, sa, sm, xph] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("student_contents").select("id", { count: "exact", head: true }).eq("aluno_id", uid).eq("status", "concluido"),
      supabase.from("student_achievements").select("*, achievements:conquista_id(nome, icone)").eq("aluno_id", uid),
      supabase.from("student_missions").select("id", { count: "exact", head: true }).eq("aluno_id", uid).eq("status", "concluida"),
      supabase.from("xp_history").select("*").eq("aluno_id", uid).order("criado_em", { ascending: false }).limit(8),
    ]);
    const { data: answers } = await supabase.from("student_answers").select("correta").eq("aluno_id", uid);
    const acertos = (answers ?? []).filter((r) => r.correta).length;
    const perc = answers && answers.length ? Math.round((acertos / answers.length) * 100) : 0;
    setState({
      profile: p.data, concluidos: sc.count ?? 0, achievements: sa.data ?? [],
      missoesConcluidas: sm.count ?? 0, historico: xph.data ?? [],
      quizAcertos: acertos, quizTotal: answers?.length ?? 0, quizPerc: perc,
    });
    setNome(p.data?.nome_exibicao ?? "");
    setTurma(p.data?.turma ?? "");
    setAvatar(p.data?.avatar_url ?? "");
    setLoading(false);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({ nome_exibicao: nome, turma, avatar_url: avatar }).eq("id", u.user.id);
    setSaving(false);
    if (error) toast.error("Não foi possível salvar");
    else { toast.success("Perfil atualizado"); load(); }
  }

  if (loading || !state) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  const p = state.profile;
  const prog = xpProximoNivel(p?.xp_total ?? 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-6 text-white" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/20 text-2xl font-black backdrop-blur">
            {(p?.nome_exibicao ?? "A").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-black">{p?.nome_exibicao}</h1>
            <div className="text-sm opacity-90">Turma {p?.turma || "—"} · {p?.nivel_geral}</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold backdrop-blur">
            <Flame className="h-4 w-4 text-gold" /> {p?.streak_atual ?? 0}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs opacity-90"><span>XP total</span><span>{p?.xp_total} / {prog.proximo}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full" style={{ width: `${prog.percentual}%`, backgroundImage: "var(--gradient-gold)" }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={salvar} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">Editar perfil</h2>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Nome de exibição</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input" /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Turma</span>
            <select value={turma} onChange={(e) => setTurma(e.target.value)} className="input">
              {["1º Ano A","1º Ano B","2º Ano A","2º Ano B","2º Ano C","3º Ano A","3º Ano B"].map(t => <option key={t}>{t}</option>)}
            </select></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">URL do avatar</span>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="input" placeholder="opcional" /></label>
          <button disabled={saving} className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" style={{ backgroundImage: "var(--gradient-primary)" }}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">Resumo</h2>
          <Row label="Atividades concluídas" value={state.concluidos} />
          <Row label="Missões concluídas" value={state.missoesConcluidas} />
          <Row label="Badges" value={`${state.achievements.length}`} />
          <Row label="Desempenho nos quizzes" value={`${state.quizPerc}% (${state.quizAcertos}/${state.quizTotal})`} />
          <Row label="Streak atual" value={`${p?.streak_atual ?? 0} dias`} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-bold">Histórico recente de XP</h2>
        {state.historico.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem atividade ainda.</div>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {state.historico.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div className="text-sm capitalize">{h.origem.replace("_", " ")}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {h.multiplicador > 1 && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-foreground">{h.multiplicador}×</span>}
                  <span className="font-bold text-primary">+{h.pontos_finais} XP</span>
                  <span>{new Date(h.criado_em).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`.input{width:100%;border-radius:.75rem;border:1px solid var(--border);background:var(--background);padding:.55rem .75rem;font-size:.875rem}`}</style>
    </div>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}</span></div>;
}