<template>
  <div class="game-hud fixed top-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm border-b border-white/10">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Left: Game Info -->
        <div class="flex items-center space-x-6">
          <!-- Turn Counter -->
          <div class="flex items-center space-x-2 text-white">
            <span class="text-gray-400">回合:</span>
            <span class="font-bold">{{ turn }}</span>
          </div>
          
          <!-- Game Timer -->
          <div class="flex items-center space-x-2 text-white">
            <span class="text-gray-400">⏱️</span>
            <span class="font-mono">{{ formatTime(duration) }}</span>
          </div>
          
          <!-- Score Preview (if victory conditions are clear) -->
          <div v-if="showScore" class="flex items-center space-x-2 text-yellow-400">
            <span class="text-gray-400">分數:</span>
            <span class="font-bold">{{ currentScore }}</span>
          </div>
        </div>
        
        <!-- Center: Turn Status -->
        <div class="flex items-center space-x-4">
          <div 
            class="px-4 py-2 rounded-full border font-medium transition-all duration-300"
            :class="turnStatusClass"
          >
            {{ turnStatusText }}
          </div>
          
          <!-- End Turn Button -->
          <button 
            v-if="isPlayerTurn && canEndTurn"
            @click="$emit('end-turn')"
            class="btn-primary px-4 py-2 text-sm"
          >
            結束回合
          </button>
        </div>
        
        <!-- Right: Game Controls -->
        <div class="flex items-center space-x-3">
          <!-- Deck Count -->
          <div class="flex items-center space-x-2 text-white text-sm">
            <span class="text-gray-400">牌組:</span>
            <div class="flex items-center space-x-1">
              <span class="text-blue-300">🃏</span>
              <span class="font-bold">{{ deckCount }}</span>
            </div>
          </div>
          
          <!-- Discard Count -->
          <div class="flex items-center space-x-2 text-white text-sm">
            <span class="text-gray-400">棄牌:</span>
            <div class="flex items-center space-x-1">
              <span class="text-gray-500">🗂️</span>
              <span class="font-bold">{{ discardCount }}</span>
            </div>
          </div>
          
          <!-- Settings Menu -->
          <div class="relative">
            <button 
              @click="showMenu = !showMenu"
              class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <span class="text-gray-300">⚙️</span>
            </button>
            
            <!-- Dropdown Menu -->
            <Transition name="menu">
              <div 
                v-if="showMenu"
                class="absolute top-10 right-0 card-base p-3 min-w-[160px] space-y-2"
              >
                <button 
                  @click="$emit('toggle-pause')"
                  class="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-white text-sm transition-colors"
                >
                  {{ isPaused ? '▶️ 繼續' : '⏸️ 暫停' }}
                </button>
                
                <button 
                  @click="$emit('show-help')"
                  class="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-white text-sm transition-colors"
                >
                  ❓ 幫助
                </button>
                
                <button 
                  @click="$emit('forfeit')"
                  class="w-full text-left px-3 py-2 rounded hover:bg-red-500/20 text-red-300 text-sm transition-colors"
                >
                  🏳️ 投降
                </button>
                
                <hr class="border-white/10">
                
                <button 
                  @click="$emit('exit-game')"
                  class="w-full text-left px-3 py-2 rounded hover:bg-red-500/20 text-red-300 text-sm transition-colors"
                >
                  🚪 退出遊戲
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Click outside to close menu -->
  <div 
    v-if="showMenu"
    class="fixed inset-0 z-10"
    @click="showMenu = false"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  turn: number
  isPlayerTurn: boolean
  duration: number
  deckCount: number
  discardCount: number
  canEndTurn: boolean
  isPaused?: boolean
  currentScore?: number
  showScore?: boolean
}

interface Emits {
  (e: 'end-turn'): void
  (e: 'toggle-pause'): void
  (e: 'show-help'): void
  (e: 'forfeit'): void
  (e: 'exit-game'): void
}

const props = withDefaults(defineProps<Props>(), {
  isPaused: false,
  currentScore: 0,
  showScore: false
})

defineEmits<Emits>()

const showMenu = ref(false)

// Turn status styling
const turnStatusClass = computed(() => {
  if (props.isPaused) {
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  }
  
  if (props.isPlayerTurn) {
    return 'bg-green-500/20 text-green-300 border-green-500/30 animate-pulse'
  } else {
    return 'bg-red-500/20 text-red-300 border-red-500/30'
  }
})

const turnStatusText = computed(() => {
  if (props.isPaused) return '⏸️ 遊戲暫停'
  if (props.isPlayerTurn) return '⚡ 你的回合'
  return '🤖 敵人思考中...'
})

// Format duration as MM:SS
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Close menu when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Menu animation */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .game-hud .container {
    padding: 0.5rem;
  }
  
  .game-hud .flex {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .game-hud .space-x-6 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 1rem;
  }
  
  .game-hud .space-x-4 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 0.75rem;
  }
}

@media (max-width: 640px) {
  .game-hud .flex {
    justify-content: center;
  }
  
  .game-hud .space-x-6,
  .game-hud .space-x-3 {
    display: none;
  }
  
  .game-hud .space-x-4 {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .game-hud .space-x-4 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 0;
  }
}
</style>