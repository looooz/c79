import type { RuntimeScrew, Screw, ScrewType } from '@/types'
import { RotationDetector } from './RotationDetector'
import { ScrewRenderer } from './ScrewRenderer'
import { ParticleSystem } from './ParticleSystem'
import { PhysicsSimulator } from './PhysicsSimulator'
import { distance, clamp, uid } from '@/utils/math'
import type { Particle } from '@/types'

export interface EngineCallbacks {
  onScrewRemoved: (screwId: string, baseScore: number) => void
  onProgressUpdate: (screwId: string, amount: number) => void
  onMilestone: (milestone: number) => void
  onAllRemoved: () => void
  onTick: (dt: number) => void
  onWrongAction: (reason: 'wrongBit' | 'wrongOrder' | 'noScrew') => void
}

export class GameEngine {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private width: number = 0
  private height: number = 0
  private dpr: number = 1

  private rotationDetector = new RotationDetector()
  private renderer = new ScrewRenderer()
  private particles = new ParticleSystem()
  private physics = new PhysicsSimulator()

  private screws: RuntimeScrew[] = []
  private activeScrewId: string | null = null
  private activeBit: ScrewType = 'cross'
  private electricMode: boolean = false
  private electricRotation: number = 0
  private electricSpeedMultiplier: number = 1
  private batteryMax: number = 100
  private callbacks: EngineCallbacks | null = null

  private isPointerDown: boolean = false
  private pointerX: number = 0
  private pointerY: number = 0
  private lastFrameTime: number = 0
  private animationFrameId: number | null = null
  private milestoneEffects: Map<string, { x: number; y: number; size: number; intensity: number }> = new Map()

  private screwdriverScreenX: number = 0
  private screwdriverScreenY: number = 0
  private screwdriverRotation: number = 0

  private isRunning: boolean = false
  private isPaused: boolean = false

  setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks
  }

  setSkinConfig(config: {
    screwdriverGradient?: [string, string]
    screwdriverPrimary?: string
    backgroundColors?: string[]
    backgroundPattern?: string
    particleColors?: string[]
    particleType?: Particle['type']
  }): void {
    this.renderer.setSkinConfig({
      screwdriverGradient: config.screwdriverGradient,
      screwdriverPrimary: config.screwdriverPrimary,
      backgroundColors: config.backgroundColors,
      backgroundPattern: config.backgroundPattern,
    })
    if (config.particleColors) {
      this.particles.setColors(config.particleColors)
    }
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.resize()
    this.bindEvents()
  }

  resize(): void {
    if (!this.canvas) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = this.canvas.getBoundingClientRect()
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = Math.floor(this.width * this.dpr)
    this.canvas.height = Math.floor(this.height * this.dpr)
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    }
    this.recalculateScrewPositions()
  }

  private recalculateScrewPositions(): void {
    const baseSize = Math.min(this.width, this.height) * 0.08
    for (const screw of this.screws) {
      screw.pixelX = (screw.x / 100) * this.width
      screw.pixelY = (screw.y / 100) * this.height
      screw.pixelSize = baseSize * (0.8 + screw.size * 0.2)
    }
  }

  setScrews(screws: Screw[]): void {
    this.screws = screws.map((s) => ({
      ...s,
      pixelX: 0,
      pixelY: 0,
      pixelSize: 0,
    }))
    this.recalculateScrewPositions()
    this.activeScrewId = null
  }

  setActiveBit(type: ScrewType): void {
    this.activeBit = type
  }

  setElectricMode(enabled: boolean): void {
    this.electricMode = enabled
    if (!enabled) {
      this.electricRotation = 0
    }
  }

  setElectricSpeed(multiplier: number): void {
    this.electricSpeedMultiplier = multiplier
  }

  setBatteryMax(max: number): void {
    this.batteryMax = max
  }

  getScrews(): RuntimeScrew[] {
    return this.screws
  }

  getActiveScrew(): RuntimeScrew | undefined {
    return this.screws.find((s) => s.id === this.activeScrewId)
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.isPaused = false
    this.lastFrameTime = performance.now()
    this.loop()
  }

  stop(): void {
    this.isRunning = false
    this.isPaused = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  pause(): void {
    this.isPaused = true
  }

  resume(): void {
    this.isPaused = false
    this.lastFrameTime = performance.now()
  }

  reset(): void {
    this.screws = []
    this.activeScrewId = null
    this.electricRotation = 0
    this.particles.clear()
    this.milestoneEffects.clear()
    this.rotationDetector.reset()
  }

  private bindEvents(): void {
    if (!this.canvas) return

    const getPos = (e: PointerEvent) => {
      const rect = this.canvas!.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    this.screwdriverScreenX = this.width / 2
    this.screwdriverScreenY = this.height / 2

    this.canvas.addEventListener('pointerenter', (e) => {
      const { x, y } = getPos(e)
      this.screwdriverScreenX = x
      this.screwdriverScreenY = y
    })

    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.isRunning || this.isPaused) return
      const { x, y } = getPos(e)
      this.isPointerDown = true
      this.pointerX = x
      this.pointerY = y
      this.screwdriverScreenX = x
      this.screwdriverScreenY = y
      this.handlePointerDown(x, y)
      this.canvas!.setPointerCapture(e.pointerId)
    })

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isRunning) return
      const { x, y } = getPos(e)
      this.pointerX = x
      this.pointerY = y
      this.screwdriverScreenX = x
      this.screwdriverScreenY = y
      if (this.isPointerDown && !this.isPaused) {
        this.handlePointerMove(x, y)
      }
    })

    this.canvas.addEventListener('pointerup', (e) => {
      this.isPointerDown = false
      this.handlePointerUp()
      if (this.canvas!.hasPointerCapture(e.pointerId)) {
        this.canvas!.releasePointerCapture(e.pointerId)
      }
    })

    this.canvas.addEventListener('pointercancel', () => {
      this.isPointerDown = false
      this.handlePointerUp()
    })
  }

  private handlePointerDown(x: number, y: number, showFeedback: boolean = true): boolean {
    const screw = this.findScrewAt(x, y)
    if (!screw || screw.removed) {
      if (showFeedback) this.callbacks?.onWrongAction('noScrew')
      return false
    }

    const nextOrder = this.getNextOrder()
    if (screw.order !== nextOrder) {
      if (showFeedback) this.callbacks?.onWrongAction('wrongOrder')
      return false
    }

    if (screw.type !== this.activeBit) {
      if (showFeedback) this.callbacks?.onWrongAction('wrongBit')
      return false
    }

    this.activeScrewId = screw.id
    this.rotationDetector.setCenter(screw.pixelX, screw.pixelY)
    screw.startTime = performance.now()
    return true
  }

  private handlePointerMove(x: number, y: number): void {
    if (!this.activeScrewId) {
      this.handlePointerDown(x, y, false)
      if (!this.activeScrewId) return
    }

    const screw = this.screws.find((s) => s.id === this.activeScrewId)
    if (!screw || screw.removed) {
      this.activeScrewId = null
      return
    }

    const time = performance.now()
    const result = this.rotationDetector.update(x, y, time)

    const speedFactor = 0.75 + result.instantaneousSpeed * 0.1
    let progress = 0
    if (result.isClockwise) {
      progress = speedFactor * 0.35
    } else if (result.instantaneousSpeed > 1.2 && result.totalClockwise > 0.5) {
      progress = speedFactor * 0.12
    }

    screw.rotation += Math.abs(result.instantaneousSpeed * 0.1)

    if (progress > 0) {
      this.applyProgress(screw, progress)
    }
  }

  private handlePointerUp(): void {
    this.activeScrewId = null
    this.rotationDetector.reset()
  }

  private findScrewAt(x: number, y: number): RuntimeScrew | undefined {
    for (const screw of this.screws) {
      if (distance(x, y, screw.pixelX, screw.pixelY) < screw.pixelSize * 1.5) {
        return screw
      }
    }
    return undefined
  }

  getNextScrew(): RuntimeScrew | undefined {
    const nextOrder = this.getNextOrder()
    if (nextOrder < 0) return undefined
    return this.screws.find((s) => s.order === nextOrder)
  }

  private getNextOrder(): number {
    const remaining = this.screws.filter((s) => !s.removed)
    if (remaining.length === 0) return -1
    return Math.min(...remaining.map((s) => s.order))
  }

  private applyProgress(screw: RuntimeScrew, amount: number): void {
    if (screw.removed) return

    const newProgress = clamp(screw.progress + amount, 0, 100)
    const delta = newProgress - screw.progress

    if (delta > 0) {
      screw.progress = newProgress
      this.callbacks?.onProgressUpdate(screw.id, delta)

      const milestone = this.physics.shouldTriggerMilestone(screw)
      if (milestone !== null) {
        this.physics.updateLastMilestone(screw, milestone)
        this.triggerMilestone(screw, milestone)
        this.callbacks?.onMilestone(milestone)
      }

      if (screw.progress >= 100) {
        this.removeScrew(screw)
      }
    }
  }

  private triggerMilestone(screw: RuntimeScrew, milestone: number): void {
    this.milestoneEffects.set(uid(), {
      x: screw.pixelX,
      y: screw.pixelY - (screw.progress / 100) * screw.pixelSize * 0.6,
      size: screw.pixelSize,
      intensity: 1,
    })

    this.particles.spawnBurst(
      screw.pixelX,
      screw.pixelY - (screw.progress / 100) * screw.pixelSize * 0.6,
      8,
    )
  }

  private removeScrew(screw: RuntimeScrew): void {
    screw.removed = true
    screw.popAnimation = 0

    const baseScore = Math.floor(50 + screw.size * 25)
    this.callbacks?.onScrewRemoved(screw.id, baseScore)

    this.particles.spawnBurst(screw.pixelX, screw.pixelY - screw.pixelSize * 0.6, 30)
    this.particles.spawnFloatingText(
      screw.pixelX,
      screw.pixelY - screw.pixelSize * 0.9,
      `+${baseScore}`,
      '#4CAF50',
    )

    const allRemoved = this.screws.every((s) => s.removed)
    if (allRemoved) {
      this.callbacks?.onAllRemoved()
    }
  }

  private updateElectricMode(dt: number): void {
    if (!this.electricMode || !this.isPointerDown) return
    if (!this.activeScrewId) {
      this.handlePointerDown(this.pointerX, this.pointerY, false)
    }
    if (!this.activeScrewId) return

    const screw = this.screws.find((s) => s.id === this.activeScrewId)
    if (!screw || screw.removed) return

    const baseSpeed = 12 * this.electricSpeedMultiplier
    this.electricRotation += baseSpeed * dt
    screw.rotation += baseSpeed * dt * 2.5

    const progress = baseSpeed * dt * 20
    this.applyProgress(screw, progress)
  }

  private loop = (): void => {
    if (!this.isRunning) return

    const now = performance.now()
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05)
    this.lastFrameTime = now

    if (!this.isPaused) {
      this.update(dt)
      this.callbacks?.onTick(dt)
    }

    this.render()
    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    const activeScrew = this.screws.find((s) => s.id === this.activeScrewId)

    for (const screw of this.screws) {
      this.physics.updateScrewPhysics(screw, dt, screw.id === this.activeScrewId)
    }

    this.updateElectricMode(dt)

    if (this.isPointerDown && activeScrew) {
      const targetRot = this.electricMode
        ? this.electricRotation
        : Math.atan2(
            this.pointerY - activeScrew.pixelY,
            this.pointerX - activeScrew.pixelX,
          )
      this.screwdriverRotation = targetRot
    }

    this.particles.update(dt)

    for (const [id, effect] of this.milestoneEffects) {
      effect.intensity -= dt * 2
      if (effect.intensity <= 0) {
        this.milestoneEffects.delete(id)
      }
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return
    const ctx = this.ctx

    ctx.clearRect(0, 0, this.width, this.height)

    this.renderer.renderBackground(ctx, this.width, this.height)

    const nextOrder = this.getNextOrder()
    for (const screw of this.screws) {
      const isActive = screw.id === this.activeScrewId
      const isNext = screw.order === nextOrder && !isActive && !screw.removed
      this.renderer.renderScrew(ctx, screw, isActive, isNext)
    }

    for (const effect of this.milestoneEffects.values()) {
      this.renderer.renderMilestoneEffect(
        ctx,
        effect.x,
        effect.y,
        effect.size,
        effect.intensity,
      )
    }

    this.particles.render(ctx)

    if (this.isPointerDown) {
      const activeScrew = this.screws.find((s) => s.id === this.activeScrewId)
      if (activeScrew) {
        const heightOffset = (activeScrew.progress / 100) * activeScrew.pixelSize * 0.6
        this.renderer.renderScrewdriver(
          ctx,
          activeScrew.pixelX,
          activeScrew.pixelY - heightOffset,
          this.activeBit,
          this.screwdriverRotation,
          true,
        )
      }
    } else {
      this.renderer.renderScrewdriver(
        ctx,
        this.screwdriverScreenX || this.width / 2,
        this.screwdriverScreenY || this.height / 2,
        this.activeBit,
        0,
        false,
      )
    }
  }
}
