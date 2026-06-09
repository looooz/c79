export type ScrewType = 'cross' | 'flat' | 'hex' | 'socket'

export interface Screw {
  id: string
  type: ScrewType
  x: number
  y: number
  size: number
  progress: number
  order: number
  removed: boolean
  rotation: number
  shakeOffset: number
  popAnimation: number
  lastMilestone: number
  startTime: number
}

export interface LevelConfig {
  id: number
  name: string
  screwCount: number
  screwTypes: ScrewType[]
  timeLimit: number
  targetScore: number
}

export interface LevelProgress {
  bestTime?: number
  stars: 0 | 1 | 2 | 3
  cleared: boolean
}

export type UpgradeId = 'motorSpeed' | 'bitSet' | 'batteryMax'

export interface Upgrade {
  id: UpgradeId
  name: string
  description: string
  maxLevel: number
  currentLevel: number
  baseCost: number
  costMultiplier: number
}

export type SkinCategory = 'screwdriver' | 'background' | 'particle'

export interface Skin {
  id: string
  category: SkinCategory
  name: string
  price: number
  owned: boolean
  equipped: boolean
  config: {
    primary?: string
    secondary?: string
    gradient?: [string, string]
    colors?: string[]
    pattern?: string
  }
}

export interface Statistics {
  totalScrews: number
  totalPlayTime: number
  fastestScrew: number
  highestCombo: number
  highestLevel: number
  levelBestTimes: Record<number, number>
}

export interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  vibrationEnabled: boolean
}

export interface ProgressState {
  coins: number
  unlockedLevel: number
  upgrades: Upgrade[]
  skins: Skin[]
  statistics: Statistics
  settings: GameSettings
  levels: Record<number, LevelProgress>
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost'

export interface RuntimeScrew extends Screw {
  pixelX: number
  pixelY: number
  pixelSize: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'spark' | 'star' | 'rainbow'
}

export interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
  maxLife: number
}
