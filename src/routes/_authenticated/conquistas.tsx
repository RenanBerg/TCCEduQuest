import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/conquistas")({
  component: Conquistas,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Conquistas() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [ach, sa] = await Promise.all([
        supabase.from("achievements").select("*"),
        supabase.from("student_achievements").select("*").eq("aluno_id", u.user.id),
      ]);
      setItems(ach.data ?? []);
      const m: Record<string, string> = {};
      (sa.data ?? []).forEach((r) => { m[r.conquista_id] = r.desbloqueada_em; });
      setUnlocked(m);
      setLoading(false);
    })();
  }, []);

  const total = items.length;
  const feitas = Object.keys(unlocked).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Conquistas</h1>
          <p className="text-sm text-muted-foreground">Desbloqueie badges completando desafios.</p>
        </div>
        <div className="rounded-full px-4 py-1.5 text-sm font-bold text-gold-foreground" style={{ backgroundImage: "var(--gradient-gold)" }}>{feitas} / {total}</div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2,3,4,5].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const done = !!unlocked[a.id];
            return (
              <div key={a.id} className={`rounded-2xl border p-4 transition ${done ? "border-gold/50 bg-card" : "border-border bg-card/60 grayscale"}`} style={done ? { boxShadow: "0 4px 16px -6px oklch(0.82 0.16 85 / 0.5)" } : undefined}>
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl" style={{ backgroundImage: done ? "var(--gradient-gold)" : "linear-gradient(135deg, oklch(0.85 0.01 260), oklch(0.75 0.01 260))" }}>
                    {done ? a.icone : <Lock className="h-5 w-5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold">{a.nome}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{a.descricao}</div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide">
                  {done ? (
                    <span className="text-success">Desbloqueada · {new Date(unlocked[a.id]).toLocaleDateString("pt-BR")}</span>
                  ) : (
                    <span className="text-muted-foreground">Bloqueada</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}