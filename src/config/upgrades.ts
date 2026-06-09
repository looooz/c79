import type { Upgrade } from '@/types'

export const DEFAULT_UPGRADES: Upgrade[] = [
  {
    id: 'motorSpeed',
    name: '电动转速',
    description: '提升电动模式下的旋转速度',
    maxLevel: 10,
    currentLevel: 0,
    baseCost: 200,
    costMultiplier: 1.6,
  },
  {
    id: 'bitSet',
    name: '智能批头套装',
    description: '自动识别并切换对应批头',
    maxLevel: 1,
    currentLevel: 0,
    baseCost: 3000,
    costMultiplier: 1,
  },
  {
    id: 'batteryMax',
    name: '电量上限',
    description: '增加电动模式可用电量',
    maxLevel: 10,
    currentLevel: 0,
    baseCost: 150,
    costMultiplier: 1.5,
  },
]

export const getUpgradeCost = (upgrade: Upgrade): number => {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel))
}

export const getMotorSpeedMultiplier = (level: number): number => 1 + level * 0.18

export const getBatteryMaxValue = (level: number): number => 100 + level * 35

export const hasAutoBit = (level: number): boolean => level >= 1
