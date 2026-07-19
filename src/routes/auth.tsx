import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [turma, setTurma] = useState("3º Ano A");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome, nome_exibicao: nome, turma },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Conta criada!");
          navigate({ to: "/dashboard" });
        } else {
          toast.info("Confirme seu e-mail antes de entrar.");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      if (/not confirmed|email_not_confirmed/i.test(msg)) {
        toast.error("E-mail ainda não confirmado.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl text-lg font-bold text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>E</div>
          <span className="text-lg font-bold">EduQuest</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg" style={{ boxShadow: "var(--shadow-card)" }}>
          <h1 className="text-2xl font-black">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Continue sua jornada de estudos." : "Comece a subir de nível hoje."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <>
                <Field label="Nome">
                  <input required value={nome} onChange={(e) => setNome(e.target.value)} className="input" placeholder="Seu nome" />
                </Field>
                <Field label="Turma">
                  <select value={turma} onChange={(e) => setTurma(e.target.value)} className="input">
                    {["1º Ano A","1º Ano B","2º Ano A","2º Ano B","2º Ano C","3º Ano A","3º Ano B"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </>
            )}
            <Field label="E-mail">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="voce@escola.com" />
            </Field>
            <Field label="Senha">
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Mínimo 6 caracteres" />
            </Field>
            <button
              disabled={loading}
              className="mt-2 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Novo aqui?{" "}<button className="font-semibold text-primary" onClick={() => setMode("signup")}>Criar conta</button></>
            ) : (
              <>Já tem conta?{" "}<button className="font-semibold text-primary" onClick={() => setMode("login")}>Entrar</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
