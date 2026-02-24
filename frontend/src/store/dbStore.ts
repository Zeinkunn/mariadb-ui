import { create } from 'zustand'

interface DbState {
    selectedDb: string | null
    selectedTable: string | null
    activeTab: 'data' | 'structure' | 'query' | 'users' | 'server' | 'importexport'
    sidebarOpen: boolean
    queryHistory: string[]
    setSelectedDb: (db: string | null) => void
    setSelectedTable: (tbl: string | null) => void
    setActiveTab: (tab: DbState['activeTab']) => void
    setSidebarOpen: (open: boolean) => void
    addToHistory: (sql: string) => void
    clearHistory: () => void
}

export const useDbStore = create<DbState>((set) => ({
    selectedDb: null,
    selectedTable: null,
    activeTab: 'query',
    sidebarOpen: true,
    queryHistory: JSON.parse(localStorage.getItem('query-history') || '[]'),
    setSelectedDb: (db) => set({ selectedDb: db, selectedTable: null }),
    setSelectedTable: (tbl) => set({ selectedTable: tbl, activeTab: 'data' }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    addToHistory: (sql) =>
        set((s) => {
            const next = [sql, ...s.queryHistory.filter((q) => q !== sql)].slice(0, 50)
            localStorage.setItem('query-history', JSON.stringify(next))
            return { queryHistory: next }
        }),
    clearHistory: () => {
        localStorage.removeItem('query-history')
        set({ queryHistory: [] })
    },
}))
