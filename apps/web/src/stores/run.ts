import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCatalogStore } from './catalog'
import { generateDeviceId, generateSignature } from '@/lib/device'
import { submitRun } from '@/lib/leaderboard'
import type { Card, Character, Encounter } from '@/lib/supabase'

// Game state types
export interface GameState {
  phase: 'setup' | 'character_select' | 'encounter_select' | 'battle' | 'victory' | 'defeat'
  turn: number
  playerTurn: boolean
}

export interface Combatant {
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
  armor: number
  statusEffects: StatusEffect[]
}

export interface StatusEffect {
  type: 'poison' | 'burn' | 'stun' | 'slow' | 'regeneration' | 'strength'
  amount?: number
  duration: number
  source?: string
}

export interface GameStats {
  startTime: number
  endTime?: number
  cardsPlayed: number
  damageDealt: number
  damageTaken: number
  totalTurns: number
}

export const useRunStore = defineStore('run', () => {
  const catalogStore = useCatalogStore()

  // Core game state
  const gameState = ref<GameState>({
    phase: 'setup',
    turn: 1,
    playerTurn: true
  })

  const selectedCharacter = ref<Character | null>(null)
  const selectedEncounter = ref<Encounter | null>(null)

  // Combat state
  const player = ref<Combatant>({
    health: 100,
    maxHealth: 100,
    energy: 3,
    maxEnergy: 3,
    armor: 0,
    statusEffects: []
  })

  const enemy = ref<Combatant>({
    health: 60,
    maxHealth: 60,
    energy: 2,
    maxEnergy: 2,
    armor: 0,
    statusEffects: []
  })

  // Card state
  const playerDeck = ref<Card[]>([])
  const playerHand = ref<Card[]>([])
  const playerDiscard = ref<Card[]>([])
  const enemyDeck = ref<Card[]>([])
  const enemyHand = ref<Card[]>([])
  const enemyDiscard = ref<Card[]>([])

  // Game statistics
  const gameStats = ref<GameStats>({
    startTime: Date.now(),
    cardsPlayed: 0,
    damageDealt: 0,
    damageTaken: 0,
    totalTurns: 0
  })

  // Computed properties
  const isPlayerTurn = computed(() => gameState.value.playerTurn)
  const gamePhase = computed(() => gameState.value.phase)
  
  const playerStatus = computed(() => ({
    healthPercent: (player.value.health / player.value.maxHealth) * 100,
    isAlive: player.value.health > 0,
    canPlayCards: isPlayerTurn.value && player.value.energy > 0
  }))

  const enemyStatus = computed(() => ({
    healthPercent: (enemy.value.health / enemy.value.maxHealth) * 100,
    isAlive: enemy.value.health > 0
  }))

  const gameDuration = computed(() => {
    const endTime = gameStats.value.endTime || Date.now()
    return Math.floor((endTime - gameStats.value.startTime) / 1000)
  })

  const finalScore = computed(() => {
    if (gameState.value.phase !== 'victory') return 0
    
    const baseScore = selectedEncounter.value?.rewards?.score_base || 100
    const multiplier = selectedEncounter.value?.rewards?.score_multiplier || 1
    const healthBonus = player.value.health * 2
    const speedBonus = Math.max(0, 300 - gameDuration.value)
    
    return Math.floor((baseScore + healthBonus + speedBonus) * multiplier)
  })

  // Actions
  function startGame() {
    gameState.value.phase = 'character_select'
  }

  function selectCharacter(character: Character) {
    selectedCharacter.value = character
    
    // Initialize player stats
    player.value.health = character.base_health
    player.value.maxHealth = character.base_health
    player.value.energy = character.base_energy
    player.value.maxEnergy = character.base_energy
    
    // Build starting deck
    playerDeck.value = catalogStore.getCardsByIds(character.starting_deck)
    
    gameState.value.phase = 'encounter_select'
  }

  function selectEncounter(encounter: Encounter) {
    selectedEncounter.value = encounter
    
    // Initialize enemy stats
    enemy.value.health = encounter.enemy_health
    enemy.value.maxHealth = encounter.enemy_health
    enemy.value.energy = 2 // Base enemy energy
    enemy.value.maxEnergy = 2
    
    // Build enemy deck
    enemyDeck.value = catalogStore.getCardsByIds(encounter.enemy_deck)
    
    startBattle()
  }

  function startBattle() {
    gameState.value.phase = 'battle'
    gameState.value.turn = 1
    gameState.value.playerTurn = true
    gameStats.value.startTime = Date.now()
    
    // Initial card draw
    drawCards(playerDeck.value, playerHand.value, 5)
    drawCards(enemyDeck.value, enemyHand.value, 3)
  }

  function drawCards(deck: Card[], hand: Card[], count: number) {
    for (let i = 0; i < count && deck.length > 0; i++) {
      const card = deck.shift()
      if (card) hand.push(card)
    }
  }

  function playCard(card: Card, targetIndex?: number) {
    if (!isPlayerTurn.value || player.value.energy < card.cost) {
      return false
    }

    // Remove card from hand
    const cardIndex = playerHand.value.findIndex(c => c.id === card.id)
    if (cardIndex === -1) return false

    playerHand.value.splice(cardIndex, 1)
    playerDiscard.value.push(card)

    // Consume energy
    player.value.energy -= card.cost

    // Apply card effects
    applyCardEffects(card, 'player')

    // Update stats
    gameStats.value.cardsPlayed++

    return true
  }

  function applyCardEffects(card: Card, caster: 'player' | 'enemy') {
    const source = caster === 'player' ? player.value : enemy.value
    const target = caster === 'player' ? enemy.value : player.value

    for (const effect of card.effects) {
      switch (effect.type) {
        case 'damage':
          if (effect.amount) {
            dealDamage(target, effect.amount)
            if (caster === 'player') gameStats.value.damageDealt += effect.amount
            else gameStats.value.damageTaken += effect.amount
          }
          break

        case 'heal':
          if (effect.amount) {
            heal(source, effect.amount)
          }
          break

        case 'armor':
          if (effect.amount) {
            source.armor += effect.amount
          }
          break

        case 'energy':
          if (effect.amount) {
            source.energy = Math.min(source.maxEnergy, source.energy + effect.amount)
          }
          break

        case 'poison':
          if (effect.amount && effect.duration) {
            addStatusEffect(target, {
              type: 'poison',
              amount: effect.amount,
              duration: effect.duration
            })
          }
          break

        case 'burn':
          if (effect.amount && effect.duration) {
            addStatusEffect(target, {
              type: 'burn',
              amount: effect.amount,
              duration: effect.duration
            })
          }
          break

        case 'stun':
          if (effect.duration) {
            addStatusEffect(target, {
              type: 'stun',
              duration: effect.duration
            })
          }
          break
      }
    }
  }

  function dealDamage(target: Combatant, amount: number) {
    // Apply armor reduction
    const actualDamage = Math.max(1, amount - target.armor)
    target.armor = Math.max(0, target.armor - amount)
    target.health = Math.max(0, target.health - actualDamage)
    
    // Check for death
    if (target.health === 0) {
      if (target === player.value) {
        endGame('defeat')
      } else {
        endGame('victory')
      }
    }
  }

  function heal(target: Combatant, amount: number) {
    target.health = Math.min(target.maxHealth, target.health + amount)
  }

  function addStatusEffect(target: Combatant, effect: StatusEffect) {
    // Remove existing effect of same type
    target.statusEffects = target.statusEffects.filter(e => e.type !== effect.type)
    target.statusEffects.push(effect)
  }

  function processStatusEffects(combatant: Combatant) {
    const effectsToRemove: number[] = []

    combatant.statusEffects.forEach((effect, index) => {
      switch (effect.type) {
        case 'poison':
        case 'burn':
          if (effect.amount) {
            dealDamage(combatant, effect.amount)
          }
          break

        case 'regeneration':
          if (effect.amount) {
            heal(combatant, effect.amount)
          }
          break
      }

      // Decrease duration
      effect.duration--
      if (effect.duration <= 0) {
        effectsToRemove.push(index)
      }
    })

    // Remove expired effects
    effectsToRemove.reverse().forEach(index => {
      combatant.statusEffects.splice(index, 1)
    })
  }

  function endTurn() {
    if (gameState.value.phase !== 'battle') return

    // Process status effects for current player
    if (isPlayerTurn.value) {
      processStatusEffects(player.value)
    } else {
      processStatusEffects(enemy.value)
      gameStats.value.totalTurns++
    }

    // Switch turns
    gameState.value.playerTurn = !gameState.value.playerTurn

    // Start of turn effects
    if (isPlayerTurn.value) {
      // Player turn start
      player.value.energy = player.value.maxEnergy
      drawCards(playerDeck.value, playerHand.value, 1)
      
      // Apply character special ability if it's passive and turn-based
      if (selectedCharacter.value?.special_ability?.type === 'passive') {
        const ability = selectedCharacter.value.special_ability
        for (const effect of ability.effects) {
          if (effect.trigger === 'turn_start') {
            // Apply the effect (simplified)
            if (effect.type === 'heal' && effect.amount) {
              heal(player.value, effect.amount)
            }
          }
        }
      }
    } else {
      // Enemy turn start
      enemy.value.energy = enemy.value.maxEnergy
      drawCards(enemyDeck.value, enemyHand.value, 1)
      
      // Simple AI turn
      setTimeout(() => {
        playEnemyTurn()
      }, 1000)
    }
  }

  function playEnemyTurn() {
    if (!isPlayerTurn.value && gameState.value.phase === 'battle') {
      // Simple AI: play first affordable card
      for (const card of enemyHand.value) {
        if (enemy.value.energy >= card.cost) {
          const cardIndex = enemyHand.value.findIndex(c => c.id === card.id)
          enemyHand.value.splice(cardIndex, 1)
          enemyDiscard.value.push(card)
          enemy.value.energy -= card.cost
          
          applyCardEffects(card, 'enemy')
          break
        }
      }
      
      // End enemy turn after a brief delay
      setTimeout(() => {
        endTurn()
      }, 500)
    }
  }

  async function endGame(result: 'victory' | 'defeat') {
    gameState.value.phase = result
    gameStats.value.endTime = Date.now()

    // Only submit if victory
    if (result === 'victory' && selectedCharacter.value && selectedEncounter.value) {
      try {
        const deviceId = generateDeviceId()
        const runData = {
          character_id: selectedCharacter.value.id,
          encounter_id: selectedEncounter.value.id,
          score: finalScore.value,
          duration_seconds: gameDuration.value,
          result,
          final_health: player.value.health,
          cards_played: gameStats.value.cardsPlayed,
          damage_dealt: gameStats.value.damageDealt,
          damage_taken: gameStats.value.damageTaken,
          device_id: deviceId,
          signature: '',
          metadata: {
            total_turns: gameStats.value.totalTurns,
            character_class: selectedCharacter.value.class,
            encounter_difficulty: selectedEncounter.value.difficulty
          }
        }

        // Generate signature
        runData.signature = await generateSignature(runData)

        // Submit to server
        const submission = await submitRun(runData)
        console.log('Run submitted:', submission)
      } catch (error) {
        console.error('Failed to submit run:', error)
      }
    }
  }

  function resetGame() {
    gameState.value = {
      phase: 'setup',
      turn: 1,
      playerTurn: true
    }
    
    selectedCharacter.value = null
    selectedEncounter.value = null
    
    player.value = {
      health: 100,
      maxHealth: 100,
      energy: 3,
      maxEnergy: 3,
      armor: 0,
      statusEffects: []
    }
    
    enemy.value = {
      health: 60,
      maxHealth: 60,
      energy: 2,
      maxEnergy: 2,
      armor: 0,
      statusEffects: []
    }
    
    playerDeck.value = []
    playerHand.value = []
    playerDiscard.value = []
    enemyDeck.value = []
    enemyHand.value = []
    enemyDiscard.value = []
    
    gameStats.value = {
      startTime: Date.now(),
      cardsPlayed: 0,
      damageDealt: 0,
      damageTaken: 0,
      totalTurns: 0
    }
  }

  return {
    // State
    gameState,
    selectedCharacter,
    selectedEncounter,
    player,
    enemy,
    playerDeck,
    playerHand,
    playerDiscard,
    enemyDeck,
    enemyHand,
    enemyDiscard,
    gameStats,

    // Computed
    isPlayerTurn,
    gamePhase,
    playerStatus,
    enemyStatus,
    gameDuration,
    finalScore,

    // Actions
    startGame,
    selectCharacter,
    selectEncounter,
    startBattle,
    playCard,
    endTurn,
    endGame,
    resetGame
  }
})