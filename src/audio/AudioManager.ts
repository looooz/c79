export class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null

  private soundEnabled: boolean = true
  private musicEnabled: boolean = true

  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = []
  private musicInterval: number | null = null
  private rotateNoise: AudioBufferSourceNode | null = null
  private rotateGain: GainNode | null = null

  init(): void {
    if (this.ctx) return

    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new AC()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.6
      this.masterGain.connect(this.ctx.destination)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = this.musicEnabled ? 0.15 : 0
      this.musicGain.connect(this.masterGain)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = this.soundEnabled ? 0.5 : 0
      this.sfxGain.connect(this.masterGain)
    } catch {
      console.warn('Web Audio API not supported')
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
    if (this.sfxGain) {
      this.sfxGain.gain.value = enabled ? 0.5 : 0
    }
    if (!enabled) {
      this.stopRotateSound()
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled
    if (this.musicGain) {
      this.musicGain.gain.value = enabled ? 0.15 : 0
    }
  }

  playClick(): void {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return
    this.resume()

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 600
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.1)
  }

  playMilestone(): void {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return
    this.resume()

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(523, this.ctx.currentTime)
    osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.05)
    osc.frequency.setValueAtTime(784, this.ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.2)
  }

  playScrewRemove(): void {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return
    this.resume()

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3)

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.3)

    this.playPop()
  }

  private playPop(): void {
    if (!this.ctx || !this.sfxGain) return

    const noise = this.ctx.createBufferSource()
    const bufferSize = this.ctx.sampleRate * 0.05
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
    }
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1000

    const gain = this.ctx.createGain()
    gain.gain.value = 0.3

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    noise.start()
  }

  startRotateSound(speed: number = 1): void {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return
    if (this.rotateNoise) return
    this.resume()

    const bufferSize = this.ctx.sampleRate * 0.5
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }

    this.rotateNoise = this.ctx.createBufferSource()
    this.rotateNoise.buffer = buffer
    this.rotateNoise.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800 + speed * 200
    filter.Q.value = 2

    this.rotateGain = this.ctx.createGain()
    this.rotateGain.gain.setValueAtTime(0, this.ctx.currentTime)
    this.rotateGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05)

    this.rotateNoise.connect(filter)
    filter.connect(this.rotateGain)
    this.rotateGain.connect(this.sfxGain)
    this.rotateNoise.start()
  }

  updateRotateSound(speed: number): void {
    if (!this.ctx || !this.rotateGain) return
    const freq = 600 + speed * 300
    this.rotateGain.gain.value = Math.min(0.25, 0.05 + speed * 0.01)
  }

  stopRotateSound(): void {
    if (this.rotateNoise && this.rotateGain && this.ctx) {
      this.rotateGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05)
      const noise = this.rotateNoise
      setTimeout(() => {
        try {
          noise.stop()
        } catch {
          /* ignore */
        }
      }, 60)
      this.rotateNoise = null
      this.rotateGain = null
    }
  }

  playCombo(level: number): void {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return
    this.resume()

    const baseFreq = 440 + Math.min(level, 10) * 60
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime)
    osc.frequency.setValueAtTime(baseFreq * 1.25, this.ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.15)
  }

  playWin(): void {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return
    this.resume()

    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const startTime = this.ctx!.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)

      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(startTime)
      osc.stop(startTime + 0.4)
    })
  }

  playLose(): void {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return
    this.resume()

    const notes = [400, 350, 300, 200]
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      const startTime = this.ctx!.currentTime + i * 0.15
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3)

      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  }

  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.musicInterval) return
    if (!this.musicEnabled) return
    this.resume()

    const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25]
    const bassNotes = [130.81, 146.83, 164.81, 174.61, 196, 146.83, 130.81, 164.81]
    let step = 0

    const playStep = () => {
      if (!this.ctx || !this.musicGain) return

      const melodyFreq = scale[step % scale.length]
      const bassFreq = bassNotes[step % bassNotes.length]

      const melody = this.ctx.createOscillator()
      const melodyGain = this.ctx.createGain()
      melody.type = 'sine'
      melody.frequency.value = melodyFreq
      melodyGain.gain.setValueAtTime(0, this.ctx.currentTime)
      melodyGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.05)
      melodyGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45)
      melody.connect(melodyGain)
      melodyGain.connect(this.musicGain)
      melody.start()
      melody.stop(this.ctx.currentTime + 0.5)

      const bass = this.ctx.createOscillator()
      const bassGain = this.ctx.createGain()
      bass.type = 'triangle'
      bass.frequency.value = bassFreq
      bassGain.gain.setValueAtTime(0, this.ctx.currentTime)
      bassGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.05)
      bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45)
      bass.connect(bassGain)
      bassGain.connect(this.musicGain)
      bass.start()
      bass.stop(this.ctx.currentTime + 0.5)

      step++
    }

    playStep()
    this.musicInterval = window.setInterval(playStep, 500)
  }

  stopMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval)
      this.musicInterval = null
    }
    this.musicNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(this.ctx?.currentTime ?? 0)
        osc.stop()
      } catch {
        /* ignore */
      }
    })
    this.musicNodes = []
  }

  vibrate(duration: number = 50): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration)
      } catch {
        /* ignore */
      }
    }
  }

  destroy(): void {
    this.stopMusic()
    this.stopRotateSound()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

export const audioManager = new AudioManager()
