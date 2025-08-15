<template>
  <div class="run-page min-h-screen">
    <!-- Loading State -->
    <div v-if="catalogStore.loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center space-y-4">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-white">載入遊戲資料中...</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="catalogStore.error" class="flex items-center justify-center min-h-screen">
      <div class="card-base p-8 text-center max-w-md">
        <div class="text-red-400 text-4xl mb-4">❌</div>
        <h2 class="text-white text-xl font-bold mb-2">載入失敗</h2>
        <p class="text-gray-300 mb-4">{{ catalogStore.error }}</p>
        <button @click="loadGameData" class="btn-primary">
          重新載入
        </button>
      </div>
    </div>
    
    <!-- Character Selection -->
    <div v-else-if="runStore.gamePhase === 'character_select'" class="container mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-4">選擇角色</h1>
        <p class="text-gray-300">選擇一個角色開始你的冒險</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <CharacterCard 
          v-for="character in catalogStore.characters"
          :key="character.id"
          :character="character"
          :selected="runStore.selectedCharacter?.id === character.id"
          @select="selectCharacter"
        />
      </div>
      
      <div class="text-center mt-8">
        <router-link to="/" class="btn-secondary">
          ← 返回主頁
        </router-link>
      </div>
    </div>
    
    <!-- Encounter Selection -->
    <div v-else-if="runStore.gamePhase === 'encounter_select'" class="container mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-4">選擇遭遇</h1>
        <p class="text-gray-300">選擇一個敵人進行戰鬥</p>
        
        <!-- Selected Character Display -->
        <div v-if="runStore.selectedCharacter" class="mt-6 flex justify-center">
          <div class="card-base p-4 flex items-center space-x-4">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              :class="classColors[runStore.selectedCharacter.class]"
            >
              {{ classIcons[runStore.selectedCharacter.class] }}
            </div>
            <div class="text-left">
              <h3 class="text-white font-bold">{{ runStore.selectedCharacter.name }}</h3>
              <p class="text-gray-300 text-sm">{{ classNames[runStore.selectedCharacter.class] }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <EncounterCard 
          v-for="encounter in catalogStore.encounters"
          :key="encounter.id"
          :encounter="encounter"
          :selected="runStore.selectedEncounter?.id === encounter.id"
          @select="selectEncounter"
        />
      </div>
      
      <div class="text-center mt-8">
        <button @click="runStore.gameState.phase = 'character_select'" class="btn-secondary">
          ← 重新選擇角色
        </button>
      </div>
    </div>
    
    <!-- Battle Phase -->
    <div v-else-if="runStore.gamePhase === 'battle'" class="battle-container">
      <!-- Game HUD -->
      <HUD 
        :turn="runStore.gameState.turn"
        :is-player-turn="runStore.isPlayerTurn"
        :duration="runStore.gameDuration"
        :deck-count="runStore.playerDeck.length"
        :discard-count="runStore.playerDiscard.length"
        :can-end-turn="canEndTurn"
        :current-score="runStore.finalScore"
        :show-score="false"
        @end-turn="endTurn"
        @forfeit="forfeitGame"
        @exit-game="exitGame"
      />
      
      <!-- Battlefield -->
      <div class="pt-20">
        <Battlefield 
          :player="{ ...runStore.player, character: runStore.selectedCharacter }"
          :enemy="{ ...runStore.enemy, encounter: runStore.selectedEncounter }"
          :is-player-turn="runStore.isPlayerTurn"
          :enemy-hand-count="runStore.enemyHand.length"
        />
      </div>
      
      <!-- Hand View -->
      <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
        <HandView 
          :hand="runStore.playerHand"
          :player-energy="runStore.player.energy"
          :deck-count="runStore.playerDeck.length"
          :can-play="runStore.isPlayerTurn"
          @play-card="playCard"
        />
      </div>
    </div>
    
    <!-- Victory Phase -->
    <div v-else-if="runStore.gamePhase === 'victory'" class="flex items-center justify-center min-h-screen">
      <div class="card-base p-8 text-center max-w-md">
        <div class="text-6xl mb-4">🏆</div>
        <h2 class="text-yellow-400 text-3xl font-bold mb-4">勝利！</h2>
        
        <div class="space-y-4 mb-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-gray-400">最終分數</div>
              <div class="text-yellow-400 text-xl font-bold">{{ runStore.finalScore }}</div>
            </div>
            <div>
              <div class="text-gray-400">戰鬥時間</div>
              <div class="text-white font-bold">{{ formatTime(runStore.gameDuration) }}</div>
            </div>
            <div>
              <div class="text-gray-400">剩餘生命</div>
              <div class="text-red-400 font-bold">{{ runStore.player.health }}</div>
            </div>
            <div>
              <div class="text-gray-400">出牌數</div>
              <div class="text-blue-400 font-bold">{{ runStore.gameStats.cardsPlayed }}</div>
            </div>
          </div>
        </div>
        
        <div class="space-y-3">
          <router-link to="/result" class="btn-primary block">
            查看排行榜
          </router-link>
          <button @click="playAgain" class="btn-secondary block">
            再玩一次
          </button>
          <router-link to="/" class="btn-secondary block">
            返回主頁
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- Defeat Phase -->
    <div v-else-if="runStore.gamePhase === 'defeat'" class="flex items-center justify-center min-h-screen">
      <div class="card-base p-8 text-center max-w-md">
        <div class="text-6xl mb-4">💀</div>
        <h2 class="text-red-400 text-3xl font-bold mb-4">敗北</h2>
        
        <div class="space-y-4 mb-6">
          <p class="text-gray-300">別氣餒，再試一次！</p>
          
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-gray-400">存活時間</div>
              <div class="text-white font-bold">{{ formatTime(runStore.gameDuration) }}</div>
            </div>
            <div>
              <div class="text-gray-400">造成傷害</div>
              <div class="text-red-400 font-bold">{{ runStore.gameStats.damageDealt }}</div>
            </div>
          </div>
        </div>
        
        <div class="space-y-3">
          <button @click="playAgain" class="btn-primary block">
            再試一次
          </button>
          <router-link to="/result" class="btn-secondary block">
            查看排行榜
          </router-link>
          <router-link to="/" class="btn-secondary block">
            返回主頁
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import { useRunStore } from '@/stores/run'
import CharacterCard from '@/components/CharacterCard.vue'
import EncounterCard from '@/components/EncounterCard.vue'
import HUD from '@/components/HUD.vue'
import Battlefield from '@/components/Battlefield.vue'
import HandView from '@/components/HandView.vue'
import type { Character, Encounter, Card } from '@/lib/supabase'

const router = useRouter()
const catalogStore = useCatalogStore()
const runStore = useRunStore()

// Computed
const canEndTurn = computed(() => {
  return runStore.isPlayerTurn && runStore.gamePhase === 'battle'
})

// Class styling for character display
const classColors = {
  warrior: 'bg-gradient-to-br from-red-500 to-red-700',
  mage: 'bg-gradient-to-br from-blue-500 to-blue-700',
  rogue: 'bg-gradient-to-br from-gray-600 to-gray-800',
  priest: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
  ranger: 'bg-gradient-to-br from-green-500 to-green-700'
}

const classIcons = {
  warrior: '⚔️',
  mage: '🔮',
  rogue: '🗡️',
  priest: '✨',
  ranger: '🏹'
}

const classNames = {
  warrior: '戰士',
  mage: '法師',
  rogue: '盜賊',
  priest: '牧師',
  ranger: '遊俠'
}

// Methods
async function loadGameData() {
  try {
    await catalogStore.loadAll()
  } catch (error) {
    console.error('Failed to load game data:', error)
  }
}

function selectCharacter(character: Character) {
  runStore.selectCharacter(character)
}

function selectEncounter(encounter: Encounter) {
  runStore.selectEncounter(encounter)
}

function playCard(card: Card, index: number) {
  runStore.playCard(card, index)
}

function endTurn() {
  runStore.endTurn()
}

function forfeitGame() {
  if (confirm('確定要投降嗎？這將結束當前遊戲。')) {
    runStore.endGame('defeat')
  }
}

function exitGame() {
  if (confirm('確定要退出遊戲嗎？進度將不會保存。')) {
    router.push('/')
  }
}

function playAgain() {
  runStore.resetGame()
  runStore.startGame()
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(async () => {
  await loadGameData()
  
  // Start the game if not already started
  if (runStore.gamePhase === 'setup') {
    runStore.startGame()
  }
})
</script>

<style scoped>
.battle-container {
  min-height: 100vh;
  padding-bottom: 200px; /* Space for hand view */
}

@media (max-width: 768px) {
  .battle-container {
    padding-bottom: 160px;
  }
}
</style>