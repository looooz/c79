import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Lock, Star, Timer, Trophy, Clock, Coins } from 'lucide-react'
import { useProgressStore } from '@/store/progressStore'
import { audioManager } from '@/audio/AudioManager'
import { LEVELS } from '@/config/levels'
import { formatTime, formatNumber } from '@/utils/math'
import { cn } from '@/lib/utils'

export default function LevelSelect() {
  const navigate = useNavigate()
  const progress = useProgressStore()

  return (
    <div className="relative h-full w-full overflow-hidden texture-wood">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="p-4 md:p-6">
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
            <button
              onClick={() => {
                audioManager.playClick()
                navigate('/')
              }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium hidden sm:inline">返回主菜单</span>
            </button>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-display text-lg md:text-xl font-bold">
                  第 {progress.unlockedLevel} 关
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400/30" />
                <span className="font-display text-lg md:text-xl font-bold text-white">
                  {formatNumber(progress.coins)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 pb-2">
          <h2 className="font-display text-2xl md:text-3xl font-black text-white mb-1">
            选择关卡
          </h2>
          <p className="text-white/50 text-sm md:text-base">
            通关后解锁下一关，用时越短星级越高
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-6 pt-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4"
          >
            <AnimatePresence>
              {LEVELS.map((level, idx) => {
                const isUnlocked = level.id <= progress.unlockedLevel
                const levelProgress = progress.levels[level.id]
                const hasBest = levelProgress?.bestTime !== undefined && levelProgress.bestTime !== Infinity
                const stars = levelProgress?.stars ?? 0

                return (
                  <motion.button
                    key={level.id}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.03,
                      type: 'spring',
                      stiffness: 300,
                      damping: 22,
                    }}
                    whileHover={isUnlocked ? { scale: 1.06, y: -4 } : {}}
                    whileTap={isUnlocked ? { scale: 0.96 } : {}}
                    onClick={() => {
                      if (!isUnlocked) return
                      audioManager.playClick()
                      navigate(`/game/${level.id}`)
                    }}
                    disabled={!isUnlocked}
                    className={cn(
                      'relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 md:p-3 transition-all',
                      isUnlocked
                        ? stars === 3
                          ? 'bg-gradient-to-b from-yellow-500/20 to-yellow-700/20 border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/30'
                          : stars > 0
                            ? 'bg-gradient-to-b from-orange-500/15 to-orange-700/15 border-2 border-orange-500/30'
                            : 'glass-card border-2 border-white/10 hover:border-accent-orange/50'
                        : 'bg-black/30 border-2 border-white/5 opacity-50 cursor-not-allowed',
                    )}
                  >
                    {isUnlocked ? (
                      <>
                        <div className={cn(
                          'font-display text-2xl md:text-4xl font-black mb-1',
                          stars === 3 ? 'text-yellow-400' : stars > 0 ? 'text-orange-400' : 'text-white',
                        )}>
                          {level.id}
                        </div>

                        <div className="flex gap-0.5 md:gap-1 mb-1.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                'w-3 h-3 md:w-4 md:h-4',
                                s <= stars
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-white/20',
                              )}
                            />
                          ))}
                        </div>

                        {hasBest ? (
                          <div className="flex items-center gap-0.5 text-[10px] md:text-xs text-white/60">
                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            {formatTime(levelProgress!.bestTime!)}
                          </div>
                        ) : (
                          <div className="text-[10px] md:text-xs text-white/40 flex items-center gap-0.5">
                            <Timer className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            {formatTime(level.timeLimit)}
                          </div>
                        )}

                        {level.id === progress.unlockedLevel && (
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-accent-orange shadow-lg shadow-orange-500/50"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <Lock className="w-6 h-6 md:w-8 md:h-8 text-white/40 mb-1" />
                        <div className="text-[10px] md:text-xs text-white/30 font-medium">
                          未解锁
                        </div>
                      </>
                    )}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
