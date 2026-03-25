// scripts/generate-icons.mjs
// Execute: node scripts/generate-icons.mjs
// Requer: npm install sharp

import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, '../public/icons')

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// SVG do ícone GymFlow (haltere verde)
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#111827"/>
  <rect width="512" height="512" rx="100" fill="#16a34a" opacity="0.15"/>
  <!-- Haltere -->
  <rect x="60" y="220" width="90" height="72" rx="16" fill="#22c55e"/>
  <rect x="130" y="196" width="50" height="120" rx="12" fill="#16a34a"/>
  <rect x="332" y="196" width="50" height="120" rx="12" fill="#16a34a"/>
  <rect x="362" y="220" width="90" height="72" rx="16" fill="#22c55e"/>
  <rect x="176" y="232" width="160" height="48" rx="8" fill="#22c55e"/>
  <!-- Letras GF -->
  <text x="256" y="290" font-family="Arial Black, sans-serif" font-size="72" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0">GF</text>
</svg>
`

async function generateIcons() {
  console.log('Gerando ícones PWA...')

  const svgBuffer = Buffer.from(svgIcon)

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, `icon-${size}x${size}.png`))
    console.log(`✓ icon-${size}x${size}.png`)
  }

  console.log('\n✅ Todos os ícones gerados em public/icons/')
  console.log('Adicione também uma imagem em public/screenshots/dashboard.png')
}

generateIcons().catch(console.error)
