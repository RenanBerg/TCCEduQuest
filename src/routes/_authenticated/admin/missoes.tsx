import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/missoes")({
  component: AdminMissoes,
});

type Mission = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  disciplina_id: string | null;
  objetivo_tipo: string;
  objetivo_quantidade: number;
  recompensa_xp: number;
  prazo: string;
  ativo: boolean;
};

type Subject = { id: string; nome: string };

const empty: Omit<Mission, "id"> = {
  titulo: "",
  descricao: "",
  tipo: "diaria",
  disciplina_id: null,
  objetivo_tipo: "conteudo",
  objetivo_quantidade: 1,
  recompensa_xp: 50,
  prazo: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
  ativo: true,
};

function AdminMissoes() {
  const [rows, setRows] = useState<Mission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Mission | (Omit<Mission, "id"> & { id?: string }) | null>(null);

  async function load() {
    setLoading(true);
    const [m, s] = await Promise.all([
      supabase.from("missions").select("*").order("prazo", { ascending: false }),
      supabase.from("subjects").select("id, nome").order("nome"),
    ]);
    setRows((m.data ?? []) as Mission[]);
    setSubjects((s.data ?? []) as Subject[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    const payload = {
      titulo: editing.titulo,
      descricao: editing.descricao,
      tipo: editing.tipo,
      disciplina_id: editing.disciplina_id || null,
      objetivo_tipo: editing.objetivo_tipo,
      objetivo_quantidade: Number(editing.objetivo_quantidade),
      recompensa_xp: Number(editing.recompensa_xp),
      prazo: new Date(editing.prazo).toISOString(),
      ativo: editing.ativo,
    };
    if (!payload.titulo.trim()) return toast.error("Título é obrigatório.");
    const res = editing.id
      ? await supabase.from("missions").update(payload).eq("id", editing.id)
      : await supabase.from("missions").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Missão salva!");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta missão?")) return;
    const { error } = await supabase.from("missions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Missão excluída.");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...empty })}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Plus className="h-4 w-4" /> Nova missão
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma missão cadastrada.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Título</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">XP</th>
                <th className="p-3">Prazo</th>
                <th className="p-3">Ativo</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.titulo}</td>
                  <td className="p-3 capitalize">{r.tipo}</td>
                  <td className="p-3">{r.recompensa_xp}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.prazo).toLocaleString("pt-BR")}</td>
                  <td className="p-3">{r.ativo ? "✅" : "⛔"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing({ ...r, prazo: new Date(r.prazo).toISOString().slice(0, 16) })} className="rounded-lg p-2 hover:bg-accent">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(r.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
              <h2 className="text-lg font-bold">{editing.id ? "Editar missão" : "Nova missão"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Título">
                <input className="input" value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} />
              </Field>
              <Field label="Descrição">
                <textarea className="input min-h-20" value={editing.descricao} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select className="input" value={editing.tipo} onChange={(e) => setEditing({ ...editing, tipo: e.target.value })}>
                    <option value="diaria">Diária</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </Field>
                <Field label="Disciplina">
                  <select className="input" value={editing.disciplina_id ?? ""} onChange={(e) => setEditing({ ...editing, disciplina_id: e.target.value || null })}>
                    <option value="">Todas</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Objetivo (tipo)">
                  <select className="input" value={editing.objetivo_tipo} onChange={(e) => setEditing({ ...editing, objetivo_tipo: e.target.value })}>
                    <option value="conteudo">Concluir conteúdos</option>
                    <option value="quiz">Concluir quizzes</option>
                    <option value="acerto">Respostas corretas</option>
                    <option value="xp">Ganhar XP</option>
                  </select>
                </Field>
                <Field label="Quantidade">
                  <input type="number" className="input" value={editing.objetivo_quantidade} onChange={(e) => setEditing({ ...editing, objetivo_quantidade: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Recompensa (XP)">
                  <input type="number" className="input" value={editing.recompensa_xp} onChange={(e) => setEditing({ ...editing, recompensa_xp: Number(e.target.value) })} />
                </Field>
                <Field label="Prazo">
                  <input type="datetime-local" className="input" value={editing.prazo} onChange={(e) => setEditing({ ...editing, prazo: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.ativo} onChange={(e) => setEditing({ ...editing, ativo: e.target.checked })} /> Ativa
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
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}