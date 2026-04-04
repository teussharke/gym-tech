// src/lib/mock/exercicios.ts

export interface Exercicio {
  id: string
  nome: string
  grupo: string
  equipamento: string
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado'
  gif_url?: string
  youtube_search: string
  youtube_url?: string  // URL direta do YouTube (ex: https://www.youtube.com/watch?v=XXXX)
}

// Extrai o video ID de uma URL do YouTube (watch, youtu.be ou embed)
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
    /youtube\.com\/shorts\/([^?\s]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url)
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1` : null
}

// ── JEFIT CDN ─────────────────────────────────────────────
// GIFs animados gratuitos do JEFIT Exercise Database
// Padrão: https://cdn.jefit.com/assets/img/exercises/gifs/{JEFIT_ID}.gif
const JEFIT = (id: number) => `https://cdn.jefit.com/assets/img/exercises/gifs/${id}.gif`

// Fallback: imagens estáticas do free-exercise-db (caso JEFIT falhe)
const FALLBACK = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises'

// Abre busca do YouTube com o termo do exercício
export function getYouTubeSearchUrl(termo: string): string {
  const query = encodeURIComponent(`como fazer ${termo} academia execução correta`)
  return `https://www.youtube.com/results?search_query=${query}`
}

export const mockExercicios: Exercicio[] = [
  // ── PEITO ──────────────────────────────────────────────
  { id: '1',  nome: 'Supino Reto com Barra',          grupo: 'Peito',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(2),   youtube_search: 'supino reto barra execução' },
  { id: '2',  nome: 'Supino Inclinado com Barra',     grupo: 'Peito',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(5),   youtube_search: 'supino inclinado barra execução' },
  { id: '3',  nome: 'Supino Declinado com Barra',     grupo: 'Peito',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(3),   youtube_search: 'supino declinado barra execução' },
  { id: '4',  nome: 'Supino Reto com Halteres',       grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(26),  youtube_search: 'supino reto halteres execução' },
  { id: '5',  nome: 'Supino Inclinado com Halteres',  grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(31),  youtube_search: 'supino inclinado halteres execução' },
  { id: '6',  nome: 'Crucifixo com Halteres',         grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(27),  youtube_search: 'crucifixo halteres execução' },
  { id: '7',  nome: 'Crucifixo Inclinado',            grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(30),  youtube_search: 'crucifixo inclinado halteres execução' },
  { id: '8',  nome: 'Crossover Polia Alta',           grupo: 'Peito',   equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(73),  youtube_search: 'crossover polia peito execução' },
  { id: '9',  nome: 'Flexão de Braço',                grupo: 'Peito',   equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(232), youtube_search: 'flexão de braço execução correta' },
  { id: '10', nome: 'Peck Deck (Voador)',              grupo: 'Peito',   equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(45),  youtube_search: 'peck deck voador peito execução' },
  { id: '11', nome: 'Mergulho no Paralelo',           grupo: 'Peito',   equipamento: 'Paralelo',   nivel: 'Intermediário', gif_url: JEFIT(177), youtube_search: 'mergulho paralelo peito execução' },
  { id: '12', nome: 'Chest Press na Máquina',         grupo: 'Peito',   equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(44),  youtube_search: 'chest press máquina execução' },

  // ── COSTAS ─────────────────────────────────────────────
  { id: '13', nome: 'Puxada Frontal',                 grupo: 'Costas',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(86),  youtube_search: 'puxada frontal execução correta' },
  { id: '14', nome: 'Puxada Neutra',                  grupo: 'Costas',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(87),  youtube_search: 'puxada neutra execução' },
  { id: '15', nome: 'Remada Curvada com Barra',       grupo: 'Costas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(7),   youtube_search: 'remada curvada barra execução' },
  { id: '16', nome: 'Remada Unilateral com Halter',   grupo: 'Costas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(90),  youtube_search: 'remada unilateral halter execução' },
  { id: '17', nome: 'Remada Baixa na Polia',          grupo: 'Costas',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(21),  youtube_search: 'remada baixa polia execução' },
  { id: '18', nome: 'Pullover com Halter',            grupo: 'Costas',  equipamento: 'Halteres',   nivel: 'Intermediário', gif_url: JEFIT(91),  youtube_search: 'pullover halter execução' },
  { id: '19', nome: 'Barra Fixa (Pull-up)',           grupo: 'Costas',  equipamento: 'Barra Fixa', nivel: 'Avançado',      gif_url: JEFIT(83),  youtube_search: 'barra fixa pullup execução' },
  { id: '20', nome: 'Levantamento Terra',             grupo: 'Costas',  equipamento: 'Barra',      nivel: 'Avançado',      gif_url: JEFIT(9),   youtube_search: 'levantamento terra execução correta' },
  { id: '21', nome: 'Hiperextensão Lombar',           grupo: 'Costas',  equipamento: 'Banco',      nivel: 'Iniciante',     gif_url: JEFIT(239), youtube_search: 'hiperextensão lombar execução' },
  { id: '22', nome: 'Remada Cavalinho',               grupo: 'Costas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(134), youtube_search: 'remada cavalinho máquina execução' },

  // ── PERNAS ─────────────────────────────────────────────
  { id: '23', nome: 'Agachamento Livre',              grupo: 'Pernas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(12),  youtube_search: 'agachamento livre barra execução' },
  { id: '24', nome: 'Agachamento Sumô',               grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(58),  youtube_search: 'agachamento sumo execução' },
  { id: '25', nome: 'Leg Press 45°',                  grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(132), youtube_search: 'leg press 45 execução' },
  { id: '26', nome: 'Cadeira Extensora',              grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(130), youtube_search: 'cadeira extensora execução' },
  { id: '27', nome: 'Mesa Flexora',                   grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(131), youtube_search: 'mesa flexora execução' },
  { id: '28', nome: 'Stiff com Barra',                grupo: 'Pernas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(11),  youtube_search: 'stiff barra execução' },
  { id: '29', nome: 'Stiff com Halteres',             grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(56),  youtube_search: 'stiff halteres execução' },
  { id: '30', nome: 'Avanço com Halteres',            grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(55),  youtube_search: 'avanço afundo halteres execução' },
  { id: '31', nome: 'Avanço com Barra',               grupo: 'Pernas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(10),  youtube_search: 'avanço barra execução' },
  { id: '32', nome: 'Agachamento Búlgaro',            grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Avançado',      gif_url: JEFIT(742), youtube_search: 'agachamento bulgaro execução' },
  { id: '33', nome: 'Panturrilha em Pé',              grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(136), youtube_search: 'panturrilha em pé execução' },
  { id: '34', nome: 'Panturrilha Sentado',            grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(135), youtube_search: 'panturrilha sentado execução' },
  { id: '35', nome: 'Cadeira Adutora',                grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(138), youtube_search: 'cadeira adutora execução' },
  { id: '36', nome: 'Cadeira Abdutora',               grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: JEFIT(137), youtube_search: 'cadeira abdutora execução' },

  // ── OMBRO ──────────────────────────────────────────────
  { id: '37', nome: 'Desenvolvimento com Barra',      grupo: 'Ombro',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(15),  youtube_search: 'desenvolvimento ombro barra execução' },
  { id: '38', nome: 'Desenvolvimento com Halteres',   grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(48),  youtube_search: 'desenvolvimento halteres ombro execução' },
  { id: '39', nome: 'Desenvolvimento Arnold',         grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Intermediário', gif_url: JEFIT(46),  youtube_search: 'arnold press execução' },
  { id: '40', nome: 'Elevação Lateral',               grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(32),  youtube_search: 'elevação lateral halteres execução' },
  { id: '41', nome: 'Elevação Lateral na Polia',      grupo: 'Ombro',   equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(75),  youtube_search: 'elevação lateral polia execução' },
  { id: '42', nome: 'Elevação Frontal',               grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(33),  youtube_search: 'elevação frontal ombro execução' },
  { id: '43', nome: 'Remada Alta com Barra',          grupo: 'Ombro',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(16),  youtube_search: 'remada alta barra ombro execução' },
  { id: '44', nome: 'Encolhimento de Ombros',         grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(35),  youtube_search: 'encolhimento ombros execução' },
  { id: '45', nome: 'Face Pull',                      grupo: 'Ombro',   equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(874), youtube_search: 'face pull execução' },
  { id: '46', nome: 'Pássaro (Crucifixo Invertido)',  grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(34),  youtube_search: 'pássaro crucifixo invertido execução' },

  // ── BÍCEPS ─────────────────────────────────────────────
  { id: '47', nome: 'Rosca Direta com Barra',         grupo: 'Bíceps',  equipamento: 'Barra',      nivel: 'Iniciante',     gif_url: JEFIT(17),  youtube_search: 'rosca direta barra execução' },
  { id: '48', nome: 'Rosca Alternada',                grupo: 'Bíceps',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(116), youtube_search: 'rosca alternada halteres execução' },
  { id: '49', nome: 'Rosca Concentrada',              grupo: 'Bíceps',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(117), youtube_search: 'rosca concentrada execução' },
  { id: '50', nome: 'Rosca Martelo',                  grupo: 'Bíceps',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(119), youtube_search: 'rosca martelo execução' },
  { id: '51', nome: 'Rosca Scott com Barra',          grupo: 'Bíceps',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(18),  youtube_search: 'rosca scott barra execução' },
  { id: '52', nome: 'Rosca na Polia Baixa',           grupo: 'Bíceps',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(72),  youtube_search: 'rosca polia baixa execução' },
  { id: '53', nome: 'Rosca 21',                       grupo: 'Bíceps',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(17),  youtube_search: 'rosca 21 bíceps execução' },

  // ── TRÍCEPS ────────────────────────────────────────────
  { id: '54', nome: 'Tríceps Pulley Barra Reta',      grupo: 'Tríceps', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(158), youtube_search: 'tríceps pulley barra reta execução' },
  { id: '55', nome: 'Tríceps Pulley Corda',           grupo: 'Tríceps', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(159), youtube_search: 'tríceps pulley corda execução' },
  { id: '56', nome: 'Tríceps Francês com Barra',      grupo: 'Tríceps', equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(20),  youtube_search: 'tríceps francês barra execução' },
  { id: '57', nome: 'Tríceps Francês com Halter',     grupo: 'Tríceps', equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(152), youtube_search: 'tríceps francês halter execução' },
  { id: '58', nome: 'Tríceps Coice',                  grupo: 'Tríceps', equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: JEFIT(153), youtube_search: 'tríceps coice halter execução' },
  { id: '59', nome: 'Mergulho no Banco',              grupo: 'Tríceps', equipamento: 'Banco',      nivel: 'Iniciante',     gif_url: JEFIT(178), youtube_search: 'mergulho banco tríceps execução' },
  { id: '60', nome: 'Supino Fechado',                 grupo: 'Tríceps', equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(4),   youtube_search: 'supino fechado tríceps execução' },

  // ── ABDÔMEN ────────────────────────────────────────────
  { id: '61', nome: 'Abdominal Crunch',               grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(216), youtube_search: 'abdominal crunch execução' },
  { id: '62', nome: 'Elevação de Pernas',             grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(218), youtube_search: 'elevação de pernas abdominal execução' },
  { id: '63', nome: 'Prancha Frontal',                grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(228), youtube_search: 'prancha abdominal execução' },
  { id: '64', nome: 'Prancha Lateral',                grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(229), youtube_search: 'prancha lateral execução' },
  { id: '65', nome: 'Abdominal na Polia',             grupo: 'Abdômen', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(76),  youtube_search: 'abdominal polia execução' },
  { id: '66', nome: 'Elevação de Pernas na Barra',    grupo: 'Abdômen', equipamento: 'Barra Fixa', nivel: 'Intermediário', gif_url: JEFIT(220), youtube_search: 'elevação pernas barra fixa execução' },
  { id: '67', nome: 'Russian Twist',                  grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(226), youtube_search: 'russian twist execução' },
  { id: '68', nome: 'Abdominal Bicicleta',            grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(215), youtube_search: 'abdominal bicicleta execução' },
  { id: '69', nome: 'Mountain Climber',               grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(249), youtube_search: 'mountain climber exercício execução' },
  { id: '70', nome: 'Dead Bug',                       grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(913), youtube_search: 'dead bug exercício abdominal execução' },

  // ── CARDIO ─────────────────────────────────────────────
  { id: '71', nome: 'Burpee',                         grupo: 'Cardio',  equipamento: 'Solo',       nivel: 'Intermediário', gif_url: JEFIT(241), youtube_search: 'burpee execução como fazer' },
  { id: '72', nome: 'Jumping Jack',                   grupo: 'Cardio',  equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(244), youtube_search: 'jumping jack exercício execução' },
  { id: '73', nome: 'Corda (Jump Rope)',              grupo: 'Cardio',  equipamento: 'Corda',      nivel: 'Iniciante',     gif_url: JEFIT(245), youtube_search: 'pular corda corretamente' },
  { id: '74', nome: 'Esteira',                        grupo: 'Cardio',  equipamento: 'Esteira',    nivel: 'Iniciante',     gif_url: JEFIT(322), youtube_search: 'treino esteira iniciante' },
  { id: '75', nome: 'Bicicleta Ergométrica',          grupo: 'Cardio',  equipamento: 'Bicicleta',  nivel: 'Iniciante',     gif_url: JEFIT(316), youtube_search: 'bicicleta ergométrica posição correta' },
  { id: '76', nome: 'Remo Ergométrico',               grupo: 'Cardio',  equipamento: 'Remo',       nivel: 'Intermediário', gif_url: JEFIT(319), youtube_search: 'remo ergométrico execução' },

  // ── GLÚTEOS ────────────────────────────────────────────
  { id: '77', nome: 'Hip Thrust com Barra',           grupo: 'Glúteos', equipamento: 'Barra',      nivel: 'Intermediário', gif_url: JEFIT(815), youtube_search: 'hip thrust barra execução' },
  { id: '78', nome: 'Elevação Pélvica',               grupo: 'Glúteos', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(206), youtube_search: 'elevação pélvica glúteo execução' },
  { id: '79', nome: 'Glúteo na Polia',                grupo: 'Glúteos', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(78),  youtube_search: 'glúteo polia execução' },
  { id: '80', nome: 'Coice de Glúteo',                grupo: 'Glúteos', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: JEFIT(204), youtube_search: 'coice glúteo execução' },
  { id: '81', nome: 'Abdução de Quadril em Pé',       grupo: 'Glúteos', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: JEFIT(79),  youtube_search: 'abdução quadril polia execução' },
]

export const gruposMusculares = [
  'Todos', 'Peito', 'Costas', 'Pernas', 'Ombro',
  'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Glúteos',
]

export const grupoColors: Record<string, string> = {
  'Peito':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Costas':   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pernas':   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Ombro':    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Bíceps':   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Tríceps':  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Abdômen':  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Cardio':   'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Glúteos':  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export const nivelColors: Record<string, string> = {
  'Iniciante':     'badge-success',
  'Intermediário': 'badge-warning',
  'Avançado':      'badge-danger',
}
