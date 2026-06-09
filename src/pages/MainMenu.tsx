import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Grid3x3, ShoppingBag, Settings as SettingsIcon, Coins, Wrench } from 'lucide-react'
import { useProgressStore } from '@/store/progressStore'
import { audioManager } from '@/audio/AudioManager'
import { formatNumber } from '@/utils/math'
import { LEVELS } from '@/config/levels'

export default function MainMenu() {
  const navigate = useNavigate()
  const progress = useProgressStore()

  useEffect(() => {
    audioManager.init()
    audioManager.setSoundEnabled(progress.settings.soundEnabled)
    audioManager.setMusicEnabled(progress.settings.musicEnabled)
    audioManager.startMusic()
  }, [progress.settings])

  const handleStart = () => {
    audioManager.playClick()
    navigate(`/game/${progress.unlockedLevel}`)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 18 } },
  }

  return (
    <div className="relative h-full w-full overflow-hidden texture-wood flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

      <div className="absolute top-0 left-0 w-40 h-40 bg-accent-orange/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-accent-blue/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-md flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="relative mb-2">
            <motion.div
              animate={{
                rotate: [0, 8, -5, 3, -2, 0],
                y: [0, -4, 2, -1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse' as const,
                ease: 'easeInOut' as const,
              }}
              className="relative"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-accent-orange to-orange-700 shadow-2xl shadow-orange-500/40 flex items-center justify-center border-4 border-white/20">
                <Wrench className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl border-2 border-accent-orange/60"
              />
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center mb-10 md:mb-14">
            <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-wider mb-2 drop-shadow-[0_4px_20px_rgba(255,152,0,0.3)]">
              拆螺丝
            </h1>
            <p className="text-base md:text-lg text-white/60 font-medium">
              解压神器 · 放松一「拧」
            </p>
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            className="group w-full mb-4 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-accent-orange to-orange-800 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-gradient-to-b from-accent-orange to-orange-700 rounded-3xl px-8 py-5 md:py-6 shadow-2xl border border-white/10 flex items-center justify-center gap-4 overflow-hidden">
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }}
              >
                <Play className="w-8 h-8 md:w-9 md:h-9 text-white fill-white/20" />
              </motion.div>
              <div className="text-left">
                <div className="text-2xl md:text-3xl font-display font-black text-white tracking-wide">
                  {progress.unlockedLevel > 1 ? '继续游戏' : '开始游戏'}
                </div>
                <div className="text-sm md:text-base text-white/80 font-medium">
                  第 {progress.unlockedLevel} / {LEVELS.length} 关
                </div>
              </div>
            </div>
          </motion.button>

          <motion.div
            variants={itemVariants}
            className="w-full grid grid-cols-2 gap-3 md:gap-4 mb-6"
          >
            <button
              onClick={() => {
                audioManager.playClick()
                navigate('/levels')
              }}
              className="glass-card p-4 md:p-5 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Grid3x3 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-center">
                <div className="font-bold text-white">关卡选择</div>
                <div className="text-xs text-white/50">挑战全15关</div>
              </div>
            </button>

            <button
              onClick={() => {
                audioManager.playClick()
                navigate('/shop')
              }}
              className="glass-card p-4 md:p-5 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-center">
                <div className="font-bold text-white">升级商店</div>
                <div className="text-xs text-white/50">强化工具</div>
              </div>
            </button>

            <button
              onClick={() => {
                audioManager.playClick()
                navigate('/settings')
              }}
              className="glass-card p-4 md:p-5 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <SettingsIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-center">
                <div className="font-bold text-white">设置统计</div>
                <div className="text-xs text-white/50">数据与偏好</div>
              </div>
            </button>

            <div className="glass-card p-4 md:p-5 flex flex-col items-center justify-center gap-2 bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-1.5">
                <Coins className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 fill-yellow-400/30" />
                <span className="font-display text-2xl md:text-3xl font-black text-yellow-400 tracking-wide">
                  {formatNumber(progress.coins)}
                </span>
              </div>
              <div className="text-xs text-yellow-200/60">我的积分</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <p className="text-xs md:text-sm text-white/40">
              💡 小提示：顺时针画圈拆卸螺丝，越快越解压！
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
