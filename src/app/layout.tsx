// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/hooks/useAuth'
import PWARegister from '@/components/PWARegister'
import CookieBanner from '@/components/CookieBanner'
import ToasterProvider from '@/components/ToasterProvider'
import '@/styles/globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'i9 Fitness - Sistema de Gestão',
  description: 'Gerencie sua academia com eficiência.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'i9 Fitness',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)',  color: '#111111' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="i9 Fitness" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="i9 Fitness" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${barlow.variable} ${barlowCondensed.variable} ${barlow.className}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" themes={['light', 'dark']}>
          <AuthProvider>
            {children}
            <ToasterProvider />
            <PWARegister />
            <CookieBanner />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
