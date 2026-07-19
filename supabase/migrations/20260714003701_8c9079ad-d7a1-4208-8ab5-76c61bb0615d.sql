
CREATE TABLE public.demo_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_exibicao TEXT NOT NULL,
  turma TEXT NOT NULL,
  avatar_url TEXT NOT NULL DEFAULT '',
  nivel_geral TEXT NOT NULL DEFAULT 'Iniciante',
  xp_total INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.demo_ranking TO authenticated;
GRANT ALL ON public.demo_ranking TO service_role;
ALTER TABLE public.demo_ranking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_ranking_select" ON public.demo_ranking FOR SELECT TO authenticated USING (true);
