'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, Youtube, Play, X, ExternalLink } from 'lucide-react'
import { mockExercicios, gruposMusculares, grupoColors, nivelColors, getYouTubeSearchUrl, extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/mock/exercicios'

const levels = ['Todos', 'Iniciante', 'Intermediário', 'Avançado']

// ── Player YouTube em modal ──────────────────────────────────
function YouTubePlayerModal({ url, nome, onClose }: { url: string; nome: string; onClose: () => void }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-lg">{nome}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full rounded-xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            title={nome}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

// ── Card do exercício ────────────────────────────────────────
function ExercicioCard({ exercicio, onPlay }: {
  exercicio: typeof mockExercicios[0]
  onPlay: (ex: typeof mockExercicios[0]) => void
}) {
  const [imgError, setImgError] = useState(false)
  const hasVideo = !!exercicio.youtube_url && !!extractYouTubeId(exercicio.youtube_url)
  const hasGif = !!exercicio.gif_url && !imgError
  const searchUrl = getYouTubeSearchUrl(exercicio.youtube_search)

  return (
    <div className="card-hover overflow-hidden group">
      {/* Foto sempre visível + overlay de vídeo/busca */}
      <div className="bg-gray-100 dark:bg-gray-700 h-36 relative overflow-hidden">
        {/* Camada de foto — gif/jpg do exercício */}
        {hasGif ? (
          <img
            src={exercicio.gif_url!}
            alt={exercicio.nome}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <Dumbbell className="w-10 h-10 text-gray-300 dark:text-gray-500" />
            <p className="text-xs text-gray-400">Sem foto</p>
          </div>
        )}

        {/* Gradient bottom */}
        {hasGif && <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />}

        {/* Badge vídeo e botão play quando tem YouTube URL */}
        {hasVideo && (
          <>
            <div className="absolute top-2 right-2">
              <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow">
                <Youtube className="w-3 h-3" /> Vídeo
              </span>
            </div>
            <button
              onClick={() => onPlay(exercicio)}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              title="Assistir vídeo"
            >
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </button>
          </>
        )}

        {/* Botão busca YouTube quando NÃO tem vídeo cadastrado */}
        {!hasVideo && (
          <a
            href={searchUrl}
            target="_blank" rel="noopener noreferrer"
            className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 shadow"
            title="Buscar no YouTube"
          >
            <Youtube className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Hover overlay com ações */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {hasVideo && (
            <button
              onClick={() => onPlay(exercicio)}
              className="bg-red-600/90 hover:bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" fill="white" /> Ver vídeo
            </button>
          )}
          {!hasVideo && (
            <a
              href={getYouTubeSearchUrl(exercicio.youtube_search)}
              target="_blank" rel="noopener noreferrer"
              className="bg-red-600/90 hover:bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
            >
              <Youtube className="w-3.5 h-3.5" /> YouTube
            </a>
          )}
          <button className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm">
            <Edit className="w-3.5 h-3.5" /> Editar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
          {exercicio.nome}
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${grupoColors[exercicio.grupo] ?? 'badge-gray'}`}>
            {exercicio.grupo}
          </span>
          <span className={`${nivelColors[exercicio.nivel]} text-xs`}>
            {exercicio.nivel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Dumbbell className="w-3 h-3" />
            {exercicio.equipamento}
          </p>
          {!hasVideo && (
            <a
              href={getYouTubeSearchUrl(exercicio.youtube_search)}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-medium"
              title="Buscar vídeo no YouTube"
            >
              <Youtube className="w-3.5 h-3.5" />
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Formulário Novo Exercício ─────────────────────────────────
function NovoExercicioModal({ onClose }: { onClose: () => void }) {
  const [youtubeInput, setYoutubeInput] = useState('')
  const previewId = youtubeInput ? extractYouTubeId(youtubeInput) : null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Novo Exercício</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label-base">Nome do exercício *</label>
            <input type="text" className="input-base" placeholder="Ex: Supino Reto com Barra" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Grupo muscular *</label>
              <select className="input-base">
                {gruposMusculares.filter(g => g !== 'Todos').map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Nível *</label>
              <select className="input-base">
                <option>Iniciante</option>
                <option>Intermediário</option>
                <option>Avançado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Equipamento</label>
            <input type="text" className="input-base" placeholder="Ex: Barra, Halteres, Máquina" />
          </div>

          <div>
            <label className="label-base">Descrição</label>
            <textarea className="input-base resize-none" rows={3} placeholder="Descrição do exercício e dicas de execução..." />
          </div>

          {/* Campo YouTube URL */}
          <div>
            <label className="label-base flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              URL do Vídeo no YouTube
            </label>
            <input
              type="url"
              className="input-base"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeInput}
              onChange={e => setYoutubeInput(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Cole a URL do vídeo que demonstra a execução correta.</p>
          </div>

          {/* Preview do vídeo */}
          {previewId && (
            <div>
              <p className="label-base mb-2">Preview do vídeo</p>
              <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${previewId}?rel=0&modestbranding=1`}
                  title="Preview"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {youtubeInput && !previewId && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              URL inválida. Use o formato: https://www.youtube.com/watch?v=XXXXXX
            </p>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button className="btn-primary flex-1">Salvar Exercício</button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function ExerciciosPage() {
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Todos')
  const [selectedLevel, setSelectedLevel] = useState('Todos')
  const [showForm, setShowForm] = useState(false)
  const [playingEx, setPlayingEx] = useState<typeof mockExercicios[0] | null>(null)

  const filtered = mockExercicios.filter(e => {
    const matchSearch =
      e.nome.toLowerCase().includes(search.toLowerCase()) ||
      e.equipamento.toLowerCase().includes(search.toLowerCase()) ||
      e.grupo.toLowerCase().includes(search.toLowerCase())
    const matchGroup = selectedGroup === 'Todos' || e.grupo === selectedGroup
    const matchLevel = selectedLevel === 'Todos' || e.nivel === selectedLevel
    return matchSearch && matchGroup && matchLevel
  })

  const comVideo = mockExercicios.filter(e => e.youtube_url).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exercícios</h1>
          <p className="page-subtitle">
            {mockExercicios.length} exercícios
            {comVideo > 0 && <span className="text-red-500 font-medium"> · {comVideo} com vídeo</span>}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Exercício</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="card-base p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar exercício, grupo ou equipamento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {gruposMusculares.map(g => (
            <button key={g} onClick={() => setSelectedGroup(g)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedGroup === g ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {levels.map(l => (
            <button key={l} onClick={() => setSelectedLevel(l)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedLevel === l ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} exercício{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(e => (
          <ExercicioCard key={e.id} exercicio={e} onPlay={setPlayingEx} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card-base p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum exercício encontrado</p>
        </div>
      )}

      {/* Modal player YouTube */}
      {playingEx?.youtube_url && (
        <YouTubePlayerModal
          url={playingEx.youtube_url}
          nome={playingEx.nome}
          onClose={() => setPlayingEx(null)}
        />
      )}

      {/* Modal novo exercício */}
      {showForm && <NovoExercicioModal onClose={() => setShowForm(false)} />}
    </div>
  )
}
