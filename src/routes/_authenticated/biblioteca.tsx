import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, FileText, Dumbbell, Link as LinkIcon, Clock, Check, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { concluirConteudo, registrarInicioConteudo } from "@/lib/gamification";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  component: Biblioteca,
});

const tipoIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Play, texto: FileText, exercicio: Dumbbell, link: LinkIcon,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Biblioteca() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contents, setContents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subjects, setSubjects] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fDisc, setFDisc] = useState<string>("todas");
  const [fTema, setFTema] = useState<string>("todos");
  const [fTipo, setFTipo] = useState<string>("todos");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const [c, s, sc] = await Promise.all([
        supabase.from("contents").select("*, subjects:disciplina_id(nome, icone, cor)").order("titulo"),
        supabase.from("subjects").select("*"),
        supabase.from("student_contents").select("conteudo_id, status").eq("aluno_id", u.user.id),
      ]);
      setContents(c.data ?? []);
      setSubjects(s.data ?? []);
      const map: Record<string, string> = {};
      (sc.data ?? []).forEach((r) => { map[r.conteudo_id] = r.status; });
      setProgress(map);
      setLoading(false);
    })();
  }, []);

  const temas = useMemo(() => {
    const set = new Set<string>();
    contents.forEach((c) => { if (fDisc === "todas" || c.disciplina_id === fDisc) set.add(c.tema); });
    return Array.from(set);
  }, [contents, fDisc]);

  const filtered = contents.filter((c) => {
    if (fDisc !== "todas" && c.disciplina_id !== fDisc) return false;
    if (fTema !== "todos" && c.tema !== fTema) return false;
    if (fTipo !== "todos" && c.tipo !== fTipo) return false;
    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function iniciar(c: any) {
    if (progress[c.id] === "concluido") return;
    await registrarInicioConteudo(userId, c.id);
    setProgress((p) => ({ ...p, [c.id]: "iniciado" }));
    const res = await concluirConteudo(userId, c);
    if (res.alreadyDone) {
      toast.info("Você já concluiu esse conteúdo.");
    } else {
      toast.success(`+${res.gained} XP${res.multiplicador === 2 ? " (2× streak)" : ""} 🎉`);
      setProgress((p) => ({ ...p, [c.id]: "concluido" }));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">Explore conteúdos e ganhe XP concluindo cada atividade.</p>
      </div>

      <QuizzesRow />

      <div className="grid gap-2 sm:grid-cols-3">
        <select className="rounded-xl border border-border bg-card px-3 py-2 text-sm" value={fDisc} onChange={(e) => { setFDisc(e.target.value); setFTema("todos"); }}>
          <option value="todas">Todas as disciplinas</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.icone} {s.nome}</option>)}
        </select>
        <select className="rounded-xl border border-border bg-card px-3 py-2 text-sm" value={fTema} onChange={(e) => setFTema(e.target.value)}>
          <option value="todos">Todos os temas</option>
          {temas.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="rounded-xl border border-border bg-card px-3 py-2 text-sm" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          <option value="video">Vídeo</option>
          <option value="texto">Texto</option>
          <option value="exercicio">Exercício</option>
          <option value="link">Link externo</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum conteúdo encontrado com esses filtros.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => {
            const Icon = tipoIcon[c.tipo] ?? FileText;
            const done = progress[c.id] === "concluido";
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.subjects?.cor }}>
                    <span>{c.subjects?.icone}</span> {c.subjects?.nome} · {c.tema}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    <Icon className="h-3 w-3" /> {c.tipo}
                  </span>
                </div>
                <h3 className="mt-2 font-bold">{c.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.descricao}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{c.duracao} min · +{c.pontos_recompensa} XP</div>
                  <button
                    disabled={done}
                    onClick={() => iniciar(c)}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-70"
                    style={{ backgroundImage: done ? "linear-gradient(135deg, oklch(0.68 0.17 155), oklch(0.60 0.15 155))" : "var(--gradient-primary)" }}
                  >
                    {done ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" />Concluído</span> : "Iniciar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuizzesRow() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizzes, setQuizzes] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("quizzes").select("*, subjects:disciplina_id(nome, icone, cor)").then((r) => setQuizzes(r.data ?? []));
  }, []);
  if (!quizzes.length) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Quizzes disponíveis</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {quizzes.map((q) => (
          <Link key={q.id} to="/quiz/$id" params={{ id: q.id }} className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: q.subjects?.cor }}>{q.subjects?.icone} {q.subjects?.nome}</div>
            <div className="mt-1 flex items-center gap-1 font-bold"><Sparkles className="h-4 w-4 text-gold" /> {q.titulo}</div>
            <div className="mt-1 text-xs text-muted-foreground">{q.descricao}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}