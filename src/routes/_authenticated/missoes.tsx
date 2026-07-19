import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, CalendarDays, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/missoes")({
  component: Missoes,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Missoes() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"diaria" | "semanal">("diaria");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [ms, sm] = await Promise.all([
        supabase.from("missions").select("*, subjects:disciplina_id(nome, icone)").eq("ativo", true),
        supabase.from("student_missions").select("*").eq("aluno_id", u.user.id),
      ]);
      const map = new Map((sm.data ?? []).map((s) => [s.missao_id, s]));
      const merged = (ms.data ?? []).map((m) => ({ ...m, student: map.get(m.id) }));
      setRows(merged);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => r.tipo === tab);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Missões</h1>
        <p className="text-sm text-muted-foreground">Complete desafios para ganhar XP e subir no ranking.</p>
      </div>

      <div className="inline-flex rounded-full border border-border bg-card p-1">
        <TabBtn active={tab === "diaria"} onClick={() => setTab("diaria")}><CalendarDays className="h-3.5 w-3.5" /> Diárias</TabBtn>
        <TabBtn active={tab === "semanal"} onClick={() => setTab("semanal")}><Sparkles className="h-3.5 w-3.5" /> Semanais</TabBtn>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((m) => {
            const prog = m.student?.progresso_atual ?? 0;
            const total = m.objetivo_quantidade;
            const perc = Math.min(100, Math.round((prog / total) * 100));
            const status = m.student?.status ?? "pendente";
            return (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Target className="h-3 w-3" /> {m.tipo === "diaria" ? "Diária" : "Semanal"}
                      {m.subjects && <span>· {m.subjects.icone} {m.subjects.nome}</span>}
                    </div>
                    <div className="font-bold">{m.titulo}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{m.descricao}</div>
                  </div>
                  <div className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-gold-foreground" style={{ backgroundImage: "var(--gradient-gold)" }}>+{m.recompensa_xp} XP</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${perc}%`, backgroundImage: status === "concluida" ? "linear-gradient(135deg, oklch(0.68 0.17 155), oklch(0.60 0.15 155))" : "var(--gradient-primary)" }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{prog} / {total} · {m.prazo}</span>
                  <StatusPill status={status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${active ? "text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
      style={active ? { backgroundImage: "var(--gradient-primary)" } : undefined}>{children}</button>
  );
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente: { label: "Pendente", cls: "bg-muted text-muted-foreground" },
    em_andamento: { label: "Em andamento", cls: "bg-accent text-accent-foreground" },
    concluida: { label: "Concluída ✓", cls: "bg-success/15 text-success" },
  };
  const s = map[status] ?? map.pendente;
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
}