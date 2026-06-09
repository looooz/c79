export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const distance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

export const angle = (cx: number, cy: number, x: number, y: number): number =>
  Math.atan2(y - cy, x - cx)

export const angleDiff = (a: number, b: number): number => {
  let diff = a - b
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return diff
}

export const randomRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min

export const randomInt = (min: number, max: number): number =>
  Math.floor(randomRange(min, max + 1))

export const uid = (): string => Math.random().toString(36).slice(2, 10)

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatNumber = (num: number): string => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}
