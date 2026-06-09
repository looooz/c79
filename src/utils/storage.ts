const PREFIX = 'screw_game_'

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    console.warn('Failed to save to localStorage')
  }
}

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

export const clearAllStorage = (): void => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
