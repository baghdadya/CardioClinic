import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeLayout = 'classic' | 'modern'

interface ThemeState {
  layout: ThemeLayout
  setLayout: (layout: ThemeLayout) => void
  toggleLayout: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      layout: 'modern',
      setLayout: (layout) => set({ layout }),
      toggleLayout: () =>
        set((state) => ({
          layout: state.layout === 'classic' ? 'modern' : 'classic',
        })),
    }),
    {
      name: 'cardioclinic-theme-layout',
    }
  )
)

export type { ThemeLayout }
