import type { Particle, FloatingText } from '@/types'
import { randomRange, randomInt } from '@/utils/math'

const MAX_PARTICLES = 500
const MAX_FLOATING = 100

export class ParticleSystem {
  private particles: Particle[] = []
  private floatingTexts: FloatingText[] = []
  private particleColors: string[] = ['#FF9800', '#FF5722', '#FFC107', '#FFF8E1']

  setColors(colors: string[]): void {
    if (colors.length > 0) {
      this.particleColors = colors
    }
  }

  spawnBurst(
    x: number,
    y: number,
    count: number = 25,
    type: Particle['type'] = 'spark',
  ): void {
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / count + randomRange(-0.2, 0.2)
      const speed = randomRange(3, 12)
      const color = this.particleColors[randomInt(0, this.particleColors.length - 1)]

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: randomRange(0.5, 1.2),
        color,
        size: randomRange(2, 6),
        type,
      })
    }
  }

  spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color: string = '#FFC107',
  ): void {
    if (this.floatingTexts.length >= MAX_FLOATING) return
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 1,
      maxLife: 1,
    })
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 15 * dt
      p.vx *= 0.98
      p.life -= dt / p.maxLife

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i]
      t.y -= 40 * dt
      t.life -= dt / t.maxLife

      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1)
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)

      if (p.type === 'star') {
        this.drawStar(ctx, p.x, p.y, p.size, p.color)
      } else if (p.type === 'rainbow') {
        const hue = (Date.now() / 10 + p.x) % 360
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8 * p.life
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    for (const t of this.floatingTexts) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, t.life)
      ctx.fillStyle = t.color
      ctx.font = 'bold 20px "Orbitron", sans-serif'
      ctx.textAlign = 'center'
      ctx.shadowColor = t.color
      ctx.shadowBlur = 10
      ctx.fillText(t.text, t.x, t.y)
      ctx.restore()
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string,
  ): void {
    const spikes = 5
    const outer = size
    const inner = size / 2
    let rot = (Math.PI / 2) * 3
    const step = Math.PI / spikes

    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 15

    ctx.beginPath()
    ctx.moveTo(cx, cy - outer)

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer)
      rot += step
      ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner)
      rot += step
    }

    ctx.lineTo(cx, cy - outer)
    ctx.closePath()
    ctx.fill()
  }

  clear(): void {
    this.particles = []
    this.floatingTexts = []
  }
}
