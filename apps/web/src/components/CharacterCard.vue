<template>
  <div 
    class="character-card group cursor-pointer transition-all duration-300 hover:scale-105"
    :class="{ 'ring-2 ring-yellow-400': selected }"
    @click="$emit('select', character)"
  >
    <div class="card-base p-6 text-center space-y-4">
      <!-- Character Avatar -->
      <div class="relative">
        <div 
          class="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl"
          :class="classColors[character.class]"
        >
          {{ classIcons[character.class] }}
        </div>
        <div 
          class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          :class="classColors[character.class]"
        >
          {{ character.base_health }}
        </div>
      </div>
      
      <!-- Character Info -->
      <div>
        <h3 class="text-white text-lg font-bold mb-1">{{ character.name }}</h3>
        <div 
          class="inline-block px-3 py-1 rounded-full text-sm font-medium"
          :class="classTextColors[character.class]"
        >
          {{ classNames[character.class] }}
        </div>
      </div>
      
      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="text-center">
          <div class="text-gray-400">生命值</div>
          <div class="text-red-400 font-bold">{{ character.base_health }}</div>
        </div>
        <div class="text-center">
          <div class="text-gray-400">能量</div>
          <div class="text-blue-400 font-bold">{{ character.base_energy }}</div>
        </div>
      </div>
      
      <!-- Description -->
      <p class="text-gray-300 text-sm leading-relaxed">
        {{ character.description }}
      </p>
      
      <!-- Special Ability -->
      <div v-if="character.special_ability" class="text-left">
        <h4 class="text-yellow-400 text-sm font-semibold mb-1">
          {{ character.special_ability.name }}
        </h4>
        <p class="text-gray-400 text-xs">
          {{ character.special_ability.description }}
        </p>
      </div>
      
      <!-- Starting Deck Preview -->
      <div class="text-left">
        <h4 class="text-gray-400 text-sm font-semibold mb-2">起始牌組</h4>
        <div class="flex flex-wrap gap-1">
          <div 
            v-for="cardId in character.starting_deck.slice(0, 6)" 
            :key="cardId"
            class="w-6 h-6 bg-white/10 rounded border border-white/20 flex items-center justify-center text-xs text-gray-300"
          >
            {{ cardId }}
          </div>
          <div 
            v-if="character.starting_deck.length > 6"
            class="w-6 h-6 bg-white/5 rounded border border-white/10 flex items-center justify-center text-xs text-gray-500"
          >
            +{{ character.starting_deck.length - 6 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Character } from '@/lib/supabase'

interface Props {
  character: Character
  selected?: boolean
}

interface Emits {
  (e: 'select', character: Character): void
}

defineProps<Props>()
defineEmits<Emits>()

// Class styling
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
</script>