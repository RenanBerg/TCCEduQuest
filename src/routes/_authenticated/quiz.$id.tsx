import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { concederXP, verificarConquistas, atualizarProgressoMissoes } from "@/lib/gamification";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/quiz/$id")({
  component: QuizPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuizPage() {
  const { id } = useParams({ from: "/_authenticated/quiz/$id" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quiz, setQuiz] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questions, setQuestions] = useState<any[]>([]);
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [correct, setCorrect] = useState(0);
  const [gained, setGained] = useState(0);
  const [finished, setFinished] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const [qz, qs, prev] = await Promise.all([
        supabase.from("quizzes").select("*, subjects:disciplina_id(nome, icone, cor)").eq("id", id).maybeSingle(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("ordem"),
        supabase.from("student_answers").select("questao_id").eq("aluno_id", u.user.id),
      ]);
      setQuiz(qz.data);
      setQuestions(qs.data ?? []);
      setAnsweredIds(new Set((prev.data ?? []).map((r) => r.questao_id)));
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  if (!quiz || questions.length === 0) return <div>Quiz não encontrado.</div>;

  const q = questions[i];
  const alts = [["a", q.alternativa_a], ["b", q.alternativa_b], ["c", q.alternativa_c], ["d", q.alternativa_d]] as const;

  async function responder() {
    if (!choice || answered) return;
    setAnswered(true);
    const acertou = choice === q.resposta_correta;
    const jaRespondida = answeredIds.has(q.id);
    let xp = 0;
    if (acertou && !jaRespondida) xp = 25;

    await supabase.from("student_answers").upsert({
      aluno_id: userId,
      questao_id: q.id,
      resposta_enviada: choice,
      correta: acertou,
      xp_recebido: xp,
    }, { onConflict: "aluno_id,questao_id" });

    if (acertou) {
      setCorrect((c) => c + 1);
      if (xp > 0) {
        const res = await concederXP({ userId, origem: "quiz", referenciaId: q.id, pontos: xp });
        setGained((g) => g + res.pontosFinais);
        toast.success(`Correta! +${res.pontosFinais} XP`);
      } else {
        toast.info("Correta! (você já havia respondido antes)");
      }
    } else {
      toast.error("Resposta incorreta");
    }
  }

  async function proxima() {
    if (i + 1 >= questions.length) {
      // fim do quiz
      await atualizarProgressoMissoes(userId, "quiz");
      await verificarConquistas(userId);
      setFinished(true);
      return;
    }
    setI(i + 1);
    setChoice(null);
    setAnswered(false);
  }

  if (finished) {
    const perc = Math.round((correct / questions.length) * 100);
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <div className="rounded-3xl p-8 text-white" style={{ backgroundImage: "var(--gradient-hero)" }}>
          <Trophy className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-3 text-2xl font-black">Quiz concluído!</h1>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Acertos" value={`${correct}/${questions.length}`} />
            <Stat label="Desempenho" value={`${perc}%`} />
            <Stat label="XP ganho" value={`+${gained}`} />
          </div>
        </div>
        <Link to="/biblioteca" className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Voltar à biblioteca</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <div className="text-xs font-semibold" style={{ color: quiz.subjects?.cor }}>{quiz.subjects?.icone} {quiz.subjects?.nome}</div>
        <h1 className="text-2xl font-black">{quiz.titulo}</h1>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${((i) / questions.length) * 100}%`, backgroundImage: "var(--gradient-primary)" }} />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Questão {i + 1} de {questions.length}</div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-semibold">{q.enunciado}</p>
        <div className="mt-4 space-y-2">
          {alts.map(([k, v]) => {
            const isCorrect = answered && k === q.resposta_correta;
            const isWrong = answered && choice === k && k !== q.resposta_correta;
            return (
              <button
                key={k}
                disabled={answered}
                onClick={() => setChoice(k)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                  isCorrect ? "border-success bg-success/10" :
                  isWrong ? "border-destructive bg-destructive/10" :
                  choice === k ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
                }`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-bold uppercase">{k}</span>
                <span className="flex-1">{v}</span>
                {isCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                {isWrong && <XCircle className="h-5 w-5 text-destructive" />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-4 rounded-xl bg-accent/60 p-3 text-sm">
            <div className="font-bold">Explicação</div>
            <p className="mt-1 text-muted-foreground">{q.explicacao}</p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          {!answered ? (
            <button disabled={!choice} onClick={responder} className="rounded-full px-6 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" style={{ backgroundImage: "var(--gradient-primary)" }}>Responder</button>
          ) : (
            <button onClick={proxima} className="inline-flex items-center gap-1 rounded-full px-6 py-2 text-sm font-semibold text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
              {i + 1 >= questions.length ? "Finalizar" : "Próxima"} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
      <div className="text-[10px] uppercase opacity-80">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}