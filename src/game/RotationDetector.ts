import { angle, angleDiff, clamp } from '@/utils/math'

export interface RotationResult {
  totalClockwise: number
  instantaneousSpeed: number
  isClockwise: boolean
}

export class RotationDetector {
  private centerX: number = 0
  private centerY: number = 0
  private lastAngle: number | null = null
  private lastTime: number = 0
  private accumulatedClockwise: number = 0
  private speedSamples: number[] = []
  private diffHistory: number[] = []
  private readonly maxSamples = 8
  private readonly maxHistory = 10

  setCenter(x: number, y: number): void {
    this.centerX = x
    this.centerY = y
    this.reset()
  }

  reset(): void {
    this.lastAngle = null
    this.lastTime = 0
    this.accumulatedClockwise = 0
    this.speedSamples = []
    this.diffHistory = []
  }

  update(x: number, y: number, time: number): RotationResult {
    const currentAngle = angle(this.centerX, this.centerY, x, y)
    let instantaneousSpeed = 0
    let isClockwise = false

    if (this.lastAngle !== null) {
      const diff = angleDiff(currentAngle, this.lastAngle)

      this.diffHistory.push(diff)
      if (this.diffHistory.length > this.maxHistory) {
        this.diffHistory.shift()
      }

      const recentSum = this.diffHistory.reduce((a, b) => a + b, 0)
      isClockwise = recentSum < -0.015

      if (diff < 0) {
        this.accumulatedClockwise += Math.abs(diff)
      } else if (isClockwise && diff < 0.12) {
        this.accumulatedClockwise += Math.abs(diff) * 0.3
      }

      const timeDiff = time - this.lastTime
      if (timeDiff > 0) {
        const rawSpeed = (Math.abs(diff) / timeDiff) * 1000
        this.speedSamples.push(rawSpeed)
        if (this.speedSamples.length > this.maxSamples) {
          this.speedSamples.shift()
        }
      }
    }

    if (this.speedSamples.length > 0) {
      instantaneousSpeed =
        this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length
    }

    this.lastAngle = currentAngle
    this.lastTime = time

    return {
      totalClockwise: this.accumulatedClockwise,
      instantaneousSpeed: clamp(instantaneousSpeed, 0, 30),
      isClockwise,
    }
  }
}
