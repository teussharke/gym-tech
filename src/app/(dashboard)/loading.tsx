'use client'

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-[3px] border-transparent animate-spin"
          style={{
            borderTopColor: 'var(--neon)',
            boxShadow: '0 0 20px var(--neon-glow)',
          }}
        />
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Carregando...
        </p>
      </div>
    </div>
  )
}
