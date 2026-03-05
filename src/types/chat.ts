export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  isLoading?: boolean
  relatedData?: {
    type: 'record' | 'product' | 'report' | 'tax'
    items: unknown[]
    summary?: string
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface QuickPrompt {
  id: string
  icon: string
  label: string
  prompt: string
}
