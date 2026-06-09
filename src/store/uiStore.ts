import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  message: string
  type: ToastType
  visible: boolean
}

interface Modal {
  type: string
  props: any
}

interface UIState {
  toast: Toast | null
  modal: Modal | null
  screenShake: number
}

interface UIActions {
  showToast: (message: string, type?: ToastType) => void
  showModal: (type: string, props?: any) => void
  hideModal: () => void
  triggerShake: (duration?: number) => void
}

export type UIStore = UIState & UIActions

let toastTimer: ReturnType<typeof setTimeout> | null = null
let shakeTimer: ReturnType<typeof setTimeout> | null = null

export const useUIStore = create<UIStore>((set, get) => ({
  toast: null,
  modal: null,
  screenShake: 0,

  showToast: (message: string, type: ToastType = 'info') => {
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }

    set({
      toast: {
        message,
        type,
        visible: true,
      },
    })

    toastTimer = setTimeout(() => {
      const { toast } = get()
      if (toast) {
        set({ toast: { ...toast, visible: false } })
      }
      toastTimer = null
    }, 3000)
  },

  showModal: (type: string, props: any = {}) => {
    set({ modal: { type, props } })
  },

  hideModal: () => {
    set({ modal: null })
  },

  triggerShake: (duration: number = 200) => {
    if (shakeTimer) {
      clearTimeout(shakeTimer)
      shakeTimer = null
    }

    set({ screenShake: duration })

    const startTime = performance.now()
    const animate = () => {
      const elapsed = performance.now() - startTime
      const remaining = Math.max(0, duration - elapsed)
      set({ screenShake: remaining })

      if (remaining > 0) {
        requestAnimationFrame(animate)
      } else {
        set({ screenShake: 0 })
        shakeTimer = null
      }
    }

    requestAnimationFrame(animate)
  },
}))
