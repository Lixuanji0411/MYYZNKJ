import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, ChatSession } from '@/types/chat'
import { aiChatService } from '@/services/ai-chat.service'
import { generateId, getNow } from '@/services/storage'

interface ChatStore {
  sessions: ChatSession[]
  currentSessionId: string | null
  isTyping: boolean

  getCurrentSession: () => ChatSession | null
  createSession: () => string
  deleteSession: (id: string) => void
  setCurrentSession: (id: string) => void
  sendMessage: (content: string) => Promise<void>
  clearCurrentSession: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isTyping: false,

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get()
        return sessions.find((s) => s.id === currentSessionId) || null
      },

      createSession: () => {
        const now = getNow()
        const newSession: ChatSession = {
          id: generateId(),
          title: '新对话',
          messages: [],
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
        }))
        return newSession.id
      },

      deleteSession: (id: string) => {
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== id)
          const currentSessionId =
            state.currentSessionId === id
              ? sessions[0]?.id || null
              : state.currentSessionId
          return { sessions, currentSessionId }
        })
      },

      setCurrentSession: (id: string) => {
        set({ currentSessionId: id })
      },

      sendMessage: async (content: string) => {
        const { currentSessionId } = get()
        let sessionId = currentSessionId

        if (!sessionId) {
          sessionId = get().createSession()
        }

        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: getNow(),
        }

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, userMessage],
                  title: s.messages.length === 0 ? content.slice(0, 20) : s.title,
                  updatedAt: getNow(),
                }
              : s
          ),
          isTyping: true,
        }))

        try {
          const currentSession = get().sessions.find((s) => s.id === sessionId)
          const history = currentSession?.messages || []
          const reply = await aiChatService.sendMessage(content, history)

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: [...s.messages, reply],
                    updatedAt: getNow(),
                  }
                : s
            ),
            isTyping: false,
          }))
        } catch {
          const errorMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: '抱歉，处理您的请求时出现了问题，请稍后重试。',
            timestamp: getNow(),
          }

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, messages: [...s.messages, errorMessage], updatedAt: getNow() }
                : s
            ),
            isTyping: false,
          }))
        }
      },

      clearCurrentSession: () => {
        const { currentSessionId } = get()
        if (!currentSessionId) return

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: [], updatedAt: getNow() }
              : s
          ),
        }))
      },
    }),
    {
      name: 'znjz_chat',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
)
