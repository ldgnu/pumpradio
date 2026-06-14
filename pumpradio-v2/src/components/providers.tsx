'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          richColors
          toastOptions={{
            style: {
              background: 'rgba(18, 18, 30, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 34, 0, 0.2)',
              color: '#e0e0e0',
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  )
}
