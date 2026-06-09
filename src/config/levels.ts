import type { LevelConfig, ScrewType } from '@/types'

const allTypes: ScrewType[] = ['cross', 'flat', 'hex', 'socket']

export const LEVELS: LevelConfig[] = Array.from({ length: 15 }, (_, i) => {
  const id = i + 1
  const screwCount = 5 + Math.floor(i * 0.8)
  const typeCount = Math.min(1 + Math.floor(i / 3), 4)
  const screwTypes = allTypes.slice(0, typeCount)
  const timeLimit = 30 + screwCount * 7
  const targetScore = 100 + id * 30

  return {
    id,
    name: `第 ${id} 关`,
    screwCount: Math.min(screwCount, 15),
    screwTypes,
    timeLimit,
    targetScore,
  }
})

export const generateScrewPositions = (count: number): Array<{ x: number; y: number }> => {
  const positions: Array<{ x: number; y: number }> = []
  const minDist = count <= 8 ? 22 : count <= 12 ? 18 : 15
  const paddingX = 12
  const paddingTop = 22
  const paddingBottom = 28

  let attempts = 0
  while (positions.length < count && attempts < 5000) {
    const x = paddingX + Math.random() * (100 - paddingX * 2)
    const y = paddingTop + Math.random() * (100 - paddingTop - paddingBottom)

    const tooClose = positions.some(
      (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < minDist,
    )

    if (!tooClose) {
      positions.push({ x, y })
    }
    attempts++
  }

  while (positions.length < count) {
    positions.push({
      x: paddingX + Math.random() * (100 - paddingX * 2),
      y: paddingTop + Math.random() * (100 - paddingTop - paddingBottom),
    })
  }

  return positions
}
