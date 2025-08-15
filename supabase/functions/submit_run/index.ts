import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RunSubmission {
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
}

async function verifySignature(data: RunSubmission, signature: string): Promise<boolean> {
  try {
    // In a real implementation, you would verify the HMAC-SHA256 signature
    // using a secret key shared between client and server
    const secretKey = Deno.env.get('SIGNATURE_SECRET_KEY') || 'default-secret-key'
    
    // Create the payload string (same as client-side)
    const payload = `${data.character_id}:${data.encounter_id}:${data.score}:${data.duration_seconds}:${data.result}:${data.device_id}`
    
    // Create HMAC-SHA256 signature
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey)
    const payloadData = encoder.encode(payload)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, payloadData)
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const runData: RunSubmission = await req.json()
    
    // Validate required fields
    const requiredFields = [
      'character_id', 'encounter_id', 'score', 'duration_seconds', 
      'result', 'final_health', 'cards_played', 'damage_dealt', 
      'damage_taken', 'device_id', 'signature'
    ]
    
    for (const field of requiredFields) {
      if (runData[field] === undefined || runData[field] === null) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Verify signature for security
    const isSignatureValid = await verifySignature(runData, runData.signature)
    if (!isSignatureValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate data constraints
    if (runData.score < 0 || runData.duration_seconds <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid score or duration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['victory', 'defeat'].includes(runData.result)) {
      return new Response(
        JSON.stringify({ error: 'Invalid result value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert run record
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        character_id: runData.character_id,
        encounter_id: runData.encounter_id,
        score: runData.score,
        duration_seconds: runData.duration_seconds,
        result: runData.result,
        final_health: runData.final_health,
        cards_played: runData.cards_played,
        damage_dealt: runData.damage_dealt,
        damage_taken: runData.damage_taken,
        device_id: runData.device_id,
        signature: runData.signature,
        metadata: runData.metadata || {}
      })
      .select()
      .single()

    if (runError) {
      console.error('Error inserting run:', runError)
      return new Response(
        JSON.stringify({ error: 'Failed to save run data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add to daily leaderboard if it's a victory
    if (runData.result === 'victory') {
      const { error: leaderboardError } = await supabase
        .from('leaderboard_daily')
        .insert({
          run_id: run.id,
          character_id: runData.character_id,
          score: runData.score,
          duration_seconds: runData.duration_seconds,
          result: runData.result,
          device_id: runData.device_id,
          leaderboard_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        })

      if (leaderboardError) {
        console.error('Error updating leaderboard:', leaderboardError)
        // Don't fail the entire request if leaderboard update fails
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        run_id: run.id,
        message: 'Run submitted successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})