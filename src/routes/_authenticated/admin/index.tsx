import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, BookOpen, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const cards = [
  { to: "/admin/missoes", label: "Missões", desc: "Criar, editar e remover missões diárias e semanais.", icon: Target },
  { to: "/admin/conteudos", label: "Conteúdos", desc: "Gerenciar a biblioteca de vídeos, textos e exercícios.", icon: BookOpen },
  { to: "/admin/quizzes", label: "Quizzes", desc: "Cadastrar quizzes e suas questões de múltipla escolha.", icon: HelpCircle },
] as const;

function AdminHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.to}
          to={c.to}
          className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-md"
        >
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <c.icon className="h-5 w-5" />
          </div>
          <div className="text-lg font-bold">{c.label}</div>
          <div className="text-sm text-muted-foreground">{c.desc}</div>
        </Link>
      ))}
    </div>
  );
}