<template>
  <div class="result-page min-h-screen p-4">
    <div class="container mx-auto max-w-6xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-4">🏆 排行榜</h1>
        <p class="text-gray-300">今日最佳戰績</p>
      </div>

      <!-- Navigation -->
      <div class="flex justify-center mb-8">
        <div class="card-base p-2 flex space-x-2">
          <button 
            @click="currentTab = 'today'"
            class="px-4 py-2 rounded transition-colors"
            :class="currentTab === 'today' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-white/10'"
          >
            今日排行
          </button>
          <button 
            @click="currentTab = 'personal'"
            class="px-4 py-2 rounded transition-colors"
            :class="currentTab === 'personal' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-white/10'"
          >
            個人紀錄
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center">
        <div class="card-base p-8 text-center">
          <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-300">載入排行榜中...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="card-base p-8 text-center max-w-md mx-auto">
        <div class="text-red-400 text-4xl mb-4">❌</div>
        <h2 class="text-white text-xl font-bold mb-2">載入失敗</h2>
        <p class="text-gray-300 mb-4">{{ error }}</p>
        <button @click="loadLeaderboard" class="btn-primary">
          重新載入
        </button>
      </div>

      <!-- Today's Leaderboard -->
      <div v-else-if="currentTab === 'today'" class="space-y-6">
        <!-- Leaderboard Table -->
        <div class="card-base overflow-hidden">
          <div class="p-6 border-b border-white/10">
            <h2 class="text-xl font-bold text-white flex items-center">
              📊 今日排行榜
              <button 
                @click="loadLeaderboard"
                class="ml-auto text-gray-400 hover:text-white transition-colors"
                title="刷新排行榜"
              >
                🔄
              </button>
            </h2>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-white/5">
                <tr class="text-left">
                  <th class="px-6 py-3 text-gray-300 font-semibold">排名</th>
                  <th class="px-6 py-3 text-gray-300 font-semibold">角色</th>
                  <th class="px-6 py-3 text-gray-300 font-semibold">分數</th>
                  <th class="px-6 py-3 text-gray-300 font-semibold">時間</th>
                  <th class="px-6 py-3 text-gray-300 font-semibold">狀態</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(entry, index) in leaderboard" 
                  :key="entry.id"
                  class="border-b border-white/5 hover:bg-white/5 transition-colors"
                  :class="{ 'bg-yellow-500/10': isCurrentUserEntry(entry) }"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                      <span class="text-lg">{{ getRankIcon(entry.rank_position || index + 1) }}</span>
                      <span class="text-white font-bold">{{ entry.rank_position || index + 1 }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                      <div 
                        class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        :class="getClassColor(entry.character_class || 'warrior')"
                      >
                        {{ getClassIcon(entry.character_class || 'warrior') }}
                      </div>
                      <div>
                        <div class="text-white font-medium">{{ entry.character_name || '未知角色' }}</div>
                        <div class="text-gray-400 text-sm">{{ getClassName(entry.character_class || 'warrior') }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-yellow-400 font-bold text-lg">{{ entry.score.toLocaleString() }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-gray-300">{{ formatDuration(entry.duration_seconds) }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span 
                      class="px-2 py-1 rounded text-xs font-medium"
                      :class="entry.result === 'victory' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'"
                    >
                      {{ entry.result === 'victory' ? '勝利' : '敗北' }}
                    </span>
                  </td>
                </tr>
                
                <!-- Empty state -->
                <tr v-if="leaderboard.length === 0">
                  <td colspan="5" class="px-6 py-12 text-center">
                    <div class="text-gray-400">
                      <div class="text-4xl mb-2">🏆</div>
                      <div>今日暫無排行記錄</div>
                      <div class="text-sm mt-2">成為第一個上榜的玩家！</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- User Stats Summary -->
        <div v-if="userRank" class="card-base p-6">
          <h3 class="text-lg font-bold text-white mb-4">🎯 你的今日表現</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-white/5 rounded-lg">
              <div class="text-2xl font-bold text-yellow-400">{{ userRank }}</div>
              <div class="text-gray-400 text-sm">目前排名</div>
            </div>
            <div class="text-center p-4 bg-white/5 rounded-lg">
              <div class="text-2xl font-bold text-green-400">{{ userBestScore.toLocaleString() }}</div>
              <div class="text-gray-400 text-sm">最佳分數</div>
            </div>
            <div class="text-center p-4 bg-white/5 rounded-lg">
              <div class="text-2xl font-bold text-blue-400">{{ userTotalGames }}</div>
              <div class="text-gray-400 text-sm">今日遊戲次數</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Personal Records -->
      <div v-else-if="currentTab === 'personal'" class="space-y-6">
        <div class="card-base p-6">
          <h2 class="text-xl font-bold text-white mb-6">📈 個人紀錄</h2>
          
          <div v-if="personalBest.length === 0" class="text-center py-12">
            <div class="text-gray-400">
              <div class="text-4xl mb-2">🎮</div>
              <div>暫無個人紀錄</div>
              <div class="text-sm mt-2">開始你的第一場遊戲吧！</div>
            </div>
          </div>
          
          <div v-else class="space-y-4">
            <div 
              v-for="(run, index) in personalBest" 
              :key="run.id"
              class="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div class="text-2xl">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅' }}</div>
                <div>
                  <div class="text-white font-medium">
                    {{ (run as any).characters?.name || '未知角色' }} vs {{ (run as any).encounters?.name || '未知敵人' }}
                  </div>
                  <div class="text-gray-400 text-sm">
                    {{ formatDate(run.created_at) }} • 難度: {{ (run as any).encounters?.difficulty || 'N/A' }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-yellow-400 font-bold text-lg">{{ run.score.toLocaleString() }}</div>
                <div class="text-gray-400 text-sm">{{ formatDuration(run.duration_seconds) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-center space-x-4 mt-8">
        <router-link to="/run" class="btn-primary">
          🎮 開始遊戲
        </router-link>
        <router-link to="/" class="btn-secondary">
          🏠 返回主頁
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getTodayLeaderboard, getUserRank, getUserBestRuns } from '@/lib/leaderboard'
import { generateDeviceId } from '@/lib/device'
import type { LeaderboardEntry } from '@/lib/supabase'

const currentTab = ref<'today' | 'personal'>('today')
const loading = ref(false)
const error = ref<string | null>(null)
const leaderboard = ref<LeaderboardEntry[]>([])
const personalBest = ref<any[]>([])
const userRank = ref<number | null>(null)
const deviceId = ref<string>('')

// User stats
const userBestScore = computed(() => {
  if (personalBest.value.length === 0) return 0
  return Math.max(...personalBest.value.map(run => run.score))
})

const userTotalGames = computed(() => {
  return personalBest.value.length
})

// Helper functions
function getRankIcon(rank: number): string {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈' 
    case 3: return '🥉'
    default: return '🏅'
  }
}

function getClassColor(characterClass: string): string {
  const colors = {
    warrior: 'bg-gradient-to-br from-red-500 to-red-700',
    mage: 'bg-gradient-to-br from-blue-500 to-blue-700',
    rogue: 'bg-gradient-to-br from-gray-600 to-gray-800',
    priest: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
    ranger: 'bg-gradient-to-br from-green-500 to-green-700'
  }
  return colors[characterClass as keyof typeof colors] || colors.warrior
}

function getClassIcon(characterClass: string): string {
  const icons = {
    warrior: '⚔️',
    mage: '🔮',
    rogue: '🗡️',
    priest: '✨',
    ranger: '🏹'
  }
  return icons[characterClass as keyof typeof icons] || icons.warrior
}

function getClassName(characterClass: string): string {
  const names = {
    warrior: '戰士',
    mage: '法師',
    rogue: '盜賊',
    priest: '牧師',
    ranger: '遊俠'
  }
  return names[characterClass as keyof typeof names] || '戰士'
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function isCurrentUserEntry(entry: LeaderboardEntry): boolean {
  return entry.device_id === deviceId.value
}

async function loadLeaderboard() {
  loading.value = true
  error.value = null
  
  try {
    // Load today's leaderboard
    const todayLeaderboard = await getTodayLeaderboard(20)
    leaderboard.value = todayLeaderboard

    // Load user rank and personal records
    const [rank, bestRuns] = await Promise.all([
      getUserRank(deviceId.value),
      getUserBestRuns(deviceId.value, 10)
    ])
    
    userRank.value = rank
    personalBest.value = bestRuns
    
  } catch (err) {
    console.error('Failed to load leaderboard:', err)
    error.value = err instanceof Error ? err.message : '載入排行榜失敗'
  } finally {
    loading.value = false
  }
}

// Initialize on mount
onMounted(async () => {
  deviceId.value = generateDeviceId()
  await loadLeaderboard()
})
</script>