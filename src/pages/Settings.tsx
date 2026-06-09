import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Music,
  Music2,
  Smartphone,
  Trash2,
  Wrench,
  Clock3,
  Zap,
  Trophy,
  Flame,
  AlertTriangle,
  X,
  BarChart3,
  CircleSlash,
} from 'lucide-react'
import { useProgressStore } from '@/store/progressStore'
import { useUIStore } from '@/store/uiStore'
import { audioManager } from '@/audio/AudioManager'
import { LEVELS } from '@/config/levels'
import { formatTime, formatNumber } from '@/utils/math'
import { cn } from '@/lib/utils'

export default function Settings() {
  const navigate = useNavigate()
  const progress = useProgressStore()
  const ui = useUIStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const stats = progress.statistics

  const toggleSound = () => {
    audioManager.playClick()
    const newVal = !progress.settings.soundEnabled
    progress.updateSettings({ soundEnabled: newVal })
    audioManager.setSoundEnabled(newVal)
    ui.showToast(newVal ? '音效已开启' : '音效已关闭', 'info')
  }

  const toggleMusic = () => {
    audioManager.playClick()
    const newVal = !progress.settings.musicEnabled
    progress.updateSettings({ musicEnabled: newVal })
    audioManager.setMusicEnabled(newVal)
    if (newVal) audioManager.startMusic()
    else audioManager.stopMusic()
    ui.showToast(newVal ? '音乐已开启' : '音乐已关闭', 'info')
  }

  const toggleVibration = () => {
    audioManager.playClick()
    const newVal = !progress.settings.vibrationEnabled
    progress.updateSettings({ vibrationEnabled: newVal })
    if (newVal) audioManager.vibrate(50)
    ui.showToast(newVal ? '震动已开启' : '震动已关闭', 'info')
  }

  const handleReset = () => {
    audioManager.playClick()
    progress.resetAll()
    setShowResetConfirm(false)
    ui.showToast('已重置所有数据', 'success')
    setTimeout(() => navigate('/'), 800)
  }

  const statItems = [
    {
      icon: Wrench,
      label: '累计拆卸',
      value: formatNumber(stats.totalScrews),
      unit: '颗',
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      icon: Clock3,
      label: '总游玩时长',
      value: formatTime(stats.totalPlayTime),
      unit: '',
      gradient: 'from-green-500 to-emerald-700',
    },
    {
      icon: Zap,
      label: '最快单颗',
      value:
        typeof stats.fastestScrew !== 'number' || !isFinite(stats.fastestScrew)
          ? '—'
          : `${stats.fastestScrew.toFixed(2)}`,
      unit: '秒',
      gradient: 'from-yellow-500 to-orange-700',
    },
    {
      icon: Trophy,
      label: '最高关卡',
      value: `第 ${stats.highestLevel}`,
      unit: '关',
      gradient: 'from-purple-500 to-violet-700',
    },
    {
      icon: Flame,
      label: '最高连击',
      value: `${stats.highestCombo}`,
      unit: 'x',
      gradient: 'from-red-500 to-rose-700',
    },
  ]

  const clearedLevels = Object.entries(progress.levels)
    .filter(([, v]) => v.cleared)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .slice(-8)
    .reverse()

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

            <h1 className="font-display text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
              设置与统计
            </h1>

            <div className="w-10 h-10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-6 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-display text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              成就数据
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {statItems.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="glass-card p-4"
                >
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br',
                      item.gradient,
                    )}
                  >
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="text-xs md:text-sm text-white/50 mb-1">{item.label}</div>
                  <div className="font-display text-lg md:text-2xl font-black text-white leading-tight">
                    {item.value}
                    <span className="text-sm font-bold text-white/50 ml-0.5">{item.unit}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-display text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-blue-400" />
              最近关卡记录
            </h2>
            <div className="glass-card p-4">
              {clearedLevels.length > 0 ? (
                <div className="space-y-2">
                  {clearedLevels.map(([levelId, data], idx) => {
                    const level = LEVELS[Number(levelId) - 1]
                    return (
                      <motion.div
                        key={levelId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-orange-700 flex items-center justify-center font-display font-black text-white shrink-0">
                            {levelId}
                          </div>
                          <div>
                            <div className="font-bold text-white">{level?.name ?? `第 ${levelId} 关`}</div>
                            <div className="text-xs text-white/50 flex items-center gap-1">
                              <Clock3 className="w-3 h-3" />
                              最佳: {data.bestTime !== undefined && data.bestTime !== Infinity ? formatTime(data.bestTime) : '—'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <div
                              key={s}
                              className={cn(
                                'w-5 h-5 md:w-6 md:h-6 flex items-center justify-center',
                                s <= data.stars ? 'text-yellow-400' : 'text-white/15',
                              )}
                            >
                              ★
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-white/40">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>还没有通关记录</p>
                  <p className="text-sm">快去挑战第一关吧！</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="font-display text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-green-400" />
              游戏设置
            </h2>
            <div className="glass-card p-4 space-y-3">
              <SettingToggle
                icon={progress.settings.soundEnabled ? Volume2 : VolumeX}
                label="游戏音效"
                description="拆卸、点击等各种声音效果"
                value={progress.settings.soundEnabled}
                onToggle={toggleSound}
                gradient="from-orange-500 to-amber-700"
              />
              <SettingToggle
                icon={progress.settings.musicEnabled ? Music : Music2}
                label="背景音乐"
                description="轻松的 Lo-fi 背景乐"
                value={progress.settings.musicEnabled}
                onToggle={toggleMusic}
                gradient="from-purple-500 to-pink-700"
              />
              <SettingToggle
                icon={progress.settings.vibrationEnabled ? Smartphone : CircleSlash}
                label="震动反馈"
                description="拆卸完成时设备振动（移动设备）"
                value={progress.settings.vibrationEnabled}
                onToggle={toggleVibration}
                gradient="from-teal-500 to-cyan-700"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="font-display text-lg md:text-xl font-bold text-white mb-3 flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              危险操作
            </h2>
            <div className="glass-card p-4 border-red-500/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
                    <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">重置所有数据</div>
                    <div className="text-sm text-white/60">
                      清除关卡进度、升级、皮肤、积分和所有统计数据，此操作不可撤销！
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audioManager.playClick()
                    setShowResetConfirm(true)
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-medium transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel rounded-3xl p-6 md:p-8 max-w-md w-full border-red-500/30"
            >
              <div className="flex items-center justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/40">
                  <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-red-400" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-black text-red-400 text-center mb-3">
                确认重置？
              </h3>
              <p className="text-center text-white/60 mb-6 leading-relaxed">
                此操作将永久删除
                <span className="text-white font-bold">所有游戏数据</span>
                ，包括关卡进度、升级、皮肤、积分和统计。确定要继续吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    audioManager.playClick()
                    setShowResetConfirm(false)
                  }}
                  className="flex-1 btn-secondary text-base"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 inline mr-1.5" /> 取消
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-5 py-3 rounded-xl font-bold bg-gradient-to-b from-red-500 to-red-800 text-white shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-base"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5 inline mr-1.5" /> 确认重置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ui.toast?.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'absolute top-24 left-1/2 z-40 px-5 py-3 rounded-xl shadow-xl font-medium',
              ui.toast.type === 'success' && 'bg-green-500 text-white',
              ui.toast.type === 'error' && 'bg-red-500 text-white',
              ui.toast.type === 'info' && 'bg-blue-500 text-white',
            )}
          >
            {ui.toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingToggle({
  icon: Icon,
  label,
  description,
  value,
  onToggle,
  gradient,
}: {
  icon: any
  label: string
  description: string
  value: boolean
  onToggle: () => void
  gradient: string
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-all text-left group"
    >
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <div
          className={cn(
            'w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br',
            gradient,
          )}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm md:text-base">{label}</div>
          <div className="text-xs md:text-sm text-white/50">{description}</div>
        </div>
      </div>
      <div
        className={cn(
          'w-12 h-7 md:w-14 md:h-8 rounded-full p-0.5 transition-all shrink-0',
          value ? 'bg-green-500' : 'bg-white/15',
        )}
      >
        <motion.div
          animate={{ x: value ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white shadow-lg"
        />
      </div>
    </button>
  )
}
