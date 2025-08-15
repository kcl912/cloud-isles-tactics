import { supabase, type LeaderboardEntry } from './supabase'

/**
 * Leaderboard API functions
 */

// Get today's leaderboard
export async function getTodayLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    throw new Error('Failed to fetch leaderboard')
  }

  return data || []
}

// Get leaderboard for specific date
export async function getLeaderboardByDate(date: string, limit: number = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard_daily')
    .select(`
      *,
      characters!inner(name, class)
    `)
    .eq('leaderboard_date', date)
    .order('rank_position', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard by date:', error)
    throw new Error('Failed to fetch leaderboard')
  }

  // Transform the data to match LeaderboardEntry interface
  return (data || []).map(entry => ({
    ...entry,
    character_name: (entry.characters as any)?.name,
    character_class: (entry.characters as any)?.class
  }))
}

// Get user's rank for today
export async function getUserRank(deviceId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('leaderboard_daily')
    .select('rank_position')
    .eq('device_id', deviceId)
    .eq('leaderboard_date', new Date().toISOString().split('T')[0])
    .order('score', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching user rank:', error)
    return null
  }

  return data?.[0]?.rank_position || null
}

// Get user's best runs
export async function getUserBestRuns(deviceId: string, limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      characters!inner(name, class),
      encounters!inner(name, difficulty)
    `)
    .eq('device_id', deviceId)
    .eq('result', 'victory')
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching user best runs:', error)
    throw new Error('Failed to fetch best runs')
  }

  return data || []
}

// Submit run score (with retry logic)
export async function submitRun(runData: {
  character_id: number
  encounter_id: number
  score: number
  duration_seconds: number
  result: 'victory' | 'defeat'
  final_health: number
  cards_played: number
  damage_dealt: number
  damage_taken: number
  device_id: string
  signature: string
  metadata?: Record<string, any>
}, maxRetries: number = 3): Promise<{ success: boolean; run_id?: string; error?: string }> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('submit_run', {
        body: runData
      })

      if (error) {
        throw error
      }

      if (data?.success) {
        return { success: true, run_id: data.run_id }
      } else {
        throw new Error(data?.error || 'Unknown error from server')
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to submit run'
        }
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  return { success: false, error: 'All retry attempts failed' }
}