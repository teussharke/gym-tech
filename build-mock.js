const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('tmp-exercises.json', 'utf8'));

// Dictionaries
const muscleMap = {
  abdominals: 'Abdômen',
  abductors: 'Pernas',
  adductors: 'Pernas',
  biceps: 'Bíceps',
  calves: 'Pernas',
  chest: 'Peito',
  forearms: 'Bíceps',
  glutes: 'Glúteos',
  hamstrings: 'Pernas',
  lats: 'Costas',
  'lower back': 'Costas',
  'middle back': 'Costas',
  neck: 'Ombro',
  quadriceps: 'Pernas',
  shoulders: 'Ombro',
  traps: 'Costas',
  triceps: 'Tríceps'
};

const equipMap = {
  'body only': 'Solo',
  machine: 'Máquina',
  kettlebells: 'Kettlebell',
  dumbbell: 'Halteres',
  cable: 'Polia',
  barbell: 'Barra',
  bands: 'Elástico',
  'medicine ball': 'Bola',
  'exercise ball': 'Bola',
  'e-z curl bar': 'Barra',
  'foam roll': 'Rolo',
  other: 'Outros'
};

const levelMap = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  expert: 'Avançado'
};

const exercises = rawData
  .filter(ex => ex.images && ex.images.length > 0)
  .map((ex, index) => {
    // Pegar grupo primário
    const pm = (ex.primaryMuscles && ex.primaryMuscles[0]) || 'other';
    const grupo = muscleMap[pm] || 'Outros';

    const equip = equipMap[ex.equipment] || 'Outros';
    const nivel = levelMap[ex.level] || 'Intermediário';
    
    // Traduzir nome pro portugues seria ideal, mas pra ser rápido e massivo
    // manteremos o nome em ingles ou se tivessemos tradutor, fariamos. 
    // Pra contornar, o youtube_search usará o nome original.
    let nome = ex.name;
    
    // url do gif
    const gif_url = `\${BASE}/` + ex.images[0];

    const searchStr = `como fazer ${nome.replace(/'/g, " ")} execution`;

    return `  { id: '${ex.id}', nome: '${nome.replace(/'/g, "\\'")}', grupo: '${grupo}', equipamento: '${equip}', nivel: '${nivel}', gif_url: \`${gif_url}\`, youtube_search: '${searchStr}' }`;
  });

const tsContent = `// src/lib/mock/exercicios.ts

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

// Extrai o video ID de uma URL do YouTube
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /youtube\\.com\\/watch\\?v=([^&\\s]+)/,
    /youtu\\.be\\/([^?\\s]+)/,
    /youtube\\.com\\/embed\\/([^?\\s]+)/,
    /youtube\\.com\\/shorts\\/([^?\\s]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url)
  return id ? \`https://www.youtube-nocookie.com/embed/\${id}?rel=0&modestbranding=1&autoplay=1\` : null
}

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

export function getYouTubeSearchUrl(termo: string): string {
  const query = encodeURIComponent(\`como fazer \${termo} academia execução correta\`)
  return \`https://www.youtube.com/results?search_query=\${query}\`
}

export const mockExercicios: Exercicio[] = [
${exercises.join(',\n')}
]

export const gruposMusculares = [
  'Todos', 'Peito', 'Costas', 'Pernas', 'Ombro',
  'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Glúteos', 'Outros'
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
  'Outros':   'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export const nivelColors: Record<string, string> = {
  'Iniciante':     'badge-success',
  'Intermediário': 'badge-warning',
  'Avançado':      'badge-danger',
}
`;

fs.writeFileSync('src/lib/mock/exercicios.ts', tsContent);
console.log('Done mapping ' + exercises.length + ' exercises!');
