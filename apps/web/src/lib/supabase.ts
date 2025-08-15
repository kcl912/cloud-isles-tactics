import { createClient } from '@supabase/supabase-js'

// Database type definitions
export interface Card {
  id: number
  name: string
  description: string
  cost: number
  type: 'attack' | 'defense' | 'utility' | 'spell'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  effects: Array<{
    type: string
    amount?: number
    duration?: number
    chance?: number
    percent?: string
    trigger?: string
    multiplier?: number
  }>
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Character {
  id: number
  name: string
  description: string
  class: 'warrior' | 'mage' | 'rogue' | 'priest' | 'ranger'
  base_health: number
  base_energy: number
  starting_deck: number[]
  special_ability?: {
    type: 'passive' | 'active'
    name: string
    description: string
    cost?: number
    effects: Array<{
      trigger?: string
      type: string
      amount?: number
      chance?: number
      multiplier?: number
    }>
  }
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Encounter {
  id: number
  name: string
  description: string
  difficulty: number
  enemy_health: number
  enemy_deck: number[]
  ai_personality: 'aggressive' | 'defensive' | 'balanced' | 'chaotic'
  rewards?: {
    score_base: number
    score_multiplier: number
  }
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Run {
  id: string
  character_id: number
  encounter_id: number
  score: number
  duration_seconds: number
  result: 'victory' | 'defeat'
  final_health: number
  cards_played: number
  damage_dealt: number
  damage_taken: number
  device_id?: string
  signature?: string
  metadata: Record<string, any>
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  run_id: string
  character_id: number
  score: number
  duration_seconds: number
  result: 'victory' | 'defeat'
  leaderboard_date: string
  rank_position?: number
  device_id?: string
  character_name?: string
  character_class?: string
  created_at: string
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      cards: {
        Row: Card
        Insert: Omit<Card, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Card, 'id' | 'created_at' | 'updated_at'>>
      }
      characters: {
        Row: Character
        Insert: Omit<Character, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Character, 'id' | 'created_at' | 'updated_at'>>
      }
      encounters: {
        Row: Encounter
        Insert: Omit<Encounter, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Encounter, 'id' | 'created_at' | 'updated_at'>>
      }
      runs: {
        Row: Run
        Insert: Omit<Run, 'id' | 'created_at'>
        Update: Partial<Omit<Run, 'id' | 'created_at'>>
      }
      leaderboard_daily: {
        Row: LeaderboardEntry
        Insert: Omit<LeaderboardEntry, 'id' | 'created_at' | 'character_name' | 'character_class'>
        Update: Partial<Omit<LeaderboardEntry, 'id' | 'created_at' | 'character_name' | 'character_class'>>
      }
    }
    Views: {
      leaderboard_view: {
        Row: LeaderboardEntry
      }
    }
  }
}

// Environment validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Utility type exports for convenience
export type { Database }