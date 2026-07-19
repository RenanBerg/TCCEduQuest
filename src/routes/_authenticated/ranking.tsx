import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ranking")({
  component: Ranking,
});

type Entry = { id: string; nome_exibicao: string; turma: string | null; avatar_url: string | null; nivel_geral: string; xp_total: number; me?: boolean };

function Ranking() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState("todas");
  const [meId, setMeId] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMeId(u.user?.id ?? "");
      const [profiles, demo] = await Promise.all([
        supabase.from("profiles").select("id, nome_exibicao, turma, avatar_url, nivel_geral, xp_total"),
        supabase.from("demo_ranking").select("id, nome_exibicao, turma, avatar_url, nivel_geral, xp_total"),
      ]);
      const combined: Entry[] = [
        ...(profiles.data ?? []).map((p) => ({
          ...p,
          nome_exibicao: p.nome_exibicao ?? "Aluno",
          me: p.id === u.user?.id,
        })),
        ...(demo.data ?? []),
      ];
      combined.sort((a, b) => b.xp_total - a.xp_total);
      setRows(combined);
      setLoading(false);
    })();
  }, []);

  const turmas = useMemo(() => Array.from(new Set(rows.map((r) => r.turma).filter((t): t is string => !!t))), [rows]);
  const filtered = turma === "todas" ? rows : rows.filter((r) => r.turma === turma);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Ranking</h1>
          <p className="text-sm text-muted-foreground">Compare seu progresso com outros alunos.</p>
        </div>
        <select value={turma} onChange={(e) => setTurma(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
          <option value="todas">Todas as turmas</option>
          {turmas.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[0,1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : (
        <>
          {/* Pódio */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[1, 0, 2].map((idx) => {
              const p = filtered[idx];
              if (!p) return <div key={idx} />;
              const height = idx === 0 ? "h-32" : idx === 1 ? "h-24" : "h-20";
              const rank = idx + 1;
              const gold = idx === 0;
              return (
                <div key={p.id} className="flex flex-col items-center">
                  <Avatar name={p.nome_exibicao} big={idx === 0} />
                  <div className="mt-1 max-w-full truncate text-center text-xs font-bold">{p.nome_exibicao}</div>
                  <div className="text-[10px] text-muted-foreground">{p.turma}</div>
                  <div className={`mt-2 flex w-full flex-col items-center justify-center rounded-t-xl ${height}`} style={{ backgroundImage: gold ? "var(--gradient-gold)" : idx === 1 ? "linear-gradient(135deg, oklch(0.85 0.01 260), oklch(0.72 0.02 260))" : "linear-gradient(135deg, oklch(0.75 0.08 40), oklch(0.65 0.10 45))" }}>
                    <Trophy className="h-5 w-5 text-white" />
                    <div className="text-lg font-black text-white">#{rank}</div>
                    <div className="text-[10px] font-semibold text-white/90">{p.xp_total} XP</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista */}
          <div className="rounded-2xl border border-border bg-card">
            {filtered.slice(3).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${p.me ? "bg-primary/5" : ""}`}>
                <div className="w-7 text-sm font-bold text-muted-foreground">#{i + 4}</div>
                <Avatar name={p.nome_exibicao} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.nome_exibicao} {p.me && <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">você</span>}</div>
                  <div className="text-xs text-muted-foreground">{p.turma} · {p.nivel_geral}</div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold">
                  <Medal className="h-3.5 w-3.5 text-gold" /> {p.xp_total}
                </div>
              </div>
            ))}
            {filtered.length <= 3 && filtered.length > 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">Fim do ranking desta turma.</div>
            )}
            {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum aluno nesta turma.</div>}
          </div>
        </>
      )}
    </div>
  );
}

function Avatar({ name, big = false }: { name: string; big?: boolean }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`grid ${big ? "h-14 w-14 text-lg" : "h-9 w-9 text-sm"} shrink-0 place-items-center rounded-full font-bold text-white`} style={{ backgroundImage: "var(--gradient-primary)" }}>
      {initials}
    </div>
  );
}