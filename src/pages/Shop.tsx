import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Coins,
  Zap,
  Battery,
  Wrench,
  Check,
  ShoppingCart,
  Wand2,
  Palette,
  Sparkles,
  ChevronUp,
} from 'lucide-react'
import { useProgressStore } from '@/store/progressStore'
import { useUIStore } from '@/store/uiStore'
import { audioManager } from '@/audio/AudioManager'
import {
  DEFAULT_UPGRADES,
  getUpgradeCost,
  getMotorSpeedMultiplier,
  getBatteryMaxValue,
  hasAutoBit,
} from '@/config/upgrades'
import { DEFAULT_SKINS, getEquippedSkin } from '@/config/skins'
import type { SkinCategory } from '@/types'
import { formatNumber } from '@/utils/math'
import { cn } from '@/lib/utils'

type TabType = 'upgrade' | SkinCategory

const TABS: { id: TabType; label: string; icon: typeof Zap }[] = [
  { id: 'upgrade', label: '升级', icon: ChevronUp },
  { id: 'screwdriver', label: '螺丝刀', icon: Wrench },
  { id: 'background', label: '背景', icon: Palette },
  { id: 'particle', label: '特效', icon: Sparkles },
]

export default function Shop() {
  const navigate = useNavigate()
  const progress = useProgressStore()
  const ui = useUIStore()
  const [activeTab, setActiveTab] = useState<TabType>('upgrade')

  const handleUpgrade = (id: string) => {
    audioManager.playClick()
    const upgrade = progress.upgrades.find((u) => u.id === id)
    if (!upgrade) return
    if (upgrade.currentLevel >= upgrade.maxLevel) return
    const cost = getUpgradeCost(upgrade)
    if (progress.coins < cost) {
      ui.showToast('积分不足', 'error')
      return
    }
    if (progress.upgradeItem(id as any)) {
      audioManager.playMilestone()
      ui.showToast('升级成功！', 'success')
    }
  }

  const handleBuySkin = (skinId: string) => {
    audioManager.playClick()
    const skin = progress.skins.find((s) => s.id === skinId)
    if (!skin) return
    if (skin.owned) {
      progress.equipSkin(skinId)
      audioManager.playMilestone()
      ui.showToast('已装备', 'success')
      return
    }
    if (progress.coins < skin.price) {
      ui.showToast('积分不足', 'error')
      return
    }
    if (progress.buySkin(skinId)) {
      progress.equipSkin(skinId)
      audioManager.playMilestone()
      ui.showToast('购买并装备成功！', 'success')
    }
  }

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

            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl">
              <Coins className="w-5 h-5 text-yellow-400 fill-yellow-400/30" />
              <span className="font-display text-xl md:text-2xl font-black text-yellow-400 tracking-wide">
                {formatNumber(progress.coins)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 pb-3">
          <div className="glass-panel rounded-2xl p-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  audioManager.playClick()
                  setActiveTab(tab.id)
                }}
                className={cn(
                  'flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-gradient-to-b from-accent-orange to-orange-700 text-white shadow-lg shadow-orange-500/25'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'upgrade' && (
                <div className="space-y-4">
                  {progress.upgrades.map((up) => {
                    const cost = getUpgradeCost(up)
                    const isMaxed = up.currentLevel >= up.maxLevel
                    const canAfford = progress.coins >= cost
                    const isUnlocked = DEFAULT_UPGRADES.find((d) => d.id === up.id)

                    let currentValue = ''
                    let nextValue = ''
                    if (up.id === 'motorSpeed') {
                      currentValue = `${(getMotorSpeedMultiplier(up.currentLevel) * 100).toFixed(0)}%`
                      nextValue = isMaxed ? '' : `${(getMotorSpeedMultiplier(up.currentLevel + 1) * 100).toFixed(0)}%`
                    } else if (up.id === 'batteryMax') {
                      currentValue = `${getBatteryMaxValue(up.currentLevel)}`
                      nextValue = isMaxed ? '' : `${getBatteryMaxValue(up.currentLevel + 1)}`
                    } else if (up.id === 'bitSet') {
                      currentValue = hasAutoBit(up.currentLevel) ? '已解锁' : '未解锁'
                      nextValue = ''
                    }

                    return (
                      <motion.div
                        key={up.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={cn(
                                'w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0',
                                up.id === 'motorSpeed' && 'bg-gradient-to-br from-yellow-500 to-orange-700',
                                up.id === 'batteryMax' && 'bg-gradient-to-br from-green-500 to-emerald-700',
                                up.id === 'bitSet' && 'bg-gradient-to-br from-purple-500 to-violet-700',
                              )}
                            >
                              {up.id === 'motorSpeed' && <Zap className="w-7 h-7 md:w-8 md:h-8 text-white" />}
                              {up.id === 'batteryMax' && <Battery className="w-7 h-7 md:w-8 md:h-8 text-white" />}
                              {up.id === 'bitSet' && <Wand2 className="w-7 h-7 md:w-8 md:h-8 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg md:text-xl text-white">{up.name}</h3>
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                                  Lv.{up.currentLevel}/{up.maxLevel}
                                </span>
                              </div>
                              <p className="text-sm text-white/60 mb-2">{up.description}</p>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-white/80">
                                  当前: <span className="font-bold text-accent-orange">{currentValue}</span>
                                </span>
                                {nextValue && (
                                  <>
                                    <span className="text-white/30">→</span>
                                    <span className="text-white/80">
                                      下一级: <span className="font-bold text-green-400">{nextValue}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 h-2.5 bg-black/30 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                up.id === 'motorSpeed' && 'bg-gradient-to-r from-yellow-400 to-orange-500',
                                up.id === 'batteryMax' && 'bg-gradient-to-r from-green-400 to-emerald-500',
                                up.id === 'bitSet' && 'bg-gradient-to-r from-purple-400 to-violet-500',
                              )}
                              style={{ width: `${(up.currentLevel / up.maxLevel) * 100}%` }}
                            />
                          </div>

                          <button
                            onClick={() => handleUpgrade(up.id)}
                            disabled={isMaxed || !canAfford || !isUnlocked}
                            className={cn(
                              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm md:text-base transition-all shrink-0',
                              isMaxed
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                                : canAfford
                                  ? 'bg-gradient-to-b from-accent-orange to-orange-700 text-white hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25'
                                  : 'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed',
                            )}
                          >
                            {isMaxed ? (
                              <>
                                <Check className="w-4 h-4 md:w-5 md:h-5" /> 已满级
                              </>
                            ) : (
                              <>
                                <Coins className="w-4 h-4 md:w-5 md:h-5" />
                                {formatNumber(cost)}
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {(activeTab === 'screwdriver' || activeTab === 'background' || activeTab === 'particle') && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {progress.skins
                    .filter((s) => s.category === activeTab)
                    .map((skin, idx) => {
                      const equipped = skin.equipped
                      const owned = skin.owned
                      const canAfford = progress.coins >= skin.price
                      const previewColor =
                        skin.config.gradient?.[0] ||
                        skin.config.primary ||
                        skin.config.colors?.[0] ||
                        '#888'

                      return (
                        <motion.button
                          key={skin.id}
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: owned ? 1.04 : 1.02, y: -3 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleBuySkin(skin.id)}
                          disabled={!owned && !canAfford}
                          className={cn(
                            'relative rounded-2xl p-3 md:p-4 flex flex-col items-center transition-all',
                            equipped
                              ? 'bg-gradient-to-b from-accent-orange/20 to-orange-800/20 border-2 border-accent-orange shadow-lg shadow-orange-500/20'
                              : owned
                                ? 'glass-card border-2 border-white/10 hover:border-green-500/50'
                                : canAfford
                                  ? 'glass-card border-2 border-white/10 hover:border-yellow-500/50'
                                  : 'bg-black/30 border-2 border-white/5 opacity-60 cursor-not-allowed',
                          )}
                        >
                          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-3 overflow-hidden flex items-center justify-center shrink-0">
                            {activeTab === 'screwdriver' ? (
                              <div
                                className="w-12 h-12 md:w-14 md:h-14 rounded-xl shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, ${skin.config.gradient?.[0] || '#F44336'} 0%, ${skin.config.gradient?.[1] || '#B71C1C'} 100%)`,
                                }}
                              />
                            ) : activeTab === 'background' ? (
                              <div
                                className="w-full h-full"
                                style={{
                                  background:
                                    skin.config.pattern === 'gradient'
                                      ? `linear-gradient(135deg, ${skin.config.colors?.join(', ')})`
                                      : skin.config.pattern === 'space'
                                        ? `radial-gradient(circle, ${skin.config.colors?.join(', ')})`
                                        : `linear-gradient(135deg, ${skin.config.colors?.join(', ')})`,
                                }}
                              />
                            ) : (
                              <div className="flex gap-1 items-center justify-center w-full h-full bg-black/40 rounded-xl">
                                {skin.config.colors?.slice(0, 5).map((c, i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                    transition={{ delay: i * 0.1, duration: 1, repeat: Infinity }}
                                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                                    style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }}
                                  />
                                ))}
                              </div>
                            )}

                            {equipped && (
                              <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-accent-orange flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div className="text-center mb-2 w-full">
                            <div className="font-bold text-white text-sm md:text-base mb-0.5 truncate">
                              {skin.name}
                            </div>
                          </div>

                          {owned ? (
                            <div
                              className={cn(
                                'text-xs md:text-sm font-bold w-full py-1.5 rounded-lg text-center',
                                equipped
                                  ? 'bg-accent-orange/20 text-accent-orange'
                                  : 'bg-green-500/10 text-green-400',
                              )}
                            >
                              {equipped ? '✓ 已装备' : '点击装备'}
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'flex items-center justify-center gap-1 text-xs md:text-sm font-bold w-full py-1.5 rounded-lg',
                                canAfford
                                  ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                  : 'bg-white/5 text-white/40',
                              )}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              {formatNumber(skin.price)}
                            </div>
                          )}
                        </motion.button>
                      )
                    })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
