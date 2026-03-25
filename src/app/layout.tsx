// src/app/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/hooks/useAuth'
import PWARegister from '@/components/PWARegister'
import { SplashScreen, PWAInstallBanner } from '@/components/UIComponents'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Mostra splash só se for PWA instalada (standalone) ou primeiro acesso do dia
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    const lastSplash = localStorage.getItem('last-splash')
    const today = new Date().toDateString()

    if (isPWA && lastSplash !== today) {
      setShowSplash(true)
      localStorage.setItem('last-splash', today)
    }
  }, [])

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>i9 Fitness - Sistema de Gestão</title>
        <meta name="description" content="Gerencie sua academia com eficiência." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="i9 Fitness" />
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {/* Splash screen — aparece ao abrir o PWA */}
            {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

            {children}

            {/* Banner de instalação PWA */}
            <PWAInstallBanner />

            {/* Toasts */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                },
                success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            <PWARegister />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
