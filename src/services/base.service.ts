import { getItem, setItem, generateId, getNow } from './storage'

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface DataService<T extends BaseEntity> {
  getAll(filters?: Record<string, unknown>): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}

export class LocalStorageService<T extends BaseEntity> implements DataService<T> {
  protected collectionKey: string

  constructor(collectionKey: string) {
    this.collectionKey = collectionKey
  }

  async getAll(filters?: Record<string, unknown>): Promise<T[]> {
    const items = getItem<T[]>(this.collectionKey) || []

    if (!filters) return items

    return items.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true
        const itemValue = (item as Record<string, unknown>)[key]
        if (typeof value === 'string' && typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase())
        }
        return itemValue === value
      })
    })
  }

  async getById(id: string): Promise<T | null> {
    const items = getItem<T[]>(this.collectionKey) || []
    return items.find((item) => item.id === id) || null
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = getItem<T[]>(this.collectionKey) || []
    const now = getNow()
    const newItem = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    } as T

    items.push(newItem)
    setItem(this.collectionKey, items)
    return newItem
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const items = getItem<T[]>(this.collectionKey) || []
    const index = items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Item with id ${id} not found in ${this.collectionKey}`)
    }

    items[index] = {
      ...items[index],
      ...data,
      id,
      updatedAt: getNow(),
    }

    setItem(this.collectionKey, items)
    return items[index]
  }

  async delete(id: string): Promise<void> {
    const items = getItem<T[]>(this.collectionKey) || []
    const filtered = items.filter((item) => item.id !== id)
    setItem(this.collectionKey, filtered)
  }

  async count(filters?: Record<string, unknown>): Promise<number> {
    const items = await this.getAll(filters)
    return items.length
  }

  async clear(): Promise<void> {
    setItem(this.collectionKey, [])
  }
}
