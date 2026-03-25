'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <span className="text-4xl">💪</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Você está offline</h1>
          <p className="text-gray-400 text-sm">
            Verifique sua conexão com a internet e tente novamente.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 rounded-xl transition-colors active:scale-95"
        >
          Tentar novamente
        </button>
        <p className="text-gray-500 text-xs">GymFlow — Sistema de Gestão de Academia</p>
      </div>
    </div>
  )
}
