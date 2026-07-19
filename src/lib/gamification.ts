import { supabase } from "@/integrations/supabase/client";

export function nivelPorXp(xp: number): "Iniciante" | "Intermediário" | "Avançado" | "Mestre" {
  if (xp >= 3000) return "Mestre";
  if (xp >= 1500) return "Avançado";
  if (xp >= 500) return "Intermediário";
  return "Iniciante";
}

export function xpProximoNivel(xp: number): { atual: number; proximo: number; percentual: number } {
  const marcos = [0, 500, 1500, 3000, 5000];
  let atual = 0;
  let proximo = 500;
  for (let i = 0; i < marcos.length - 1; i++) {
    if (xp >= marcos[i] && xp < marcos[i + 1]) {
      atual = marcos[i];
      proximo = marcos[i + 1];
      break;
    }
  }
  if (xp >= 3000) {
    atual = 3000;
    proximo = 5000;
  }
  const percentual = Math.min(100, Math.round(((xp - atual) / (proximo - atual)) * 100));
  return { atual, proximo, percentual };
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Concede XP ao aluno, aplicando multiplicador de streak (2x quando streak >=7).
 * Também atualiza streak, última atividade, xp_total, nivel_geral e verifica conquistas.
 */
export async function concederXP(params: {
  userId: string;
  origem: string;
  referenciaId?: string;
  pontos: number;
}) {
  const { userId, origem, referenciaId, pontos } = params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_total, streak_atual, ultima_atividade")
    .eq("id", userId)
    .maybeSingle();

  const hoje = hojeISO();
  let novoStreak = profile?.streak_atual ?? 0;
  if (profile?.ultima_atividade !== hoje) {
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    novoStreak = profile?.ultima_atividade === ontem ? novoStreak + 1 : 1;
  }
  const multiplicador = novoStreak >= 7 ? 2 : 1;
  const pontosFinais = pontos * multiplicador;
  const novoXp = (profile?.xp_total ?? 0) + pontosFinais;

  await supabase.from("xp_history").insert({
    aluno_id: userId,
    origem,
    referencia_id: referenciaId,
    pontos,
    multiplicador,
    pontos_finais: pontosFinais,
  });

  await supabase
    .from("profiles")
    .update({
      xp_total: novoXp,
      streak_atual: novoStreak,
      ultima_atividade: hoje,
      nivel_geral: nivelPorXp(novoXp),
    })
    .eq("id", userId);

  await supabase.from("activity_log").insert({
    aluno_id: userId,
    tipo_atividade: origem,
    referencia_id: referenciaId,
  });

  await verificarConquistas(userId);
  await atualizarProgressoMissoes(userId, origem);

  return { pontosFinais, multiplicador, novoXp, novoStreak };
}

export async function verificarConquistas(userId: string) {
  const { data: achievements } = await supabase.from("achievements").select("*");
  const { data: unlocked } = await supabase
    .from("student_achievements")
    .select("conquista_id")
    .eq("aluno_id", userId);
  const unlockedIds = new Set((unlocked ?? []).map((u) => u.conquista_id));

  const { count: totalConteudos } = await supabase
    .from("student_contents")
    .select("*", { count: "exact", head: true })
    .eq("aluno_id", userId)
    .eq("status", "concluido");

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_atual")
    .eq("id", userId)
    .maybeSingle();

  const { data: acertos } = await supabase
    .from("student_answers")
    .select("id")
    .eq("aluno_id", userId)
    .eq("correta", true);

  const { data: conteudosTema } = await supabase
    .from("student_contents")
    .select("conteudo_id, contents:conteudo_id(tema)")
    .eq("aluno_id", userId)
    .eq("status", "concluido");

  const desbloqueadas: string[] = [];
  for (const ach of achievements ?? []) {
    if (unlockedIds.has(ach.id)) continue;
    let alcancou = false;
    if (ach.criterio_tipo === "conteudos_total") {
      alcancou = (totalConteudos ?? 0) >= ach.criterio_quantidade;
    } else if (ach.criterio_tipo === "streak") {
      alcancou = (profile?.streak_atual ?? 0) >= ach.criterio_quantidade;
    } else if (ach.criterio_tipo === "acertos") {
      alcancou = (acertos?.length ?? 0) >= ach.criterio_quantidade;
    } else if (ach.criterio_tipo === "conteudos_tema") {
      const count = (conteudosTema ?? []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.contents?.tema === ach.criterio_extra,
      ).length;
      alcancou = count >= ach.criterio_quantidade;
    } else if (ach.criterio_tipo === "disciplinas") {
      const { data: sp } = await supabase
        .from("subject_progress")
        .select("disciplina_id")
        .eq("aluno_id", userId)
        .gt("atividades_concluidas", 0);
      alcancou = (sp?.length ?? 0) >= ach.criterio_quantidade;
    }
    if (alcancou) {
      await supabase.from("student_achievements").insert({
        aluno_id: userId,
        conquista_id: ach.id,
      });
      desbloqueadas.push(ach.nome);
    }
  }
  return desbloqueadas;
}

export async function atualizarProgressoMissoes(userId: string, origem: string) {
  const { data: missions } = await supabase.from("missions").select("*").eq("ativo", true);
  const { data: userMissions } = await supabase
    .from("student_missions")
    .select("*")
    .eq("aluno_id", userId);

  for (const m of missions ?? []) {
    const tipoMatch =
      m.objetivo_tipo === origem ||
      (m.objetivo_tipo === "conteudo" && (origem === "video" || origem === "texto" || origem === "exercicio" || origem === "link"));
    if (!tipoMatch) continue;

    const existente = userMissions?.find((u) => u.missao_id === m.id);
    if (existente?.status === "concluida") continue;

    const novoProg = (existente?.progresso_atual ?? 0) + 1;
    const concluida = novoProg >= m.objetivo_quantidade;

    if (!existente) {
      await supabase.from("student_missions").insert({
        aluno_id: userId,
        missao_id: m.id,
        progresso_atual: novoProg,
        status: concluida ? "concluida" : "em_andamento",
        concluida_em: concluida ? new Date().toISOString() : null,
      });
    } else {
      await supabase
        .from("student_missions")
        .update({
          progresso_atual: novoProg,
          status: concluida ? "concluida" : "em_andamento",
          concluida_em: concluida ? new Date().toISOString() : null,
        })
        .eq("id", existente.id);
    }

    if (concluida) {
      // conceder XP da missão sem re-disparar cascata infinita
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp_total, streak_atual")
        .eq("id", userId)
        .maybeSingle();
      const mult = (profile?.streak_atual ?? 0) >= 7 ? 2 : 1;
      const finais = m.recompensa_xp * mult;
      await supabase.from("xp_history").insert({
        aluno_id: userId,
        origem: "missao",
        referencia_id: m.id,
        pontos: m.recompensa_xp,
        multiplicador: mult,
        pontos_finais: finais,
      });
      const novoXp = (profile?.xp_total ?? 0) + finais;
      await supabase
        .from("profiles")
        .update({ xp_total: novoXp, nivel_geral: nivelPorXp(novoXp) })
        .eq("id", userId);
    }
  }
}

export async function registrarInicioConteudo(userId: string, conteudoId: string) {
  await supabase.from("student_contents").upsert(
    { aluno_id: userId, conteudo_id: conteudoId, status: "iniciado" },
    { onConflict: "aluno_id,conteudo_id", ignoreDuplicates: true },
  );
}

export async function concluirConteudo(userId: string, conteudo: {
  id: string; tipo: string; pontos_recompensa: number; disciplina_id: string;
}) {
  const { data: existing } = await supabase
    .from("student_contents")
    .select("*")
    .eq("aluno_id", userId)
    .eq("conteudo_id", conteudo.id)
    .maybeSingle();

  if (existing?.status === "concluido") {
    return { alreadyDone: true, gained: 0 };
  }

  await supabase.from("student_contents").upsert(
    {
      aluno_id: userId,
      conteudo_id: conteudo.id,
      status: "concluido",
      concluido_em: new Date().toISOString(),
    },
    { onConflict: "aluno_id,conteudo_id" },
  );

  const res = await concederXP({
    userId,
    origem: conteudo.tipo,
    referenciaId: conteudo.id,
    pontos: conteudo.pontos_recompensa,
  });

  // subject progress
  const { data: sp } = await supabase
    .from("subject_progress")
    .select("*")
    .eq("aluno_id", userId)
    .eq("disciplina_id", conteudo.disciplina_id)
    .maybeSingle();
  if (!sp) {
    await supabase.from("subject_progress").insert({
      aluno_id: userId,
      disciplina_id: conteudo.disciplina_id,
      xp_disciplina: res.pontosFinais,
      atividades_concluidas: 1,
      nivel_disciplina: nivelPorXp(res.pontosFinais),
    });
  } else {
    const novoXp = sp.xp_disciplina + res.pontosFinais;
    await supabase
      .from("subject_progress")
      .update({
        xp_disciplina: novoXp,
        atividades_concluidas: sp.atividades_concluidas + 1,
        nivel_disciplina: nivelPorXp(novoXp),
      })
      .eq("id", sp.id);
  }

  return { alreadyDone: false, gained: res.pontosFinais, multiplicador: res.multiplicador };
}