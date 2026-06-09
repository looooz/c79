import { create } from 'zustand'
import type { GameStatus, Screw, ScrewType } from '@/types'
import { clamp } from '@/utils/math'

interface GameState {
  status: GameStatus
  levelId: number
  screws: Screw[]
  currentScrewId: string | null
  activeBit: ScrewType
  electricMode: boolean
  battery: number
  score: number
  combo: number
  maxCombo: number
  timeRemaining: number
  elapsedTime: number
  sessionStartTime: number
  lastRemoveTime: number
}

interface GameActions {
  startLevel: (levelId: number, screws: Screw[], timeLimit: number) => void
  pause: () => void
  resume: () => void
  selectScrew: (id: string | null) => void
  setActiveBit: (type: ScrewType) => void
  toggleElectricMode: () => void
  consumeBattery: (amount: number) => void
  rechargeBattery: (amount: number) => void
  addProgress: (screwId: string, amount: number) => void
  removeScrew: (id: string, baseScore: number) => void
  tick: (dt: number) => void
  lose: () => void
  win: () => void
  reset: () => void
}

export type GameStore = GameState & GameActions

const createInitialState = (): GameState => ({
  status: 'idle',
  levelId: 0,
  screws: [],
  currentScrewId: null,
  activeBit: 'cross',
  electricMode: false,
  battery: 100,
  score: 0,
  combo: 0,
  maxCombo: 0,
  timeRemaining: 0,
  elapsedTime: 0,
  sessionStartTime: 0,
  lastRemoveTime: 0,
})

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  startLevel: (levelId: number, screws: Screw[], timeLimit: number) => {
    const now = performance.now()
    set({
      status: 'playing',
      levelId,
      screws: screws.map((s) => ({ ...s })),
      currentScrewId: null,
      activeBit: 'cross',
      electricMode: false,
      battery: 100,
      score: 0,
      combo: 0,
      maxCombo: 0,
      timeRemaining: timeLimit,
      elapsedTime: 0,
      sessionStartTime: now,
      lastRemoveTime: now,
    })
  },

  pause: () => {
    const { status } = get()
    if (status !== 'playing') return
    set({ status: 'paused' })
  },

  resume: () => {
    const { status } = get()
    if (status !== 'paused') return
    set({ status: 'playing' })
  },

  selectScrew: (id: string | null) => {
    set({ currentScrewId: id })
  },

  setActiveBit: (type: ScrewType) => {
    set({ activeBit: type })
  },

  toggleElectricMode: () => {
    const { status, battery } = get()
    if (status !== 'playing') return
    set({ electricMode: battery > 0 ? !get().electricMode : false })
  },

  consumeBattery: (amount: number) => {
    const { status, electricMode } = get()
    if (status !== 'playing' || !electricMode) return
    const newBattery = Math.max(0, get().battery - amount)
    set({
      battery: newBattery,
      electricMode: newBattery <= 0 ? false : get().electricMode,
    })
  },

  rechargeBattery: (amount: number) => {
    const { status } = get()
    if (status !== 'playing') return
    set((state) => ({
      battery: Math.min(100, state.battery + amount),
    }))
  },

  addProgress: (screwId: string, amount: number) => {
    const { status } = get()
    if (status !== 'playing') return
    set((state) => ({
      screws: state.screws.map((s) =>
        s.id === screwId && !s.removed
          ? { ...s, progress: clamp(s.progress + amount, 0, 100) }
          : s,
      ),
    }))
  },

  removeScrew: (id: string, baseScore: number) => {
    const { status, lastRemoveTime } = get()
    if (status !== 'playing') return

    const screw = get().screws.find((s) => s.id === id)
    if (!screw || screw.removed) return

    const now = performance.now()
    const timeSinceLastRemove = now - lastRemoveTime

    let newCombo: number
    if (timeSinceLastRemove < 3000) {
      newCombo = get().combo + 1
    } else {
      newCombo = 1
    }

    const comboMultiplier = 1 + Math.min(newCombo - 1, 10) * 0.1
    const finalScore = Math.floor(baseScore * comboMultiplier)
    const newScore = get().score + finalScore
    const newMaxCombo = Math.max(get().maxCombo, newCombo)

    set((state) => ({
      screws: state.screws.map((s) =>
        s.id === id ? { ...s, removed: true } : s,
      ),
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      lastRemoveTime: now,
    }))
  },

  tick: (dt: number) => {
    const { status } = get()
    if (status !== 'playing') return

    const newTimeRemaining = Math.max(0, get().timeRemaining - dt)
    const newElapsedTime = get().elapsedTime + dt

    set({
      timeRemaining: newTimeRemaining,
      elapsedTime: newElapsedTime,
    })

    if (newTimeRemaining <= 0) {
      set({ status: 'lost' })
    }
  },

  lose: () => {
    set({ status: 'lost' })
  },

  win: () => {
    const { status } = get()
    if (status !== 'playing' && status !== 'paused') return
    set({ status: 'won' })
  },

  reset: () => {
    set(createInitialState())
  },
}))
