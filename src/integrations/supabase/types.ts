export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          criado_em: string
          criterio_extra: string | null
          criterio_quantidade: number
          criterio_tipo: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          criterio_extra?: string | null
          criterio_quantidade?: number
          criterio_tipo: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          criterio_extra?: string | null
          criterio_quantidade?: number
          criterio_tipo?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          aluno_id: string
          criado_em: string
          id: string
          referencia_id: string | null
          tipo_atividade: string
        }
        Insert: {
          aluno_id: string
          criado_em?: string
          id?: string
          referencia_id?: string | null
          tipo_atividade: string
        }
        Update: {
          aluno_id?: string
          criado_em?: string
          id?: string
          referencia_id?: string | null
          tipo_atividade?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          disciplina_id: string | null
          duracao: number
          id: string
          pontos_recompensa: number
          tema: string
          tipo: string
          titulo: string
          url: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          disciplina_id?: string | null
          duracao?: number
          id?: string
          pontos_recompensa?: number
          tema?: string
          tipo: string
          titulo: string
          url?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          disciplina_id?: string | null
          duracao?: number
          id?: string
          pontos_recompensa?: number
          tema?: string
          tipo?: string
          titulo?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_ranking: {
        Row: {
          avatar_url: string | null
          criado_em: string
          id: string
          nivel_geral: string
          nome_exibicao: string
          turma: string | null
          xp_total: number
        }
        Insert: {
          avatar_url?: string | null
          criado_em?: string
          id?: string
          nivel_geral?: string
          nome_exibicao: string
          turma?: string | null
          xp_total?: number
        }
        Update: {
          avatar_url?: string | null
          criado_em?: string
          id?: string
          nivel_geral?: string
          nome_exibicao?: string
          turma?: string | null
          xp_total?: number
        }
        Relationships: []
      }
      missions: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          disciplina_id: string | null
          id: string
          objetivo_quantidade: number
          objetivo_tipo: string
          prazo: string | null
          recompensa_xp: number
          tipo: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          disciplina_id?: string | null
          id?: string
          objetivo_quantidade?: number
          objetivo_tipo: string
          prazo?: string | null
          recompensa_xp?: number
          tipo?: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          disciplina_id?: string | null
          id?: string
          objetivo_quantidade?: number
          objetivo_tipo?: string
          prazo?: string | null
          recompensa_xp?: number
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          criado_em: string
          id: string
          nivel_geral: string
          nome_exibicao: string | null
          streak_atual: number
          turma: string | null
          ultima_atividade: string | null
          updated_at: string
          xp_total: number
        }
        Insert: {
          avatar_url?: string | null
          criado_em?: string
          id: string
          nivel_geral?: string
          nome_exibicao?: string | null
          streak_atual?: number
          turma?: string | null
          ultima_atividade?: string | null
          updated_at?: string
          xp_total?: number
        }
        Update: {
          avatar_url?: string | null
          criado_em?: string
          id?: string
          nivel_geral?: string
          nome_exibicao?: string | null
          streak_atual?: number
          turma?: string | null
          ultima_atividade?: string | null
          updated_at?: string
          xp_total?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          criado_em: string
          enunciado: string
          explicacao: string | null
          id: string
          ordem: number
          quiz_id: string
          resposta_correta: string
        }
        Insert: {
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          criado_em?: string
          enunciado: string
          explicacao?: string | null
          id?: string
          ordem?: number
          quiz_id: string
          resposta_correta?: string
        }
        Update: {
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          criado_em?: string
          enunciado?: string
          explicacao?: string | null
          id?: string
          ordem?: number
          quiz_id?: string
          resposta_correta?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          criado_em: string
          descricao: string | null
          disciplina_id: string | null
          id: string
          tema: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          disciplina_id?: string | null
          id?: string
          tema?: string
          titulo: string
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          disciplina_id?: string | null
          id?: string
          tema?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_achievements: {
        Row: {
          aluno_id: string
          conquista_id: string
          desbloqueada_em: string
          id: string
        }
        Insert: {
          aluno_id: string
          conquista_id: string
          desbloqueada_em?: string
          id?: string
        }
        Update: {
          aluno_id?: string
          conquista_id?: string
          desbloqueada_em?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_conquista_id_fkey"
            columns: ["conquista_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      student_answers: {
        Row: {
          aluno_id: string
          correta: boolean
          criado_em: string
          id: string
          questao_id: string
          resposta_enviada: string
          xp_recebido: number
        }
        Insert: {
          aluno_id: string
          correta?: boolean
          criado_em?: string
          id?: string
          questao_id: string
          resposta_enviada: string
          xp_recebido?: number
        }
        Update: {
          aluno_id?: string
          correta?: boolean
          criado_em?: string
          id?: string
          questao_id?: string
          resposta_enviada?: string
          xp_recebido?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_contents: {
        Row: {
          aluno_id: string
          concluido_em: string | null
          conteudo_id: string
          criado_em: string
          id: string
          status: string
        }
        Insert: {
          aluno_id: string
          concluido_em?: string | null
          conteudo_id: string
          criado_em?: string
          id?: string
          status?: string
        }
        Update: {
          aluno_id?: string
          concluido_em?: string | null
          conteudo_id?: string
          criado_em?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_contents_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      student_missions: {
        Row: {
          aluno_id: string
          concluida_em: string | null
          criado_em: string
          id: string
          missao_id: string
          progresso_atual: number
          status: string
        }
        Insert: {
          aluno_id: string
          concluida_em?: string | null
          criado_em?: string
          id?: string
          missao_id: string
          progresso_atual?: number
          status?: string
        }
        Update: {
          aluno_id?: string
          concluida_em?: string | null
          criado_em?: string
          id?: string
          missao_id?: string
          progresso_atual?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_missions_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_progress: {
        Row: {
          aluno_id: string
          atividades_concluidas: number
          criado_em: string
          disciplina_id: string
          id: string
          nivel_disciplina: string
          xp_disciplina: number
        }
        Insert: {
          aluno_id: string
          atividades_concluidas?: number
          criado_em?: string
          disciplina_id: string
          id?: string
          nivel_disciplina?: string
          xp_disciplina?: number
        }
        Update: {
          aluno_id?: string
          atividades_concluidas?: number
          criado_em?: string
          disciplina_id?: string
          id?: string
          nivel_disciplina?: string
          xp_disciplina?: number
        }
        Relationships: [
          {
            foreignKeyName: "subject_progress_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          cor: string | null
          criado_em: string
          icone: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string | null
          criado_em?: string
          icone?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string | null
          criado_em?: string
          icone?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          aluno_id: string
          criado_em: string
          id: string
          multiplicador: number
          origem: string
          pontos: number
          pontos_finais: number
          referencia_id: string | null
        }
        Insert: {
          aluno_id: string
          criado_em?: string
          id?: string
          multiplicador?: number
          origem: string
          pontos: number
          pontos_finais: number
          referencia_id?: string | null
        }
        Update: {
          aluno_id?: string
          criado_em?: string
          id?: string
          multiplicador?: number
          origem?: string
          pontos?: number
          pontos_finais?: number
          referencia_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
