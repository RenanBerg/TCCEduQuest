import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Sparkles, Target, BookOpen, Flame, Rocket } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl text-xl font-bold text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>E</div>
          <span className="text-xl font-bold tracking-tight">EduQuest</span>
        </div>
        <Link to="/auth" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Feito para o ensino médio
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Suba de nível <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>estudando</span>.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Missões diárias, quizzes, conquistas e ranking entre turmas. Transforme seus estudos em uma jornada motivadora.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth" className="rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg" style={{ backgroundImage: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                  Começar agora
                </Link>
                <Link to="/auth" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent">
                  Já tenho conta
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-gold" /> Streak diário</div>
                <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-gold" /> Badges e troféus</div>
                <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Missões</div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl p-8 text-white shadow-2xl" style={{ backgroundImage: "var(--gradient-hero)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider opacity-80">Nível atual</div>
                    <div className="text-3xl font-black">Avançado</div>
                  </div>
                  <Trophy className="h-12 w-12 text-gold" />
                </div>
                <div className="mt-6">
                  <div className="flex justify-between text-xs opacity-90"><span>XP</span><span>2.480 / 3.000</span></div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full" style={{ width: "82%", backgroundImage: "var(--gradient-gold)" }} />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {["🔥 7", "🎯 12", "🏆 6"].map((v) => (
                    <div key={v} className="rounded-xl bg-white/15 p-3 text-center backdrop-blur">
                      <div className="text-lg font-bold">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BookOpen, title: "Biblioteca completa", desc: "7 disciplinas, vídeos, exercícios e materiais." },
            { icon: Target, title: "Missões diárias", desc: "Desafios que impulsionam sua rotina de estudos." },
            { icon: Trophy, title: "Ranking e conquistas", desc: "Compare com sua turma e desbloqueie badges." },
            { icon: Flame, title: "Streak de estudo", desc: "7 dias seguidos = 2× de XP no bônus." },
            { icon: Sparkles, title: "Quizzes rápidos", desc: "Feedback imediato com explicação da resposta." },
            { icon: Rocket, title: "Progresso por matéria", desc: "Evolua de Iniciante a Mestre em cada disciplina." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="grid h-11 w-11 place-items-center rounded-xl text-primary" style={{ backgroundColor: "oklch(0.94 0.04 285)" }}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} EduQuest — Aprender pode ser uma aventura.
        </div>
      </footer>
    </div>
  );
}
