import type { RuntimeScrew, ScrewType } from '@/types'

interface SkinConfig {
  screwdriverGradient?: [string, string]
  screwdriverPrimary?: string
  backgroundColors?: string[]
  backgroundPattern?: string
}

export class ScrewRenderer {
  private skinConfig: SkinConfig = {}

  setSkinConfig(config: SkinConfig): void {
    this.skinConfig = config
  }

  renderBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const pattern = this.skinConfig.backgroundPattern ?? 'wood'
    const colors = this.skinConfig.backgroundColors ?? ['#5D4037', '#4E342E', '#3E2723']

    if (pattern === 'gradient' && colors.length >= 2) {
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color)
      })
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    } else if (pattern === 'space') {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width)
      colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color)
      })
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      this.drawStars(ctx, width, height)
    } else if (pattern === 'metal') {
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, colors[0] ?? '#455A64')
      gradient.addColorStop(0.5, colors[1] ?? '#37474F')
      gradient.addColorStop(1, colors[2] ?? '#263238')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      this.drawMetalTexture(ctx, width, height)
    } else {
      this.drawWoodTexture(ctx, width, height, colors)
    }

    this.drawBorder(ctx, width, height)
  }

  private drawWoodTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: string[],
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, colors[0] ?? '#5D4037')
    gradient.addColorStop(0.5, colors[1] ?? '#4E342E')
    gradient.addColorStop(1, colors[2] ?? '#3E2723')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.globalAlpha = 0.08
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * height + Math.sin(i * 2) * 8
      ctx.strokeStyle = '#1a0f0a'
      ctx.lineWidth = 1 + Math.random() * 1.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(width * 0.25, y + Math.sin(i) * 12, width * 0.75, y + Math.cos(i) * 8, width, y + Math.sin(i * 1.5) * 6)
      ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.05
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * width
      const cy = Math.random() * height
      const r = 30 + Math.random() * 60
      const knotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      knotGrad.addColorStop(0, '#2a1810')
      knotGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = knotGrad
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawMetalTexture(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    ctx.save()
    ctx.globalAlpha = 0.1
    ctx.strokeStyle = '#607D8B'
    ctx.lineWidth = 1
    for (let i = 0; i < height; i += 3) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i + 0.5)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawStars(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    ctx.save()
    for (let i = 0; i < 80; i++) {
      const x = (i * 97.3) % width
      const y = (i * 53.7) % height
      const size = 0.5 + Math.random() * 2
      const alpha = 0.3 + Math.random() * 0.7
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawBorder(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const borderGrad = ctx.createLinearGradient(0, 0, 20, 0)
    borderGrad.addColorStop(0, 'rgba(0,0,0,0.4)')
    borderGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = borderGrad
    ctx.fillRect(0, 0, 20, height)

    const borderGradR = ctx.createLinearGradient(width, 0, width - 20, 0)
    borderGradR.addColorStop(0, 'rgba(0,0,0,0.4)')
    borderGradR.addColorStop(1, 'transparent')
    ctx.fillStyle = borderGradR
    ctx.fillRect(width - 20, 0, 20, height)

    const borderGradT = ctx.createLinearGradient(0, 0, 0, 20)
    borderGradT.addColorStop(0, 'rgba(0,0,0,0.4)')
    borderGradT.addColorStop(1, 'transparent')
    ctx.fillStyle = borderGradT
    ctx.fillRect(0, 0, width, 20)

    const borderGradB = ctx.createLinearGradient(0, height, 0, height - 20)
    borderGradB.addColorStop(0, 'rgba(0,0,0,0.5)')
    borderGradB.addColorStop(1, 'transparent')
    ctx.fillStyle = borderGradB
    ctx.fillRect(0, height - 20, width, 20)
  }

  renderScrew(
    ctx: CanvasRenderingContext2D,
    screw: RuntimeScrew,
    isActive: boolean,
    isNext: boolean,
  ): void {
    const size = screw.pixelSize
    const x = screw.pixelX + screw.shakeOffset
    const y = screw.pixelY + screw.shakeOffset
    const heightOffset = (screw.progress / 100) * size * 0.6
    const popY = screw.removed ? screw.popAnimation * size * 3 : 0
    const drawY = y - heightOffset - popY
    const scale = 1 - (screw.progress / 100) * 0.02
    const rotation = screw.rotation + (screw.removed ? screw.popAnimation * Math.PI * 4 : 0)

    ctx.save()
    ctx.translate(x, drawY)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)
    ctx.globalAlpha = screw.removed ? Math.max(0, 1 - screw.popAnimation) : 1

    if (isActive || isNext) {
      ctx.save()
      ctx.shadowColor = isActive ? '#FFC107' : '#2196F3'
      ctx.shadowBlur = isActive ? 25 : 12
      ctx.strokeStyle = isActive ? 'rgba(255, 193, 7, 0.6)' : 'rgba(33, 150, 243, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    this.renderScrewHead(ctx, size, screw.type, screw.progress)
    ctx.restore()

    if (!screw.removed) {
      this.renderProgressRing(ctx, x, drawY, size, screw.progress, isActive)
    }

    if (isNext && !isActive && !screw.removed) {
      this.renderOrderIndicator(ctx, x, drawY - size * 1.3, screw.order)
    }
  }

  private renderScrewHead(
    ctx: CanvasRenderingContext2D,
    size: number,
    type: ScrewType,
    progress: number,
  ): void {
    const r = size * 0.6

    const shadowGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, r * 1.2)
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)')
    shadowGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = shadowGrad
    ctx.beginPath()
    ctx.arc(0, 2, r * 1.2, 0, Math.PI * 2)
    ctx.fill()

    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r)
    const brightness = 0.5 + progress * 0.005
    bodyGrad.addColorStop(0, `hsl(0, 0%, ${brightness * 100}%)`)
    bodyGrad.addColorStop(0.5, `hsl(0, 0%, ${brightness * 75}%)`)
    bodyGrad.addColorStop(1, `hsl(0, 0%, ${brightness * 45}%)`)
    ctx.fillStyle = bodyGrad
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    const highlightGrad = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0, -r * 0.2, -r * 0.2, r * 0.6)
    highlightGrad.addColorStop(0, 'rgba(255,255,255,0.4)')
    highlightGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = highlightGrad
    ctx.beginPath()
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1a1a1a'
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'
    ctx.lineWidth = 1.5

    switch (type) {
      case 'cross':
        this.drawCross(ctx, r * 0.55)
        break
      case 'flat':
        this.drawFlat(ctx, r * 0.55)
        break
      case 'hex':
        this.drawHex(ctx, r * 0.55)
        break
      case 'socket':
        this.drawSocket(ctx, r * 0.5)
        break
    }
  }

  private drawCross(ctx: CanvasRenderingContext2D, r: number): void {
    const t = r * 0.35
    ctx.beginPath()
    ctx.rect(-t / 2, -r, t, r * 2)
    ctx.rect(-r, -t / 2, r * 2, t)
    ctx.fill()
    ctx.stroke()
  }

  private drawFlat(ctx: CanvasRenderingContext2D, r: number): void {
    const t = r * 0.3
    ctx.beginPath()
    ctx.rect(-r, -t / 2, r * 2, t)
    ctx.fill()
    ctx.stroke()
  }

  private drawHex(ctx: CanvasRenderingContext2D, r: number): void {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      const px = Math.cos(a) * r
      const py = Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#1a1a1a'
    ctx.stroke()
  }

  private drawSocket(ctx: CanvasRenderingContext2D, r: number): void {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      const px = Math.cos(a) * r
      const py = Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  private renderProgressRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    progress: number,
    isActive: boolean,
  ): void {
    const r = size * 0.75
    const lineWidth = isActive ? 4 : 3

    ctx.save()
    ctx.translate(x, y)

    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()

    if (progress > 0) {
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + (Math.PI * 2 * progress) / 100
      const hue = progress < 50 ? 120 - progress * 1.2 : 120 - progress * 0.8
      ctx.strokeStyle = `hsl(${hue}, 80%, 55%)`
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      if (isActive) {
        ctx.shadowColor = `hsl(${hue}, 80%, 55%)`
        ctx.shadowBlur = 8
      }
      ctx.beginPath()
      ctx.arc(0, 0, r, startAngle, endAngle)
      ctx.stroke()
    }

    ctx.restore()
  }

  private renderOrderIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    order: number,
  ): void {
    ctx.save()
    ctx.translate(x, y)

    ctx.fillStyle = '#2196F3'
    ctx.shadowColor = '#2196F3'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(0, 0, 14, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px "Orbitron", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowBlur = 0
    ctx.fillText(String(order), 0, 1)

    ctx.restore()
  }

  renderScrewdriver(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bitType: ScrewType,
    rotation: number = 0,
    isActive: boolean = false,
  ): void {
    const gradient = this.skinConfig.screwdriverGradient ?? ['#F44336', '#B71C1C']
    const primary = this.skinConfig.screwdriverPrimary ?? '#F44336'

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    const handleLen = 80
    const handleR = 18

    const handleGrad = ctx.createLinearGradient(-handleR, 0, handleLen, 0)
    handleGrad.addColorStop(0, gradient[0])
    handleGrad.addColorStop(1, gradient[1])
    ctx.fillStyle = handleGrad
    ctx.beginPath()
    ctx.roundRect(-handleR, -handleR, handleLen, handleR * 2, 8)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(10 + i * 12, 0, handleR - 3, -Math.PI / 3, Math.PI / 3)
      ctx.stroke()
    }

    const shaftLen = 50
    const shaftR = 6
    const shaftGrad = ctx.createLinearGradient(handleLen - 5, -shaftR, handleLen + shaftLen, shaftR)
    shaftGrad.addColorStop(0, '#9E9E9E')
    shaftGrad.addColorStop(0.5, '#E0E0E0')
    shaftGrad.addColorStop(1, '#757575')
    ctx.fillStyle = shaftGrad
    ctx.beginPath()
    ctx.roundRect(handleLen - 5, -shaftR, shaftLen + 5, shaftR * 2, 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1
    ctx.stroke()

    if (isActive) {
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.strokeStyle = primary
      ctx.lineWidth = 3
      const spinPhase = (Date.now() / 50) % (Math.PI * 2)
      ctx.beginPath()
      ctx.arc(handleLen + shaftLen / 2, 0, shaftR + 4, spinPhase, spinPhase + Math.PI)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(handleLen + shaftLen / 2, 0, shaftR + 4, spinPhase + Math.PI, spinPhase + Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    this.renderBit(ctx, handleLen + shaftLen, bitType)

    ctx.restore()
  }

  private renderBit(
    ctx: CanvasRenderingContext2D,
    x: number,
    type: ScrewType,
  ): void {
    const len = 15
    ctx.save()
    ctx.translate(x, 0)

    ctx.fillStyle = '#616161'
    ctx.beginPath()
    ctx.moveTo(0, -4)
    ctx.lineTo(len - 5, -3)
    ctx.lineTo(len, -2)
    ctx.lineTo(len, 2)
    ctx.lineTo(len - 5, 3)
    ctx.lineTo(0, 4)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    ctx.fillStyle = '#212121'
    switch (type) {
      case 'cross':
        ctx.beginPath()
        ctx.rect(len - 1, -1.5, 3, 3)
        ctx.rect(len - 2.5, -0.5, 5, 1)
        ctx.fill()
        break
      case 'flat':
        ctx.fillRect(len - 2, -0.5, 5, 1)
        break
      case 'hex':
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i
          const px = len + Math.cos(a) * 2.5
          const py = Math.sin(a) * 2.5
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
        break
      case 'socket':
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i
          const px = len + Math.cos(a) * 2.5
          const py = Math.sin(a) * 2.5
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        break
    }

    ctx.restore()
  }

  renderMilestoneEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    intensity: number,
  ): void {
    ctx.save()
    ctx.translate(x, y)
    ctx.globalAlpha = intensity

    const rings = 3
    for (let i = 0; i < rings; i++) {
      const r = size * (0.9 + (1 - intensity) * 0.6 + i * 0.15)
      const alpha = (1 - i / rings) * intensity * 0.8
      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#FFC107'
      ctx.shadowColor = '#FFC107'
      ctx.shadowBlur = 20
      ctx.lineWidth = 3 - i
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }
}
