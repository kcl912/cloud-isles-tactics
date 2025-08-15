<template>
  <div class="battlefield grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
    <!-- Player Side -->
    <div class="combatant-panel player-side">
      <div class="card-base p-6 space-y-4">
        <!-- Player Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              :class="player.character ? classColors[player.character.class] : 'bg-blue-600'"
            >
              {{ player.character ? classIcons[player.character.class] : '👤' }}
            </div>
            <div>
              <h3 class="text-white font-bold">{{ player.character?.name || '玩家' }}</h3>
              <div 
                v-if="player.character"
                class="text-xs px-2 py-1 rounded"
                :class="player.character ? classTextColors[player.character.class] : 'bg-blue-500/20 text-blue-300'"
              >
                {{ player.character ? classNames[player.character.class] : '' }}
              </div>
            </div>
          </div>
          
          <!-- Turn indicator -->
          <div 
            v-if="isPlayerTurn"
            class="flex items-center space-x-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30"
          >
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium">你的回合</span>
          </div>
        </div>
        
        <!-- Health Bar -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-300">生命值</span>
            <span class="text-white font-bold">
              {{ player.health }} / {{ player.maxHealth }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500 relative"
              :style="{ width: `${(player.health / player.maxHealth) * 100}%` }"
            >
              <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <!-- Energy Orbs -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-300">能量</span>
            <span class="text-blue-300 font-bold">
              {{ player.energy }} / {{ player.maxEnergy }}
            </span>
          </div>
          <div class="flex space-x-1">
            <div 
              v-for="i in player.maxEnergy" 
              :key="i"
              class="w-8 h-8 rounded-full border-2 transition-all duration-300"
              :class="i <= player.energy 
                ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50' 
                : 'border-gray-600 bg-gray-800'"
            >
              <div 
                v-if="i <= player.energy"
                class="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Armor -->
        <div v-if="player.armor > 0" class="flex items-center space-x-2">
          <span class="text-gray-400 text-sm">護甲:</span>
          <div class="flex items-center space-x-1">
            <span class="text-blue-300">🛡️</span>
            <span class="text-blue-300 font-bold">{{ player.armor }}</span>
          </div>
        </div>
        
        <!-- Status Effects -->
        <div v-if="player.statusEffects.length > 0" class="space-y-2">
          <div class="text-gray-400 text-sm">狀態效果:</div>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="effect in player.statusEffects" 
              :key="effect.type"
              class="flex items-center space-x-1 px-2 py-1 rounded text-xs"
              :class="statusEffectColors[effect.type]"
            >
              <span>{{ statusEffectIcons[effect.type] }}</span>
              <span>{{ effect.duration }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Enemy Side -->
    <div class="combatant-panel enemy-side">
      <div class="card-base p-6 space-y-4 border border-red-500/20">
        <!-- Enemy Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              :class="enemy.encounter ? difficultyColors[getDifficultyLevel(enemy.encounter.difficulty)] : 'bg-red-600'"
            >
              {{ enemy.encounter ? personalityIcons[enemy.encounter.ai_personality] : '👹' }}
            </div>
            <div>
              <h3 class="text-white font-bold">{{ enemy.encounter?.name || '敵人' }}</h3>
              <div 
                v-if="enemy.encounter"
                class="text-xs px-2 py-1 rounded"
                :class="enemy.encounter ? personalityTextColors[enemy.encounter.ai_personality] : 'bg-red-500/20 text-red-300'"
              >
                {{ enemy.encounter ? personalityNames[enemy.encounter.ai_personality] : '' }}
              </div>
            </div>
          </div>
          
          <!-- Turn indicator -->
          <div 
            v-if="!isPlayerTurn"
            class="flex items-center space-x-2 bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-500/30"
          >
            <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium">敵人回合</span>
          </div>
        </div>
        
        <!-- Health Bar -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-300">生命值</span>
            <span class="text-white font-bold">
              {{ enemy.health }} / {{ enemy.maxHealth }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 relative"
              :style="{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }"
            >
              <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <!-- Enemy Energy (simplified) -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-300">能量</span>
            <span class="text-red-300 font-bold">
              {{ enemy.energy }} / {{ enemy.maxEnergy }}
            </span>
          </div>
          <div class="flex space-x-1">
            <div 
              v-for="i in enemy.maxEnergy" 
              :key="i"
              class="w-6 h-6 rounded-full border transition-all duration-300"
              :class="i <= enemy.energy 
                ? 'bg-red-500 border-red-400' 
                : 'border-gray-600 bg-gray-800'"
            ></div>
          </div>
        </div>
        
        <!-- Armor -->
        <div v-if="enemy.armor > 0" class="flex items-center space-x-2">
          <span class="text-gray-400 text-sm">護甲:</span>
          <div class="flex items-center space-x-1">
            <span class="text-blue-300">🛡️</span>
            <span class="text-blue-300 font-bold">{{ enemy.armor }}</span>
          </div>
        </div>
        
        <!-- Status Effects -->
        <div v-if="enemy.statusEffects.length > 0" class="space-y-2">
          <div class="text-gray-400 text-sm">狀態效果:</div>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="effect in enemy.statusEffects" 
              :key="effect.type"
              class="flex items-center space-x-1 px-2 py-1 rounded text-xs"
              :class="statusEffectColors[effect.type]"
            >
              <span>{{ statusEffectIcons[effect.type] }}</span>
              <span>{{ effect.duration }}</span>
            </div>
          </div>
        </div>
        
        <!-- Enemy Hand Count -->
        <div class="flex items-center space-x-2 text-sm">
          <span class="text-gray-400">手牌:</span>
          <span class="text-red-300 font-bold">{{ enemyHandCount }} 張</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Character, Encounter } from '@/lib/supabase'
import type { Combatant } from '@/stores/run'

interface Props {
  player: Combatant & { character?: Character }
  enemy: Combatant & { encounter?: Encounter }
  isPlayerTurn: boolean
  enemyHandCount: number
}

defineProps<Props>()

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'

function getDifficultyLevel(difficulty: number): DifficultyLevel {
  if (difficulty <= 3) return 'easy'
  if (difficulty <= 5) return 'medium'
  if (difficulty <= 7) return 'hard'
  return 'expert'
}

// Class styling (for player character)
const classColors = {
  warrior: 'bg-gradient-to-br from-red-500 to-red-700',
  mage: 'bg-gradient-to-br from-blue-500 to-blue-700',
  rogue: 'bg-gradient-to-br from-gray-600 to-gray-800',
  priest: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
  ranger: 'bg-gradient-to-br from-green-500 to-green-700'
}

const classTextColors = {
  warrior: 'bg-red-500/20 text-red-300 border border-red-500/30',
  mage: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  rogue: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  priest: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  ranger: 'bg-green-500/20 text-green-300 border border-green-500/30'
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

// Difficulty styling (for enemy encounter)
const difficultyColors = {
  easy: 'bg-gradient-to-br from-green-500 to-green-700',
  medium: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
  hard: 'bg-gradient-to-br from-orange-500 to-orange-700',
  expert: 'bg-gradient-to-br from-red-500 to-red-700'
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

// Status effect styling
const statusEffectColors = {
  poison: 'bg-green-500/20 text-green-300 border border-green-500/30',
  burn: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  stun: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  slow: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  regeneration: 'bg-green-500/20 text-green-300 border border-green-500/30',
  strength: 'bg-red-500/20 text-red-300 border border-red-500/30'
}

const statusEffectIcons = {
  poison: '☠️',
  burn: '🔥',
  stun: '💫',
  slow: '🐌',
  regeneration: '💚',
  strength: '💪'
}
</script>