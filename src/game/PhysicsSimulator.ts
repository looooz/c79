import type { Screw } from '@/types'
import { lerp } from '@/utils/math'

export class PhysicsSimulator {
  updateScrewPhysics(screw: Screw, dt: number, isActive: boolean): void {
    if (screw.removed) {
      screw.popAnimation = Math.min(1, screw.popAnimation + dt * 3)
      return
    }

    if (isActive) {
      const shakeSpeed = 25 + screw.progress * 0.5
      screw.shakeOffset = Math.sin(performance.now() / (1000 / shakeSpeed)) * (1 + screw.progress * 0.03)
    } else {
      screw.shakeOffset = lerp(screw.shakeOffset, 0, dt * 10)
    }
  }

  getScrewHeightOffset(progress: number, size: number): number {
    return progress * 0.5 * size
  }

  getScrewScale(progress: number): number {
    return 1 - progress * 0.02
  }

  shouldTriggerMilestone(screw: Screw): number | null {
    const milestones = [25, 50, 75, 100]
    for (const m of milestones) {
      if (screw.progress >= m && screw.lastMilestone < m) {
        return m
      }
    }
    return null
  }

  updateLastMilestone(screw: Screw, milestone: number): void {
    screw.lastMilestone = Math.max(screw.lastMilestone, milestone)
  }
}
