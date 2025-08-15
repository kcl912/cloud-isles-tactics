<template>
  <div 
    class="encounter-card group cursor-pointer transition-all duration-300 hover:scale-105"
    :class="{ 'ring-2 ring-yellow-400': selected }"
    @click="$emit('select', encounter)"
  >
    <div class="card-base p-6 text-center space-y-4">
      <!-- Enemy Avatar -->
      <div class="relative">
        <div 
          class="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl"
          :class="difficultyColors[getDifficultyLevel(encounter.difficulty)]"
        >
          {{ personalityIcons[encounter.ai_personality] }}
        </div>
        <div 
          class="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          :class="difficultyBadgeColors[getDifficultyLevel(encounter.difficulty)]"
        >
          {{ encounter.difficulty }}
        </div>
      </div>
      
      <!-- Encounter Info -->
      <div>
        <h3 class="text-white text-lg font-bold mb-1">{{ encounter.name }}</h3>
        <div class="flex items-center justify-center space-x-2">
          <div 
            class="inline-block px-3 py-1 rounded-full text-sm font-medium"
            :class="difficultyTextColors[getDifficultyLevel(encounter.difficulty)]"
          >
            {{ difficultyNames[getDifficultyLevel(encounter.difficulty)] }}
          </div>
          <div 
            class="inline-block px-3 py-1 rounded-full text-sm font-medium"
            :class="personalityTextColors[encounter.ai_personality]"
          >
            {{ personalityNames[encounter.ai_personality] }}
          </div>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="text-center">
          <div class="text-gray-400">敵人生命</div>
          <div class="text-red-400 font-bold">{{ encounter.enemy_health }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-400">難度</div>
          <div 
            class="font-bold"
            :class="difficultyTextColors[getDifficultyLevel(encounter.difficulty)]"
          >
            {{ encounter.difficulty }}/10
          </div>
        </div>
      </div>
      
      <!-- Description -->
      <p class="text-gray-300 text-sm leading-relaxed">
        {{ encounter.description }}
      </p>
      
      <!-- Rewards Preview -->
      <div v-if="encounter.rewards" class="text-left">
        <h4 class="text-yellow-400 text-sm font-semibold mb-1">獎勵</h4>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="text-center p-2 bg-white/5 rounded">
            <div class="text-gray-400">基礎分數</div>
            <div class="text-yellow-400 font-bold">{{ encounter.rewards.score_base }}</div>
          </div>
          <div class="text-center p-2 bg-white/5 rounded">
            <div class="text-gray-400">分數倍率</div>
            <div class="text-green-400 font-bold">×{{ encounter.rewards.score_multiplier }}</div>
          </div>
        </div>
      </div>
      
      <!-- Enemy Deck Preview -->
      <div class="text-left">
        <h4 class="text-gray-400 text-sm font-semibold mb-2">敵人牌組</h4>
        <div class="flex flex-wrap gap-1">
          <div 
            v-for="cardId in encounter.enemy_deck.slice(0, 6)" 
            :key="cardId"
            class="w-6 h-6 bg-red-500/10 rounded border border-red-500/20 flex items-center justify-center text-xs text-red-300"
          >
            {{ cardId }}
          </div>
          <div 
            v-if="encounter.enemy_deck.length > 6"
            class="w-6 h-6 bg-red-500/5 rounded border border-red-500/10 flex items-center justify-center text-xs text-red-500/50"
          >
            +{{ encounter.enemy_deck.length - 6 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Encounter } from '@/lib/supabase'

interface Props {
  encounter: Encounter
  selected?: boolean
}

interface Emits {
  (e: 'select', encounter: Encounter): void
}

defineProps<Props>()
defineEmits<Emits>()

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'

function getDifficultyLevel(difficulty: number): DifficultyLevel {
  if (difficulty <= 3) return 'easy'
  if (difficulty <= 5) return 'medium'
  if (difficulty <= 7) return 'hard'
  return 'expert'
}

// Difficulty styling
const difficultyColors = {
  easy: 'bg-gradient-to-br from-green-500 to-green-700',
  medium: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
  hard: 'bg-gradient-to-br from-orange-500 to-orange-700',
  expert: 'bg-gradient-to-br from-red-500 to-red-700'
}

const difficultyBadgeColors = {
  easy: 'bg-green-600 text-white',
  medium: 'bg-yellow-600 text-white',
  hard: 'bg-orange-600 text-white',
  expert: 'bg-red-600 text-white'
}

const difficultyTextColors = {
  easy: 'bg-green-500/20 text-green-300 border border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  hard: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  expert: 'bg-red-500/20 text-red-300 border border-red-500/30'
}

const difficultyNames = {
  easy: '簡單',
  medium: '普通',
  hard: '困難',
  expert: '專家'
}

// AI Personality styling
const personalityIcons = {
  aggressive: '🔥',
  defensive: '🛡️',
  balanced: '⚖️',
  chaotic: '⚡'
}

const personalityTextColors = {
  aggressive: 'bg-red-500/20 text-red-300 border border-red-500/30',
  defensive: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  balanced: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  chaotic: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
}

const personalityNames = {
  aggressive: '激進',
  defensive: '防禦',
  balanced: '平衡',
  chaotic: '混亂'
}
</script>