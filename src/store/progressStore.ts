import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ProgressState,
  Statistics,
  GameSettings,
  Upgrade,
  Skin,
  LevelProgress,
} from '@/types'
import { DEFAULT_UPGRADES, getUpgradeCost } from '@/config/upgrades'
import { DEFAULT_SKINS } from '@/config/skins'
import { clearAllStorage } from '@/utils/storage'
import { clamp } from '@/utils/math'

const DEFAULT_STATISTICS: Statistics = {
  totalScrews: 0,
  totalPlayTime: 0,
  fastestScrew: Infinity,
  highestCombo: 0,
  highestLevel: 0,
  levelBestTimes: {},
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
}

const DEFAULT_LEVELS: Record<number, LevelProgress> = {}

interface ProgressActions {
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  upgradeItem: (id: Upgrade['id']) => boolean
  buySkin: (id: string) => boolean
  equipSkin: (id: string) => void
  unlockLevel: (id: number) => void
  completeLevel: (
    levelId: number,
    time: number,
    stars: 0 | 1 | 2 | 3,
    earnedCoins: number,
  ) => void
  updateStats: (partial: Partial<Statistics>) => void
  updateSettings: (partial: Partial<GameSettings>) => void
  markTutorialSeen: () => void
  resetAll: () => void
}

export type ProgressStore = ProgressState & ProgressActions

const createInitialState = (): ProgressState => ({
  coins: 0,
  unlockedLevel: 1,
  upgrades: DEFAULT_UPGRADES.map((u) => ({ ...u })),
  skins: DEFAULT_SKINS.map((s) => ({ ...s })),
  statistics: { ...DEFAULT_STATISTICS, levelBestTimes: {} },
  settings: { ...DEFAULT_SETTINGS },
  levels: { ...DEFAULT_LEVELS },
  hasSeenTutorial: false,
})

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      addCoins: (amount: number) => {
        if (amount <= 0) return
        set((state) => ({ coins: state.coins + amount }))
      },

      spendCoins: (amount: number) => {
        if (amount <= 0) return false
        const { coins } = get()
        if (coins < amount) return false
        set({ coins: coins - amount })
        return true
      },

      upgradeItem: (id: Upgrade['id']) => {
        const { upgrades, spendCoins } = get()
        const upgrade = upgrades.find((u) => u.id === id)
        if (!upgrade) return false
        if (upgrade.currentLevel >= upgrade.maxLevel) return false

        const cost = getUpgradeCost(upgrade)
        if (!spendCoins(cost)) return false

        set((state) => ({
          upgrades: state.upgrades.map((u) =>
            u.id === id
              ? { ...u, currentLevel: u.currentLevel + 1 }
              : u,
          ),
        }))
        return true
      },

      buySkin: (id: string) => {
        const { skins, spendCoins } = get()
        const skin = skins.find((s) => s.id === id)
        if (!skin) return false
        if (skin.owned) return false

        if (!spendCoins(skin.price)) return false

        set((state) => ({
          skins: state.skins.map((s) =>
            s.id === id ? { ...s, owned: true } : s,
          ),
        }))
        return true
      },

      equipSkin: (id: string) => {
        const { skins } = get()
        const skin = skins.find((s) => s.id === id)
        if (!skin || !skin.owned) return

        set((state) => ({
          skins: state.skins.map((s) => {
            if (s.id === id) return { ...s, equipped: true }
            if (s.category === skin.category) return { ...s, equipped: false }
            return s
          }),
        }))
      },

      unlockLevel: (id: number) => {
        set((state) => ({
          unlockedLevel: Math.max(state.unlockedLevel, id),
        }))
      },

      completeLevel: (
        levelId: number,
        time: number,
        stars: 0 | 1 | 2 | 3,
        earnedCoins: number,
      ) => {
        const { statistics, addCoins, unlockLevel } = get()

        addCoins(earnedCoins)

        set((state) => {
          const existing = state.levels[levelId]
          const prevBest = existing?.bestTime ?? Infinity
          const newBest = time < prevBest ? time : prevBest

          return {
            levels: {
              ...state.levels,
              [levelId]: {
                bestTime: newBest,
                stars: Math.max(existing?.stars ?? 0, stars) as 0 | 1 | 2 | 3,
                cleared: true,
              },
            },
            statistics: {
              ...state.statistics,
              highestLevel: Math.max(state.statistics.highestLevel, levelId),
              levelBestTimes: {
                ...state.statistics.levelBestTimes,
                [levelId]: newBest,
              },
            },
          }
        })

        unlockLevel(levelId + 1)
      },

      updateStats: (partial: Partial<Statistics>) => {
        set((state) => ({
          statistics: { ...state.statistics, ...partial },
        }))
      },

      updateSettings: (partial: Partial<GameSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }))
      },

      markTutorialSeen: () => {
        set({ hasSeenTutorial: true })
      },

      resetAll: () => {
        clearAllStorage()
        set(createInitialState())
      },
    }),
    {
      name: 'screw-game-progress',
      partialize: (state) => ({
        coins: state.coins,
        unlockedLevel: state.unlockedLevel,
        upgrades: state.upgrades,
        skins: state.skins,
        statistics: state.statistics,
        settings: state.settings,
        levels: state.levels,
        hasSeenTutorial: state.hasSeenTutorial,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.statistics.fastestScrew === null || state.statistics.fastestScrew === undefined) {
            state.statistics.fastestScrew = Infinity
          }
          if (!state.statistics.levelBestTimes) {
            state.statistics.levelBestTimes = {}
          }
          if (state.hasSeenTutorial === null || state.hasSeenTutorial === undefined) {
            state.hasSeenTutorial = false
          }
        }
      },
    },
  ),
)
