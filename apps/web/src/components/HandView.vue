<template>
  <div class="hand-view relative">
    <!-- Hand Cards Container -->
    <div 
      class="flex justify-center items-end space-x-2 px-4 py-6 min-h-[140px]"
      :class="{ 'pointer-events-none opacity-50': !canPlay }"
    >
      <div 
        v-for="(card, index) in hand" 
        :key="`${card.id}-${index}`"
        class="hand-card relative transition-all duration-300"
        :style="getCardStyle(index)"
        @click="playCard(card, index)"
      >
        <CardView 
          :card="card"
          :hoverable="canPlay"
          :disabled="!canPlayCard(card)"
          :show-details="true"
          class="transform transition-all duration-300"
          :class="{
            'hover:scale-110 hover:-translate-y-4': canPlay && canPlayCard(card),
            'cursor-not-allowed opacity-50': !canPlayCard(card)
          }"
        />
        
        <!-- Unplayable indicator -->
        <div 
          v-if="!canPlayCard(card)"
          class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl pointer-events-none"
        >
          <div class="text-red-400 text-xs font-bold bg-red-900/80 px-2 py-1 rounded">
            能量不足
          </div>
        </div>
      </div>
      
      <!-- Empty hand message -->
      <div 
        v-if="hand.length === 0"
        class="text-gray-400 text-center py-8"
      >
        <div class="text-4xl mb-2">🃏</div>
        <div>手牌為空</div>
      </div>
    </div>
    
    <!-- Hand Info -->
    <div class="flex justify-between items-center px-4 py-2 bg-black/20 rounded-lg mx-4">
      <div class="text-gray-300 text-sm">
        手牌: <span class="text-white font-bold">{{ hand.length }}</span> / {{ maxHandSize }}
      </div>
      <div class="text-gray-300 text-sm">
        牌組: <span class="text-white font-bold">{{ deckCount }}</span> 張剩餘
      </div>
    </div>
    
    <!-- Play animation overlay -->
    <Transition name="card-play">
      <div 
        v-if="playingCard"
        class="absolute inset-0 pointer-events-none z-10"
      >
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce-in">
          <CardView 
            :card="playingCard"
            :hoverable="false"
            :show-details="false"
            class="scale-125 opacity-80"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CardView from './CardView.vue'
import type { Card } from '@/lib/supabase'

interface Props {
  hand: Card[]
  playerEnergy: number
  maxHandSize?: number
  deckCount: number
  canPlay: boolean
}

interface Emits {
  (e: 'play-card', card: Card, index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  maxHandSize: 10
})

const emit = defineEmits<Emits>()

const playingCard = ref<Card | null>(null)

// Computed
const canPlayCard = computed(() => (card: Card) => {
  return props.canPlay && props.playerEnergy >= card.cost
})

// Card fan layout calculation
function getCardStyle(index: number) {
  const totalCards = props.hand.length
  const maxRotation = 15 // Maximum rotation in degrees
  const cardSpacing = 8 // Spacing between cards in pixels
  
  if (totalCards <= 1) {
    return {
      transform: 'rotate(0deg) translateY(0px)',
      zIndex: 1
    }
  }
  
  // Calculate rotation for fan effect
  const rotationStep = (maxRotation * 2) / (totalCards - 1)
  const rotation = -maxRotation + (index * rotationStep)
  
  // Calculate vertical offset for arc effect
  const maxOffset = 10
  const centerIndex = (totalCards - 1) / 2
  const distanceFromCenter = Math.abs(index - centerIndex)
  const normalizedDistance = distanceFromCenter / centerIndex
  const verticalOffset = maxOffset * normalizedDistance
  
  return {
    transform: `rotate(${rotation}deg) translateY(${verticalOffset}px)`,
    zIndex: totalCards - Math.abs(index - centerIndex), // Center cards have higher z-index
    marginLeft: index > 0 ? `-${cardSpacing}px` : '0px'
  }
}

async function playCard(card: Card, index: number) {
  if (!canPlayCard.value(card)) {
    return
  }
  
  // Show play animation
  playingCard.value = card
  
  // Emit event after a short delay for animation
  setTimeout(() => {
    emit('play-card', card, index)
    playingCard.value = null
  }, 600)
}
</script>

<style scoped>
.hand-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hand-card:hover {
  z-index: 100 !important;
}

/* Card play animation */
.card-play-enter-active {
  transition: all 0.6s ease-out;
}

.card-play-leave-active {
  transition: all 0.3s ease-in;
}

.card-play-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.card-play-leave-to {
  opacity: 0;
  transform: scale(1.2) translateY(-40px);
}
</style>