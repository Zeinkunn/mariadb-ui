import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConnectionConfig {
    host: string
    port: string
    user: string
    password: string
}

interface ConnectionState {
    connected: boolean
    config: ConnectionConfig | null
    version: string
    currentUser: string
    setConnected: (connected: boolean, config?: ConnectionConfig, version?: string, currentUser?: string) => void
    disconnect: () => void
}

export const useConnectionStore = create<ConnectionState>()(
    persist(
        (set) => ({
            connected: false,
            config: null,
            version: '',
            currentUser: '',
            setConnected: (connected, config, version = '', currentUser = '') =>
                set({ connected, config: config ?? null, version, currentUser }),
            disconnect: () => set({ connected: false, config: null, version: '', currentUser: '' }),
        }),
        {
            name: 'mariadb-connection',
            partialize: (s) => ({ config: s.config }),
        }
    )
)
