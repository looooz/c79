import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pause,
  Play,
  Home as HomeIcon,
  Zap,
  ZapOff,
  RotateCcw,
  Star,
  Timer,
  Trophy,
  Flame,
  X,
  ChevronRight,
} from 'lucide-react'
import { GameEngine } from '@/game/GameEngine'
import { audioManager } from '@/audio/AudioManager'
import { useGameStore } from '@/store/gameStore'
import { useProgressStore } from '@/store/progressStore'
import { useUIStore } from '@/store/uiStore'
import { LEVELS, generateScrewPositions } from '@/config/levels'
import { getEquippedSkin } from '@/config/skins'
import {
  getMotorSpeedMultiplier,
  getBatteryMaxValue,
  hasAutoBit,
} from '@/config/upgrades'
import type { Screw, ScrewType, Particle } from '@/types'
import { uid, formatTime, formatNumber } from '@/utils/math'
import { cn } from '@/lib/utils'

const BIT_TYPES: { type: ScrewType; label: string; icon: string }[] = [
  { type: 'cross', label: '十字', icon: '✚' },
  { type: 'flat', label: '一字', icon: '━' },
  { type: 'hex', label: '六角', icon: '⬡' },
  { type: 'socket', label: '内六角', icon: '⬢' },
]

export default function GamePlay() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const gameStatus = useGameStore((s) => s.status)
  const gameLevelId = useGameStore((s) => s.levelId)
  const gameScrews = useGameStore((s) => s.screws)
  const gameActiveBit = useGameStore((s) => s.activeBit)
  const gameElectricMode = useGameStore((s) => s.electricMode)
  const gameBattery = useGameStore((s) => s.battery)
  const gameScore = useGameStore((s) => s.score)
  const gameCombo = useGameStore((s) => s.combo)
  const gameMaxCombo = useGameStore((s) => s.maxCombo)
  const gameTimeRemaining = useGameStore((s) => s.timeRemaining)
  const gameElapsedTime = useGameStore((s) => s.elapsedTime)

  const gameStartLevel = useGameStore((s) => s.startLevel)
  const gamePause = useGameStore((s) => s.pause)
  const gameResume = useGameStore((s) => s.resume)
  const gameSetActiveBit = useGameStore((s) => s.setActiveBit)
  const gameToggleElectricMode = useGameStore((s) => s.toggleElectricMode)
  const gameConsumeBattery = useGameStore((s) => s.consumeBattery)
  const gameRechargeBattery = useGameStore((s) => s.rechargeBattery)
  const gameAddProgress = useGameStore((s) => s.addProgress)
  const gameRemoveScrew = useGameStore((s) => s.removeScrew)
  const gameTick = useGameStore((s) => s.tick)
  const gameLose = useGameStore((s) => s.lose)
  const gameWin = useGameStore((s) => s.win)
  const gameReset = useGameStore((s) => s.reset)

  const progressUpgrades = useProgressStore((s) => s.upgrades)
  const progressSettings = useProgressStore((s) => s.settings)
  const progressSkins = useProgressStore((s) => s.skins)
  const progressStatistics = useProgressStore((s) => s.statistics)
  const progressAddCoins = useProgressStore((s) => s.addCoins)
  const progressUpdateStats = useProgressStore((s) => s.updateStats)
  const progressCompleteLevel = useProgressStore((s) => s.completeLevel)

  const uiScreenShake = useUIStore((s) => s.screenShake)
  const uiToast = useUIStore((s) => s.toast)
  const uiTriggerShake = useUIStore((s) => s.triggerShake)
  const uiHideModal = useUIStore((s) => s.hideModal)

  const [showResult, setShowResult] = useState(false)
  const [resultData, setResultData] = useState<{
    won: boolean
    stars: 0 | 1 | 2 | 3
    score: number
    time: number
    coins: number
    maxCombo: number
  } | null>(null)

  const levelConfig = LEVELS[Number(levelId) - 1]

  const initLevel = useCallback(() => {
    if (!levelConfig) return

    const positions = generateScrewPositions(levelConfig.screwCount)
    const screws: Screw[] = positions.map((pos, idx) => {
      const type =
        levelConfig.screwTypes[
          Math.floor(Math.random() * levelConfig.screwTypes.length)
        ]
      return {
        id: uid(),
        type,
        x: pos.x,
        y: pos.y,
        size: Math.floor(Math.random() * 3) + 1,
        progress: 0,
        order: idx + 1,
        removed: false,
        rotation: 0,
        shakeOffset: 0,
        popAnimation: 0,
        lastMilestone: 0,
        startTime: 0,
      }
    })

    gameStartLevel(Number(levelId), screws, levelConfig.timeLimit)

    const batteryMax = getBatteryMaxValue(
      progressUpgrades.find((u) => u.id === 'batteryMax')?.currentLevel ?? 0,
    )
    gameRechargeBattery(batteryMax)
  }, [levelConfig, levelId, gameStartLevel, gameRechargeBattery, progressUpgrades])

  const setupSkin = useCallback(() => {
    const sdSkin = getEquippedSkin(progressSkins, 'screwdriver')
    const bgSkin = getEquippedSkin(progressSkins, 'background')
    const ptSkin = getEquippedSkin(progressSkins, 'particle')

    engineRef.current?.setSkinConfig({
      screwdriverGradient: sdSkin?.config.gradient,
      screwdriverPrimary: sdSkin?.config.primary,
      backgroundColors: bgSkin?.config.colors,
      backgroundPattern: bgSkin?.config.pattern,
      particleColors: ptSkin?.config.colors,
      particleType: (ptSkin?.id.includes('star')
        ? 'star'
        : ptSkin?.id.includes('rainbow')
          ? 'rainbow'
          : 'spark') as Particle['type'],
    })
  }, [progressSkins])

  useEffect(() => {
    if (!canvasRef.current || !levelConfig) return

    audioManager.init()
    audioManager.setSoundEnabled(progressSettings.soundEnabled)
    audioManager.setMusicEnabled(progressSettings.musicEnabled)

    const engine = new GameEngine()
    engineRef.current = engine
    engine.init(canvasRef.current)
    initLevel()
    setupSkin()

    const motorLevel =
      progressUpgrades.find((u) => u.id === 'motorSpeed')?.currentLevel ?? 0
    engine.setElectricSpeed(getMotorSpeedMultiplier(motorLevel))

    const bitSetLevel =
      progressUpgrades.find((u) => u.id === 'bitSet')?.currentLevel ?? 0
    hasAutoBit(bitSetLevel)

    engine.setCallbacks({
      onScrewRemoved: (screwId, baseScore) => {
        gameRemoveScrew(screwId, baseScore)
        audioManager.playScrewRemove()
        if (progressSettings.vibrationEnabled) {
          audioManager.vibrate(100)
        }
        uiTriggerShake(250)
        const currentCombo = useGameStore.getState().combo
        if (currentCombo > 0 && currentCombo % 5 === 0) {
          audioManager.playCombo(currentCombo)
        }

        const fastest = progressStatistics.fastestScrew
        const screw = useGameStore.getState().screws.find((s) => s.id === screwId)
        if (screw && screw.startTime > 0) {
          const elapsed = (performance.now() - screw.startTime) / 1000
          const isFastestUnset =
            typeof fastest !== 'number' || !isFinite(fastest)
          if (isFastestUnset || elapsed < fastest) {
            progressUpdateStats({ fastestScrew: elapsed })
          }
        }
        const currentMaxCombo = useGameStore.getState().maxCombo
        progressUpdateStats({
          totalScrews: progressStatistics.totalScrews + 1,
          highestCombo: Math.max(
            progressStatistics.highestCombo,
            currentMaxCombo,
          ),
        })
      },
      onProgressUpdate: (screwId, amount) => {
        gameAddProgress(screwId, amount)
      },
      onMilestone: () => {
        audioManager.playMilestone()
      },
      onAllRemoved: () => {
        gameWin()
      },
      onTick: (dt) => {
        gameTick(dt)
        const currentElectricMode = useGameStore.getState().electricMode
        if (currentElectricMode) {
          gameConsumeBattery(dt * 12)
        }
      },
    })

    const handleResize = () => engine.resize()
    window.addEventListener('resize', handleResize)

    engine.start()
    audioManager.startMusic()

    return () => {
      window.removeEventListener('resize', handleResize)
      engine.stop()
      audioManager.stopMusic()
    }
  }, [
    levelConfig,
    initLevel,
    setupSkin,
    progressSettings,
    progressUpgrades,
    progressStatistics,
    progressUpdateStats,
    gameRemoveScrew,
    gameAddProgress,
    gameWin,
    gameTick,
    gameConsumeBattery,
    uiTriggerShake,
  ])

  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.setActiveBit(gameActiveBit)
  }, [gameActiveBit])

  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.setElectricMode(gameElectricMode && gameBattery > 0)
  }, [gameElectricMode, gameBattery])

  useEffect(() => {
    if (!engineRef.current || gameScrews.length === 0) return
    engineRef.current.setScrews(gameScrews)
  }, [gameScrews])

  useEffect(() => {
    const bitSetLevel =
      progressUpgrades.find((u) => u.id === 'bitSet')?.currentLevel ?? 0
    if (!hasAutoBit(bitSetLevel)) return

    const nextScrew = gameScrews
      .filter((s) => !s.removed)
      .sort((a, b) => a.order - b.order)[0]
    if (nextScrew && nextScrew.type !== gameActiveBit) {
      gameSetActiveBit(nextScrew.type)
    }
  }, [gameScrews, progressUpgrades, gameActiveBit, gameSetActiveBit])

  useEffect(() => {
    if (gameStatus === 'won' && !showResult) {
      const timeRatio = gameElapsedTime / levelConfig!.timeLimit
      let stars: 0 | 1 | 2 | 3 = 1
      if (timeRatio < 0.5) stars = 3
      else if (timeRatio < 0.75) stars = 2

      const baseCoins = Math.floor(gameScore * 0.3)
      const starBonus = stars * 50
      const comboBonus = gameMaxCombo * 10
      const totalCoins = baseCoins + starBonus + comboBonus

      progressCompleteLevel(
        Number(levelId),
        gameElapsedTime,
        stars,
        totalCoins,
      )

      setResultData({
        won: true,
        stars,
        score: gameScore,
        time: gameElapsedTime,
        coins: totalCoins,
        maxCombo: gameMaxCombo,
      })
      setShowResult(true)
      audioManager.playWin()
    } else if (gameStatus === 'lost' && !showResult) {
      const coins = Math.floor(gameScore * 0.1)
      setResultData({
        won: false,
        stars: 0,
        score: gameScore,
        time: gameElapsedTime,
        coins,
        maxCombo: gameMaxCombo,
      })
      progressAddCoins(coins)
      setShowResult(true)
      audioManager.playLose()
    }
  }, [gameStatus, showResult])

  useEffect(() => {
    const elapsed = gameElapsedTime
    if (elapsed > 0) {
      const totalPlayTime = progressStatistics.totalPlayTime
      progressUpdateStats({
        totalPlayTime: totalPlayTime + (gameStatus === 'playing' ? 0.016 : 0),
      })
    }
  }, [gameElapsedTime, gameStatus, progressStatistics, progressUpdateStats])

  useEffect(() => {
    const shakeDuration = uiScreenShake
    if (shakeDuration > 0 && canvasRef.current) {
      const intensity = Math.min(shakeDuration / 250, 1)
      canvasRef.current.style.transform = `translate(${(Math.random() - 0.5) * 8 * intensity}px, ${(Math.random() - 0.5) * 8 * intensity}px)`
    } else if (canvasRef.current) {
      canvasRef.current.style.transform = 'translate(0, 0)'
    }
  }, [uiScreenShake, gameElapsedTime])

  const handlePauseToggle = () => {
    audioManager.playClick()
    if (gameStatus === 'playing') {
      gamePause()
      engineRef.current?.pause()
    } else if (gameStatus === 'paused') {
      gameResume()
      engineRef.current?.resume()
    }
  }

  const handleRestart = () => {
    audioManager.playClick()
    setShowResult(false)
    setResultData(null)
    engineRef.current?.reset()
    gameReset()
    initLevel()
    setTimeout(() => {
      engineRef.current?.setScrews(useGameStore.getState().screws)
    }, 0)
  }

  const handleNextLevel = () => {
    audioManager.playClick()
    const nextId = Number(levelId) + 1
    if (nextId <= LEVELS.length) {
      navigate(`/game/${nextId}`)
    } else {
      navigate('/levels')
    }
  }

  const comboColor =
    gameCombo >= 10
      ? 'text-red-400'
      : gameCombo >= 5
        ? 'text-orange-400'
        : gameCombo >= 2
          ? 'text-yellow-400'
          : 'text-white'

  const timePercent = (gameTimeRemaining / (levelConfig?.timeLimit ?? 60)) * 100
  const timeColor = timePercent < 25 ? 'bg-red-500' : timePercent < 50 ? 'bg-yellow-500' : 'bg-green-500'

  if (!levelConfig) {
    return (
      <div className="h-full w-full flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">关卡不存在</p>
          <button onClick={() => navigate('/levels')} className="btn-primary">
            返回选关
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-wood-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none select-none cursor-none"
        style={{ transition: 'transform 50ms ease-out' }}
      />

      <div className="absolute top-0 left-0 right-0 z-10 p-3 md:p-4">
        <div className="glass-panel rounded-2xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                <span
                  className={cn(
                    'font-display text-lg md:text-2xl font-bold',
                    timePercent < 25 ? 'text-red-400 animate-pulse' : 'text-white',
                  )}
                >
                  {formatTime(gameTimeRemaining)}
                </span>
              </div>
              <div className="w-16 md:w-24 h-2 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-300', timeColor)}
                  style={{ width: `${timePercent}%` }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {gameCombo >= 2 && (
                <motion.div
                  key={gameCombo}
                  initial={{ scale: 0.5, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: -10 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 20 }}
                  className={cn(
                    'flex items-center gap-1.5',
                    comboColor,
                    'combo-text',
                  )}
                >
                  <Flame className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-display text-xl md:text-3xl font-black">
                    {gameCombo}x
                  </span>
                  <span className="text-xs md:text-sm opacity-80">连击</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                <span className="font-display text-lg md:text-2xl font-bold text-white">
                  {formatNumber(gameScore)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePauseToggle}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                >
                  {gameStatus === 'paused' ? (
                    <Play className="w-5 h-5" />
                  ) : (
                    <Pause className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    audioManager.playClick()
                    navigate('/levels')
                  }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                >
                  <HomeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-white/70">电量 {Math.floor(gameBattery)}%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-150"
                style={{
                  width: `${Math.max(0, Math.min(100, gameBattery))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 md:p-4">
        <div className="glass-panel rounded-2xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-white/60 mr-1">批头:</span>
              {BIT_TYPES.map((bit) => (
                <button
                  key={bit.type}
                  onClick={() => {
                    audioManager.playClick()
                    gameSetActiveBit(bit.type)
                  }}
                  className={cn(
                    'w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center transition-all',
                    gameActiveBit === bit.type
                      ? 'bg-gradient-to-b from-accent-orange to-orange-700 shadow-lg shadow-orange-500/30 scale-105'
                      : 'bg-white/10 hover:bg-white/15',
                  )}
                  title={bit.label}
                >
                  <span className="text-lg md:text-xl">{bit.icon}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => {
                  audioManager.playClick()
                  gameToggleElectricMode()
                }}
                className={cn(
                  'flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl font-medium transition-all',
                  gameElectricMode && gameBattery > 0
                    ? 'bg-gradient-to-b from-yellow-500 to-yellow-700 text-white shadow-lg shadow-yellow-500/30 animate-pulse-glow'
                    : 'bg-white/10 hover:bg-white/15 text-white/70',
                )}
                disabled={gameBattery <= 0}
              >
                {gameElectricMode && gameBattery > 0 ? (
                  <>
                    <Zap className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                    <span className="text-sm md:text-base hidden sm:inline">电动中</span>
                  </>
                ) : (
                  <>
                    <ZapOff className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base hidden sm:inline">电动模式</span>
                  </>
                )}
              </button>

              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all"
              >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base hidden sm:inline">重开</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-white/60">
                关卡 {levelConfig.id} · {levelConfig.screwCount}颗螺丝
              </span>
              <span className="text-white/60">
                剩余 {gameScrews.filter((s) => !s.removed).length}/
                {gameScrews.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameStatus === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel rounded-3xl p-6 md:p-8 max-w-md w-full text-center"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                游戏暂停
              </h2>
              <div className="flex flex-col gap-3">
                <button onClick={handlePauseToggle} className="btn-primary text-lg">
                  <Play className="w-5 h-5 inline mr-2" /> 继续游戏
                </button>
                <button onClick={handleRestart} className="btn-secondary text-lg">
                  <RotateCcw className="w-5 h-5 inline mr-2" /> 重新开始
                </button>
                <button
                  onClick={() => {
                    audioManager.playClick()
                    navigate('/levels')
                  }}
                  className="btn-secondary text-lg"
                >
                  <HomeIcon className="w-5 h-5 inline mr-2" /> 返回选关
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResult && resultData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
              className="glass-panel rounded-3xl p-6 md:p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <h2
                  className={cn(
                    'text-4xl md:text-5xl font-display font-black mb-3',
                    resultData.won ? 'text-yellow-400' : 'text-red-400',
                  )}
                >
                  {resultData.won ? '🎉 通关成功' : '⏰ 时间到'}
                </h2>

                <div className="flex justify-center gap-2 my-5">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: i * 0.15,
                        type: 'spring' as const,
                        stiffness: 400,
                        damping: 15,
                      }}
                    >
                      <Star
                        className={cn(
                          'w-10 h-10 md:w-14 md:h-14',
                          i <= resultData.stars
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                            : 'text-white/20',
                        )}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="glass-card p-4 flex items-center justify-between">
                  <span className="text-white/70">得分</span>
                  <span className="font-display text-2xl font-bold text-white">
                    {formatNumber(resultData.score)}
                  </span>
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                  <span className="text-white/70">用时</span>
                  <span className="font-display text-xl font-bold text-blue-400">
                    {formatTime(resultData.time)}
                  </span>
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                  <span className="text-white/70">最高连击</span>
                  <span className="font-display text-xl font-bold text-orange-400">
                    {resultData.maxCombo}x
                  </span>
                </div>
                <div className="glass-card p-4 flex items-center justify-between bg-yellow-500/10 border-yellow-500/20">
                  <span className="text-yellow-200">获得积分</span>
                  <span className="font-display text-2xl font-bold text-yellow-400">
                    +{formatNumber(resultData.coins)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {resultData.won && Number(levelId) < LEVELS.length && (
                  <button onClick={handleNextLevel} className="btn-primary text-lg">
                    下一关
                    <ChevronRight className="w-5 h-5 inline ml-1" />
                  </button>
                )}
                <button onClick={handleRestart} className="btn-secondary text-lg">
                  <RotateCcw className="w-5 h-5 inline mr-2" />
                  {resultData.won ? '再玩一次' : '重新挑战'}
                </button>
                <button
                  onClick={() => {
                    audioManager.playClick()
                    navigate('/levels')
                  }}
                  className="btn-secondary text-lg"
                >
                  返回选关
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uiToast?.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'absolute top-24 left-1/2 z-40 px-5 py-3 rounded-xl shadow-xl font-medium',
              uiToast.type === 'success' && 'bg-green-500 text-white',
              uiToast.type === 'error' && 'bg-red-500 text-white',
              uiToast.type === 'info' && 'bg-blue-500 text-white',
            )}
          >
            {uiToast.message}
            <button
              onClick={() => uiHideModal()}
              className="ml-3 opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4 inline" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
