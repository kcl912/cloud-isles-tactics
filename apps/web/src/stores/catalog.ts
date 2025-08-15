import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Card, type Character, type Encounter } from '@/lib/supabase'

export const useCatalogStore = defineStore('catalog', () => {
  // State
  const cards = ref<Card[]>([])
  const characters = ref<Character[]>([])
  const encounters = ref<Encounter[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number>(0)

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000

  // Computed
  const isLoaded = computed(() => cards.value.length > 0 && characters.value.length > 0 && encounters.value.length > 0)
  const isCacheValid = computed(() => Date.now() - lastFetched.value < CACHE_DURATION)

  // Filter cards by type
  const getCardsByType = computed(() => (type: Card['type']) => {
    return cards.value.filter(card => card.type === type)
  })

  // Filter cards by rarity
  const getCardsByRarity = computed(() => (rarity: Card['rarity']) => {
    return cards.value.filter(card => card.rarity === rarity)
  })

  // Filter characters by class
  const getCharactersByClass = computed(() => (characterClass: Character['class']) => {
    return characters.value.filter(character => character.class === characterClass)
  })

  // Filter encounters by difficulty
  const getEncountersByDifficulty = computed(() => (minDiff: number, maxDiff?: number) => {
    return encounters.value.filter(encounter => {
      return encounter.difficulty >= minDiff && (!maxDiff || encounter.difficulty <= maxDiff)
    })
  })

  // Get card by ID
  const getCardById = computed(() => (id: number) => {
    return cards.value.find(card => card.id === id)
  })

  // Get character by ID
  const getCharacterById = computed(() => (id: number) => {
    return characters.value.find(character => character.id === id)
  })

  // Get encounter by ID
  const getEncounterById = computed(() => (id: number) => {
    return encounters.value.find(encounter => encounter.id === id)
  })

  // Get cards by IDs (for deck building)
  const getCardsByIds = computed(() => (ids: number[]) => {
    return ids.map(id => cards.value.find(card => card.id === id)).filter(Boolean) as Card[]
  })

  // Actions
  async function loadAll(forceRefresh = false) {
    if (!forceRefresh && isLoaded.value && isCacheValid.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      // Load all data in parallel
      const [cardsResult, charactersResult, encountersResult] = await Promise.all([
        supabase.from('cards').select('*').order('id'),
        supabase.from('characters').select('*').order('id'),
        supabase.from('encounters').select('*').order('difficulty')
      ])

      // Check for errors
      if (cardsResult.error) throw cardsResult.error
      if (charactersResult.error) throw charactersResult.error
      if (encountersResult.error) throw encountersResult.error

      // Update state
      cards.value = cardsResult.data || []
      characters.value = charactersResult.data || []
      encounters.value = encountersResult.data || []
      lastFetched.value = Date.now()

      console.log('Catalog loaded:', {
        cards: cards.value.length,
        characters: characters.value.length,
        encounters: encounters.value.length
      })

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load catalog'
      console.error('Error loading catalog:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadCards(forceRefresh = false) {
    if (!forceRefresh && cards.value.length > 0 && isCacheValid.value) {
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('cards')
        .select('*')
        .order('id')

      if (fetchError) throw fetchError

      cards.value = data || []
      lastFetched.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load cards'
      throw err
    }
  }

  async function loadCharacters(forceRefresh = false) {
    if (!forceRefresh && characters.value.length > 0 && isCacheValid.value) {
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .order('id')

      if (fetchError) throw fetchError

      characters.value = data || []
      lastFetched.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load characters'
      throw err
    }
  }

  async function loadEncounters(forceRefresh = false) {
    if (!forceRefresh && encounters.value.length > 0 && isCacheValid.value) {
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('encounters')
        .select('*')
        .order('difficulty')

      if (fetchError) throw fetchError

      encounters.value = data || []
      lastFetched.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load encounters'
      throw err
    }
  }

  // Search functionality
  function searchCards(query: string): Card[] {
    const lowerQuery = query.toLowerCase()
    return cards.value.filter(card => 
      card.name.toLowerCase().includes(lowerQuery) ||
      card.description.toLowerCase().includes(lowerQuery) ||
      card.type.toLowerCase().includes(lowerQuery) ||
      card.rarity.toLowerCase().includes(lowerQuery)
    )
  }

  function searchCharacters(query: string): Character[] {
    const lowerQuery = query.toLowerCase()
    return characters.value.filter(character => 
      character.name.toLowerCase().includes(lowerQuery) ||
      character.description.toLowerCase().includes(lowerQuery) ||
      character.class.toLowerCase().includes(lowerQuery)
    )
  }

  function searchEncounters(query: string): Encounter[] {
    const lowerQuery = query.toLowerCase()
    return encounters.value.filter(encounter => 
      encounter.name.toLowerCase().includes(lowerQuery) ||
      encounter.description.toLowerCase().includes(lowerQuery) ||
      encounter.ai_personality.toLowerCase().includes(lowerQuery)
    )
  }

  // Clear cache
  function clearCache() {
    cards.value = []
    characters.value = []
    encounters.value = []
    lastFetched.value = 0
    error.value = null
  }

  return {
    // State
    cards,
    characters,
    encounters,
    loading,
    error,
    lastFetched,

    // Computed
    isLoaded,
    isCacheValid,
    getCardsByType,
    getCardsByRarity,
    getCharactersByClass,
    getEncountersByDifficulty,
    getCardById,
    getCharacterById,
    getEncounterById,
    getCardsByIds,

    // Actions
    loadAll,
    loadCards,
    loadCharacters,
    loadEncounters,
    searchCards,
    searchCharacters,
    searchEncounters,
    clearCache
  }
})