// src/lib/mock/exercicios.ts
// GIFs: free-exercise-db (github.com/yuhonas/free-exercise-db)
// Fallback: YouTube embed quando não há GIF

export interface Exercicio {
  id: string
  nome: string
  grupo: string
  equipamento: string
  nivel: 'Iniciante' | 'Intermediário' | 'Avançado'
  gif_url?: string
  youtube_search: string // termo de busca para embed do YouTube
}

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

// YouTube embed: https://www.youtube.com/embed?listType=search&list=TERMO
// Abre o primeiro vídeo da busca — gratuito, sem chave de API
export function getYouTubeSearchUrl(termo: string): string {
  const query = encodeURIComponent(`como fazer ${termo} academia`)
  return `https://www.youtube.com/results?search_query=${query}`
}

export const mockExercicios: Exercicio[] = [
  // ── PEITO ──────────────────────────────────────────────
  { id: '1',  nome: 'Supino Reto com Barra',          grupo: 'Peito',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,                    youtube_search: 'supino reto barra execução' },
  { id: '2',  nome: 'Supino Inclinado com Barra',     grupo: 'Peito',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,            youtube_search: 'supino inclinado barra execução' },
  { id: '3',  nome: 'Supino Declinado com Barra',     grupo: 'Peito',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Decline_Bench_Press/0.jpg`,                          youtube_search: 'supino declinado barra execução' },
  { id: '4',  nome: 'Supino Reto com Halteres',       grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Bench_Press/0.jpg`,                                 youtube_search: 'supino reto halteres execução' },
  { id: '5',  nome: 'Supino Inclinado com Halteres',  grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Incline_Bench_Press/0.jpg`,                         youtube_search: 'supino inclinado halteres execução' },
  { id: '6',  nome: 'Crucifixo com Halteres',         grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Flyes/0.jpg`,                                       youtube_search: 'crucifixo halteres execução' },
  { id: '7',  nome: 'Crucifixo Inclinado',            grupo: 'Peito',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Incline_Flyes/0.jpg`,                               youtube_search: 'crucifixo inclinado halteres execução' },
  { id: '8',  nome: 'Crossover Polia Alta',           grupo: 'Peito',   equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Crossover/0.jpg`,                                      youtube_search: 'crossover polia peito execução' },
  { id: '9',  nome: 'Flexão de Braço',                grupo: 'Peito',   equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Push-up/0.jpg`,                                              youtube_search: 'flexão de braço execução correta' },
  { id: '10', nome: 'Peck Deck (Voador)',              grupo: 'Peito',   equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Pec_Deck_Fly/0.jpg`,                                         youtube_search: 'peck deck voador peito execução' },
  { id: '11', nome: 'Mergulho no Paralelo',           grupo: 'Peito',   equipamento: 'Paralelo',   nivel: 'Intermediário', gif_url: `${BASE}/Dips_-_Chest_Version/0.jpg`,                                 youtube_search: 'mergulho paralelo peito execução' },
  { id: '12', nome: 'Chest Press na Máquina',         grupo: 'Peito',   equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Chest_Press/0.jpg`,                                    youtube_search: 'chest press máquina execução' },

  // ── COSTAS ─────────────────────────────────────────────
  { id: '13', nome: 'Puxada Frontal',                 grupo: 'Costas',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Pull_Down/0.jpg`,                                      youtube_search: 'puxada frontal execução correta' },
  { id: '14', nome: 'Puxada Neutra',                  grupo: 'Costas',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Close_Grip_Pull_Down/0.jpg`,                           youtube_search: 'puxada neutra execução' },
  { id: '15', nome: 'Remada Curvada com Barra',       grupo: 'Costas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Bent_Over_Row/0.jpg`,                                youtube_search: 'remada curvada barra execução' },
  { id: '16', nome: 'Remada Unilateral com Halter',   grupo: 'Costas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_One_Arm_Row/0.jpg`,                                 youtube_search: 'remada unilateral halter execução' },
  { id: '17', nome: 'Remada Baixa na Polia',          grupo: 'Costas',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Seated_Row/0.jpg`,                                     youtube_search: 'remada baixa polia execução' },
  { id: '18', nome: 'Pullover com Halter',            grupo: 'Costas',  equipamento: 'Halteres',   nivel: 'Intermediário', gif_url: `${BASE}/Dumbbell_Pullover/0.jpg`,                                    youtube_search: 'pullover halter execução' },
  { id: '19', nome: 'Barra Fixa (Pull-up)',           grupo: 'Costas',  equipamento: 'Barra Fixa', nivel: 'Avançado',      gif_url: `${BASE}/Pull-up/0.jpg`,                                              youtube_search: 'barra fixa pullup execução' },
  { id: '20', nome: 'Levantamento Terra',             grupo: 'Costas',  equipamento: 'Barra',      nivel: 'Avançado',      gif_url: `${BASE}/Barbell_Deadlift/0.jpg`,                                     youtube_search: 'levantamento terra execução correta' },
  { id: '21', nome: 'Hiperextensão Lombar',           grupo: 'Costas',  equipamento: 'Banco',      nivel: 'Iniciante',     gif_url: `${BASE}/Hyperextension/0.jpg`,                                       youtube_search: 'hiperextensão lombar execução' },
  { id: '22', nome: 'Remada Cavalinho',               grupo: 'Costas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Seated_Row/0.jpg`,                                     youtube_search: 'remada cavalinho máquina execução' },

  // ── PERNAS ─────────────────────────────────────────────
  { id: '23', nome: 'Agachamento Livre',              grupo: 'Pernas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Full_Squat/0.jpg`,                                   youtube_search: 'agachamento livre barra execução' },
  { id: '24', nome: 'Agachamento Sumô',               grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Sumo_Squat/0.jpg`,                                  youtube_search: 'agachamento sumo execução' },
  { id: '25', nome: 'Leg Press 45°',                  grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Leg_Press/0.jpg`,                                            youtube_search: 'leg press 45 execução' },
  { id: '26', nome: 'Cadeira Extensora',              grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Leg_Extension/0.jpg`,                                  youtube_search: 'cadeira extensora execução' },
  { id: '27', nome: 'Mesa Flexora',                   grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Lying_Leg_Curl/0.jpg`,                                 youtube_search: 'mesa flexora execução' },
  { id: '28', nome: 'Stiff com Barra',                grupo: 'Pernas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Romanian_Deadlift/0.jpg`,                            youtube_search: 'stiff barra execução' },
  { id: '29', nome: 'Stiff com Halteres',             grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Romanian_Deadlift/0.jpg`,                           youtube_search: 'stiff halteres execução' },
  { id: '30', nome: 'Avanço com Halteres',            grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Lunge/0.jpg`,                                       youtube_search: 'avanço afundo halteres execução' },
  { id: '31', nome: 'Avanço com Barra',               grupo: 'Pernas',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Lunge/0.jpg`,                                        youtube_search: 'avanço barra execução' },
  { id: '32', nome: 'Agachamento Búlgaro',            grupo: 'Pernas',  equipamento: 'Halteres',   nivel: 'Avançado',      gif_url: `${BASE}/Dumbbell_Bulgarian_Split_Squat/0.jpg`,                       youtube_search: 'agachamento bulgaro execução' },
  { id: '33', nome: 'Panturrilha em Pé',              grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Standing_Calf_Raise/0.jpg`,                            youtube_search: 'panturrilha em pé execução' },
  { id: '34', nome: 'Panturrilha Sentado',            grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Seated_Calf_Raise/0.jpg`,                              youtube_search: 'panturrilha sentado execução' },
  { id: '35', nome: 'Cadeira Adutora',                grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Seated_Hip_Adduction/0.jpg`,                           youtube_search: 'cadeira adutora execução' },
  { id: '36', nome: 'Cadeira Abdutora',               grupo: 'Pernas',  equipamento: 'Máquina',    nivel: 'Iniciante',     gif_url: `${BASE}/Lever_Seated_Hip_Abduction/0.jpg`,                           youtube_search: 'cadeira abdutora execução' },

  // ── OMBRO ──────────────────────────────────────────────
  { id: '37', nome: 'Desenvolvimento com Barra',      grupo: 'Ombro',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Seated_Behind_Head_Military_Press/0.jpg`,            youtube_search: 'desenvolvimento ombro barra execução' },
  { id: '38', nome: 'Desenvolvimento com Halteres',   grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Shoulder_Press/0.jpg`,                              youtube_search: 'desenvolvimento halteres ombro execução' },
  { id: '39', nome: 'Desenvolvimento Arnold',         grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Intermediário', gif_url: `${BASE}/Dumbbell_Arnold_Press/0.jpg`,                                youtube_search: 'arnold press execução' },
  { id: '40', nome: 'Elevação Lateral',               grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Lateral_Raise/0.jpg`,                               youtube_search: 'elevação lateral halteres execução' },
  { id: '41', nome: 'Elevação Lateral na Polia',      grupo: 'Ombro',   equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Lateral_Raise/0.jpg`,                                  youtube_search: 'elevação lateral polia execução' },
  { id: '42', nome: 'Elevação Frontal',               grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Front_Raise/0.jpg`,                                 youtube_search: 'elevação frontal ombro execução' },
  { id: '43', nome: 'Remada Alta com Barra',          grupo: 'Ombro',   equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Upright_Row/0.jpg`,                                  youtube_search: 'remada alta barra ombro execução' },
  { id: '44', nome: 'Encolhimento de Ombros',         grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Shrug/0.jpg`,                                       youtube_search: 'encolhimento ombros execução' },
  { id: '45', nome: 'Face Pull',                      grupo: 'Ombro',   equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Face_Pull/0.jpg`,                                      youtube_search: 'face pull execução' },
  { id: '46', nome: 'Pássaro (Crucifixo Invertido)',  grupo: 'Ombro',   equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Bent_Over_Lateral_Raise/0.jpg`,                     youtube_search: 'pássaro crucifixo invertido execução' },

  // ── BÍCEPS ─────────────────────────────────────────────
  { id: '47', nome: 'Rosca Direta com Barra',         grupo: 'Bíceps',  equipamento: 'Barra',      nivel: 'Iniciante',     gif_url: `${BASE}/Barbell_Curl/0.jpg`,                                         youtube_search: 'rosca direta barra execução' },
  { id: '48', nome: 'Rosca Alternada',                grupo: 'Bíceps',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Alternate_Bicep_Curl/0.jpg`,                        youtube_search: 'rosca alternada halteres execução' },
  { id: '49', nome: 'Rosca Concentrada',              grupo: 'Bíceps',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Concentration_Curl/0.jpg`,                          youtube_search: 'rosca concentrada execução' },
  { id: '50', nome: 'Rosca Martelo',                  grupo: 'Bíceps',  equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Hammer_Curl/0.jpg`,                                 youtube_search: 'rosca martelo execução' },
  { id: '51', nome: 'Rosca Scott com Barra',          grupo: 'Bíceps',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Preacher_Curl/0.jpg`,                                youtube_search: 'rosca scott barra execução' },
  { id: '52', nome: 'Rosca na Polia Baixa',           grupo: 'Bíceps',  equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Curl/0.jpg`,                                           youtube_search: 'rosca polia baixa execução' },
  { id: '53', nome: 'Rosca 21',                       grupo: 'Bíceps',  equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Curl/0.jpg`,                                         youtube_search: 'rosca 21 bíceps execução' },

  // ── TRÍCEPS ────────────────────────────────────────────
  { id: '54', nome: 'Tríceps Pulley Barra Reta',      grupo: 'Tríceps', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Pushdown/0.jpg`,                                       youtube_search: 'tríceps pulley barra reta execução' },
  { id: '55', nome: 'Tríceps Pulley Corda',           grupo: 'Tríceps', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Triceps_Pushdown_(Rope)/0.jpg`,                        youtube_search: 'tríceps pulley corda execução' },
  { id: '56', nome: 'Tríceps Francês com Barra',      grupo: 'Tríceps', equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Lying_Triceps_Extension_Skull_Crusher/0.jpg`,        youtube_search: 'tríceps francês barra execução' },
  { id: '57', nome: 'Tríceps Francês com Halter',     grupo: 'Tríceps', equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Lying_Triceps_Extension/0.jpg`,                     youtube_search: 'tríceps francês halter execução' },
  { id: '58', nome: 'Tríceps Coice',                  grupo: 'Tríceps', equipamento: 'Halteres',   nivel: 'Iniciante',     gif_url: `${BASE}/Dumbbell_Kickback/0.jpg`,                                    youtube_search: 'tríceps coice halter execução' },
  { id: '59', nome: 'Mergulho no Banco',              grupo: 'Tríceps', equipamento: 'Banco',      nivel: 'Iniciante',     gif_url: `${BASE}/Triceps_Dips/0.jpg`,                                         youtube_search: 'mergulho banco tríceps execução' },
  { id: '60', nome: 'Supino Fechado',                 grupo: 'Tríceps', equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Close-Grip_Bench_Press/0.jpg`,                       youtube_search: 'supino fechado tríceps execução' },

  // ── ABDÔMEN ────────────────────────────────────────────
  { id: '61', nome: 'Abdominal Crunch',               grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Crunch/0.jpg`,                                               youtube_search: 'abdominal crunch execução' },
  { id: '62', nome: 'Elevação de Pernas',             grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Lying_Leg_Raise/0.jpg`,                                      youtube_search: 'elevação de pernas abdominal execução' },
  { id: '63', nome: 'Prancha Frontal',                grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Plank/0.jpg`,                                                youtube_search: 'prancha abdominal execução' },
  { id: '64', nome: 'Prancha Lateral',                grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Side_Plank/0.jpg`,                                           youtube_search: 'prancha lateral execução' },
  { id: '65', nome: 'Abdominal na Polia',             grupo: 'Abdômen', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Crunch/0.jpg`,                                         youtube_search: 'abdominal polia execução' },
  { id: '66', nome: 'Elevação de Pernas na Barra',    grupo: 'Abdômen', equipamento: 'Barra Fixa', nivel: 'Intermediário', gif_url: `${BASE}/Hanging_Leg_Raise/0.jpg`,                                    youtube_search: 'elevação pernas barra fixa execução' },
  { id: '67', nome: 'Russian Twist',                  grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Russian_Twist/0.jpg`,                                        youtube_search: 'russian twist execução' },
  { id: '68', nome: 'Abdominal Bicicleta',            grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Bicycle_Crunch/0.jpg`,                                       youtube_search: 'abdominal bicicleta execução' },
  { id: '69', nome: 'Mountain Climber',               grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Mountain_Climber/0.jpg`,                                     youtube_search: 'mountain climber exercício execução' },
  { id: '70', nome: 'Dead Bug',                       grupo: 'Abdômen', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: undefined,                                                             youtube_search: 'dead bug exercício abdominal execução' },

  // ── CARDIO ─────────────────────────────────────────────
  { id: '71', nome: 'Burpee',                         grupo: 'Cardio',  equipamento: 'Solo',       nivel: 'Intermediário', gif_url: `${BASE}/Burpee/0.jpg`,                                               youtube_search: 'burpee execução como fazer' },
  { id: '72', nome: 'Jumping Jack',                   grupo: 'Cardio',  equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Jumping_Jack/0.jpg`,                                         youtube_search: 'jumping jack exercício execução' },
  { id: '73', nome: 'Corda (Jump Rope)',              grupo: 'Cardio',  equipamento: 'Corda',      nivel: 'Iniciante',     gif_url: undefined,                                                             youtube_search: 'pular corda corretamente' },
  { id: '74', nome: 'Esteira',                        grupo: 'Cardio',  equipamento: 'Esteira',    nivel: 'Iniciante',     gif_url: undefined,                                                             youtube_search: 'treino esteira iniciante' },
  { id: '75', nome: 'Bicicleta Ergométrica',          grupo: 'Cardio',  equipamento: 'Bicicleta',  nivel: 'Iniciante',     gif_url: undefined,                                                             youtube_search: 'bicicleta ergométrica posição correta' },
  { id: '76', nome: 'Remo Ergométrico',               grupo: 'Cardio',  equipamento: 'Remo',       nivel: 'Intermediário', gif_url: undefined,                                                             youtube_search: 'remo ergométrico execução' },

  // ── GLÚTEOS ────────────────────────────────────────────
  { id: '77', nome: 'Hip Thrust com Barra',           grupo: 'Glúteos', equipamento: 'Barra',      nivel: 'Intermediário', gif_url: `${BASE}/Barbell_Hip_Thrust/0.jpg`,                                   youtube_search: 'hip thrust barra execução' },
  { id: '78', nome: 'Elevação Pélvica',               grupo: 'Glúteos', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Glute_Bridge/0.jpg`,                                         youtube_search: 'elevação pélvica glúteo execução' },
  { id: '79', nome: 'Glúteo na Polia',                grupo: 'Glúteos', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: `${BASE}/Cable_Pull_Through/0.jpg`,                                   youtube_search: 'glúteo polia execução' },
  { id: '80', nome: 'Coice de Glúteo',                grupo: 'Glúteos', equipamento: 'Solo',       nivel: 'Iniciante',     gif_url: `${BASE}/Donkey_Kicks/0.jpg`,                                         youtube_search: 'coice glúteo execução' },
  { id: '81', nome: 'Abdução de Quadril em Pé',       grupo: 'Glúteos', equipamento: 'Polia',      nivel: 'Iniciante',     gif_url: undefined,                                                             youtube_search: 'abdução quadril polia execução' },
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
