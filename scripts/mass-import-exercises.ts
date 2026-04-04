import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { translate } from '@vitalets/google-translate-api';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  dotenv.config(); // fallback to .env
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const muscleMap: Record<string, string> = {
  abdominals: 'abdomen',
  hamstrings: 'pernas',
  adductors: 'pernas',
  quadriceps: 'pernas',
  biceps: 'biceps',
  shoulders: 'ombro',
  chest: 'peito',
  'middle back': 'costas',
  calves: 'panturrilha',
  glutes: 'gluteos',
  'lower back': 'costas',
  lats: 'costas',
  triceps: 'triceps',
  traps: 'costas',
  forearms: 'antebraco',
  neck: 'ombro',
  abductors: 'pernas'
};

const levelMap: Record<string, string> = {
  beginner: 'iniciante',
  intermediate: 'intermediario',
  expert: 'avancado'
};

const fallbackTranslation: Record<string, string> = {
  "barbell curl": "Rosca Direta com Barra",
  "bench press": "Supino Reto",
  "cable crossover": "Crossover na Polia",
  "calf raise": "Elevação de Panturrilha",
  "chin-up": "Barra Fixa (Supinada)",
  "crunch": "Abdominal Supra",
  "deadlift": "Levantamento Terra",
  "dips": "Mergulho nas Paralelas",
  "dumbbell curl": "Rosca Direta com Halteres",
  "dumbbell row": "Remada Unilateral com Halteres",
  "front raise": "Elevação Frontal",
  "hammer curl": "Rosca Martelo",
  "incline bench press": "Supino Inclinado",
  "lat pulldown": "Puxada Frontal",
  "lateral raise": "Elevação Lateral",
  "leg curl": "Mesa Flexora",
  "leg extension": "Cadeira Extensora",
  "leg press": "Leg Press",
  "military press": "Desenvolvimento Militar",
  "plank": "Prancha Abdominal",
  "push up": "Flexão de Braço",
  "romanian deadlift": "Levantamento Terra Romeno (Stiff)",
  "skullcrusher": "Tríceps Testa",
  "squat": "Agachamento Livre",
  "triceps extension": "Extensão de Tríceps",
  "triceps pushdown": "Tríceps Pulley"
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function translateText(text: string): Promise<string> {
  // Use fallback if text is a common exercise name
  const lowerText = text.toLowerCase().trim();
  if (fallbackTranslation[lowerText]) {
    return fallbackTranslation[lowerText];
  }

  try {
    await delay(1500); // 1.5s delay to avoid TooManyRequests
    const res = await translate(text, { to: 'pt' });
    return res.text;
  } catch (error) {
    console.error(`Translation failed for "${text}". Using original text.`);
    return text;
  }
}

async function uploadImage(url: string, path: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    
    const { data, error } = await supabase.storage
      .from('exercise-images')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (error) {
      console.error(`Upload error for ${path}:`, error.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(path);
      
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.error(`Failed to download/upload image ${url}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("Fetching exercises JSON...");
  const res = await axios.get('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
  const exercises = res.data;
  
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find(b => b.name === 'exercise-images')) {
    console.log("Creating bucket 'exercise-images'...");
    await supabase.storage.createBucket('exercise-images', { public: true });
  }

  const popularExercises = [
    "bench press", "incline bench press", "decline bench press", "dumbbell flyes", "cable crossover", "push up", "push-ups", "peck deck", "machine fly", "chest dip",
    "pull up", "pull-up", "lat pulldown", "seated cable row", "barbell row", "bent over row", "dumbbell row", "deadlift", "t-bar row", "chin up", "chin-up",
    "squat", "barbell squat", "leg press", "lunge", "dumbbell lunge", "leg extension", "leg curl", "seated leg curl", "lying leg curl", "calf raise", "standing calf raise", "romanian deadlift", "stiff leg deadlift", "hack squat", "bulgarian split squat",
    "overhead press", "military press", "dumbbell shoulder press", "lateral raise", "front raise", "reverse fly", "upright row", "face pull",
    "barbell curl", "dumbbell curl", "hammer curl", "preacher curl", "concentration curl", "cable curl",
    "triceps pushdown", "triceps extension", "skullcrusher", "dips", "triceps dip", "overhead triceps extension", "close grip bench press",
    "crunch", "leg raise", "hanging leg raise", "plank", "cable crunch", "russian twist", "ab wheel", "sit up", "sit-up"
  ];

  const toProcess = exercises.filter((ex: any) => 
    popularExercises.includes(ex.name.toLowerCase())
  );

  console.log(`Found ${exercises.length} total exercises. Kept ${toProcess.length} popular gym exercises for ingestion...`);
  
  for (const ex of toProcess) {
    try {
      console.log(`\nProcessing: ${ex.name}`);
      
      const translatedName = await translateText(ex.name);
      
      const { data: existing } = await supabase
        .from('exercicios')
        .select('id')
        .eq('nome', translatedName)
        .single();
        
      if (existing) {
        console.log(`Skipping ${translatedName}, already exists.`);
        continue;
      }
      
      const instructionsEn = ex.instructions.join('\n');
      const translatedInstructions = await translateText(instructionsEn);
      
      const primaryMuscle = ex.primaryMuscles && ex.primaryMuscles[0] ? ex.primaryMuscles[0] : '';
      const grupoMuscular = muscleMap[primaryMuscle] || 'corpo_todo';
      const nivel = levelMap[ex.level] || 'iniciante';
      
      let imageUrl = null;
      if (ex.images && ex.images.length > 0) {
        const rawImageUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`;
        const ext = ex.images[0].split('.').pop() || 'jpg';
        const storagePath = `${ex.id}.${ext}`;
        imageUrl = await uploadImage(rawImageUrl, storagePath);
      }
      
      let translatedEquip = null;
      if (ex.equipment && ex.equipment !== 'body only') {
        translatedEquip = await translateText(ex.equipment);
      } else if (ex.equipment === 'body only') {
        translatedEquip = 'peso do corpo';
      }
      
      const { error } = await supabase.from('exercicios').insert({
        nome: translatedName,
        descricao: translatedInstructions.substring(0, 200) + '...',
        grupo_muscular: grupoMuscular,
        nivel: nivel,
        gif_url: imageUrl,
        equipamento: translatedEquip,
        instrucoes: translatedInstructions,
        is_publico: true
      });
      
      if (error) {
        console.error(`DB Insert Error for ${translatedName}:`, error);
      } else {
        console.log(`Successfully ingested: ${translatedName}`);
      }
      
    } catch (e: any) {
      console.error(`Failed on ${ex.name}:`, e.message);
    }
  }
  
  console.log("\nFinished ingestion script!");
}

main();
