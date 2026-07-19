
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ SUBJECTS ============
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  icone TEXT,
  cor TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO authenticated, anon;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read subjects" ON public.subjects FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admins manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_exibicao TEXT,
  turma TEXT,
  avatar_url TEXT,
  xp_total INTEGER NOT NULL DEFAULT 0,
  streak_atual INTEGER NOT NULL DEFAULT 0,
  ultima_atividade DATE,
  nivel_geral TEXT NOT NULL DEFAULT 'Iniciante',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_exibicao)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_exibicao', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CONTENTS ============
CREATE TABLE public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tema TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL,
  disciplina_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  duracao INTEGER NOT NULL DEFAULT 0,
  pontos_recompensa INTEGER NOT NULL DEFAULT 10,
  url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contents TO authenticated, anon;
GRANT ALL ON public.contents TO service_role;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read contents" ON public.contents FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admins manage contents" ON public.contents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ QUIZZES / QUESTIONS ============
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tema TEXT NOT NULL DEFAULT '',
  disciplina_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO authenticated, anon;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read quizzes" ON public.quizzes FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admins manage quizzes" ON public.quizzes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  alternativa_a TEXT NOT NULL DEFAULT '',
  alternativa_b TEXT NOT NULL DEFAULT '',
  alternativa_c TEXT NOT NULL DEFAULT '',
  alternativa_d TEXT NOT NULL DEFAULT '',
  resposta_correta TEXT NOT NULL DEFAULT 'a',
  explicacao TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage questions" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ACHIEVEMENTS ============
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  criterio_tipo TEXT NOT NULL,
  criterio_quantidade INTEGER NOT NULL DEFAULT 1,
  criterio_extra TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage achievements" ON public.achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MISSIONS ============
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'diaria',
  disciplina_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  objetivo_tipo TEXT NOT NULL,
  objetivo_quantidade INTEGER NOT NULL DEFAULT 1,
  recompensa_xp INTEGER NOT NULL DEFAULT 50,
  prazo TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read missions" ON public.missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage missions" ON public.missions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ STUDENT_CONTENTS ============
CREATE TABLE public.student_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'iniciado',
  concluido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, conteudo_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_contents TO authenticated;
GRANT ALL ON public.student_contents TO service_role;
ALTER TABLE public.student_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own student_contents" ON public.student_contents FOR ALL TO authenticated
  USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ STUDENT_ANSWERS ============
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  resposta_enviada TEXT NOT NULL,
  correta BOOLEAN NOT NULL DEFAULT false,
  xp_recebido INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, questao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_answers TO authenticated;
GRANT ALL ON public.student_answers TO service_role;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own student_answers" ON public.student_answers FOR ALL TO authenticated
  USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ STUDENT_ACHIEVEMENTS ============
CREATE TABLE public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conquista_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  desbloqueada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, conquista_id)
);
GRANT SELECT, INSERT ON public.student_achievements TO authenticated;
GRANT ALL ON public.student_achievements TO service_role;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own student_achievements" ON public.student_achievements FOR ALL TO authenticated
  USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ STUDENT_MISSIONS ============
CREATE TABLE public.student_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  missao_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  progresso_atual INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  concluida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, missao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_missions TO authenticated;
GRANT ALL ON public.student_missions TO service_role;
ALTER TABLE public.student_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own student_missions" ON public.student_missions FOR ALL TO authenticated
  USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ SUBJECT_PROGRESS ============
CREATE TABLE public.subject_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  xp_disciplina INTEGER NOT NULL DEFAULT 0,
  atividades_concluidas INTEGER NOT NULL DEFAULT 0,
  nivel_disciplina TEXT NOT NULL DEFAULT 'Iniciante',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, disciplina_id)
);
GRANT SELECT, INSERT, UPDATE ON public.subject_progress TO authenticated;
GRANT ALL ON public.subject_progress TO service_role;
ALTER TABLE public.subject_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subject_progress" ON public.subject_progress FOR ALL TO authenticated
  USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ XP_HISTORY ============
CREATE TABLE public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origem TEXT NOT NULL,
  referencia_id UUID,
  pontos INTEGER NOT NULL,
  multiplicador INTEGER NOT NULL DEFAULT 1,
  pontos_finais INTEGER NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.xp_history TO authenticated;
GRANT ALL ON public.xp_history TO service_role;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp_history" ON public.xp_history FOR ALL TO authenticated
  USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ ACTIVITY_LOG ============
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_atividade TEXT NOT NULL,
  referencia_id UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity_log" ON public.activity_log FOR ALL TO authenticated
  USING (auth.uid() = aluno_id) WITH CHECK (auth.uid() = aluno_id);

-- ============ DEMO_RANKING ============
CREATE TABLE public.demo_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_exibicao TEXT NOT NULL,
  turma TEXT,
  avatar_url TEXT,
  nivel_geral TEXT NOT NULL DEFAULT 'Iniciante',
  xp_total INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.demo_ranking TO authenticated, anon;
GRANT ALL ON public.demo_ranking TO service_role;
ALTER TABLE public.demo_ranking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read demo_ranking" ON public.demo_ranking FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admins manage demo_ranking" ON public.demo_ranking FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SEED subjects ============
INSERT INTO public.subjects (nome, icone, cor) VALUES
  ('Matemática', '📐', '#3B82F6'),
  ('Português', '📚', '#EF4444'),
  ('Física', '⚛️', '#8B5CF6'),
  ('Química', '🧪', '#10B981'),
  ('Biologia', '🧬', '#22C55E'),
  ('História', '🏛️', '#F59E0B'),
  ('Geografia', '🌎', '#06B6D4'),
  ('Inglês', '🇬🇧', '#EC4899');
