import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/quizzes")({
  component: AdminQuizzes,
});

type Quiz = { id: string; titulo: string; descricao: string; tema: string; disciplina_id: string };
type Subject = { id: string; nome: string };
type Question = {
  id: string;
  quiz_id: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  explicacao: string;
  ordem: number;
};

const emptyQuiz: Omit<Quiz, "id"> = { titulo: "", descricao: "", tema: "", disciplina_id: "" };
const emptyQuestion: Omit<Question, "id" | "quiz_id"> = {
  enunciado: "",
  alternativa_a: "",
  alternativa_b: "",
  alternativa_c: "",
  alternativa_d: "",
  resposta_correta: "a",
  explicacao: "",
  ordem: 1,
};

function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Quiz | (Omit<Quiz, "id"> & { id?: string }) | null>(null);
  const [managingQuiz, setManagingQuiz] = useState<Quiz | null>(null);

  async function load() {
    setLoading(true);
    const [q, s] = await Promise.all([
      supabase.from("quizzes").select("*").order("titulo"),
      supabase.from("subjects").select("id, nome").order("nome"),
    ]);
    setQuizzes((q.data ?? []) as Quiz[]);
    setSubjects((s.data ?? []) as Subject[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveQuiz() {
    if (!editing) return;
    if (!editing.titulo.trim() || !editing.disciplina_id) return toast.error("Título e disciplina são obrigatórios.");
    const payload = { titulo: editing.titulo, descricao: editing.descricao, tema: editing.tema, disciplina_id: editing.disciplina_id };
    const res = editing.id
      ? await supabase.from("quizzes").update(payload).eq("id", editing.id)
      : await supabase.from("quizzes").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Quiz salvo!");
    setEditing(null);
    load();
  }

  async function removeQuiz(id: string) {
    if (!confirm("Excluir este quiz e todas as suas questões?")) return;
    await supabase.from("questions").delete().eq("quiz_id", id);
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Quiz excluído.");
    load();
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s.nome]));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...emptyQuiz })} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4" /> Novo quiz
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum quiz cadastrado.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Título</th>
                <th className="p-3">Disciplina</th>
                <th className="p-3">Tema</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id} className="border-t border-border">
                  <td className="p-3 font-medium">{q.titulo}</td>
                  <td className="p-3">{subjectMap.get(q.disciplina_id) ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{q.tema}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setManagingQuiz(q)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-accent">
                        <ListChecks className="h-4 w-4" /> Questões
                      </button>
                      <button onClick={() => setEditing(q)} className="rounded-lg p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => removeQuiz(q.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing.id ? "Editar quiz" : "Novo quiz"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Título"><input className="input" value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} /></Field>
              <Field label="Descrição"><textarea className="input min-h-20" value={editing.descricao} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tema"><input className="input" value={editing.tema} onChange={(e) => setEditing({ ...editing, tema: e.target.value })} /></Field>
                <Field label="Disciplina">
                  <select className="input" value={editing.disciplina_id} onChange={(e) => setEditing({ ...editing, disciplina_id: e.target.value })}>
                    <option value="">Selecione…</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 text-sm hover:bg-accent">Cancelar</button>
              <button onClick={saveQuiz} className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow" style={{ backgroundImage: "var(--gradient-primary)" }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {managingQuiz && <QuestionsManager quiz={managingQuiz} onClose={() => setManagingQuiz(null)} />}
    </div>
  );
}

function QuestionsManager({ quiz, onClose }: { quiz: Quiz; onClose: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Question | (Omit<Question, "id" | "quiz_id"> & { id?: string }) | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("questions").select("*").eq("quiz_id", quiz.id).order("ordem");
    setQuestions((data ?? []) as Question[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, [quiz.id]);

  async function save() {
    if (!editing) return;
    if (!editing.enunciado.trim()) return toast.error("Enunciado é obrigatório.");
    const payload = {
      quiz_id: quiz.id,
      enunciado: editing.enunciado,
      alternativa_a: editing.alternativa_a,
      alternativa_b: editing.alternativa_b,
      alternativa_c: editing.alternativa_c,
      alternativa_d: editing.alternativa_d,
      resposta_correta: editing.resposta_correta,
      explicacao: editing.explicacao,
      ordem: Number(editing.ordem),
    };
    const res = editing.id
      ? await supabase.from("questions").update(payload).eq("id", editing.id)
      : await supabase.from("questions").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Questão salva!");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta questão?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Questão excluída.");
    load();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Questões — {quiz.titulo}</h2>
            <p className="text-xs text-muted-foreground">{questions.length} questão(ões) cadastrada(s)</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <div className="mb-3 flex justify-end">
          <button onClick={() => setEditing({ ...emptyQuestion, ordem: questions.length + 1 })} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <Plus className="h-3 w-3" /> Nova questão
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sem questões ainda.</div>
        ) : (
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground">#{q.ordem} — Correta: {q.resposta_correta.toUpperCase()}</div>
                    <div className="text-sm font-medium">{q.enunciado}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(q)} className="rounded-lg p-1.5 hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(q.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="mt-4 space-y-3 rounded-xl border border-primary/50 bg-muted/30 p-4">
            <div className="text-sm font-bold">{editing.id ? "Editar questão" : "Nova questão"}</div>
            <Field label="Enunciado"><textarea className="input min-h-20" value={editing.enunciado} onChange={(e) => setEditing({ ...editing, enunciado: e.target.value })} /></Field>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["a", "b", "c", "d"] as const).map((letter) => (
                <Field key={letter} label={`Alternativa ${letter.toUpperCase()}`}>
                  <input className="input" value={editing[`alternativa_${letter}` as const]} onChange={(e) => setEditing({ ...editing, [`alternativa_${letter}`]: e.target.value })} />
                </Field>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Resposta correta">
                <select className="input" value={editing.resposta_correta} onChange={(e) => setEditing({ ...editing, resposta_correta: e.target.value })}>
                  <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
                </select>
              </Field>
              <Field label="Ordem"><input type="number" className="input" value={editing.ordem} onChange={(e) => setEditing({ ...editing, ordem: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Explicação"><textarea className="input min-h-16" value={editing.explicacao} onChange={(e) => setEditing({ ...editing, explicacao: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-xl px-3 py-1.5 text-xs hover:bg-accent">Cancelar</button>
              <button onClick={save} className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow" style={{ backgroundImage: "var(--gradient-primary)" }}>Salvar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-xs font-semibold text-muted-foreground">{label}</div>{children}</label>;
}