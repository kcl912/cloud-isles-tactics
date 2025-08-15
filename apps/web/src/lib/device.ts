/**
 * Device identification and signature utilities
 */

// Generate a unique device ID
export function generateDeviceId(): string {
  // Try to get existing device ID from localStorage
  const existingId = localStorage.getItem('cloud_isles_device_id')
  if (existingId) {
    return existingId
  }

  // Generate new device ID using various browser fingerprinting techniques
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 4,
    navigator.deviceMemory || 8
  ].join('|')

  // Create hash from fingerprint
  const deviceId = hashString(fingerprint) + '-' + Date.now().toString(36)
  
  // Store in localStorage for persistence
  localStorage.setItem('cloud_isles_device_id', deviceId)
  
  return deviceId
}

// Simple hash function for strings
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Generate SHA-256 hash
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate HMAC-SHA256 signature for run submission
export async function generateSignature(data: {
  character_id: number
  encounter_id: number
  score: number
  duration_seconds: number
  result: string
  device_id: string
}): Promise<string> {
  // In a real implementation, this secret should be more secure
  // For this demo, we'll use a simple secret
  const secretKey = 'cloud-isles-tactics-secret-key'
  
  // Create the payload string (same order as server-side verification)
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
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Get device information for debugging
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  }
}