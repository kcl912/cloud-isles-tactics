<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="card-base p-8 max-w-4xl w-full">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">雲嶼令</h1>
        <p class="text-gray-300">Cloud Isles Tactics</p>
      </div>

      <!-- 角色輪播 -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4 text-center">選擇角色</h2>
        <div class="flex items-center justify-center space-x-4">
          <button 
            @click="prevCharacter" 
            class="btn-secondary p-2 rounded-full"
            :disabled="characters.length <= 1"
          >
            ←
          </button>
          
          <div class="flex-1 max-w-md">
            <div 
              v-if="currentCharacter" 
              class="bg-gray-800 rounded-lg p-6 text-center transition-all duration-300"
            >
              <div class="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                <img 
                  v-if="currentCharacter.image_url" 
                  :src="currentCharacter.image_url" 
                  :alt="currentCharacter.name"
                  class="w-full h-full object-cover"
                >
                <div v-else class="text-4xl">👤</div>
              </div>
              <h3 class="text-xl font-bold text-white">{{ currentCharacter.name }}</h3>
              <p class="text-gray-300 text-sm mb-2">{{ getClassDisplayName(currentCharacter.class) }}</p>
              <p class="text-gray-400 text-sm">{{ currentCharacter.description }}</p>
              <div class="mt-4 flex justify-center space-x-4">
                <div class="text-center">
                  <div class="text-gray-400 text-xs">生命值</div>
                  <div class="text-white font-bold">{{ currentCharacter.base_health }}</div>
                </div>
                <div class="text-center">
                  <div class="text-gray-400 text-xs">能量</div>
                  <div class="text-white font-bold">{{ currentCharacter.base_energy }}</div>
                </div>
              </div>
            </div>
            
            <div v-else class="bg-gray-800 rounded-lg p-6 text-center">
              <p class="text-gray-400">暫無角色資料</p>
            </div>
          </div>
          
          <button 
            @click="nextCharacter" 
            class="btn-secondary p-2 rounded-full"
            :disabled="characters.length <= 1"
          >
            →
          </button>
        </div>
      </div>

      <!-- 難度選擇 -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4 text-center">選擇難度</h2>
        <div class="flex justify-center space-x-4">
          <button 
            @click="selectDifficulty('normal')"
            :class="[
              'px-6 py-3 rounded-lg font-bold transition-all',
              selectedDifficulty === 'normal' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            普通
          </button>
          <button 
            @click="selectDifficulty('hard')"
            :class="[
              'px-6 py-3 rounded-lg font-bold transition-all',
              selectedDifficulty === 'hard' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            困難
          </button>
        </div>
        <div class="mt-4 text-center">
          <p v-if="selectedDifficulty === 'normal'" class="text-gray-300">
            標準遊戲體驗，適合新手玩家
          </p>
          <p v-else-if="selectedDifficulty === 'hard'" class="text-gray-300">
            敵人初始護甲增加，卡牌權重調整，適合挑戰者
          </p>
        </div>
      </div>

      <!-- 開始遊戲按鈕 -->
      <div class="text-center space-y-4">
        <button 
          @click="startGame" 
          :disabled="!currentCharacter"
          class="btn-primary block w-full max-w-md mx-auto py-3"
        >
          開始遊戲
        </button>
        
        <router-link to="/result" class="btn-secondary block w-full max-w-md mx-auto py-3">
          排行榜
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import { useRunStore } from '@/stores/run'
import type { Character } from '@/lib/supabase'

const router = useRouter()
const catalogStore = useCatalogStore()
const runStore = useRunStore()

// 難度選擇
const selectedDifficulty = ref<'normal' | 'hard'>('normal')

// 角色輪播
const currentCharacterIndex = ref(0)
const characters = computed(() => catalogStore.characters)

const currentCharacter = computed<Character | null>(() => {
  if (characters.value.length === 0) return null
  return characters.value[currentCharacterIndex.value] || null
})

// 班級顯示名稱
const getClassDisplayName = (characterClass: string) => {
  const classMap: Record<string, string> = {
    warrior: '戰士',
    mage: '法師',
    rogue: '盜賊',
    priest: '牧師',
    ranger: '遊俠'
  }
  return classMap[characterClass] || characterClass
}

// 角色輪播導航
const nextCharacter = () => {
  if (characters.value.length <= 1) return
  currentCharacterIndex.value = (currentCharacterIndex.value + 1) % characters.value.length
}

const prevCharacter = () => {
  if (characters.value.length <= 1) return
  currentCharacterIndex.value = (currentCharacterIndex.value - 1 + characters.value.length) % characters.value.length
}

// 選擇難度
const selectDifficulty = (difficulty: 'normal' | 'hard') => {
  selectedDifficulty.value = difficulty
}

// 開始遊戲
const startGame = () => {
  if (!currentCharacter.value) return
  
  // 重置遊戲狀態
  runStore.resetGame()
  
  // 設置選擇的角色
  runStore.selectCharacter(currentCharacter.value)
  
  // 根據難度調整敵人屬性（這將在 encounter 選擇時實現）
  // 這裡我們只是初始化遊戲
  runStore.startGame()
  
  // 導向到遊戲頁面
  router.push('/run')
}

// 載入數據
onMounted(async () => {
  try {
    await catalogStore.loadAll()
    // 設置第一個角色為默認選擇
    if (characters.value.length > 0) {
      currentCharacterIndex.value = 0
    }
  } catch (error) {
    console.error('Failed to load game data:', error)
  }
})
</script>