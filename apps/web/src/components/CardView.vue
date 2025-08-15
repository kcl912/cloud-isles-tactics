<template>
  <div 
    class="card-view group relative cursor-pointer transition-all duration-300"
    :class="{
      'transform hover:scale-105 hover:-translate-y-2': hoverable,
      'opacity-50': disabled,
      'ring-2 ring-yellow-400': selected,
      [`rarity-${card.rarity}`]: true
    }"
    @click="handleClick"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <!-- Card Container -->
    <div class="card-base p-4 w-32 h-44 flex flex-col justify-between relative overflow-hidden">
      <!-- Rarity Indicator -->
      <div 
        class="absolute top-1 right-1 w-3 h-3 rounded-full"
        :class="rarityColors[card.rarity]"
      ></div>
      
      <!-- Cost Badge -->
      <div 
        class="absolute top-1 left-1 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-lg"
      >
        {{ card.cost }}
      </div>
      
      <!-- Card Image Area -->
      <div class="flex-1 flex items-center justify-center mt-6 mb-2">
        <div 
          class="w-16 h-16 rounded-lg bg-gradient-to-br shadow-inner flex items-center justify-center"
          :class="typeColors[card.type]"
        >
          <span class="text-2xl">{{ typeIcons[card.type] }}</span>
        </div>
      </div>
      
      <!-- Card Name -->
      <div class="text-center">
        <h3 class="text-white text-sm font-semibold truncate mb-1">
          {{ card.name }}
        </h3>
        <div 
          class="text-xs px-2 py-1 rounded-full text-center"
          :class="typeTextColors[card.type]"
        >
          {{ typeNames[card.type] }}
        </div>
      </div>
    </div>
    
    <!-- Tooltip -->
    <Transition name="tooltip">
      <div 
        v-if="showTooltip && showDetails"
        class="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 card-base p-4 text-sm"
      >
        <!-- Tooltip Arrow -->
        <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/20"></div>
        
        <div class="text-white space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-base">{{ card.name }}</h4>
            <div class="flex items-center space-x-1">
              <span class="text-blue-300 font-bold">{{ card.cost }}</span>
              <span class="text-xs text-gray-300">能量</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <span 
              class="px-2 py-1 rounded text-xs font-medium"
              :class="typeTextColors[card.type]"
            >
              {{ typeNames[card.type] }}
            </span>
            <span 
              class="px-2 py-1 rounded text-xs font-medium"
              :class="rarityTextColors[card.rarity]"
            >
              {{ rarityNames[card.rarity] }}
            </span>
          </div>
          
          <p class="text-gray-300 text-sm leading-relaxed">
            {{ card.description }}
          </p>
          
          <!-- Effects -->
          <div v-if="card.effects.length > 0" class="space-y-1">
            <h5 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">效果</h5>
            <div class="space-y-1">
              <div 
                v-for="(effect, index) in card.effects" 
                :key="index"
                class="text-xs text-gray-300 flex items-center space-x-1"
              >
                <span class="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{{ formatEffect(effect) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Card } from '@/lib/supabase'

interface Props {
  card: Card
  hoverable?: boolean
  disabled?: boolean
  selected?: boolean
  showDetails?: boolean
}

interface Emits {
  (e: 'click', card: Card): void
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: true,
  disabled: false,
  selected: false,
  showDetails: true
})

const emit = defineEmits<Emits>()

const showTooltip = ref(false)

// Card type styling
const typeColors = {
  attack: 'from-red-500 to-red-700',
  defense: 'from-blue-500 to-blue-700',
  utility: 'from-green-500 to-green-700',
  spell: 'from-purple-500 to-purple-700'
}

const typeTextColors = {
  attack: 'bg-red-500/20 text-red-300 border border-red-500/30',
  defense: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  utility: 'bg-green-500/20 text-green-300 border border-green-500/30',
  spell: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
}

const typeIcons = {
  attack: '⚔️',
  defense: '🛡️',
  utility: '✨',
  spell: '🔮'
}

const typeNames = {
  attack: '攻擊',
  defense: '防禦',
  utility: '輔助',
  spell: '法術'
}

// Rarity styling
const rarityColors = {
  common: 'bg-gray-400',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500'
}

const rarityTextColors = {
  common: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  uncommon: 'bg-green-500/20 text-green-300 border border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  legendary: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
}

const rarityNames = {
  common: '普通',
  uncommon: '罕見',
  rare: '稀有',
  epic: '史詩',
  legendary: '傳說'
}

function formatEffect(effect: any): string {
  switch (effect.type) {
    case 'damage':
      return `造成 ${effect.amount} 點傷害`
    case 'heal':
      return `恢復 ${effect.amount} 點生命值`
    case 'armor':
      return `獲得 ${effect.amount} 點護甲`
    case 'energy':
      return `獲得 ${effect.amount} 點能量`
    case 'poison':
      return `施加 ${effect.duration} 回合中毒 (${effect.amount} 傷害/回合)`
    case 'burn':
      return `施加 ${effect.duration} 回合燃燒 (${effect.amount} 傷害/回合)`
    case 'stun':
      return `造成 ${effect.duration} 回合暈眩`
    case 'slow':
      return `造成 ${effect.duration} 回合減速`
    case 'draw':
      return `抽 ${effect.amount} 張牌`
    case 'cleanse':
      return `移除所有負面狀態`
    default:
      return `${effect.type}: ${effect.amount || ''}`
  }
}

function handleClick() {
  if (!props.disabled) {
    emit('click', props.card)
  }
}
</script>

<style scoped>
.rarity-common {
  @apply shadow-gray-500/20;
}

.rarity-uncommon {
  @apply shadow-green-500/20;
}

.rarity-rare {
  @apply shadow-blue-500/20;
}

.rarity-epic {
  @apply shadow-purple-500/20;
}

.rarity-legendary {
  @apply shadow-yellow-500/20 ring-1 ring-yellow-500/30;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.9);
}
</style>