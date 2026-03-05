const STORAGE_PREFIX = 'znjz_'

export function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getStorageKey(key))
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error)
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(getStorageKey(key))
}

export function getAllByPrefix<T>(prefix: string): T[] {
  const fullPrefix = getStorageKey(prefix)
  const results: T[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(fullPrefix)) {
      try {
        const value = localStorage.getItem(key)
        if (value) results.push(JSON.parse(value) as T)
      } catch {
        // skip malformed items
      }
    }
  }

  return results
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function getNow(): string {
  return new Date().toISOString()
}
