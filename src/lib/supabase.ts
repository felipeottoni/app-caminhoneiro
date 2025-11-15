import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos do banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          is_premium: boolean
          premium_expires_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
        }
      }
      jornadas: {
        Row: {
          id: string
          user_id: string
          data_inicio: string
          hora_inicio: string
          pais_inicio: string
          km_inicial: number
          ultimo_descanso: string
          amplitude: string
          checkup_caminhao: boolean
          checkup_reboque: boolean
          data_fim: string | null
          hora_fim: string | null
          pais_fim: string | null
          km_final: number | null
          proximo_descanso: string | null
          observacoes_fim: string | null
          status: 'em_andamento' | 'concluida'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data_inicio: string
          hora_inicio: string
          pais_inicio: string
          km_inicial: number
          ultimo_descanso: string
          amplitude: string
          checkup_caminhao: boolean
          checkup_reboque: boolean
          data_fim?: string | null
          hora_fim?: string | null
          pais_fim?: string | null
          km_final?: number | null
          proximo_descanso?: string | null
          observacoes_fim?: string | null
          status?: 'em_andamento' | 'concluida'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data_inicio?: string
          hora_inicio?: string
          pais_inicio?: string
          km_inicial?: number
          ultimo_descanso?: string
          amplitude?: string
          checkup_caminhao?: boolean
          checkup_reboque?: boolean
          data_fim?: string | null
          hora_fim?: string | null
          pais_fim?: string | null
          km_final?: number | null
          proximo_descanso?: string | null
          observacoes_fim?: string | null
          status?: 'em_andamento' | 'concluida'
          created_at?: string
        }
      }
      eventos: {
        Row: {
          id: string
          jornada_id: string
          tipo: 'saida' | 'pausa' | 'carregamento' | 'abastecimento' | 'descarregamento'
          horario: string
          local: string
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          jornada_id: string
          tipo: 'saida' | 'pausa' | 'carregamento' | 'abastecimento' | 'descarregamento'
          horario: string
          local: string
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          jornada_id?: string
          tipo?: 'saida' | 'pausa' | 'carregamento' | 'abastecimento' | 'descarregamento'
          horario?: string
          local?: string
          observacao?: string | null
          created_at?: string
        }
      }
    }
  }
}
