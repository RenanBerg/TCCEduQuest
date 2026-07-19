import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/conteudos")({
  component: AdminConteudos,
});

type Content = {
  id: string;
  titulo: string;
  descricao: string;
  tema: string;
  tipo: string;
  disciplina_id: string;
  duracao: number;
  pontos_recompensa: number;
  url: string | null;
  ativo: boolean;
};
type Subject = { id: string; nome: string };

const empty: Omit<Content, "id"> = {
  titulo: "",
  descricao: "",
  tema: "",
  tipo: "video",
  disciplina_id: "",
  duracao: 10,
  pontos_recompensa: 20,
  url: "",
  ativo: true,
};

function AdminConteudos() {
  const [rows, setRows] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Content | (Omit<Content, "id"> & { id?: string }) | null>(null);
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    const [c, s] = await Promise.all([
      supabase.from("contents").select("*").order("criado_em", { ascending: false }),
      supabase.from("subjects").select("id, nome").order("nome"),
    ]);
    setRows((c.data ?? []) as Content[]);
    setSubjects((s.data ?? []) as Subject[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.titulo.trim()) return toast.error("Título é obrigatório.");
    if (!editing.disciplina_id) return toast.error("Selecione uma disciplina.");
    const payload = {
      titulo: editing.titulo,
      descricao: editing.descricao,
      tema: editing.tema,
      tipo: editing.tipo,
      disciplina_id: editing.disciplina_id,
      duracao: Number(editing.duracao),
      pontos_recompensa: Number(editing.pontos_recompensa),
      url: editing.url || null,
      ativo: editing.ativo,
    };
    const res = editing.id
      ? await supabase.from("contents").update(payload).eq("id", editing.id)
      : await supabase.from("contents").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Conteúdo salvo!");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este conteúdo?")) return;
    const { error } = await supabase.from("contents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Conteúdo excluído.");
    load();
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s.nome]));
  const filtered = rows.filter((r) => r.titulo.toLowerCase().includes(filter.toLowerCase()) || r.tema.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input placeholder="Buscar por título ou tema…" className="input max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button onClick={() => setEditing({ ...empty })} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4" /> Novo conteúdo
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum conteúdo.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Título</th>
                <th className="p-3">Disciplina</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">XP</th>
                <th className="p-3">Ativo</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{r.titulo}</div>
                    <div className="text-xs text-muted-foreground">{r.tema}</div>
                  </td>
                  <td className="p-3">{subjectMap.get(r.disciplina_id) ?? "—"}</td>
                  <td className="p-3 capitalize">{r.tipo}</td>
                  <td className="p-3">{r.pontos_recompensa}</td>
                  <td className="p-3">{r.ativo ? "✅" : "⛔"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(r)} className="rounded-lg p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(r.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
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
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing.id ? "Editar conteúdo" : "Novo conteúdo"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Título"><input className="input" value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} /></Field>
              <Field label="Descrição"><textarea className="input min-h-20" value={editing.descricao} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tema"><input className="input" value={editing.tema} onChange={(e) => setEditing({ ...editing, tema: e.target.value })} /></Field>
                <Field label="Tipo">
                  <select className="input" value={editing.tipo} onChange={(e) => setEditing({ ...editing, tipo: e.target.value })}>
                    <option value="video">Vídeo</option>
                    <option value="texto">Texto</option>
                    <option value="exercicio">Exercício</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </Field>
              </div>
              <Field label="Disciplina">
                <select className="input" value={editing.disciplina_id} onChange={(e) => setEditing({ ...editing, disciplina_id: e.target.value })}>
                  <option value="">Selecione…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duração (min)"><input type="number" className="input" value={editing.duracao} onChange={(e) => setEditing({ ...editing, duracao: Number(e.target.value) })} /></Field>
                <Field label="XP"><input type="number" className="input" value={editing.pontos_recompensa} onChange={(e) => setEditing({ ...editing, pontos_recompensa: Number(e.target.value) })} /></Field>
              </div>
              <Field label="URL (opcional)"><input className="input" value={editing.url ?? ""} onChange={(e) => setEditing({ ...editing, url: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.ativo} onChange={(e) => setEditing({ ...editing, ativo: e.target.checked })} /> Ativo
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 text-sm hover:bg-accent">Cancelar</button>
              <button onClick={save} className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow" style={{ backgroundImage: "var(--gradient-primary)" }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-xs font-semibold text-muted-foreground">{label}</div>{children}</label>;
}