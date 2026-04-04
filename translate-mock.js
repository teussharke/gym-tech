const fs = require('fs');

async function translateChunk(texts) {
  const batched = texts.join(' ||| ');
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(batched)}`;
    const res = await fetch(url);
    const data = await res.json();
    let resultStr = "";
    for (const chunk of data[0]) {
      resultStr += chunk[0];
    }
    return resultStr.split('|||').map(s => s.trim().replace(/^o |^a /i, '')); // remover artigos como "o supino", "a rosca"
  } catch(e) {
    console.error("Erro na tradução", e);
    return texts;
  }
}

async function run() {
  const rawData = JSON.parse(fs.readFileSync('tmp-exercises.json', 'utf8'));

  const muscleMap = { abdominals: 'Abdômen', abductors: 'Pernas', adductors: 'Pernas', biceps: 'Bíceps', calves: 'Pernas', chest: 'Peito', forearms: 'Bíceps', glutes: 'Glúteos', hamstrings: 'Pernas', lats: 'Costas', 'lower back': 'Costas', 'middle back': 'Costas', neck: 'Ombro', quadriceps: 'Pernas', shoulders: 'Ombro', traps: 'Costas', triceps: 'Tríceps' };
  const equipMap = { 'body only': 'Solo', machine: 'Máquina', kettlebells: 'Kettlebell', dumbbell: 'Halteres', cable: 'Polia', barbell: 'Barra', bands: 'Elástico', 'medicine ball': 'Bola', 'exercise ball': 'Bola', 'e-z curl bar': 'Barra', 'foam roll': 'Rolo', other: 'Outros' };
  const levelMap = { beginner: 'Iniciante', intermediate: 'Intermediário', expert: 'Avançado' };

  let valid = rawData.filter(ex => ex.images && ex.images.length > 0);
  
  // Agrupar nomes
  let names = valid.map(ex => ex.name);
  
  console.log("Traduzindo " + names.length + " nomes...");
  
  let translatedNames = [];
  const CHUNK_SIZE = 40;
  for (let i = 0; i < names.length; i += CHUNK_SIZE) {
    const chunk = names.slice(i, i + CHUNK_SIZE);
    const trans = await translateChunk(chunk);
    translatedNames.push(...trans);
    // pequeno descanso pra não dar rate limit
    await new Promise(r => setTimeout(r, 800));
    console.log(`Traduzido ${Math.min(i + CHUNK_SIZE, names.length)}/${names.length}`);
  }

  const exercises = valid.map((ex, index) => {
    const pm = (ex.primaryMuscles && ex.primaryMuscles[0]) || 'other';
    const grupo = muscleMap[pm] || 'Outros';
    const equip = equipMap[ex.equipment] || 'Outros';
    const nivel = levelMap[ex.level] || 'Intermediário';
    
    let nome = translatedNames[index] || ex.name;
    // sanitização rápida da string traduzida
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
    
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
  youtube_url?: string
}

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
\${exercises.join(',\\n')}
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
  console.log('Fim!');
}

run();
