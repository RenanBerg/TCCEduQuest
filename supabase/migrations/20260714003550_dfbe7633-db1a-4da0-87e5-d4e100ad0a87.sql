
-- =========================================
-- EduQuest schema
-- =========================================

-- helper: updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  nome_exibicao TEXT NOT NULL DEFAULT '',
  turma TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  xp_total INTEGER NOT NULL DEFAULT 0,
  nivel_geral TEXT NOT NULL DEFAULT 'Iniciante',
  streak_atual INTEGER NOT NULL DEFAULT 0,
  ultima_atividade DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Everyone authenticated can read basic profile data (for ranking); RLS still applies to updates.
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, nome_exibicao, turma)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nome_exibicao', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'turma', '3º Ano A')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ subjects ============
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL DEFAULT '',
  icone TEXT NOT NULL DEFAULT '📚',
  cor TEXT NOT NULL DEFAULT '#6366f1'
);
GRANT SELECT ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated USING (true);

-- ============ contents ============
CREATE TABLE public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  disciplina_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  tema TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL CHECK (tipo IN ('video','texto','exercicio','link')),
  duracao INTEGER NOT NULL DEFAULT 5, -- minutos
  url TEXT DEFAULT '',
  pontos_recompensa INTEGER NOT NULL DEFAULT 10,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.contents(disciplina_id);
CREATE INDEX ON public.contents(tipo);
GRANT SELECT ON public.contents TO authenticated;
GRANT ALL ON public.contents TO service_role;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contents_select" ON public.contents FOR SELECT TO authenticated USING (ativo = true);

-- ============ student_contents ============
CREATE TABLE public.student_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'iniciado' CHECK (status IN ('iniciado','concluido')),
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_em TIMESTAMPTZ,
  UNIQUE (aluno_id, conteudo_id)
);
CREATE INDEX ON public.student_contents(aluno_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_contents TO authenticated;
GRANT ALL ON public.student_contents TO service_role;
ALTER TABLE public.student_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sc_select_own" ON public.student_contents FOR SELECT TO authenticated USING (auth.uid() = aluno_id);
CREATE POLICY "sc_insert_own" ON public.student_contents FOR INSERT TO authenticated WITH CHECK (auth.uid() = aluno_id);
CREATE POLICY "sc_update_own" ON public.student_contents FOR UPDATE TO authenticated USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ missions ============
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL CHECK (tipo IN ('diaria','semanal')),
  disciplina_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  objetivo_tipo TEXT NOT NULL DEFAULT 'video' CHECK (objetivo_tipo IN ('video','exercicio','conteudo','quiz')),
  objetivo_quantidade INTEGER NOT NULL DEFAULT 1,
  recompensa_xp INTEGER NOT NULL DEFAULT 50,
  prazo TEXT NOT NULL DEFAULT 'hoje',
  ativo BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions_select" ON public.missions FOR SELECT TO authenticated USING (ativo = true);

-- ============ student_missions ============
CREATE TABLE public.student_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  missao_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  progresso_atual INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida')),
  concluida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, missao_id)
);
CREATE INDEX ON public.student_missions(aluno_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_missions TO authenticated;
GRANT ALL ON public.student_missions TO service_role;
ALTER TABLE public.student_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_select_own" ON public.student_missions FOR SELECT TO authenticated USING (auth.uid() = aluno_id);
CREATE POLICY "sm_insert_own" ON public.student_missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = aluno_id);
CREATE POLICY "sm_update_own" ON public.student_missions FOR UPDATE TO authenticated USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ quizzes ============
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  disciplina_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  tema TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT ''
);
GRANT SELECT ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT TO authenticated USING (true);

-- ============ questions ============
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('a','b','c','d')),
  explicacao TEXT NOT NULL DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ON public.questions(quiz_id);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select" ON public.questions FOR SELECT TO authenticated USING (true);

-- ============ student_answers ============
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  resposta_enviada CHAR(1) NOT NULL,
  correta BOOLEAN NOT NULL,
  respondida_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  xp_recebido INTEGER NOT NULL DEFAULT 0,
  UNIQUE (aluno_id, questao_id)
);
CREATE INDEX ON public.student_answers(aluno_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_answers TO authenticated;
GRANT ALL ON public.student_answers TO service_role;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sa_select_own" ON public.student_answers FOR SELECT TO authenticated USING (auth.uid() = aluno_id);
CREATE POLICY "sa_insert_own" ON public.student_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = aluno_id);

-- ============ achievements ============
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL DEFAULT '',
  icone TEXT NOT NULL DEFAULT '🏆',
  criterio_tipo TEXT NOT NULL,
  criterio_quantidade INTEGER NOT NULL DEFAULT 1,
  criterio_extra TEXT DEFAULT ''
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach_select" ON public.achievements FOR SELECT TO authenticated USING (true);

-- ============ student_achievements ============
CREATE TABLE public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conquista_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  desbloqueada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, conquista_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_achievements TO authenticated;
GRANT ALL ON public.student_achievements TO service_role;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sach_select_own" ON public.student_achievements FOR SELECT TO authenticated USING (auth.uid() = aluno_id);
CREATE POLICY "sach_insert_own" ON public.student_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = aluno_id);

-- ============ xp_history ============
CREATE TABLE public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origem TEXT NOT NULL,
  referencia_id UUID,
  pontos INTEGER NOT NULL DEFAULT 0,
  multiplicador NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  pontos_finais INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.xp_history(aluno_id, criado_em DESC);
GRANT SELECT, INSERT ON public.xp_history TO authenticated;
GRANT ALL ON public.xp_history TO service_role;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xph_select_own" ON public.xp_history FOR SELECT TO authenticated USING (auth.uid() = aluno_id);
CREATE POLICY "xph_insert_own" ON public.xp_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = aluno_id);

-- ============ activity_log ============
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_atividade TEXT NOT NULL,
  referencia_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.activity_log(aluno_id, criado_em DESC);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "al_select_own" ON public.activity_log FOR SELECT TO authenticated USING (auth.uid() = aluno_id);
CREATE POLICY "al_insert_own" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = aluno_id);

-- ============ subject_progress ============
CREATE TABLE public.subject_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  xp_disciplina INTEGER NOT NULL DEFAULT 0,
  nivel_disciplina TEXT NOT NULL DEFAULT 'Iniciante',
  atividades_concluidas INTEGER NOT NULL DEFAULT 0,
  UNIQUE (aluno_id, disciplina_id)
);
GRANT SELECT, INSERT, UPDATE ON public.subject_progress TO authenticated;
GRANT ALL ON public.subject_progress TO service_role;
ALTER TABLE public.subject_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_select_own" ON public.subject_progress FOR SELECT TO authenticated USING (auth.uid() = aluno_id);
CREATE POLICY "sp_insert_own" ON public.subject_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = aluno_id);
CREATE POLICY "sp_update_own" ON public.subject_progress FOR UPDATE TO authenticated USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);
