import { create } from 'zustand'

interface ThemeState {
    dark: boolean
    toggle: () => void
}

const initDark = localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)

if (initDark) document.documentElement.classList.add('dark')

export const useThemeStore = create<ThemeState>((set) => ({
    dark: initDark,
    toggle: () =>
        set((s) => {
            const next = !s.dark
            document.documentElement.classList.toggle('dark', next)
            localStorage.setItem('theme', next ? 'dark' : 'light')
            return { dark: next }
        }),
}))
