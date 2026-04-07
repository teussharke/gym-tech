'use client'

import { Toaster } from 'react-hot-toast'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ToasterProvider() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: isDark
          ? {
              background: '#14141C',
              color: '#F0F0F8',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }
          : {
              background: '#FFFFFF',
              color: '#0A0A14',
              borderRadius: '14px',
              border: '1px solid rgba(0,0,0,0.09)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
        success: { iconTheme: { primary: '#FF6B00', secondary: isDark ? '#000' : '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  )
}
